/**
 * Sync Engine
 * Pulls data from Ticket Tailor and Stripe, upserts into local SQLite.
 * All operations are idempotent — safe to re-run.
 */

import { PrismaClient } from '@prisma/client';
import * as tt from './ticketTailor';
import * as stripe from './stripe';

const prisma = new PrismaClient();

export interface SyncResult {
  source: string;
  status: 'completed' | 'failed';
  eventsProcessed: number;
  ordersProcessed: number;
  paymentsProcessed: number;
  errors: string[];
}

// ─── Ticket Tailor Sync ───

export async function syncTicketTailor(): Promise<SyncResult> {
  const result: SyncResult = {
    source: 'ticket_tailor',
    status: 'completed',
    eventsProcessed: 0,
    ordersProcessed: 0,
    paymentsProcessed: 0,
    errors: [],
  };

  const syncRun = await prisma.syncRun.create({
    data: { source: 'ticket_tailor', status: 'running' },
  });

  try {
    // 1. Fetch events
    const events = await tt.fetchEvents();

    for (const ttEvent of events) {
      try {
        const startDate = new Date(`${ttEvent.start.date}T${ttEvent.start.time}`);
        const endDate = ttEvent.end ? new Date(`${ttEvent.end.date}T${ttEvent.end.time}`) : null;

        const event = await prisma.event.upsert({
          where: { ttEventId: ttEvent.id },
          create: {
            ttEventId: ttEvent.id,
            name: ttEvent.name,
            startDate,
            endDate: endDate ?? startDate,
            status: ttEvent.status === 'published' ? 'on_sale' : ttEvent.status,
            ttRawJson: JSON.stringify(ttEvent),
          },
          update: {
            name: ttEvent.name,
            startDate,
            endDate: endDate ?? startDate,
            status: ttEvent.status === 'published' ? 'on_sale' : ttEvent.status,
            ttRawJson: JSON.stringify(ttEvent),
            updatedAt: new Date(),
          },
        });

        // Sync ticket types
        if (ttEvent.ticket_types) {
          for (const ttType of ttEvent.ticket_types) {
            await prisma.ticketType.upsert({
              where: { ttTicketTypeId: ttType.id },
              create: {
                ttTicketTypeId: ttType.id,
                eventId: event.id,
                name: ttType.name,
                price: tt.penceToPounds(ttType.price),
                bookingFee: tt.penceToPounds(ttType.booking_fee || 15),
                quantity: ttType.quantity || 0,
                sold: ttType.sold || 0,
                productCategory: tt.detectProductCategory(ttType.name),
              },
              update: {
                name: ttType.name,
                price: tt.penceToPounds(ttType.price),
                sold: ttType.sold || 0,
                quantity: ttType.quantity || 0,
                productCategory: tt.detectProductCategory(ttType.name),
                updatedAt: new Date(),
              },
            });
          }
        }

        result.eventsProcessed++;
      } catch (err: any) {
        result.errors.push(`Event ${ttEvent.id}: ${err.message}`);
      }
    }

    // 2. Fetch recent orders (last 30 days for efficiency)
    const orders = await tt.fetchOrders();

    for (const ttOrder of orders) {
      try {
        // Find the event
        const event = await prisma.event.findFirst({
          where: { ttEventId: ttOrder.event_id },
        });
        if (!event) continue;

        const order = await prisma.order.upsert({
          where: { ttOrderId: ttOrder.id },
          create: {
            ttOrderId: ttOrder.id,
            eventId: event.id,
            totalPaid: tt.penceToPounds(ttOrder.total),
            orderDate: new Date(ttOrder.created_at),
            paymentMethod: ttOrder.payment?.payment_method,
            stripeChargeId: ttOrder.payment?.transaction_id || null,
            customerName: ttOrder.buyer?.name || null,
            customerEmail: ttOrder.buyer?.email || null,
            cancelled: ttOrder.status === 'cancelled',
            exclusiveTax: tt.penceToPounds(ttOrder.tax_total || 0),
            ttRawJson: JSON.stringify(ttOrder),
          },
          update: {
            totalPaid: tt.penceToPounds(ttOrder.total),
            cancelled: ttOrder.status === 'cancelled',
            updatedAt: new Date(),
          },
        });

        // Sync line items
        if (ttOrder.line_items) {
          for (const item of ttOrder.line_items) {
            const ticketType = await prisma.ticketType.findFirst({
              where: { ttTicketTypeId: item.ticket_type_id },
            });

            await prisma.orderLine.upsert({
              where: { id: `${order.id}_${item.id}` },
              create: {
                id: `${order.id}_${item.id}`,
                orderId: order.id,
                ticketTypeId: ticketType?.id || null,
                description: item.ticket_type_name,
                quantity: item.quantity,
                unitPrice: tt.penceToPounds(item.price),
                lineTotal: tt.penceToPounds(item.price * item.quantity),
                productCategory: tt.detectProductCategory(item.ticket_type_name),
              },
              update: {
                quantity: item.quantity,
                unitPrice: tt.penceToPounds(item.price),
                lineTotal: tt.penceToPounds(item.price * item.quantity),
              },
            });
          }
        }

        result.ordersProcessed++;
      } catch (err: any) {
        result.errors.push(`Order ${ttOrder.id}: ${err.message}`);
      }
    }

    result.status = 'completed';
  } catch (err: any) {
    result.status = 'failed';
    result.errors.push(`Fatal: ${err.message}`);
  }

  await prisma.syncRun.update({
    where: { id: syncRun.id },
    data: {
      status: result.status,
      eventsProcessed: result.eventsProcessed,
      ordersProcessed: result.ordersProcessed,
      errors: JSON.stringify(result.errors),
      completedAt: new Date(),
    },
  });

  return result;
}

// ─── Stripe Sync ───

export async function syncStripe(): Promise<SyncResult> {
  const result: SyncResult = {
    source: 'stripe',
    status: 'completed',
    eventsProcessed: 0,
    ordersProcessed: 0,
    paymentsProcessed: 0,
    errors: [],
  };

  const syncRun = await prisma.syncRun.create({
    data: { source: 'stripe', status: 'running' },
  });

  try {
    // Fetch last 30 days of charges
    const thirtyDaysAgo = Math.floor((Date.now() - 30 * 86400000) / 1000);
    const charges = await stripe.fetchCharges(thirtyDaysAgo);

    for (const charge of charges) {
      try {
        let stripeFee = 0;
        let netAmount = stripe.penceToPounds(charge.amount);

        // Try to get balance transaction for fee details
        if (charge.balance_transaction) {
          try {
            const btx = await stripe.fetchBalanceTransaction(charge.balance_transaction);
            stripeFee = stripe.penceToPounds(btx.fee);
            netAmount = stripe.penceToPounds(btx.net);
          } catch {
            // Fall back to estimated fee
            stripeFee = stripe.penceToPounds(Math.round(charge.amount * 0.015 + 20));
            netAmount = stripe.penceToPounds(charge.amount) - stripeFee;
          }
        }

        // Try to match to an order
        const matchedOrder = await prisma.order.findFirst({
          where: { stripeChargeId: charge.id },
        });

        await prisma.payment.upsert({
          where: { stripeChargeId: charge.id },
          create: {
            stripeChargeId: charge.id,
            orderId: matchedOrder?.id || null,
            grossAmount: stripe.penceToPounds(charge.amount),
            stripeFee,
            netAmount,
            currency: charge.currency,
            status: charge.status,
            refundedAmount: stripe.penceToPounds(charge.amount_refunded || 0),
            stripeRawJson: JSON.stringify(charge),
            matched: !!matchedOrder,
          },
          update: {
            grossAmount: stripe.penceToPounds(charge.amount),
            stripeFee,
            netAmount,
            status: charge.status,
            refundedAmount: stripe.penceToPounds(charge.amount_refunded || 0),
            matched: !!matchedOrder,
            updatedAt: new Date(),
          },
        });

        result.paymentsProcessed++;
      } catch (err: any) {
        result.errors.push(`Charge ${charge.id}: ${err.message}`);
      }
    }

    result.status = 'completed';
  } catch (err: any) {
    result.status = 'failed';
    result.errors.push(`Fatal: ${err.message}`);
  }

  await prisma.syncRun.update({
    where: { id: syncRun.id },
    data: {
      status: result.status,
      paymentsProcessed: result.paymentsProcessed,
      errors: JSON.stringify(result.errors),
      completedAt: new Date(),
    },
  });

  return result;
}

// ─── Full Sync ───

export async function syncAll(): Promise<{ tt: SyncResult; stripe: SyncResult }> {
  const tt = await syncTicketTailor();
  const stripeResult = await syncStripe();
  return { tt, stripe: stripeResult };
}
