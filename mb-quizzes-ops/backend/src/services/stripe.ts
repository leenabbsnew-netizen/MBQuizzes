/**
 * Stripe API Integration
 * Server-side only. Uses stripe-node SDK pattern but with fetch for minimal deps.
 */

import { config } from '../config';

const BASE_URL = 'https://api.stripe.com/v1';

async function stripeFetch(path: string, params?: Record<string, string>) {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${config.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Stripe API error ${res.status}: ${body}`);
  }

  return res.json();
}

export interface StripeCharge {
  id: string;
  amount: number; // pence
  amount_refunded: number;
  currency: string;
  status: string;
  balance_transaction?: string;
  created: number; // unix timestamp
  metadata?: Record<string, string>;
  [key: string]: any;
}

export interface StripeBalanceTransaction {
  id: string;
  amount: number;
  fee: number;
  fee_details: { type: string; amount: number }[];
  net: number;
  currency: string;
  source: string;
  created: number;
  [key: string]: any;
}

export async function fetchCharges(
  createdAfter?: number,
  limit = 100
): Promise<StripeCharge[]> {
  const params: Record<string, string> = { limit: String(limit) };
  if (createdAfter) params['created[gte]'] = String(createdAfter);
  const data = await stripeFetch('/charges', params);
  return data.data || [];
}

export async function fetchChargeById(chargeId: string): Promise<StripeCharge> {
  return stripeFetch(`/charges/${chargeId}`);
}

export async function fetchBalanceTransaction(
  txnId: string
): Promise<StripeBalanceTransaction> {
  return stripeFetch(`/balance_transactions/${txnId}`);
}

export async function fetchPaymentIntents(
  createdAfter?: number,
  limit = 100
): Promise<any[]> {
  const params: Record<string, string> = { limit: String(limit) };
  if (createdAfter) params['created[gte]'] = String(createdAfter);
  const data = await stripeFetch('/payment_intents', params);
  return data.data || [];
}

export async function fetchRefunds(chargeId: string): Promise<any[]> {
  const data = await stripeFetch('/refunds', { charge: chargeId });
  return data.data || [];
}

/** Convert Stripe amount (pence) to pounds */
export function penceToPounds(amount: number): number {
  return Math.round(amount) / 100;
}
