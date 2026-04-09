/**
 * Reconciliation Engine
 * Matches Stripe payments to Ticket Tailor orders.
 * Flags exceptions for manual review.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ReconciliationReport {
  matched: number;
  unmatchedPayments: UnmatchedPayment[];
  unmatchedOrders: UnmatchedOrder[];
  refunds: RefundRecord[];
  duplicates: DuplicateRecord[];
  totalStripeGross: number;
  totalTTGross: number;
  variance: number;
}

export interface UnmatchedPayment {
  stripeChargeId: string;
  amount: number;
  date: string;
  status: string;
}

export interface UnmatchedOrder {
  ttOrderId: string;
  totalPaid: number;
  date: string;
  stripeChargeId: string | null;
  reason: string;
}

export interface RefundRecord {
  stripeChargeId: string;
  originalAmount: number;
  refundedAmount: number;
}

export interface DuplicateRecord {
  stripeChargeId: string;
  matchedOrderIds: string[];
}

export async function runReconciliation(): Promise<ReconciliationReport> {
  // Get all payments
  const payments = await prisma.payment.findMany();
  const orders = await prisma.order.findMany({
    where: { cancelled: false, paymentMethod: 'STRIPE' },
  });

  let matched = 0;
  const unmatchedPayments: UnmatchedPayment[] = [];
  const unmatchedOrders: UnmatchedOrder[] = [];
  const refunds: RefundRecord[] = [];
  const duplicates: DuplicateRecord[] = [];

  // Check each payment for a matching order
  for (const payment of payments) {
    if (payment.matched && payment.orderId) {
      matched++;
    } else if (!payment.matched) {
      unmatchedPayments.push({
        stripeChargeId: payment.stripeChargeId || 'unknown',
        amount: payment.grossAmount,
        date: payment.createdAt.toISOString(),
        status: payment.status,
      });
    }

    if (payment.refundedAmount > 0) {
      refunds.push({
        stripeChargeId: payment.stripeChargeId || 'unknown',
        originalAmount: payment.grossAmount,
        refundedAmount: payment.refundedAmount,
      });
    }
  }

  // Check each Stripe order for a matching payment
  for (const order of orders) {
    if (!order.stripeChargeId) {
      unmatchedOrders.push({
        ttOrderId: order.ttOrderId,
        totalPaid: order.totalPaid,
        date: order.orderDate.toISOString(),
        stripeChargeId: null,
        reason: 'No Stripe charge ID in TT order',
      });
      continue;
    }

    const payment = payments.find(p => p.stripeChargeId === order.stripeChargeId);
    if (!payment) {
      unmatchedOrders.push({
        ttOrderId: order.ttOrderId,
        totalPaid: order.totalPaid,
        date: order.orderDate.toISOString(),
        stripeChargeId: order.stripeChargeId,
        reason: 'Stripe charge not found in synced payments',
      });
    }
  }

  // Check for duplicates (same Stripe charge matched to multiple orders)
  const chargeToOrders = new Map<string, string[]>();
  for (const order of orders) {
    if (order.stripeChargeId) {
      const existing = chargeToOrders.get(order.stripeChargeId) || [];
      existing.push(order.ttOrderId);
      chargeToOrders.set(order.stripeChargeId, existing);
    }
  }
  for (const [chargeId, orderIds] of chargeToOrders) {
    if (orderIds.length > 1) {
      duplicates.push({ stripeChargeId: chargeId, matchedOrderIds: orderIds });
    }
  }

  const totalStripeGross = payments.reduce((s, p) => s + p.grossAmount, 0);
  const totalTTGross = orders.reduce((s, o) => s + o.totalPaid, 0);

  return {
    matched,
    unmatchedPayments,
    unmatchedOrders,
    refunds,
    duplicates,
    totalStripeGross: Math.round(totalStripeGross * 100) / 100,
    totalTTGross: Math.round(totalTTGross * 100) / 100,
    variance: Math.round((totalStripeGross - totalTTGross) * 100) / 100,
  };
}
