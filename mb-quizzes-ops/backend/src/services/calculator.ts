/**
 * MB Quizzes Calculation Engine
 *
 * Pure functions. No side effects. No database calls.
 * Every function takes explicit inputs and returns explicit outputs.
 */

// ─── Types ───

export interface Assumptions {
  quizBasePrice: number;
  themedQuizBasePrice: number;
  bonusBingoBasePrice: number;
  bingoMainCardAllIn: number;
  bingoBonusAllIn: number;
  customerVatRate: number;
  flatRateVat: number;
  stripeFeePercent: number;
  stripeFixedFee: number;
  paygFeePerItem: number;
  coreQuizAds: number;
  coreQuizActivation: number;
  themedQuizAds: number;
  themedQuizActivation: number;
  themedQuizWriting: number;
  bingoAds: number;
  bingoSoftwareOther: number;
  hostLicencePerMonth: number;
  satBingoEventsPerMonth: number;
  zoomCostPerHost: number;
  hostMinimum: number;
  hostSplitPercent: number;
  leeMinimumAcceptable: number;
  bingoTargetPool: number;
  bingoSoftPool: number;
  bingoDefaultPrizeBoard: number;
  bingoConservativeBonus: number;
  quizPrizeLadder: PrizeLadderStep[];
  bingoPrizePerBonus: number;
  bingoPrizeCap: number;
}

export interface PrizeLadderStep {
  minTeams: number;
  prize: number;
}

export type EventType =
  | 'core_quiz'
  | 'themed_quiz'
  | 'core_quiz_bingo'
  | 'themed_quiz_bingo'
  | 'standalone_bingo';

export type DecisionStatus = 'run' | 'hold' | 'do_not_run';

export interface EventSales {
  mainSold: number;       // quiz teams or bingo main cards
  bonusSold: number;      // bonus bingo add-ons
  totalOrders: number;    // total separate payment orders (for Stripe fixed fee calc)
}

export interface EventEconomics {
  // Revenue
  grossCharged: number;
  flatRateVatAmount: number;
  stripeFees: number;
  paygFees: number;
  netAfterFees: number;

  // Costs
  ads: number;
  activation: number;
  writing: number;
  licence: number;
  zoomAlloc: number;
  otherCosts: number;
  totalFixedCosts: number;

  // Prizes
  quizPrize: number;
  bingoPrize: number;
  totalPrize: number;

  // Results
  profitPool: number;
  hostTake: number;
  leeTake: number;
  hostTakePercent: number;

  // Decision
  status: DecisionStatus;
  statusReason: string;

  // Needs
  moreMainsNeeded: number;
  moreBonusNeeded: number;
}

export interface BingoBoard {
  total: number;
  game1: number;
  game2: number;
  game3: number;
  game4Bonus: number;
}

export interface BingoDecision {
  economics: EventEconomics;
  board: BingoBoard;
  actualPool: number;
  conservativeForecastPool: number;
  conservativeBonusForecast: number;
  maxPrizeBoardAtMinPool: number;
  maxPrizeBoardAtTargetPool: number;
  mainCardsWithoutBonus: number;
}

// ─── Customer Price Calculations ───

/** Calculate what the customer pays for a quiz/bingo-addon ticket */
export function customerPrice(basePrice: number, bookingFee: number, vatRate: number): number {
  return round2((basePrice + bookingFee) * (1 + vatRate));
}

/** For all-in prices (Saturday bingo), the customer price IS the input */
export function allInPrice(allIn: number): number {
  return allIn;
}

// ─── Gross Revenue ───

export function grossCharged(
  mainSold: number,
  mainCustomerPrice: number,
  bonusSold: number,
  bonusCustomerPrice: number
): number {
  return round2(mainSold * mainCustomerPrice + bonusSold * bonusCustomerPrice);
}

// ─── Deductions ───

export function flatRateVatAmount(gross: number, flatRateVat: number): number {
  return round2(gross * flatRateVat);
}

export function stripeFees(
  gross: number,
  feePercent: number,
  fixedFee: number,
  totalOrders: number
): number {
  return round2(gross * feePercent + fixedFee * totalOrders);
}

export function paygFees(totalItems: number, feePerItem: number): number {
  return round2(totalItems * feePerItem);
}

// ─── Event Fixed Costs ───

export function eventFixedCosts(eventType: EventType, a: Assumptions): {
  ads: number;
  activation: number;
  writing: number;
  licence: number;
  otherCosts: number;
} {
  const hasBingo = eventType.includes('bingo');
  const isThemed = eventType.includes('themed');
  const isStandalone = eventType === 'standalone_bingo';

  let ads = isThemed ? a.themedQuizAds : a.coreQuizAds;
  let activation = isThemed ? a.themedQuizActivation : a.coreQuizActivation;
  let writing = isThemed ? a.themedQuizWriting : 0;
  let licence = 0;
  let otherCosts = 0;

  if (isStandalone) {
    ads = a.bingoAds;
    activation = 0;
    writing = 0;
    otherCosts = a.bingoSoftwareOther;
    licence = round2(a.hostLicencePerMonth / a.satBingoEventsPerMonth);
  } else if (hasBingo) {
    licence = round2(a.hostLicencePerMonth / a.satBingoEventsPerMonth);
  }

  return { ads, activation, writing, licence, otherCosts };
}

// ─── Prize Calculations ───

export function quizPrizeFromLadder(teams: number, ladder: PrizeLadderStep[]): number {
  const sorted = [...ladder].sort((a, b) => b.minTeams - a.minTeams);
  for (const step of sorted) {
    if (teams >= step.minTeams) return step.prize;
  }
  return sorted[sorted.length - 1]?.prize ?? 0;
}

export function bingoBonusPrize(bonusSold: number, prizePerBonus: number, cap: number): number {
  return Math.min(round2(bonusSold * prizePerBonus), cap);
}

// ─── Host / Lee Split ───

export function hostAndLeeSplit(
  profitPool: number,
  hostMinimum: number,
  splitPercent: number
): { hostTake: number; leeTake: number; hostPercent: number } {
  if (profitPool <= 0) {
    return { hostTake: 0, leeTake: profitPool, hostPercent: 0 };
  }
  const hostShare = profitPool * splitPercent;
  const hostTake = Math.max(hostShare, hostMinimum);
  const leeTake = round2(profitPool - hostTake);
  return {
    hostTake: round2(Math.min(hostTake, profitPool)),
    leeTake,
    hostPercent: round2(Math.min(hostTake, profitPool) / profitPool),
  };
}

// ─── Decision Logic ───

export function decideStatus(
  profitPool: number,
  leeTake: number,
  leeMinimum: number,
  hostMinimum: number
): { status: DecisionStatus; reason: string } {
  if (profitPool < 0) {
    return { status: 'do_not_run', reason: `Profit pool is negative (£${profitPool.toFixed(2)})` };
  }
  if (leeTake < 0) {
    return { status: 'do_not_run', reason: `Lee/MB take is negative (£${leeTake.toFixed(2)})` };
  }
  if (profitPool < hostMinimum + leeMinimum) {
    return {
      status: 'hold',
      reason: `Pool £${profitPool.toFixed(2)} below minimum £${(hostMinimum + leeMinimum).toFixed(2)}`,
    };
  }
  if (leeTake < leeMinimum) {
    return { status: 'hold', reason: `Lee take £${leeTake.toFixed(2)} below minimum £${leeMinimum.toFixed(2)}` };
  }
  return { status: 'run', reason: 'Meets thresholds' };
}

// ─── Full Event Economics ───

export function calculateEventEconomics(
  eventType: EventType,
  sales: EventSales,
  a: Assumptions,
  manualPrizeOverride?: number,
  manualBoardOverride?: number
): EventEconomics {
  const isStandalone = eventType === 'standalone_bingo';

  // Customer prices
  const mainPrice = isStandalone
    ? a.bingoMainCardAllIn
    : customerPrice(a.quizBasePrice, a.paygFeePerItem, a.customerVatRate);
  const bonusPrice = isStandalone
    ? a.bingoBonusAllIn
    : customerPrice(a.bonusBingoBasePrice, a.paygFeePerItem, a.customerVatRate);

  // Revenue
  const gross = grossCharged(sales.mainSold, mainPrice, sales.bonusSold, bonusPrice);
  const vatAmt = flatRateVatAmount(gross, a.flatRateVat);
  const stripe = stripeFees(gross, a.stripeFeePercent, a.stripeFixedFee, sales.totalOrders);
  const totalItems = sales.mainSold + sales.bonusSold;
  const payg = paygFees(totalItems, a.paygFeePerItem);
  const net = round2(gross - vatAmt - stripe - payg);

  // Costs
  const costs = eventFixedCosts(eventType, a);
  const totalFixed = round2(costs.ads + costs.activation + costs.writing + costs.licence + costs.otherCosts);

  // Prizes
  let quizPrize = 0;
  let bingoPrize = 0;
  let totalPrize = 0;

  if (isStandalone) {
    totalPrize = manualBoardOverride ?? a.bingoDefaultPrizeBoard;
  } else {
    quizPrize = quizPrizeFromLadder(sales.mainSold, a.quizPrizeLadder);
    if (eventType.includes('bingo')) {
      bingoPrize = bingoBonusPrize(sales.bonusSold, a.bingoPrizePerBonus, a.bingoPrizeCap);
    }
    totalPrize = manualPrizeOverride ?? (quizPrize + bingoPrize);
  }

  // Profit pool
  const profitPool = round2(net - totalFixed - totalPrize);

  // Host/Lee split
  const split = hostAndLeeSplit(profitPool, a.hostMinimum, a.hostSplitPercent);

  // Decision
  const decision = decideStatus(profitPool, split.leeTake, a.leeMinimumAcceptable, a.hostMinimum);

  // Needs calculation
  const netPerMain = round2(mainPrice * (1 - a.flatRateVat) - mainPrice * a.stripeFeePercent - a.paygFeePerItem);
  const netPerBonus = round2(bonusPrice * (1 - a.flatRateVat) - bonusPrice * a.stripeFeePercent - a.paygFeePerItem);
  const deficit = Math.max(0, (a.hostMinimum + a.leeMinimumAcceptable) - profitPool);
  const moreMainsNeeded = deficit > 0 ? Math.ceil(deficit / netPerMain) : 0;
  const moreBonusNeeded = deficit > 0 ? Math.ceil(deficit / netPerBonus) : 0;

  return {
    grossCharged: gross,
    flatRateVatAmount: vatAmt,
    stripeFees: stripe,
    paygFees: payg,
    netAfterFees: net,
    ads: costs.ads,
    activation: costs.activation,
    writing: costs.writing,
    licence: costs.licence,
    zoomAlloc: 0,
    otherCosts: costs.otherCosts,
    totalFixedCosts: totalFixed,
    quizPrize,
    bingoPrize,
    totalPrize,
    profitPool,
    hostTake: split.hostTake,
    leeTake: split.leeTake,
    hostTakePercent: split.hostPercent,
    status: decision.status,
    statusReason: decision.reason,
    moreMainsNeeded,
    moreBonusNeeded,
  };
}

// ─── Saturday Bingo Specific ───

export function buildBingoBoard(totalPrize: number): BingoBoard {
  // Default proportional split: 15% / 20% / 25% / 40%
  return {
    total: totalPrize,
    game1: round2(totalPrize * 0.15),
    game2: round2(totalPrize * 0.20),
    game3: round2(totalPrize * 0.25),
    game4Bonus: round2(totalPrize * 0.40),
  };
}

export function calculateBingoDecision(
  sales: EventSales,
  a: Assumptions,
  prizeBoardOverride?: number
): BingoDecision {
  const prizeBoard = prizeBoardOverride ?? a.bingoDefaultPrizeBoard;
  const economics = calculateEventEconomics('standalone_bingo', sales, a, undefined, prizeBoard);

  // Conservative forecast: bonus buyers who haven't bought yet
  const conservativeBonusForecast = Math.round(sales.mainSold * a.bingoConservativeBonus);
  const forecastBonusSold = Math.max(sales.bonusSold, conservativeBonusForecast);

  const forecastSales: EventSales = {
    mainSold: sales.mainSold,
    bonusSold: forecastBonusSold,
    totalOrders: sales.mainSold + forecastBonusSold, // worst case: all separate orders
  };
  const forecastEcon = calculateEventEconomics('standalone_bingo', forecastSales, a, undefined, prizeBoard);

  // Max prize board calculations
  const netBeforePrize = economics.netAfterFees - economics.totalFixedCosts + economics.totalPrize;
  const maxPrizeBoardAtMinPool = Math.max(0, round2(netBeforePrize - a.bingoSoftPool));
  const maxPrizeBoardAtTargetPool = Math.max(0, round2(netBeforePrize - a.bingoTargetPool));

  const mainCardsWithoutBonus = sales.mainSold - sales.bonusSold;

  return {
    economics,
    board: buildBingoBoard(prizeBoard),
    actualPool: economics.profitPool,
    conservativeForecastPool: forecastEcon.profitPool,
    conservativeBonusForecast,
    maxPrizeBoardAtMinPool,
    maxPrizeBoardAtTargetPool,
    mainCardsWithoutBonus: Math.max(0, mainCardsWithoutBonus),
  };
}

/** Generate profit pool matrix for given main/bonus ranges */
export function bingoPoolMatrix(
  maxMain: number,
  maxBonus: number,
  a: Assumptions,
  prizeBoard?: number
): number[][] {
  const matrix: number[][] = [];
  for (let m = 0; m <= maxMain; m++) {
    const row: number[] = [];
    for (let b = 0; b <= maxBonus; b++) {
      const sales: EventSales = { mainSold: m, bonusSold: b, totalOrders: m + b };
      const econ = calculateEventEconomics('standalone_bingo', sales, a, undefined, prizeBoard ?? a.bingoDefaultPrizeBoard);
      row.push(round2(econ.profitPool));
    }
    matrix.push(row);
  }
  return matrix;
}

// ─── Utility ───

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export { round2 };
