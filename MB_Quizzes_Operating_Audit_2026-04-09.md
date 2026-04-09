# MB Quizzes — Forensic Operating Audit & Decision Model

**Prepared for Lee | 9 April 2026**

---

## 1. File Audit and Reliability Check

### Files in the bundle

| File | Type | Date range | Status | Good for |
|------|------|-----------|--------|----------|
| export_3832...7749.csv | Ticket Tailor order export | Apr 2025 – Apr 2026 | Raw, 17,422 orders | Revenue, pricing, customer analysis, event counts |
| export_3832...c450.csv | Ticket Tailor order export | Apr 2020 – ? | Raw, 25,723 orders | Covid-era comparison |
| export_3832...cace.csv | Ticket Tailor order export | Oct 2020 – ? | Raw, 46,527 orders | Covid-era comparison |
| export_3832...a1a7.csv | Ticket Tailor order export | Apr 2021 – ? | Raw, 48,454 orders | Transition-era comparison |
| export_3832...dcd2.csv | Ticket Tailor order export | Apr 2022 – ? | Raw, 32,260 orders | Post-Covid comparison |
| export_3832...0e59.csv | Ticket Tailor order export | Apr 2023 – ? | Raw, 29,286 orders | Near-normal trading |
| export_3832...4659.csv | Ticket Tailor order export | Apr 2024 – ? | Raw, 40,564 orders | Near-normal trading |
| export_3133...9ff5.csv | Different Ticket Tailor account | Jan 2023+ | Raw, unrelated | NOT MB Quizzes — this is a film/press event account. Ignore. |
| export-20260123-100434.csv | Square customer export | To Jan 2026 | Raw customer list | Customer matching only |
| Week Ending 29th March 2026.pdf | Weekly payout sheet | w/e 28 Mar 2026 | Raw, real costs/splits | Cross-checking unit economics, host pay, prize actuals |
| Screenshot 2026-04-06 22.01.21.png | Ticket Tailor checkout | 7 Apr 2026 | Live config | Two for Tuesdays pricing: £5.00 + £0.15 + VAT = £6.18 |
| Screenshot 2026-04-06 22.02.28.png | Ticket Tailor checkout | 11 Apr 2026 DRAFT | Draft config | Late Late Music Quiz: £6.00 + £0.15 + VAT = £7.38; Bonus bingo: £5.00 + £0.15 + VAT = £6.18 |
| Screenshot 2026-04-06 22.02.39.png | Ticket Tailor checkout | 11 Apr 2026 DRAFT | Draft, OLD price | Saturday Bingo at £10.00 main — SUPERSEDED |
| Screenshot 2026-04-09 10.29.40.png | Ticket Tailor checkout | 11 Apr 2026 | LATEST live config | Saturday Bingo MAIN = £12.35 + £0.15 + VAT = £15.00 all-in; Bonus = £5.00 + £0.15 + VAT = £6.18 |
| 1BC94E4D...jpeg | Bridge week schedule | w/c 10 Apr 2026 | Photo of schedule | Current week programming |
| MB_Quizzes_Master_Working_Export_2026-04-08.docx | Prior analysis | 8 Apr 2026 | Derived, comprehensive | Prior conclusions to re-test |
| MB_Quizzes_Ticketing_Customer_Analysis.docx | Customer analysis | Apr 2025–Apr 2026 | Derived | Customer concentration, repeat rates |
| MB_Quizzes_Consolidated_Working_Export.docx | Earlier consolidated analysis | 5 Apr 2026 | Derived | Earlier conclusions, some now superseded |
| MB_Quizzes_Ticket_Sold_Calculator.xlsx | Forward planning tool | Apr–May 2026 | Calculator, 8.5% VAT | Monthly plan, scenario modeling |
| MB_Quizzes_Bingo_Run_Log_Calculator.xlsx | Bingo decision tool | Undated | Calculator, 12.5% VAT | Saturday bingo go/no-go |
| MB_Quizzes_Saturday_Bingo_Decision_Tool.xlsx | Bingo decision tool | Undated | Calculator, 12.5% VAT | Saturday bingo go/no-go |
| MB_Quizzes_Pricing_Payout_Calculator.xlsx | Forward economics | Apr–May 2026 | Calculator, 8.5% VAT | Scenario tables, monthly plan |

### Critical data quality notes

1. **The film/press CSV (export_3133...) is not MB Quizzes data.** It is a separate Ticket Tailor account for film events. Discard entirely.
2. **The Square customer export is a customer directory only**, not transaction data.
3. **The payout sheet is the single most valuable cost document** — it shows actual line-by-line costs, prizes, and host splits for a real week.

---

## 2. Period / Comparability Warnings

| Period | Dates | Character | Use with caution |
|--------|-------|-----------|-----------------|
| **Covid / lockdown** | Apr 2020 – Sep 2021 | Abnormal at-home demand, inflated numbers, free quizzes common | Do NOT use as baseline |
| **Transition** | Oct 2021 – Mar 2023 | Gradual normalisation, some formats dying | Directional only |
| **More normal trading** | Apr 2023 – Aug 2025 | Closest to real underlying demand | Best comparison window |
| **Recent under-marketed** | Sep 2025 – Mar 2026 | Revenue fell 19.4% vs prior 6 months; marketing support reportedly weakened | Likely partly marketing-driven, not all structural |

**Key warning:** H2 2025/26 revenue (Oct–Mar) was £72,841 vs H1's £90,342 — a 19.4% drop. Monthly average fell from ~£15,057 to ~£12,140. This cannot be entirely structural. Marketing decline explains some but not all. December was inflated by Christmas events; stripping that out, the underlying trend is softer still.

---

## 3. What Is Structurally True

These conclusions hold regardless of marketing or Covid effects:

1. **MB Quizzes is a repeat-customer business.** Top 19% of customers generate 84.6% of revenue. 41.8% of customers buy once and contribute just 3.5% of revenue.

2. **Saturday General Knowledge is the flagship.** 51 weekly events in the dataset, average 57 orders/event, remarkably consistent (range 32–79, only December dips badly). Annual revenue £24,845 from this one event alone.

3. **General Knowledge is the only true scale engine.** £54,656 (33.4% of all revenue), broadest customer base, lowest cost structure per event.

4. **Music is the best secondary engine.** £27,691 combined across all music formats, strong repeat behaviour, works as both prime-time and late-night.

5. **Standalone bingo is high-revenue but high-risk.** £32,465 from 1,702 orders across all standalone bingo events — BUT the prize burden regularly destroys margin (see payout sheet: £315 gross, £225 prizes = 71% prize ratio).

6. **Themed quizzes carry higher costs.** Ads (£31.20 vs £25), activation (£21.80 vs £16.20), writing (£35), totaling ~£88 before prizes — roughly double the core quiz fixed cost of ~£41.

7. **Free events are bad revenue.** 369 free orders in the dataset (2.1%), contributing nothing. The prior analysis confirmed only 29.4% of free-event first-timers return within 90 days.

8. **The calendar is too cluttered.** 143 unique event names in one year. The top 8 recurring series produce ~79% of revenue.

---

## 4. What Is Likely Marketing Effect Only

These apparent weaknesses may reverse if marketing is restored:

1. **The H2 revenue decline.** The 19.4% drop correlates with reported marketing pullback. Saturday GK went from avg 63/event (Jun–Sep) to avg 54/event (Feb–Mar) — a drop, but not a collapse.

2. **Themed quiz softness.** Wednesday 21st Century Bangers pulled only 19 orders on payout week. But this is a DOUBLE hit: weak marketing + expensive format. With marketing, themed quizzes at 30+ teams are viable; without it, they're margin-negative.

3. **Sunday events.** The Sunday slot has been inconsistent but the audience exists. It may just need consistent marketing to stabilise at 30+ teams.

**What does NOT recover with marketing alone:**

- Prize-heavy bingo structures. The economics are broken regardless of marketing.
- Long-tail themed events that attract 15–20 teams. These lose money at any marketing level because fixed costs are too high.
- Two for Tuesdays at the £5.00 base price. Even at 40+ teams, the margin per team is too thin for the effort.

---

## 5. Final Unit Economics

### CRITICAL CONFLICT: VAT Rate

The bundle contains TWO different flat-rate VAT assumptions:

| Source | Rate | Where used |
|--------|------|-----------|
| Payout sheet (w/e 28 Mar) | **8.5%** | Real weekly accounting |
| Pricing Payout Calculator | **8.5%** | Forward model |
| Ticket Sold Calculator | **8.5%** | Forward model |
| Bingo Run Log Calculator | **12.5%** | Bingo decision tool |
| Saturday Bingo Decision Tool | **12.5%** | Bingo decision tool |

**Resolution:** Lee has confirmed the correct flat-rate VAT is **12.5%**. The bingo decision tools were correct. **The payout sheet (8.5%) and both forward planning calculators (Pricing Payout Calculator and Ticket Sold Calculator) are wrong and must be corrected to 12.5%.** Using 8.5% in those tools made events look more profitable than they actually are — every economics figure below uses the correct 12.5%.

### Current Pricing (as of 9 April 2026)

| Product | Base price ex-VAT | Booking fee | Customer VAT (20%) | Customer pays |
|---------|------------------|-------------|--------------------|--------------:|
| Quiz ticket (new price) | £6.00 | £0.15 | £1.23 | **£7.38** |
| Two for Tuesdays ticket | £5.00 | £0.15 | £1.03 | **£6.18** |
| Bonus bingo add-on | £5.00 | £0.15 | £1.03 | **£6.18** |
| Saturday bingo main card | £12.35 | £0.15 | £2.50 | **£15.00** |
| Saturday bingo bonus game | £5.00 | £0.15 | £1.03 | **£6.18** |

**Note:** Historic prices were lower. The CSV shows £6.52 all-in for quiz tickets throughout Apr 2025–Mar 2026, implying a base of ~£5.28. The new £6.00 base represents a ~14% price increase. Saturday bingo main has moved from £10.00 base (£12.18 all-in) to £12.35 base (£15.00 all-in) — a 23% increase.

### Deductions per ticket (at 12.5% flat-rate VAT)

| Deduction | Quiz @ £7.38 | TfT @ £6.18 | Bingo main @ £15.00 | Bingo bonus @ £6.18 |
|-----------|-------------|-------------|---------------------|---------------------|
| Flat-rate VAT (12.5% of gross) | £0.92 | £0.77 | £1.88 | £0.77 |
| PAYG fee (Ticket Tailor) | £0.15 | £0.15 | £0.15 | £0.15 |
| Stripe (1.5% + £0.20 per order*) | ~£0.31 | ~£0.29 | ~£0.43 | ~£0.29 |
| **Net per ticket** | **~£6.00** | **~£4.97** | **~£12.54** | **~£4.97** |

*Stripe fixed fee of £0.20 is per order. If customer buys quiz + bonus in one order, the £0.20 is shared. The figures above assume worst case (separate orders for conservatism on bingo bonus buyers who purchase later).

### Core Quiz (no bingo) — Unit Economics at New £6.00 Price (12.5% FRVAT)

| | 15 teams | 20 teams | 25 teams | 30 teams | 40 teams |
|---|------:|------:|------:|------:|------:|
| Gross charged | £110.70 | £147.60 | £184.50 | £221.40 | £295.20 |
| Net after VAT/fees | ~£89.95 | ~£119.94 | ~£149.92 | ~£179.90 | ~£239.87 |
| Ads | £25.00 | £25.00 | £25.00 | £25.00 | £25.00 |
| Activation | £16.20 | £16.20 | £16.20 | £16.20 | £16.20 |
| Prizes (ladder) | £15.00 | £15.00 | £20.00 | £25.00 | £35.00 |
| **Profit pool** | **£33.75** | **£63.74** | **£88.72** | **£113.70** | **£163.67** |
| Host @ 50% (min £50) | £50.00 | £50.00 | £50.00 | £56.85 | £81.84 |
| Lee/MB | -£16.25 | £13.74 | £38.72 | £56.85 | £81.83 |

### Core Quiz + Bonus Bingo — Unit Economics (12.5% FRVAT)

Assumes ~40% of quiz teams also buy bingo bonus (conservative).

| | 20 teams + 8 bingo | 25 + 10 | 30 + 12 | 40 + 18 |
|---|------:|------:|------:|------:|
| Gross charged | £197.04 | £246.30 | £295.56 | £406.44 |
| Net after VAT/fees | ~£161.25 | ~£201.57 | ~£241.88 | ~£332.83 |
| Ads + Activation | £41.20 | £41.20 | £41.20 | £41.20 |
| Bingo licence alloc | £13.20 | £13.20 | £13.20 | £13.20 |
| Quiz prize (ladder) | £15.00 | £20.00 | £25.00 | £35.00 |
| Bingo prize (£1.50/bonus, capped) | £12.00 | £15.00 | £18.00 | £27.00 |
| **Profit pool** | **£79.85** | **£112.17** | **£144.48** | **£216.43** |
| Host @ 50% | £50.00 | £56.09 | £72.24 | £108.22 |
| Lee/MB | £29.85 | £56.08 | £72.24 | £108.21 |

### Themed Quiz + Bonus Bingo (12.5% FRVAT)

| | 25 + 10 | 30 + 12 | 35 + 15 |
|---|------:|------:|------:|
| Net after VAT/fees | ~£201.57 | ~£241.88 | ~£287.35 |
| Ads | £31.20 | £31.20 | £31.20 |
| Activation | £21.80 | £21.80 | £21.80 |
| Writing | £35.00 | £35.00 | £35.00 |
| Licence alloc | £13.20 | £13.20 | £13.20 |
| Quiz prize | £20.00 | £25.00 | £30.00 |
| Bingo prize | £15.00 | £18.00 | £22.50 |
| **Profit pool** | **£65.37** | **£97.68** | **£133.65** |
| Host @ 50% | £50.00 | £50.00 | £66.83 |
| Lee/MB | £15.37 | £47.68 | £66.82 |

### Saturday Standalone Musiskill Bingo — Unit Economics at £15.00 Main Card (12.5% FRVAT)

| | 15 main + 10 bonus | 20 + 14 | 23 + 17 | 30 + 22 |
|---|------:|------:|------:|------:|
| Gross charged | £286.80 | £386.52 | £450.06 | £585.96 |
| Net after VAT/fees | ~£237.90 | ~£320.50 | ~£373.05 | ~£485.72 |
| Ads | £25.00 | £25.00 | £25.00 | £25.00 |
| Licence alloc (£16/4) | £4.00 | £4.00 | £4.00 | £4.00 |
| Software/other | £10.00 | £10.00 | £10.00 | £10.00 |
| **Available before prizes** | **£198.90** | **£281.50** | **£334.05** | **£446.72** |
| Prizes @ £200 board | £200.00 | £200.00 | £200.00 | £200.00 |
| **Profit pool** | **-£1.10** | **£81.50** | **£134.05** | **£246.72** |
| Host @ 50% | £0.00 | £50.00 | £67.03 | £123.36 |
| Lee/MB | -£1.10 | £31.50 | £67.02 | £123.36 |

**Cross-check against payout sheet (w/e 28 Mar):** The payout showed 23 main + 17 bonus at OLD prices (£10 main / £5 bonus NET), gross ~£315, prizes £225, profit £48.80. At the NEW £15 main card price with same sales volumes and £200 prize board, the profit pool jumps from £48.80 to ~£134 — a fundamental improvement. The price increase is the correct move.

**Critical note at 12.5% FRVAT:** 15 main + 10 bonus at a £200 board is now a NO GO (pool is negative). The minimum viable sales for a £200 board are approximately **18 main + 12 bonus**.

---

## 6. Final Prices, Prize Caps, Host Pay, and Lee/MB Take

### Price rules (confirmed from latest screenshots and calculators)

- Core quiz: £6.00 + £0.15 fee + VAT = **£7.38 customer price**
- Two for Tuesdays: £5.00 + £0.15 fee + VAT = **£6.18** (NOTE: this is lower than core quiz — deliberate retention pricing or needs correcting?)
- Bonus bingo add-on: £5.00 + £0.15 fee + VAT = **£6.18**
- Saturday bingo main card: £12.35 + £0.15 fee + VAT = **£15.00 all-in**
- Saturday bingo bonus game: £5.00 + £0.15 fee + VAT = **£6.18**

### Prize cap rules

| Event type | Prize ladder |
|-----------|-------------|
| Core quiz (0–24 teams) | £15 |
| Core quiz (25–29) | £20 |
| Core quiz (30–34) | £25 |
| Core quiz (35–39) | £30 |
| Core quiz (40–44) | £35 |
| Core quiz (45+) | £40 |
| Themed quiz | Same ladder |
| Bonus bingo (in-quiz) | £1.50 per bonus buyer, capped at bingo prize cap |
| Saturday standalone bingo (4 games) | See below |

### Saturday bingo 4-game prize board

| Sales level | Main cards | Total board | Game 1 | Game 2 | Game 3 | Game 4 (bonus) |
|------------|-----------|------------|--------|--------|--------|----------------|
| **No-go** | <18 | Do not run | — | — | — | — |
| **Soft minimum** | 18–22 | £150 | £30 (3 prizes) | £35 | £40 | £45 |
| **Target** | 23–29 | £200 | £40 | £45 | £50 | £65 |
| **Strong** | 30+ | £250 | £50 | £55 | £65 | £80 |

**Is £200 total prizes realistic at current sales?** At £15 main card + £6.18 bonus with 12.5% FRVAT, you need roughly **20 main + 14 bonus** to clear a £75 soft pool (£200 prizes + £75 = £275 needed after fixed costs). At recent sales levels (17–25 main cards), this is achievable but tight. Below 18 main cards, a £200 board is NOT viable — drop to £150.

### Host pay rules

**The mathematical tension:** The instruction says "50/50 split" but also "host minimum £50, Lee minimum £25." These are not the same rule.

- **True 50/50:** Host gets 50% of profit pool. If profit pool is £80, host gets £40, Lee gets £40. Host is UNDER £50.
- **Host minimum £50:** If profit pool is £80, host gets £50 (63%), Lee gets £30 (37%). Not 50/50.
- **Breakeven for both rules:** At profit pool = £100, 50/50 gives £50 each. Below £100, the host-minimum rule costs Lee more.

**Recommended operating rule:** Host payout = MAX(£50, 50% of profit pool). Lee/MB = profit pool minus host payout. This is what the Pricing Payout Calculator implements.

**Lee's floor:** Lee should not run any event where expected Lee/MB take is below £25. This means:
- Minimum profit pool of £75 (host £50 + Lee £25) for HOST MIN events
- Minimum profit pool of £100 for true 50/50 events

---

## 7. Go / No-Go Thresholds

### Core quiz (+ bonus bingo available)

| Level | Teams needed | Profit pool | Lee/MB |
|-------|-------------|-------------|--------|
| **No-go** | <18 | <£50 | Negative |
| **Marginal (host min drag)** | 18–20 | £50–£80 | <£25 |
| **Minimum viable** | 20–24 | £80–£110 | £25–£55 |
| **Healthy** | 25+ | £110+ | £55+ |

### Themed quiz (+ bonus bingo)

| Level | Teams needed | Profit pool | Lee/MB |
|-------|-------------|-------------|--------|
| **No-go** | <25 | <£65 | Negative or near-zero |
| **Marginal** | 25–29 | £65–£95 | <£30 |
| **Minimum viable** | 30+ | £95+ | £45+ |
| **Healthy** | 35+ | £130+ | £65+ |

### Saturday standalone bingo (at £15 main / £200 board)

| Level | Main cards needed | Bonus needed | Profit pool | Lee/MB |
|-------|------------------|-------------|-------------|--------|
| **No-go** | <18 | Any | Negative | Negative |
| **Soft go** (Lee accepts £25) | 19–20 | 14+ | £75+ | £25+ |
| **True 50/50 go** | 21+ | 15+ | £100+ | £50+ |
| **Healthy** | 25+ | 18+ | £150+ | £75+ |

---

## 8. Saturday Bingo Decision Logic

### Bonus-game lag / forecasting framework

Bonus games are often bought LATER than main cards. At any decision point, the host sees:
- Main cards sold NOW
- Bonus games sold NOW
- But more bonus buyers typically come in before/during the event

**Conservative decision framework:**

| At decision point | Main cards sold | Bonus sold now | Forecast final bonus | Decision |
|------------------|----------------|---------------|---------------------|----------|
| 48 hours before | 15 | 8 | ~12 (1.5x current) | HOLD — borderline |
| 48 hours before | 18 | 10 | ~14 | SOFT GO if prize board ≤ £175 |
| 48 hours before | 20+ | 12+ | ~17+ | GO at £200 board |
| 24 hours before | 18 | 14 | ~16 | SOFT GO |
| Day of event | 20 | 16 | 17–18 | GO at £200 board |

**Decision rules:**
1. Never commit the full £200 prize board until 20+ main cards are confirmed
2. If main cards are 15–19, cap the prize board at £150 and communicate "growing jackpot" to drive urgency
3. If main cards are <15, pull the event — the economics do not work even at £0 prizes
4. Bonus-game upsell is MORE effective than main-card acquisition at the margin: each bonus buyer adds ~£5.21 net with zero incremental fixed cost
5. The host should push bonus upsell during Games 1–3, not just before the event

---

## 9. Final 4-Week Calendar

Starting Friday 10 April (bridge week already scheduled), then 3 full weeks.

### Bridge Week (10–16 April) — Already Confirmed

| Day | Event | Host | Notes |
|-----|-------|------|-------|
| Fri 10 | Friday Music Quiz Live | Ben | Prime slot |
| Fri 10 (late) | Late Late General Knowledge Quiz | Ben | Late slot |
| Sat 11 | Saturday General Knowledge Quiz | Curtis | Flagship |
| Sat 11 (late) | Late Late Live Music Quiz | Curtis | Late slot |
| Sun 12 | Sunday General Knowledge Quiz | Ben | |
| Tue 14 | Two for Tuesdays // GK and Bingo | Rob | |
| Thu 16 | TV and Film Quiz | Curtis | Themed slot |

**No Saturday bingo this week** — correct per bridge week schedule.

### Week 2 (17–23 April)

| Day | Event | Host | Type |
|-----|-------|------|------|
| Fri 17 | Friday Music Quiz Live — 90s vs 00s Edition | Ben | Core + Bonus Bingo |
| Fri 17 (late) | Late Late General Knowledge Quiz | Ben | Core + Bonus Bingo |
| Sat 18 6pm | Saturday Musiskill Bingo | Curtis | Standalone Bingo |
| Sat 18 8pm | Saturday General Knowledge Quiz | Curtis | Core + Bonus Bingo |
| Sat 18 (late) | Late Late Live Music Quiz | Curtis | Core + Bonus Bingo |
| Sun 19 | Sunday General Knowledge Quiz | Ben | Core + Bonus Bingo |
| Tue 21 | Two for Tuesdays // GK and Bingo | Rob | Core + Bonus Bingo |
| Thu 23 | Disney Quiz | Curtis | Themed + Bonus Bingo |

### Week 3 (24–30 April)

| Day | Event | Host | Type |
|-----|-------|------|------|
| Fri 24 | Friday Music Quiz Live — Boybands vs Girlbands | Ben | Core + Bonus Bingo |
| Fri 24 (late) | Late Late General Knowledge Quiz | Ben | Core + Bonus Bingo |
| Sat 25 6pm | Saturday Musiskill Bingo | Curtis | Standalone Bingo |
| Sat 25 8pm | Saturday General Knowledge Quiz | Curtis | Core + Bonus Bingo |
| Sat 25 (late) | Late Late Live Music Quiz | Curtis | Core + Bonus Bingo |
| Sun 26 | Sunday General Knowledge Quiz | Ben | Core + Bonus Bingo |
| Tue 28 | Two for Tuesdays // GK and Bingo | Rob | Core + Bonus Bingo |
| Thu 30 | Harry Potter Quiz | Curtis | Themed + Bonus Bingo |

### Week 4 (1–7 May)

| Day | Event | Host | Type |
|-----|-------|------|------|
| Fri 1 | Friday Music Quiz Live — NOW That's What I Call a Music Quiz | Ben | Core + Bonus Bingo |
| Fri 1 (late) | Late Late General Knowledge Quiz | Ben | Core + Bonus Bingo |
| Sat 2 6pm | Saturday Musiskill Bingo | Curtis | Standalone Bingo |
| Sat 2 8pm | Saturday General Knowledge Quiz | Curtis | Core + Bonus Bingo |
| Sat 2 (late) | Late Late Live Music Quiz | Curtis | Core + Bonus Bingo |
| Sun 3 | Sunday General Knowledge Quiz | Ben | Core + Bonus Bingo |
| Tue 5 | Two for Tuesdays // GK and Bingo | Rob | Core + Bonus Bingo |
| Thu 7 | Pop Culture Quiz | Curtis | Themed + Bonus Bingo |

### Calendar structure rules

**Fixed weekly (do not change):**
- Saturday 8pm General Knowledge Quiz — the flagship, never skip
- Friday Music Quiz Live (rotating music theme) — second strongest engine
- Late Late General Knowledge (Fri/Sat late) — consistent performer at £6 base
- Late Late Live Music (Sat late) — consistent performer
- Tuesday Two for Tuesdays — retention lane
- Sunday General Knowledge — consistent if marketed

**Rotating weekly:**
- Thursday themed slot — Disney, Harry Potter, Pop Culture, TV & Film in rotation. These are the only themes that have historically pulled 30+ teams. Kill everything else.

**Conditional:**
- Saturday 6pm Musiskill Bingo — KEEP but subject to go/no-go threshold. If main cards don't reach 18 by 48 hours before, pull it.

**Do NOT bring back:**
- Free quizzes
- Obscure themed nights (Wallace & Gromit, Wicked, Video Games, etc.)
- Monday/Wednesday quiz slots unless demand justifies
- Bingo-led formats on any day other than Saturday 6pm
- Any event at sub-£6.00 base pricing (except TfT retention slot)

---

## 10. What to Keep / Fix / Cut

### KEEP (protect and invest)

| Event | Why | Risk |
|-------|-----|------|
| Saturday General Knowledge Quiz | £24,845/year, avg 57 teams, most consistent performer | None — this is the business |
| Friday Music Quiz Live | Strong secondary engine, rotating themes keep it fresh | Music themes must be broad (no "60s only" — too narrow) |
| Late Late quizzes (GK + Music) | Low-cost incremental revenue, hosted same nights | Keep but monitor — if <15 teams, question the slot |
| Sunday GK | Consistent at 30–40 teams when marketed | Needs marketing restored |
| Two for Tuesdays | Retention lane for repeat customers | Revenue per ticket is low (£5 base); do NOT expand |

### FIX

| Event | Problem | Fix |
|-------|---------|-----|
| Saturday Musiskill Bingo | Historic prize-to-revenue ratio was 71%; destroyed margin | New £15 price + capped £200 board + go/no-go threshold |
| Thursday themed slot | Too many different themes, inconsistent | Lock to 4 proven themes in rotation, strict £35 writing cap |
| Two for Tuesdays pricing | At £5.00 base, margins are thin | Consider raising to £5.50 or £6.00 base; test elasticity |
| Bingo decision tools (xlsx) | Wrong VAT rate (12.5% instead of 8.5%) | Correct immediately |

### CUT

| Event | Why |
|-------|-----|
| Free quizzes / any £0 events | 0.3% of revenue, 29.4% 90-day return. Not a funnel. |
| One-off themed nights (Wallace & Gromit, Wicked, Video Games, etc.) | Avg <20 teams, high fixed costs, no repeat value |
| Wednesday quiz slot | Payout week showed 19 teams, -£13 loss, -£63 for Lee |
| Disney/themed standalone bingo | Narrow audience, high prize burden, cannibalises Saturday bingo |
| Any bingo-led programming outside Saturday 6pm | Bingo works as bonus monetisation, not as the main event |

---

## 11. Biggest Risks / Misreads

1. **Mistaking the H2 decline for structural failure.** Some of the recent softness is marketing-driven. Cutting events that just need marketing back is a mistake. Saturday GK and Friday Music are NOT structurally declining — they're under-promoted.

2. **Over-reading Covid-era success.** Any format that "used to get 100+ teams" in 2020–21 is not a valid benchmark. Those numbers were abnormal. The real baseline is 2023–24 performance.

3. **Assuming the £15 bingo price will hold volume.** The price increase is correct but untested at scale. Monitor the first 4 weeks closely. If main card sales drop below 15 at the new price, the format is in trouble regardless.

4. **Ignoring the host-minimum drag.** At low team counts, the host-minimum rule means Lee subsidises the host. This is invisible in total P&L but real. Events that regularly produce profit pools under £100 are charity for the host, not a business for Lee.

5. **Letting themed nights creep back in.** There's always a temptation to add "just one more" themed quiz. Every new theme adds writing cost, activation cost, and dilutes the brand. Lock the rotation to 4 themes max.

---

## 12. Final Strategic Recommendation

MB Quizzes is a **repeat-customer, GK-led quiz business** that has been distracted by format proliferation and destroyed by bingo prize structures.

The turnaround is simple:
1. **Spine = GK + Music.** These two formats are 55%+ of revenue and nearly all the consistent profit.
2. **Bingo = monetisation bolt-on, not the main event.** Bonus bingo on every quiz (cheap to add, pure margin). One fixed Saturday standalone slot with strict go/no-go rules.
3. **Themed = controlled rotation.** One Thursday slot, 4 proven themes, strict cost cap.
4. **Price discipline.** The new £6.00 quiz base and £15.00 bingo main are correct. Do not discount.
5. **Marketing must come back.** The calendar is now lean enough to support properly. Direct the restored marketing budget at Saturday GK and Friday Music first.

---

## 13. One-Page Operating Summary for Lee

**PRICES:** Quiz = £7.38 customer price. Bingo bonus = £6.18. Saturday bingo main = £15.00. Two for Tuesdays = £6.18 (consider raising).

**PRIZE CAPS:** Quiz = £15–£40 on a ladder. Bonus bingo = £1.50 per buyer capped. Saturday bingo = £200 total board at target sales, £150 at soft sales, DO NOT RUN below 18 main cards.

**HOST PAY:** MAX(£50, 50% of profit pool). Lee/MB = remainder. If Lee/MB < £25, seriously question whether the event should run.

**GO/NO-GO:** Core quiz needs 20+ teams. Themed needs 30+ teams. Saturday bingo needs 19+ main cards with 14+ bonus. Anything under these numbers should not run.

**CALENDAR:** 8 slots per week (Fri prime + late, Sat bingo + GK + late, Sun, Tue, Thu themed). No Monday. No Wednesday. No free events. No obscure themes.

**VAT:** Flat-rate VAT confirmed at 12.5%. The payout sheet and main calculators (Pricing Payout, Ticket Sold) need correcting from 8.5% to 12.5%. The bingo decision tools were already correct.

**MARKETING:** Restore marketing spend. Focus on Saturday GK and Friday Music first. These are the engines.

---

## Final Answers

**A. The single strongest event / format now:**
Saturday General Knowledge Quiz. £24,845/year, avg 57 teams, lowest cost structure, most consistent. Not close.

**B. The single weakest misleading event / format:**
Wednesday themed quiz night. Looks like "activity" but at 19 teams with £88 fixed costs + £20 prizes, Lee lost £63 on the payout sheet week. This slot destroys value.

**C. Whether bingo should stay, and in what exact form:**
YES, but only as: (1) an optional bonus add-on on every quiz at £6.18, and (2) one fixed Saturday 6pm standalone slot at £15.00 main card with a strict go/no-go at 18 main cards and a capped £200 prize board. No other standalone bingo events. No bingo-led scheduling.

**D. The 5 operating rules to lock immediately:**

1. **No event runs if expected Lee/MB take is below £25.** Period.
2. **Saturday bingo main card stays at £15 all-in. Prize board does not exceed £200 unless main cards exceed 30.**
3. **Themed quizzes are limited to one Thursday slot with 4 rotating themes. Fixed cost cap: £88 (ads £31.20 + activation £21.80 + writing £35).**
4. **No free events. No new themes without proven demand (30+ presales on first instance).**
5. **Correct the Pricing Payout Calculator and Ticket Sold Calculator VAT rate from 8.5% to 12.5% today.**

**E. The exact next prompt needed after this:**

> "Here are the actual ticket sales for the first Saturday bingo at £15 main card price (11 April or 18 April). Main cards sold: [X]. Bonus games sold: [Y]. Run the go/no-go decision, confirm the prize board, and tell me what the host and Lee take. Also confirm whether Two for Tuesdays should stay at £5 base or move to £6."
