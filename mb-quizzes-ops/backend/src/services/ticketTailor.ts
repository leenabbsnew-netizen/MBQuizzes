/**
 * Ticket Tailor API Integration
 * Docs: https://developers.tickettailor.com/
 * All API calls are server-side only.
 */

import { config } from '../config';

const BASE_URL = 'https://api.tickettailor.com/v1';

async function ttFetch(path: string, params?: Record<string, string>) {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`${config.TICKET_TAILOR_API_KEY}:`).toString('base64')}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ticket Tailor API error ${res.status}: ${body}`);
  }

  return res.json();
}

// ─── Events ───

export interface TTEvent {
  id: string;
  name: string;
  status: string; // published, draft, closed
  start: { date: string; time: string; tz: string };
  end?: { date: string; time: string; tz: string };
  ticket_types: TTTicketType[];
  url: string;
  [key: string]: any;
}

export interface TTTicketType {
  id: string;
  name: string;
  price: number; // in smallest unit (pence)
  booking_fee: number;
  quantity: number;
  sold: number;
  status: string;
  [key: string]: any;
}

export async function fetchEvents(status?: string): Promise<TTEvent[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  const data = await ttFetch('/event_series', params);
  return data.data || [];
}

export async function fetchEventById(eventId: string): Promise<TTEvent> {
  return ttFetch(`/event_series/${eventId}`);
}

export async function fetchEventOccurrences(eventSeriesId: string): Promise<any[]> {
  const data = await ttFetch(`/event_series/${eventSeriesId}/events`);
  return data.data || [];
}

// ─── Orders ───

export interface TTOrder {
  id: string;
  event_id: string;
  event_summary?: { name: string };
  total: number; // pence
  tax_total: number;
  status: string;
  payment: { payment_method: string; transaction_id?: string };
  line_items: TTLineItem[];
  buyer?: { name: string; email: string };
  created_at: string;
  [key: string]: any;
}

export interface TTLineItem {
  id: string;
  ticket_type_id: string;
  ticket_type_name: string;
  quantity: number;
  price: number; // pence
  booking_fee: number;
  [key: string]: any;
}

export async function fetchOrders(eventId?: string): Promise<TTOrder[]> {
  const allOrders: TTOrder[] = [];
  let cursor: string | undefined;
  const params: Record<string, string> = {};
  if (eventId) params.event_id = eventId;

  // Paginate
  do {
    if (cursor) params.starting_after = cursor;
    const data = await ttFetch('/orders', params);
    const orders = data.data || [];
    allOrders.push(...orders);
    cursor = orders.length > 0 ? orders[orders.length - 1].id : undefined;
    // Stop if no more pages
    if (!data.links?.next) break;
  } while (cursor);

  return allOrders;
}

export async function fetchOrderById(orderId: string): Promise<TTOrder> {
  return ttFetch(`/orders/${orderId}`);
}

// ─── Issued Tickets ───

export async function fetchIssuedTickets(eventId: string): Promise<any[]> {
  const data = await ttFetch('/issued_tickets', { event_id: eventId });
  return data.data || [];
}

// ─── Product Category Detection ───

export function detectProductCategory(ticketTypeName: string): string {
  const n = ticketTypeName.toLowerCase();
  if (n.includes('transaction') || n.includes('booking fee')) return 'transaction_fee';
  if (n.includes('bonus') || n.includes('jackpot') || n.includes('4th')) return 'bingo_bonus';
  if (n.includes('bingo card') || n.includes('set of bingo') || n.includes('one set of')) return 'bingo_main';
  if (n.includes('bingo') && !n.includes('bonus')) return 'bingo_addon';
  if (n.includes('household') || n.includes('team') || n.includes('quiz')) return 'quiz_team';
  return 'quiz_team'; // default
}

/** Convert pence to pounds */
export function penceToPounds(pence: number): number {
  return Math.round(pence) / 100;
}
