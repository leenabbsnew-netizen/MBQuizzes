import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateEventEconomics, calculateBingoDecision, bingoPoolMatrix, type Assumptions, type EventSales, type EventType } from '../services/calculator';
import { syncAll } from '../services/sync';
import { runReconciliation } from '../services/reconciliation';

const prisma = new PrismaClient();
const router = Router();

// ─── Helper: load active assumptions ───

async function getAssumptions(): Promise<Assumptions> {
  const row = await prisma.assumptionSet.findFirst({ where: { isActive: true } });
  if (!row) throw new Error('No active assumption set');
  return {
    ...row,
    quizPrizeLadder: JSON.parse(row.quizPrizeLadder),
  } as unknown as Assumptions;
}

// ─── Events ───

router.get('/events', async (_req: Request, res: Response) => {
  const events = await prisma.event.findMany({
    include: { ticketTypes: true, decisions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { startDate: 'desc' },
  });

  // Enrich with sales summaries
  const enriched = await Promise.all(events.map(async (event) => {
    const mainTypes = event.ticketTypes.filter(t => ['quiz_team', 'bingo_main'].includes(t.productCategory));
    const bonusTypes = event.ticketTypes.filter(t => ['bingo_bonus', 'bingo_addon'].includes(t.productCategory));
    const mainSold = mainTypes.reduce((s, t) => s + t.sold, 0);
    const bonusSold = bonusTypes.reduce((s, t) => s + t.sold, 0);

    const orderCount = await prisma.order.count({ where: { eventId: event.id, cancelled: false } });
    const revenue = await prisma.order.aggregate({
      where: { eventId: event.id, cancelled: false },
      _sum: { totalPaid: true },
    });

    return {
      ...event,
      mainSold,
      bonusSold,
      orderCount,
      totalRevenue: revenue._sum.totalPaid || 0,
      latestDecision: event.decisions[0] || null,
    };
  }));

  res.json(enriched);
});

router.get('/events/:id', async (req: Request, res: Response) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: {
      ticketTypes: true,
      orders: { include: { lines: true, payments: true }, orderBy: { orderDate: 'desc' }, take: 50 },
      decisions: { orderBy: { createdAt: 'desc' }, take: 10 },
      snapshots: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

router.get('/events/:id/economics', async (req: Request, res: Response) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: { ticketTypes: true },
  });
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const assumptions = await getAssumptions();
  const mainTypes = event.ticketTypes.filter(t => ['quiz_team', 'bingo_main'].includes(t.productCategory));
  const bonusTypes = event.ticketTypes.filter(t => ['bingo_bonus', 'bingo_addon'].includes(t.productCategory));

  const sales: EventSales = {
    mainSold: mainTypes.reduce((s, t) => s + t.sold, 0),
    bonusSold: bonusTypes.reduce((s, t) => s + t.sold, 0),
    totalOrders: await prisma.order.count({ where: { eventId: event.id, cancelled: false } }),
  };

  const boardOverride = req.query.board ? parseFloat(req.query.board as string) : undefined;
  const eventType = event.eventType as EventType;

  if (eventType === 'standalone_bingo') {
    const decision = calculateBingoDecision(sales, assumptions, boardOverride);
    res.json({ event, sales, ...decision, assumptions });
  } else {
    const economics = calculateEventEconomics(eventType, sales, assumptions, undefined, boardOverride);
    res.json({ event, sales, economics, assumptions });
  }
});

// ─── Decisions ───

router.post('/events/:id/decision', async (req: Request, res: Response) => {
  const { decision, notes, mainCardsSold, bonusSold, profitPool, hostTake, leeTake, prizeBoard } = req.body;
  if (!['run', 'hold', 'do_not_run'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision' });
  }

  const log = await prisma.decisionLog.create({
    data: {
      eventId: req.params.id,
      decision,
      decidedBy: 'lee',
      notes,
      mainCardsSold,
      bonusSold,
      profitPool,
      hostTake,
      leeTake,
      prizeBoard,
    },
  });
  res.json(log);
});

router.get('/decisions', async (_req: Request, res: Response) => {
  const decisions = await prisma.decisionLog.findMany({
    include: { event: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(decisions);
});

// ─── Sync ───

router.post('/sync', async (_req: Request, res: Response) => {
  try {
    const result = await syncAll();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sync/log', async (_req: Request, res: Response) => {
  const logs = await prisma.syncRun.findMany({ orderBy: { startedAt: 'desc' }, take: 50 });
  res.json(logs);
});

// ─── Assumptions ───

router.get('/assumptions', async (_req: Request, res: Response) => {
  const active = await prisma.assumptionSet.findFirst({ where: { isActive: true } });
  res.json(active);
});

router.put('/assumptions', async (req: Request, res: Response) => {
  const active = await prisma.assumptionSet.findFirst({ where: { isActive: true } });
  if (!active) return res.status(404).json({ error: 'No active assumption set' });

  const updated = await prisma.assumptionSet.update({
    where: { id: active.id },
    data: {
      ...req.body,
      quizPrizeLadder: req.body.quizPrizeLadder
        ? JSON.stringify(req.body.quizPrizeLadder)
        : undefined,
      updatedAt: new Date(),
    },
  });
  res.json(updated);
});

// ─── Reconciliation ───

router.get('/reconciliation', async (_req: Request, res: Response) => {
  const report = await runReconciliation();
  res.json(report);
});

// ─── Bingo Matrix ───

router.get('/reports/bingo-matrix', async (req: Request, res: Response) => {
  const assumptions = await getAssumptions();
  const maxMain = parseInt(req.query.maxMain as string) || 50;
  const maxBonus = parseInt(req.query.maxBonus as string) || 50;
  const board = req.query.board ? parseFloat(req.query.board as string) : undefined;
  const matrix = bingoPoolMatrix(maxMain, maxBonus, assumptions, board);
  res.json({ matrix, maxMain, maxBonus, prizeBoard: board || assumptions.bingoDefaultPrizeBoard });
});

// ─── Planner ───

router.get('/planner', async (_req: Request, res: Response) => {
  const entries = await prisma.plannerEntry.findMany({
    include: { event: true },
    orderBy: [{ date: 'asc' }],
  });
  res.json(entries);
});

// ─── Hosts ───

router.get('/hosts', async (_req: Request, res: Response) => {
  const hosts = await prisma.host.findMany({ where: { isActive: true } });
  res.json(hosts);
});

export default router;
