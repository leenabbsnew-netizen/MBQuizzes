import {
  customerPrice,
  grossCharged,
  flatRateVatAmount,
  stripeFees,
  paygFees,
  quizPrizeFromLadder,
  bingoBonusPrize,
  hostAndLeeSplit,
  decideStatus,
  calculateEventEconomics,
  calculateBingoDecision,
  round2,
  type Assumptions,
  type EventSales,
  type PrizeLadderStep,
} from '../services/calculator';

const DEFAULT_LADDER: PrizeLadderStep[] = [
  { minTeams: 0, prize: 15 },
  { minTeams: 25, prize: 20 },
  { minTeams: 30, prize: 25 },
  { minTeams: 35, prize: 30 },
  { minTeams: 40, prize: 35 },
  { minTeams: 45, prize: 40 },
];

const ASSUMPTIONS: Assumptions = {
  quizBasePrice: 6.00,
  themedQuizBasePrice: 6.00,
  bonusBingoBasePrice: 6.00,
  bingoMainCardAllIn: 15.00,
  bingoBonusAllIn: 6.18,
  customerVatRate: 0.20,
  flatRateVat: 0.125,
  stripeFeePercent: 0.015,
  stripeFixedFee: 0.20,
  paygFeePerItem: 0.15,
  coreQuizAds: 25,
  coreQuizActivation: 16.20,
  themedQuizAds: 31.20,
  themedQuizActivation: 21.80,
  themedQuizWriting: 35,
  bingoAds: 25,
  bingoSoftwareOther: 10,
  hostLicencePerMonth: 16,
  satBingoEventsPerMonth: 4,
  zoomCostPerHost: 0,
  hostMinimum: 50,
  hostSplitPercent: 0.50,
  leeMinimumAcceptable: 25,
  bingoTargetPool: 100,
  bingoSoftPool: 75,
  bingoDefaultPrizeBoard: 200,
  bingoConservativeBonus: 0.70,
  quizPrizeLadder: DEFAULT_LADDER,
  bingoPrizePerBonus: 1.50,
  bingoPrizeCap: 50,
};

describe('Customer Price', () => {
  test('quiz at £6 base + 15p fee + 20% VAT = £7.38', () => {
    expect(customerPrice(6.00, 0.15, 0.20)).toBe(7.38);
  });

  test('bonus bingo at £5 base + 15p fee + 20% VAT = £6.18', () => {
    expect(customerPrice(5.00, 0.15, 0.20)).toBe(6.18);
  });
});

describe('Gross Charged', () => {
  test('25 quiz teams at £7.38 + 10 bingo at £6.18', () => {
    expect(grossCharged(25, 7.38, 10, 6.18)).toBe(246.30);
  });

  test('zero sales = zero gross', () => {
    expect(grossCharged(0, 7.38, 0, 6.18)).toBe(0);
  });
});

describe('Flat Rate VAT', () => {
  test('12.5% of £246.30', () => {
    expect(flatRateVatAmount(246.30, 0.125)).toBe(30.79);
  });

  test('8.5% of £246.30', () => {
    expect(flatRateVatAmount(246.30, 0.085)).toBe(20.94);
  });
});

describe('Stripe Fees', () => {
  test('1.5% + £0.20 per order', () => {
    const result = stripeFees(246.30, 0.015, 0.20, 25);
    expect(result).toBe(round2(246.30 * 0.015 + 0.20 * 25));
  });
});

describe('PAYG Fees', () => {
  test('35 items at 15p', () => {
    expect(paygFees(35, 0.15)).toBe(5.25);
  });
});

describe('Quiz Prize Ladder', () => {
  test('20 teams = £15', () => {
    expect(quizPrizeFromLadder(20, DEFAULT_LADDER)).toBe(15);
  });

  test('25 teams = £20', () => {
    expect(quizPrizeFromLadder(25, DEFAULT_LADDER)).toBe(20);
  });

  test('40 teams = £35', () => {
    expect(quizPrizeFromLadder(40, DEFAULT_LADDER)).toBe(35);
  });

  test('50 teams = £40', () => {
    expect(quizPrizeFromLadder(50, DEFAULT_LADDER)).toBe(40);
  });
});

describe('Bingo Bonus Prize', () => {
  test('10 bonus at £1.50 = £15', () => {
    expect(bingoBonusPrize(10, 1.50, 50)).toBe(15);
  });

  test('cap at £50', () => {
    expect(bingoBonusPrize(100, 1.50, 50)).toBe(50);
  });
});

describe('Host / Lee Split', () => {
  test('50/50 on £200 pool', () => {
    const split = hostAndLeeSplit(200, 50, 0.50);
    expect(split.hostTake).toBe(100);
    expect(split.leeTake).toBe(100);
  });

  test('host minimum kicks in on £80 pool', () => {
    const split = hostAndLeeSplit(80, 50, 0.50);
    expect(split.hostTake).toBe(50);
    expect(split.leeTake).toBe(30);
  });

  test('negative pool = host gets 0', () => {
    const split = hostAndLeeSplit(-20, 50, 0.50);
    expect(split.hostTake).toBe(0);
    expect(split.leeTake).toBe(-20);
  });
});

describe('Decision Status', () => {
  test('healthy event = run', () => {
    const d = decideStatus(150, 75, 25, 50);
    expect(d.status).toBe('run');
  });

  test('negative pool = do not run', () => {
    const d = decideStatus(-10, -60, 25, 50);
    expect(d.status).toBe('do_not_run');
  });

  test('borderline = hold', () => {
    const d = decideStatus(60, 10, 25, 50);
    expect(d.status).toBe('hold');
  });
});

describe('Full Event Economics', () => {
  test('core quiz + bingo with 25 teams + 10 bonus', () => {
    const sales: EventSales = { mainSold: 25, bonusSold: 10, totalOrders: 25 };
    const econ = calculateEventEconomics('core_quiz_bingo', sales, ASSUMPTIONS);

    expect(econ.grossCharged).toBeGreaterThan(0);
    expect(econ.netAfterFees).toBeLessThan(econ.grossCharged);
    expect(econ.profitPool).toBeDefined();
    expect(econ.hostTake).toBeGreaterThanOrEqual(0);
    expect(econ.status).toBeDefined();
  });

  test('themed quiz with 19 teams loses money', () => {
    const sales: EventSales = { mainSold: 19, bonusSold: 0, totalOrders: 19 };
    const econ = calculateEventEconomics('themed_quiz', sales, ASSUMPTIONS);

    // With £31.20 ads + £21.80 activation + £35 writing = £88 fixed costs
    // 19 teams can't cover this
    expect(econ.profitPool).toBeLessThan(50);
    expect(econ.leeTake).toBeLessThan(25);
  });

  test('Saturday GK at 57 teams is very healthy', () => {
    const sales: EventSales = { mainSold: 57, bonusSold: 20, totalOrders: 57 };
    const econ = calculateEventEconomics('core_quiz_bingo', sales, ASSUMPTIONS);

    expect(econ.profitPool).toBeGreaterThan(200);
    expect(econ.status).toBe('run');
  });
});

describe('Saturday Bingo Decision', () => {
  test('23 main + 17 bonus at £200 board', () => {
    const sales: EventSales = { mainSold: 23, bonusSold: 17, totalOrders: 40 };
    const decision = calculateBingoDecision(sales, ASSUMPTIONS, 200);

    expect(decision.economics.grossCharged).toBeGreaterThan(0);
    expect(decision.board.total).toBe(200);
    expect(decision.conservativeBonusForecast).toBe(Math.round(23 * 0.70));
    expect(decision.actualPool).toBeDefined();
  });

  test('15 main + 5 bonus is borderline', () => {
    const sales: EventSales = { mainSold: 15, bonusSold: 5, totalOrders: 20 };
    const decision = calculateBingoDecision(sales, ASSUMPTIONS, 200);

    // At these low numbers, pool is likely negative or very small
    expect(decision.economics.profitPool).toBeLessThan(100);
  });

  test('30 main + 22 bonus is healthy', () => {
    const sales: EventSales = { mainSold: 30, bonusSold: 22, totalOrders: 52 };
    const decision = calculateBingoDecision(sales, ASSUMPTIONS, 200);

    expect(decision.economics.profitPool).toBeGreaterThan(100);
    expect(decision.economics.status).toBe('run');
  });

  test('max prize board at target respects minimum pool', () => {
    const sales: EventSales = { mainSold: 25, bonusSold: 18, totalOrders: 43 };
    const decision = calculateBingoDecision(sales, ASSUMPTIONS, 200);

    // Max board at target should leave exactly the target pool
    expect(decision.maxPrizeBoardAtTargetPool).toBeGreaterThanOrEqual(0);
    expect(decision.maxPrizeBoardAtMinPool).toBeGreaterThanOrEqual(decision.maxPrizeBoardAtTargetPool);
  });
});

describe('Cross-check against payout sheet w/e 28 Mar', () => {
  // Payout sheet: Saturday Musiskill Bingo 23 main + 17 bonus, £315 gross, £225 prizes
  // That was at OLD prices (£10 main net / £5 bonus net)
  // At NEW £15 main / £6.18 bonus, same volume should be much better
  test('new pricing transforms bingo economics', () => {
    const sales: EventSales = { mainSold: 23, bonusSold: 17, totalOrders: 40 };
    const econ = calculateEventEconomics('standalone_bingo', sales, ASSUMPTIONS, undefined, 200);

    // At £15 main + £6.18 bonus: gross = 23*15 + 17*6.18 = 345 + 105.06 = 450.06
    expect(econ.grossCharged).toBeCloseTo(450.06, 0);
    // Profit pool should be significantly better than old £48.80
    expect(econ.profitPool).toBeGreaterThan(48.80);
  });
});
