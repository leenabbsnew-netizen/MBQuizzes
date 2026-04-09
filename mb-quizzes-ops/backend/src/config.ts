import 'dotenv/config';

export const config = {
  TICKET_TAILOR_API_KEY: process.env.TICKET_TAILOR_API_KEY || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  PORT: parseInt(process.env.PORT || '3001', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export function validateConfig() {
  const warnings: string[] = [];
  if (!config.TICKET_TAILOR_API_KEY) warnings.push('TICKET_TAILOR_API_KEY not set — sync will fail');
  if (!config.STRIPE_SECRET_KEY) warnings.push('STRIPE_SECRET_KEY not set — Stripe sync will fail');
  return warnings;
}
