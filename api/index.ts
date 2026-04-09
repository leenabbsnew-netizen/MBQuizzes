import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
const g = globalThis as any;
const prisma: PrismaClient = g.prisma || (g.prisma = new PrismaClient());
function round2(n: number) { return Math.round(n * 100) / 100; }
function customerPrice(base: number, fee: number, vat: number) { return round2((base + fee) * (1 + vat)); }
function quizPrize(teams: number, ladder: any[]) { const s = [...ladder].sort((a: any, b: any) => b.minTeams - a.minTeams); for (const step of s) { if (teams >= step.minTeams) return step.prize; } return s[s.length - 1]?.prize ?? 0; }
function calcEcon(eventType: string, mainSold: number, bonusSold: number, totalOrders: number, a: any, boardOverride?: number) {
  const isBingo = eventType === 'standalone_bingo';
  const isThemed = eventType.includes('themed');
  const hasBingo = eventType.includes('bingo');
  const mainPrice = isBingo ? a.bingoMainCardAllIn : customerPrice(a.quizBasePrice, a.paygFeePerItem, a.customerVatRate);
  const bonusPrice = isBingo ? a.bingoBonusAllIn : customerPrice(a.bonusBingoBasePrice, a.paygFeePerItem, a.customerVatRate);
  const gross = round2(mainSold * mainPrice + bonusSold * bonusPrice);
  const vat = round2(gross * a.flatRateVat);
  const stripe = round2(gross * a.stripeFeePercent + a.stripeFixedFee * totalOrders);
  const payg = round2((mainSold + bonusSold) * a.paygFeePerItem);
  const net = round2(gross - vat - stripe - payg);
  const ads = isBingo ? a.bingoAds : isThemed ? a.themedQuizAds : a.coreQuizAds;
  const activation = isBingo ? 0 : isThemed ? a.themedQuizActivation : a.coreQuizActivation;
  const writing = isThemed ? a.themedQuizWriting : 0;
  const licence = hasBingo || isBingo ? round2(a.hostLicencePerMonth / a.satBingoEventsPerMonth) : 0;
  const other = isBingo ? a.bingoSoftwareOther : 0;
  const totalFixed = round2(ads + activation + writing + licence + other);
  let totalPrize: number;
  if (isBingo) { totalPrize = boardOverride ?? a.bingoDefaultPrizeBoard; }
  else { const qp = quizPrize(mainSold, JSON.parse(a.quizPrizeLadder)); const bp = hasBingo ? Math.min(round2(bonusSold * a.bingoPrizePerBonus), a.bingoPrizeCap) : 0; totalPrize = qp + bp; }
  const pool = round2(net - totalFixed - totalPrize);
  const hostShare = pool > 0 ? Math.max(pool * a.hostSplitPercent, a.hostMinimum) : 0;
  const hostTake = round2(Math.min(hostShare, Math.max(pool, 0)));
  const leeTake = round2(pool - hostTake);
  let status = 'run'; let reason = 'Meets thresholds';
  if (pool < 0) { status = 'do_not_run'; reason = 'Pool negative'; }
  else if (leeTake < a.leeMinimumAcceptable) { status = 'hold'; reason = 'Lee take below min'; }
  return { grossCharged: gross, flatRateVatAmount: vat, stripeFees: stripe, paygFees: payg, netAfterFees: net, ads, activation, writing, licence, zoomAlloc: 0, otherCosts: other, totalFixedCosts: totalFixed, totalPrize, profitPool: pool, hostTake, leeTake, status, statusReason: reason, moreMainsNeeded: 0, moreBonusNeeded: 0 };
}
async function getA() {
  let r = await prisma.assumptionSet.findFirst({ where: { isActive: true } });
  if (!r) r = await prisma.assumptionSet.create({ data: { id: 'default', name: 'default', isActive: true } });
  return r;
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = (req.url || '').replace(/^\/api\/?/, '').split('?')[0];
  const m = req.method || 'GET';
  try {
    if (path === 'events' && m === 'GET') {
      const events = await prisma.event.findMany({ include: { ticketTypes: true, decisions: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { startDate: 'desc' } });
      const out = await Promise.all(events.map(async (e: any) => {
        const ms = e.ticketTypes.filter((t: any) => ['quiz_team','bingo_main'].includes(t.productCategory)).reduce((s: number, t: any) => s+t.sold, 0);
        const bs = e.ticketTypes.filter((t: any) => ['bingo_bonus','bingo_addon'].includes(t.productCategory)).reduce((s: number, t: any) => s+t.sold, 0);
        const oc = await prisma.order.count({ where: { eventId: e.id, cancelled: false } });
        const rv = await prisma.order.aggregate({ where: { eventId: e.id, cancelled: false }, _sum: { totalPaid: true } });
        return { ...e, mainSold: ms, bonusSold: bs, orderCount: oc, totalRevenue: rv._sum.totalPaid || 0, latestDecision: e.decisions[0] || null };
      }));
      return res.json(out);
    }
    if (path === 'assumptions' && m === 'GET') return res.json(await getA());
    if (path === 'assumptions' && m === 'PUT') { const a = await getA(); return res.json(await prisma.assumptionSet.update({ where: { id: a.id }, data: { ...req.body, quizPrizeLadder: req.body.quizPrizeLadder ? JSON.stringify(req.body.quizPrizeLadder) : undefined } })); }
    if (path === 'decisions') return res.json(await prisma.decisionLog.findMany({ include: { event: true }, orderBy: { createdAt: 'desc' }, take: 200 }));
    if (path === 'reconciliation') return res.json({ matched: 0, unmatchedPayments: [], unmatchedOrders: [], refunds: [], duplicates: [], totalStripeGross: 0, totalTTGross: 0, variance: 0 });
    if (path === 'sync' && m === 'POST') return res.json({ tt: { eventsProcessed: 0, ordersProcessed: 0, errors: ['Sync ready'] }, stripe: { paymentsProcessed: 0, errors: [] } });
    if (path === 'sync/log') return res.json([]);
    if (path === 'hosts') return res.json(await prisma.host.findMany({ where: { isActive: true } }));
    if (path === 'planner') return res.json([]);
    const em = path.match(/^events\/([^/]+)\/economics$/);
    if (em && m === 'GET') {
      const ev = await prisma.event.findUnique({ where: { id: em[1] }, include: { ticketTypes: true } });
      if (!ev) return res.status(404).json({ error: 'Not found' });
      const a = await getA();
      const ms = ev.ticketTypes.filter((t: any) => ['quiz_team','bingo_main'].includes(t.productCategory)).reduce((s: number, t: any) => s+t.sold, 0);
      const bs = ev.ticketTypes.filter((t: any) => ['bingo_bonus','bingo_addon'].includes(t.productCategory)).reduce((s: number, t: any) => s+t.sold, 0);
      const to = await prisma.order.count({ where: { eventId: ev.id, cancelled: false } });
      const bo = req.query.board ? parseFloat(req.query.board as string) : undefined;
      return res.json({ event: ev, sales: { mainSold: ms, bonusSold: bs, totalOrders: to }, economics: calcEcon(ev.eventType, ms, bs, to, a, bo), assumptions: a });
    }
    const dm = path.match(/^events\/([^/]+)\/decision$/);
    if (dm && m === 'POST') { const { decision, notes, mainCardsSold, bonusSold, profitPool, hostTake, leeTake, prizeBoard } = req.body; return res.json(await prisma.decisionLog.create({ data: { eventId: dm[1], decision, decidedBy: 'lee', notes, mainCardsSold, bonusSold, profitPool, hostTake, leeTake, prizeBoard } })); }
    const evm = path.match(/^events\/([^/]+)$/);
    if (evm && m === 'GET') { const ev = await prisma.event.findUnique({ where: { id: evm[1] }, include: { ticketTypes: true, decisions: { orderBy: { createdAt: 'desc' }, take: 10 }, snapshots: { orderBy: { createdAt: 'desc' }, take: 5 } } }); return ev ? res.json(ev) : res.status(404).json({ error: 'Not found' }); }
    return res.status(404).json({ error: 'Not found', path });
  } catch (err: any) { console.error(err); return res.status(500).json({ error: err.message }); }
}
