import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const g = globalThis as any;
const prisma: PrismaClient = g.prisma || (g.prisma = new PrismaClient());

function round2(n: number) { return Math.round(n * 100) / 100; }
function customerPrice(base: number, fee: number, vat: number) { return round2((base + fee) * (1 + vat)); }
function quizPrize(teams: number, ladder: any[]) {
  const s = [...ladder].sort((a: any, b: any) => b.minTeams - a.minTeams);
  for (const step of s) { if (teams >= step.minTeams) return step.prize; }
  return s[s.length - 1]?.prize ?? 0;
}

function calcEcon(eventType: string, mainSold: number, bonusSold: number, totalOrders: number, a: any, boardOverride?: number, platform?: string | null, sqCredits?: number, quizPrizeOverride?: number | null, bingoPrizeOverride?: number | null, quizTeamCount?: number) {
  const isBingo = eventType === 'standalone_bingo';
  const isThemed = eventType.includes('themed');
  const hasBingo = eventType.includes('bingo');
  const mainPrice = isBingo ? a.bingoMainCardAllIn : customerPrice(a.quizBasePrice, a.paygFeePerItem, a.customerVatRate);
  const bonusPrice = isBingo ? a.bingoBonusAllIn : customerPrice(a.bonusBingoBasePrice, a.paygFeePerItem, a.customerVatRate);
  const gross = round2(mainSold * mainPrice + bonusSold * bonusPrice);
  const vat = round2(gross * a.flatRateVat);
  const stripe = round2(gross * a.stripeFeePercent + a.stripeFixedFee * totalOrders);
  const payg = round2((mainSold + bonusSold) * a.paygFeePerItem * 1.20);
  const net = round2(gross - vat - stripe - payg);
  const ads = isBingo ? a.bingoAds : isThemed ? a.themedQuizAds : a.coreQuizAds;
  let activation = 0;
  if (platform === 'redtooth') { activation = isBingo ? 0 : a.coreQuizActivation; }
  else if (platform === 'speedquizzing') { activation = round2((sqCredits || 1) * 9.60); }
  const writing = isThemed ? a.themedQuizWriting : 0;
  const licence = hasBingo || isBingo ? round2(a.hostLicencePerMonth / a.satBingoEventsPerMonth) : 0;
  const other = isBingo ? a.bingoSoftwareOther : 0;
  const totalFixed = round2(ads + activation + writing + licence + other);
  const quizPrizeCalc = isBingo ? 0 : quizPrize(quizTeamCount ?? mainSold, JSON.parse(a.quizPrizeLadder));
  const bingoPrizeCalc = isBingo ? (boardOverride ?? a.bingoDefaultPrizeBoard) : hasBingo ? round2(bonusSold * a.bingoPrizePerBonus) : 0;
  const quizPrizeActual = quizPrizeOverride != null ? quizPrizeOverride : quizPrizeCalc;
  const bingoPrizeActual = bingoPrizeOverride != null ? bingoPrizeOverride : bingoPrizeCalc;
  const totalPrize = round2(quizPrizeActual + bingoPrizeActual);
  const pool = round2(net - totalFixed - totalPrize);
  const hostShare = pool > 0 ? Math.max(pool * a.hostSplitPercent, a.hostMinimum) : 0;
  const hostTake = round2(Math.min(hostShare, Math.max(pool, 0)));
  const leeTake = round2(pool - hostTake);
  let status = 'run'; let reason = 'Meets thresholds';
  if (pool < 0) { status = 'do_not_run'; reason = 'Pool negative'; }
  else if (leeTake < a.leeMinimumAcceptable) { status = 'hold'; reason = 'Lee take below min'; }
  return { grossCharged: gross, flatRateVatAmount: vat, stripeFees: stripe, paygFees: payg, netAfterFees: net, ads, activation, writing, licence, zoomAlloc: 0, otherCosts: other, totalFixedCosts: totalFixed, quizPrizeCalc, bingoPrizeCalc, quizPrizePaid: quizPrizeOverride, bingoPrizePaid: bingoPrizeOverride, totalPrize, profitPool: pool, hostTake, leeTake, status, statusReason: reason, moreMainsNeeded: 0, moreBonusNeeded: 0 };
}
async function getAssumptions() {
  let r = await prisma.assumptionSet.findFirst({ where: { isActive: true } });
  if (!r) r = await prisma.assumptionSet.create({ data: { id: 'default', name: 'default', isActive: true } });
  return r;
}

function classifyTT(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('bonus game') || n.includes('jackpot') || n.includes('full house')) return 'bingo_bonus';
  if (n.includes('bingo') && (n.includes('bonus') || n.includes('addon') || n.includes('add on'))) return 'bingo_bonus';
  if (n.includes('bingo') || n.includes('musiskill')) return 'bingo_main';
  if (n.includes('transaction') || n.includes('fee')) return 'transaction_fee';
  if (n.includes('comp') || n.includes('free')) return 'comp';
  return 'quiz_team';
}

function detectType(name: string, tts: any[]): string {
  const n = name.toLowerCase();
  const hasBingo = tts.some((t: any) => classifyTT(t.name).startsWith('bingo'));
  if (n.includes('standalone bingo') || (n.includes('bingo') && !n.includes('quiz'))) return 'standalone_bingo';
  if (hasBingo) return n.includes('themed') ? 'themed_quiz_with_bingo' : 'core_quiz_with_bingo';
  return n.includes('themed') || n.includes('special') ? 'themed_quiz' : 'core_quiz';
}

async function ttFetch(ep: string): Promise<any> {
  const key = process.env.TICKET_TAILOR_API_KEY;
  if (!key) throw new Error('TICKET_TAILOR_API_KEY not set');
  const res = await fetch(`https://api.tickettailor.com/v1${ep}`, {
    headers: { 'Authorization': `Basic ${Buffer.from(key + ':').toString('base64')}`, 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`TT ${res.status}: ${(await res.text()).substring(0, 200)}`);
  return res.json();
}

async function syncTT() {
  const errors: string[] = [];
  let eventsProcessed = 0, ordersProcessed = 0;
  try {
    const since = Math.floor((Date.now() - 3 * 86400000) / 1000);
    let allOrders: any[] = [];
    let cursor: string | null = null;
    for (let p = 0; p < 5; p++) {
      const q = '?limit=100&created_at_gte=' + since + (cursor ? '&starting_after=' + cursor : '');
      const d = await ttFetch('/orders' + q);
      const orders = d.data || [];
      if (!orders.length) break;
      allOrders = allOrders.concat(orders);
      cursor = orders[orders.length - 1]?.id;
      if (!d.links?.next) break;
    }
    const seriesMap = new Map<string, any[]>();
    for (const o of allOrders) {
      const esId = o.event_series_id || o.event_summary?.event_series_id || o.event?.event_series_id;
      if (esId) { if (!seriesMap.has(esId)) seriesMap.set(esId, []); seriesMap.get(esId)!.push(o); }
    }
    for (const [esId, orders] of seriesMap) {
      try {
        const series = await ttFetch('/event_series/' + esId);
        const tts = series.default_ticket_types || series.ticket_types || [];
        const eventType = detectType(series.name, tts);
        let startDate = new Date();
        if (orders[0]?.event_summary?.start_date?.iso) startDate = new Date(orders[0].event_summary.start_date.iso);
        else if (orders[0]?.event?.start?.iso) startDate = new Date(orders[0].event.start.iso);
        const ev = await prisma.event.upsert({
          where: { ttEventId: esId },
          create: { ttEventId: esId, name: series.name, startDate, status: series.status || 'published', eventType },
          update: { name: series.name, status: series.status || 'published' }
        });
        for (const tt of tts) {
          await prisma.ticketType.upsert({
            where: { ttTicketTypeId: tt.id },
            create: { ttTicketTypeId: tt.id, eventId: ev.id, name: tt.name, price: (tt.price || 0) / 100, bookingFee: (tt.booking_fee || 0) / 100, quantity: tt.quantity_total || 0, sold: tt.quantity_issued || 0, productCategory: classifyTT(tt.name) },
            update: { name: tt.name, price: (tt.price || 0) / 100, sold: tt.quantity_issued || 0, productCategory: classifyTT(tt.name) }
          });
        }
        for (const o of orders) {
          await prisma.order.upsert({
            where: { ttOrderId: o.id },
            create: { ttOrderId: o.id, eventId: ev.id, totalPaid: (o.total || 0) / 100, orderDate: new Date((o.created_at || 0) * 1000), paymentMethod: o.txn_id ? 'STRIPE' : 'OTHER', stripeChargeId: o.txn_id || null, customerName: [o.first_name, o.last_name].filter(Boolean).join(' ') || null, customerEmail: o.email || null, cancelled: o.status === 'cancelled' || o.status === 'refunded', refundedAmount: o.status === 'refunded' ? (o.total || 0) / 100 : 0 },
            update: { totalPaid: (o.total || 0) / 100, cancelled: o.status === 'cancelled' || o.status === 'refunded' }
          });
          ordersProcessed++;
        }
        eventsProcessed++;
      } catch (e: any) { errors.push(esId + ': ' + e.message); }
    }
    const keepIds = [...seriesMap.keys()];
    if (keepIds.length > 0) {
      const purged = await prisma.event.deleteMany({ where: { ttEventId: { notIn: keepIds } } });
      errors.push('Purged ' + purged.count + ' old events, kept ' + keepIds.length);
    }
  } catch (e: any) { errors.push('TT: ' + e.message); }
  return { eventsProcessed, ordersProcessed, errors };
}

// ── Stripe ──
async function syncStripe() {
  const errors: string[] = [];
  let paymentsProcessed = 0;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) { errors.push('STRIPE_SECRET_KEY not set'); return { paymentsProcessed, errors }; }
  try {
    const since = Math.floor((Date.now() - 7 * 86400000) / 1000);
    const res = await fetch(`https://api.stripe.com/v1/charges?limit=100&created[gte]=${since}`, {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (!res.ok) { errors.push(`Stripe ${res.status}`); return { paymentsProcessed, errors }; }
    const data = await res.json();
    for (const ch of (data.data || [])) {
      try {
        const gross = (ch.amount || 0) / 100;
        const fee = ch.balance_transaction?.fee ? ch.balance_transaction.fee / 100 : round2(gross * 0.015 + 0.20);
        const net = round2(gross - fee);
        const matched = await prisma.order.findFirst({ where: { stripeChargeId: ch.id } });
        await prisma.payment.upsert({
          where: { stripeChargeId: ch.id },
          create: { stripeChargeId: ch.id, orderId: matched?.id || null, grossAmount: gross, stripeFee: fee, netAmount: net, currency: ch.currency || 'gbp', status: ch.status || 'succeeded', refundedAmount: (ch.amount_refunded || 0) / 100, matched: !!matched },
          update: { grossAmount: gross, stripeFee: fee, netAmount: net, status: ch.status, refundedAmount: (ch.amount_refunded || 0) / 100, orderId: matched?.id || null, matched: !!matched }
        });
        paymentsProcessed++;
      } catch (e: any) { errors.push(`ch_${ch.id}: ${e.message}`); }
    }
  } catch (e: any) { errors.push(`Stripe: ${e.message}`); }
  return { paymentsProcessed, errors };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const path = (req.url || '').replace(/^\/api\/?/, '').split('?')[0];
  const m = req.method || 'GET';
  try {
    if (path === 'events' && m === 'GET') {
      const since = new Date(Date.now() - 7 * 86400000);
      const events = await prisma.event.findMany({ where: { startDate: { gte: since } }, include: { ticketTypes: true, decisions: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { startDate: 'desc' } });
      const out = events.map((e: any) => {
        const ms = e.ticketTypes.filter((t: any) => ['quiz_team', 'bingo_main'].includes(t.productCategory)).reduce((s: number, t: any) => s + t.sold, 0);
        const bs = e.ticketTypes.filter((t: any) => ['bingo_bonus', 'bingo_addon'].includes(t.productCategory)).reduce((s: number, t: any) => s + t.sold, 0);
        const totalRevenue = e.ticketTypes.reduce((s: number, t: any) => s + (t.sold * (t.price + t.bookingFee)), 0);
        return { ...e, mainSold: ms, bonusSold: bs, orderCount: ms + bs, totalRevenue: round2(totalRevenue), latestDecision: e.decisions[0] || null };
      });
      return res.json(out);
    }
    if (path === 'assumptions' && m === 'GET') return res.json(await getAssumptions());
    if (path === 'reset' && m === 'GET') {
      await prisma.$executeRawUnsafe('TRUNCATE "OrderLine", "Payment", "Order", "DecisionLog", "EventEconomicsSnapshot", "PlannerEntry", "TicketType", "Event" CASCADE');
      const tt = await syncTT();
      const stripe = await syncStripe();
      return res.json({ reset: true, sync: { tt, stripe } });
    }
    if (path === 'assumptions' && m === 'PUT') { const a = await getAssumptions(); return res.json(await prisma.assumptionSet.update({ where: { id: a.id }, data: { ...req.body, quizPrizeLadder: req.body.quizPrizeLadder ? JSON.stringify(req.body.quizPrizeLadder) : undefined } })); }
    if (path === 'decisions') return res.json(await prisma.decisionLog.findMany({ include: { event: true }, orderBy: { createdAt: 'desc' }, take: 200 }));
    if (path === 'cleanup' && (m === 'POST' || m === 'GET')) {
      const before = req.body?.before ? new Date(req.body.before) : new Date('2026-04-10T00:00:00Z');
      const oldEvents = await prisma.event.findMany({ where: { startDate: { lt: before } }, select: { id: true } });
      let deleted = 0;
      for (const ev of oldEvents) {
        await prisma.orderLine.deleteMany({ where: { order: { eventId: ev.id } } });
        await prisma.payment.deleteMany({ where: { order: { eventId: ev.id } } });
        await prisma.order.deleteMany({ where: { eventId: ev.id } });
        await prisma.decisionLog.deleteMany({ where: { eventId: ev.id } });
        await prisma.eventEconomicsSnapshot.deleteMany({ where: { eventId: ev.id } });
        await prisma.ticketType.deleteMany({ where: { eventId: ev.id } });
        await prisma.plannerEntry.deleteMany({ where: { eventId: ev.id } });
        await prisma.event.delete({ where: { id: ev.id } });
        deleted++;
      }
      return res.json({ deleted, before });
    }
    if (path === 'purge' && m === 'GET') {
      const allEvents = await prisma.event.findMany({ select: { id: true, ttEventId: true, name: true } });
      let deleted = 0; const kept: string[] = [];
      for (const ev of allEvents) {
        const num = parseInt((ev.ttEventId || '').replace('es_', ''));
        if (num < 1500000) {
          try {
            await prisma.orderLine.deleteMany({ where: { order: { eventId: ev.id } } });
            await prisma.payment.deleteMany({ where: { order: { eventId: ev.id } } });
            await prisma.order.deleteMany({ where: { eventId: ev.id } });
            await prisma.decisionLog.deleteMany({ where: { eventId: ev.id } });
            await prisma.eventEconomicsSnapshot.deleteMany({ where: { eventId: ev.id } });
            await prisma.ticketType.deleteMany({ where: { eventId: ev.id } });
            await prisma.plannerEntry.deleteMany({ where: { eventId: ev.id } });
            await prisma.event.delete({ where: { id: ev.id } });
            deleted++;
          } catch(_){}
        } else { kept.push(ev.name); }
      }
      return res.json({ deleted, kept: kept.length, keptEvents: kept });
    }
    if (path === 'reconciliation') {
      const payments = await prisma.payment.findMany();
      const orders = await prisma.order.findMany({ where: { cancelled: false, paymentMethod: 'STRIPE' } });
      const matched = payments.filter(p => p.matched).length;
      const totalSG = round2(payments.reduce((s, p) => s + p.grossAmount, 0));
      const totalTG = round2(orders.reduce((s, o) => s + o.totalPaid, 0));
      return res.json({ matched, unmatchedPayments: payments.filter(p => !p.matched).length, unmatchedOrders: 0, refunds: payments.filter(p => p.refundedAmount > 0).length, duplicates: 0, totalStripeGross: totalSG, totalTTGross: totalTG, variance: round2(totalSG - totalTG) });
    }
    if (path === 'sync' && (m === 'POST' || m === 'GET')) {
      const run = await prisma.syncRun.create({ data: { source: 'manual', status: 'running' } });
      const tt = await syncTT();
      const stripe = await syncStripe();
      await prisma.syncRun.update({ where: { id: run.id }, data: { status: (tt.errors.length + stripe.errors.length) > 0 ? 'completed_with_errors' : 'completed', eventsProcessed: tt.eventsProcessed, ordersProcessed: tt.ordersProcessed, paymentsProcessed: stripe.paymentsProcessed, errors: JSON.stringify([...tt.errors, ...stripe.errors]), completedAt: new Date() } });
      return res.json({ tt, stripe });
    }
    if (path === 'sync/log') return res.json(await prisma.syncRun.findMany({ orderBy: { startedAt: 'desc' }, take: 50 }));
    if (path === 'hosts') return res.json(await prisma.host.findMany({ where: { isActive: true } }));
    if (path === 'planner') return res.json([]);
    const em = path.match(/^events\/([^\/]+)\/economics$/);
    if (em && m === 'GET') {
      const ev = await prisma.event.findUnique({ where: { id: em[1] }, include: { ticketTypes: true } });
      if (!ev) return res.status(404).json({ error: 'Not found' });
      const a = await getAssumptions();
      const ms = ev.ticketTypes.filter((t: any) => ['quiz_team', 'bingo_main'].includes(t.productCategory)).reduce((s: number, t: any) => s + t.sold, 0);
      const bs = ev.ticketTypes.filter((t: any) => ['bingo_bonus', 'bingo_addon'].includes(t.productCategory)).reduce((s: number, t: any) => s + t.sold, 0);
      const qt = ev.ticketTypes.filter((t: any) => t.productCategory === 'quiz_team').reduce((s: number, t: any) => s + t.sold, 0);
      const to = await prisma.order.count({ where: { eventId: ev.id, cancelled: false } });
      const bo = req.query.board ? parseFloat(req.query.board as string) : undefined;
      return res.json({ event: ev, sales: { mainSold: ms, bonusSold: bs, quizTeams: qt, totalOrders: to }, economics: calcEcon(ev.eventType, ms, bs, to, a, bo, (ev as any).platform, (ev as any).sqCredits, (ev as any).quizPrizePaid, (ev as any).bingoPrizePaid, qt), assumptions: a });
    }
    const dm = path.match(/^events\/([^\/]+)\/decision$/);
    if (dm && m === 'POST') { const b = req.body; return res.json(await prisma.decisionLog.create({ data: { eventId: dm[1], decision: b.decision, decidedBy: 'lee', notes: b.notes, mainCardsSold: b.mainCardsSold, bonusSold: b.bonusSold, profitPool: b.profitPool, hostTake: b.hostTake, leeTake: b.leeTake, prizeBoard: b.prizeBoard } })); }
    const hm = path.match(/^events\/([^\/]+)\/host$/);
    if (hm && m === 'PUT') { const updated = await prisma.event.update({ where: { id: hm[1] }, data: { host: req.body.host } }); return res.json(updated); }
    const pm = path.match(/^events\/([^\/]+)\/platform$/);
    if (pm && m === 'PUT') { const updated = await prisma.event.update({ where: { id: pm[1] }, data: { platform: req.body.platform || null, sqCredits: req.body.sqCredits || 0 } }); return res.json(updated); }
    const prm = path.match(/^events\/([^\/]+)\/prizes$/);
    if (prm && m === 'PUT') { const updated = await prisma.event.update({ where: { id: prm[1] }, data: { quizPrizePaid: req.body.quizPrizePaid ?? null, bingoPrizePaid: req.body.bingoPrizePaid ?? null } }); return res.json(updated); }
    const evm = path.match(/^events\/([^\/]+)$/);
    if (evm && m === 'GET') { const ev = await prisma.event.findUnique({ where: { id: evm[1] }, include: { ticketTypes: true, decisions: { orderBy: { createdAt: 'desc' }, take: 10 }, snapshots: { orderBy: { createdAt: 'desc' }, take: 5 } } }); return ev ? res.json(ev) : res.status(404).json({ error: 'Not found' }); }
    if (evm && m === 'DELETE') {
      await prisma.orderLine.deleteMany({ where: { order: { eventId: evm[1] } } });
      await prisma.payment.deleteMany({ where: { order: { eventId: evm[1] } } });
      await prisma.order.deleteMany({ where: { eventId: evm[1] } });
      await prisma.decisionLog.deleteMany({ where: { eventId: evm[1] } });
      await prisma.eventEconomicsSnapshot.deleteMany({ where: { eventId: evm[1] } });
      await prisma.ticketType.deleteMany({ where: { eventId: evm[1] } });
      await prisma.plannerEntry.deleteMany({ where: { eventId: evm[1] } });
      await prisma.event.delete({ where: { id: evm[1] } });
      return res.json({ deleted: true });
    }
    const etm = path.match(/^events\/([^\/]+)\/type$/);
    if (etm && m === 'PUT') { const u = await prisma.event.update({ where: { id: etm[1] }, data: { eventType: req.body.eventType } }); return res.json(u); }
    const rfshm = path.match(/^events\/([^\/]+)\/refresh$/);
    if (rfshm && m === 'POST') {
      const ev = await prisma.event.findUnique({ where: { id: rfshm[1] }, include: { ticketTypes: true } });
      if (!ev) return res.status(404).json({ error: 'Not found' });
      try {
        const series = await ttFetch(`/event_series/${ev.ttEventId}`);
        const tts = series.ticket_types || series.default_ticket_types || [];
        for (const tt of tts) {
          await prisma.ticketType.upsert({
            where: { ttTicketTypeId: tt.id },
            create: { ttTicketTypeId: tt.id, eventId: ev.id, name: tt.name, price: (tt.price || 0) / 100, bookingFee: (tt.booking_fee || 0) / 100, quantity: tt.quantity_total || 0, sold: tt.quantity_issued || 0, productCategory: classifyTT(tt.name) },
            update: { name: tt.name, price: (tt.price || 0) / 100, sold: tt.quantity_issued || 0, productCategory: classifyTT(tt.name) }
          });
        }
        const updated = await prisma.event.findUnique({ where: { id: ev.id }, include: { ticketTypes: true } });
        return res.json({ refreshed: true, event: updated });
      } catch (e: any) { return res.status(500).json({ error: e.message }); }
    }
    if (path === 'weekly' && m === 'GET') {
      const now = new Date();
      const day = now.getDay();
      const diffToFri = (day >= 5) ? day - 5 : day + 2;
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - diffToFri); weekStart.setHours(0,0,0,0);
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
      const fromParam = req.query.from ? new Date(req.query.from as string) : weekStart;
      const toParam = req.query.to ? new Date(req.query.to as string) : weekEnd;
      const events = await prisma.event.findMany({ where: { startDate: { gte: fromParam, lt: toParam } }, include: { ticketTypes: true, decisions: { orderBy: { createdAt: 'desc' }, take: 1 } } });
      const a = await getAssumptions();
      let totalLee = 0; let totalHost = 0; let totalGross = 0; let totalEvents = 0;
      const breakdown = [];
      for (const ev of events as any[]) {
        const ms = ev.ticketTypes.filter((t: any) => ['quiz_team', 'bingo_main'].includes(t.productCategory)).reduce((s: number, t: any) => s + t.sold, 0);
        const bs = ev.ticketTypes.filter((t: any) => ['bingo_bonus', 'bingo_addon'].includes(t.productCategory)).reduce((s: number, t: any) => s + t.sold, 0);
        const qt = ev.ticketTypes.filter((t: any) => t.productCategory === 'quiz_team').reduce((s: number, t: any) => s + t.sold, 0);
        const to = ms;
        const ec = calcEcon(ev.eventType, ms, bs, to, a, undefined, ev.platform, ev.sqCredits, ev.quizPrizePaid, ev.bingoPrizePaid, qt);
        totalLee += ec.leeTake; totalHost += ec.hostTake; totalGross += ec.grossCharged; totalEvents++;
        breakdown.push({ id: ev.id, name: ev.name, date: ev.startDate, host: ev.host, eventType: ev.eventType, mainSold: ms, leeTake: ec.leeTake, hostTake: ec.hostTake, grossCharged: ec.grossCharged, profitPool: ec.profitPool });
      }
      const mailingList = a.mailingListWeekly ?? 45;
      const perEventMailingCost = totalEvents > 0 ? round2(mailingList / totalEvents) : 0;
      let adjLee = 0; let adjHost = 0;
      const adjBreakdown = breakdown.map((b: any) => {
        const adjPool = round2(b.profitPool - perEventMailingCost);
        const adjHostTake = adjPool > 0 ? round2(Math.min(Math.max(adjPool * a.hostSplitPercent, a.hostMinimum), adjPool)) : 0;
        const adjLeeTake = round2(adjPool - adjHostTake);
        adjLee += adjLeeTake; adjHost += adjHostTake;
        return { ...b, mailingCost: perEventMailingCost, profitPool: adjPool, hostTake: adjHostTake, leeTake: adjLeeTake };
      });
      return res.json({ weekStart: fromParam, weekEnd: toParam, totalEvents, totalGross: round2(totalGross), totalLee: round2(adjLee), totalHost: round2(adjHost), mailingList, perEventMailingCost, breakdown: adjBreakdown });
    }
    const rfm = path.match(/^events\/([^\/]+)\/refund$/);
    if (rfm && m === 'POST') {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ error: 'orderId required' });
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      const errors: string[] = [];
      if (order.stripeChargeId && process.env.STRIPE_SECRET_KEY) {
        try {
          const r = await fetch('https://api.stripe.com/v1/refunds', { method: 'POST', headers: { 'Authorization': 'Bearer ' + process.env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'payment_intent=' + encodeURIComponent(order.stripeChargeId) });
          if (!r.ok) errors.push('Stripe refund failed: ' + (await r.text()).substring(0, 200));
        } catch (e: any) { errors.push('Stripe: ' + e.message); }
      }
      if (order.ttOrderId && process.env.TICKET_TAILOR_API_KEY) {
        try {
          const auth = Buffer.from(process.env.TICKET_TAILOR_API_KEY + ':').toString('base64');
          const ticketsRes = await fetch('https://api.tickettailor.com/v1/issued_tickets?order_id=' + order.ttOrderId, { headers: { 'Authorization': 'Basic ' + auth } });
          if (ticketsRes.ok) {
            const ticketsData = await ticketsRes.json();
            for (const ticket of (ticketsData.data || [])) {
              await fetch('https://api.tickettailor.com/v1/issued_tickets/' + ticket.id + '/void', { method: 'POST', headers: { 'Authorization': 'Basic ' + auth } });
            }
          }
        } catch (e: any) { errors.push('TT: ' + e.message); }
      }
      await prisma.order.update({ where: { id: orderId }, data: { cancelled: true, refundedAmount: order.totalPaid } });
      return res.json({ refunded: true, orderId, errors });
    }
    return res.status(404).json({ error: 'Not found', path });
  } catch (err: any) { console.error(err); return res.status(500).json({ error: err.message }); }
}
