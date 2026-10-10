import { FinanceComparisonObject, QuotePreset, RunningCostBreakdown } from '../types/finance';

export function calculateRunningCosts(
  deal: Partial<FinanceComparisonObject>
): RunningCostBreakdown {
  const name = (deal.car_name || '').toLowerCase();
  let fuelType: 'EV' | 'Petrol' | 'Diesel' | 'PHEV' | 'Hybrid' = 'Petrol';

  if (deal.fuel_type) {
    const ft = deal.fuel_type.toLowerCase();
    if (ft.includes('electric') || ft.includes('ev') || ft === 'bev') fuelType = 'EV';
    else if (ft.includes('phev') || ft.includes('plug-in')) fuelType = 'PHEV';
    else if (ft.includes('hybrid') || ft.includes('mhev')) fuelType = 'Hybrid';
    else if (ft.includes('diesel')) fuelType = 'Diesel';
    else fuelType = 'Petrol';
  } else {
    if (
      name.includes('c40') ||
      name.includes('recharge') ||
      name.includes('ev') ||
      name.includes('electric') ||
      name.includes('tesla') ||
      name.includes('ioniq') ||
      name.includes('id.4')
    ) {
      fuelType = 'EV';
    } else if (name.includes('phev') || name.includes('plug-in')) {
      fuelType = 'PHEV';
    } else if (name.includes('hybrid') || name.includes('mhev') || name.includes('b5') || name.includes('b6')) {
      fuelType = 'Hybrid';
    } else if (name.includes('diesel') || name.includes('d4') || name.includes('d5') || name.includes('tdi')) {
      fuelType = 'Diesel';
    }
  }

  const annualMileage = deal.annual_mileage || 10000;
  let annualFuelEnergy = 0;
  let annualRoadTax = 190;
  let annualServicing = 450;
  let annualInsurance = 950;
  let efficiencyLabel = '30 MPG';

  if (fuelType === 'EV') {
    efficiencyLabel = '3.3 mi/kWh';
    // 3.3 mi/kWh. 80% home charging @ 7.5p/kWh + 20% public rapid @ 50p/kWh
    annualFuelEnergy = Math.round((annualMileage / 3.3) * (0.8 * 0.075 + 0.2 * 0.50));
    annualRoadTax = 10; // EV VED rate
    annualServicing = 220; // Fewer wearable parts
    annualInsurance = 850;
  } else if (fuelType === 'PHEV') {
    efficiencyLabel = '65 MPG equiv';
    annualFuelEnergy = Math.round((annualMileage / 65) * 6.5);
    annualRoadTax = 180;
    annualServicing = 380;
    annualInsurance = 900;
  } else if (fuelType === 'Hybrid') {
    efficiencyLabel = '42 MPG';
    annualFuelEnergy = Math.round((annualMileage / 42) * 4.546 * 1.45);
    annualRoadTax = 180;
    annualServicing = 420;
    annualInsurance = 950;
  } else if (fuelType === 'Diesel') {
    efficiencyLabel = '40 MPG';
    annualFuelEnergy = Math.round((annualMileage / 40) * 4.546 * 1.52);
    annualRoadTax = 190;
    annualServicing = 480;
    annualInsurance = 980;
  } else {
    efficiencyLabel = '30 MPG';
    annualFuelEnergy = Math.round((annualMileage / 30) * 4.546 * 1.45);
    if (name.includes('xc90') || name.includes('bmw x5') || name.includes('q7') || name.includes('range rover')) {
      annualRoadTax = 570; // Luxury VED supplement
      annualServicing = 650;
      annualInsurance = 1100;
    } else {
      annualRoadTax = 190;
      annualServicing = 450;
      annualInsurance = 950;
    }
  }

  const estimated_total_annual_running = annualFuelEnergy + annualRoadTax + annualServicing + annualInsurance;
  const estimated_monthly_running = Math.round(estimated_total_annual_running / 12);
  const monthlyPayment = Number(deal.monthly_payment || 0);
  const estimated_monthly_tco = Math.round((monthlyPayment + estimated_monthly_running) * 100) / 100;

  return {
    fuel_type: fuelType,
    annual_mileage: annualMileage,
    efficiency_label: efficiencyLabel,
    estimated_annual_fuel_energy: annualFuelEnergy,
    estimated_annual_road_tax: annualRoadTax,
    estimated_annual_servicing: annualServicing,
    estimated_annual_insurance: annualInsurance,
    estimated_total_annual_running: estimated_total_annual_running,
    estimated_monthly_running: estimated_monthly_running,
    estimated_monthly_tco: estimated_monthly_tco,
  };
}

export function formatVerdictCurrency(verdict: string, currency = '£'): string {
  if (!verdict) return '';
  return verdict.replace(/[$£€]\s*([\d,]+(?:\.\d+)?)/g, `${currency}$1`);
}

export function formatMoney(val: number, currency = '£'): string {
  return `${currency}${Number(val || 0).toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(val) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Enforces the strict required mathematical formulas:
 * 1. "total_interest": (Monthly Payment * Term + Balloon) - Advance. (0 if APR is 0%).
 * 2. "net_upfront_deficit": max(0, Negative Equity - Trade-in Bonus).
 * 3. "dead_money": total_interest + net_upfront_deficit.
 * 4. "verdict": 2-sentence plain-English breakdown.
 */
export function recalculateFinance(
  data: Partial<FinanceComparisonObject>,
  currency = '£'
): FinanceComparisonObject {
  const car_name = (data.car_name || 'Vehicle Finance Deal').trim();
  const term_months = Math.max(1, Math.round(Number(data.term_months) || 36));
  let monthly_payment = Math.max(0, Number(data.monthly_payment) || 0);
  const balloon = Math.max(0, Number(data.balloon) || 0);
  const apr = Math.max(0, Number(data.apr) || 0);
  let flat_rate = Math.max(0, Number(data.flat_rate) || 0);
  const annual_mileage = Math.max(0, Number(data.annual_mileage) || 0);
  let negative_equity = Math.max(0, Number(data.negative_equity) || 0);
  const trade_in_offer = Number(data.trade_in_offer) || 0;
  const loan_settlement = Number(data.loan_settlement) || 0;

  // Auto calculate negative_equity if trade_in_offer and loan_settlement are present
  if (loan_settlement > 0 && trade_in_offer > 0 && !data.negative_equity) {
    negative_equity = Math.max(0, loan_settlement - trade_in_offer);
  }

  const bonus_discount = Math.max(0, Number(data.bonus_discount) || 0);
  const customer_deposit = Math.max(0, Number(data.customer_deposit) || 0);

  // 2. net_upfront_deficit
  const net_upfront_deficit = Math.max(
    0,
    Math.round((negative_equity - bonus_discount) * 100) / 100
  );

  // Handle rolling deficit into new car loan advance
  let is_negative_equity_rolled = data.is_negative_equity_rolled;
  let base_advance = data.base_advance !== undefined ? Math.max(0, Number(data.base_advance) || 0) : undefined;
  let advance = Math.max(0, Number(data.advance) || 0);

  if (is_negative_equity_rolled === true && net_upfront_deficit > 0) {
    if (base_advance !== undefined) {
      advance = Math.round((base_advance + net_upfront_deficit) * 100) / 100;
    } else {
      base_advance = advance;
      advance = Math.round((base_advance + net_upfront_deficit) * 100) / 100;
    }
  } else if (is_negative_equity_rolled === false && base_advance !== undefined) {
    advance = base_advance;
  } else if (base_advance === undefined) {
    base_advance = advance;
  }

  // 1. Calculate total_interest and monthly_payment accurately without forced rounding
  let total_interest = 0;
  if (apr === 0 && flat_rate === 0) {
    total_interest = 0;
  } else if (monthly_payment > 0) {
    total_interest = (monthly_payment * term_months + balloon) - advance;
    if (total_interest < 0) total_interest = 0;
  } else if (flat_rate > 0 && advance > 0) {
    total_interest = advance * (flat_rate / 100) * (term_months / 12);
    monthly_payment = Math.max(0, ((advance + total_interest) - balloon) / term_months);
  } else if (apr > 0 && advance > 0) {
    const r = (apr / 100) / 12;
    const numerator = (advance * r * Math.pow(1 + r, term_months)) - (balloon * r);
    const denominator = Math.pow(1 + r, term_months) - 1;
    monthly_payment = denominator > 0 ? Math.max(0, numerator / denominator) : 0;
    total_interest = (monthly_payment * term_months + balloon) - advance;
    if (total_interest < 0) total_interest = 0;
  }

  // Exact 2 decimal places for money figures
  total_interest = Math.round(total_interest * 100) / 100;
  monthly_payment = Math.round(monthly_payment * 100) / 100;

  // Implied flat rate if flat_rate was not given
  if (flat_rate === 0 && advance > 0 && term_months > 0 && total_interest > 0) {
    flat_rate = Math.round(((total_interest / advance) / (term_months / 12)) * 10000) / 100;
  }

  // 3. dead_money
  const dead_money = Math.round((total_interest + net_upfront_deficit) * 100) / 100;

  // 4. Voluntary Termination (Section 99 / 100 CCA 1974 - 50% Rule)
  const total_amount_payable = Math.round((customer_deposit + advance + total_interest) * 100) / 100;
  const vt_threshold_amount = Math.round((total_amount_payable / 2) * 100) / 100;
  let vt_month = 0;
  if (customer_deposit >= vt_threshold_amount) {
    vt_month = 0;
  } else if (monthly_payment > 0) {
    vt_month = Math.min(term_months, Math.ceil((vt_threshold_amount - customer_deposit) / monthly_payment));
  } else {
    vt_month = term_months;
  }

  let verdict = (data.verdict || '').trim();
  if (!verdict) {
    if (apr === 0 && flat_rate === 0 && net_upfront_deficit === 0) {
      verdict = `This 0% APR arrangement carries zero finance charges and zero rolled-over negative equity, yielding minimal dead money of ${formatMoney(dead_money, currency)}. Overall, this is an exceptionally clean structure free from hidden interest traps.`;
    } else if (dead_money > advance * 0.25 || apr > 10 || net_upfront_deficit > 1500) {
      verdict = `This agreement exposes you to substantial dead money totaling ${formatMoney(dead_money, currency)}, driven by a Contract APR of ${apr}% ${flat_rate > 0 ? `(${flat_rate}% flat rate)` : ''} and ${net_upfront_deficit > 0 ? `an unresolved negative equity deficit of ${formatMoney(net_upfront_deficit, currency)}` : 'elevated finance fees'}. You reach 50% Voluntary Termination protection at Month ${vt_month} (${formatMoney(vt_threshold_amount, currency)}).`;
    } else {
      verdict = `The deal offers a Contract APR of ${apr}% ${flat_rate > 0 ? `(${flat_rate}% flat rate)` : ''} with total dead money contained at ${formatMoney(dead_money, currency)}. You reach Voluntary Termination (50% rule) protection at Month ${vt_month} of ${term_months}.`;
    }
  } else {
    verdict = formatVerdictCurrency(verdict, currency);
  }

  const res: FinanceComparisonObject = {
    car_name,
    advance,
    term_months,
    monthly_payment,
    balloon,
    apr,
    flat_rate,
    annual_mileage,
    negative_equity,
    bonus_discount,
    total_interest,
    net_upfront_deficit,
    dead_money,
    customer_deposit,
    total_amount_payable,
    vt_threshold_amount,
    vt_month,
    verdict,
  };

  if (data.isMyCar !== undefined) res.isMyCar = data.isMyCar;
  if (data.reg_number !== undefined && data.reg_number !== null) res.reg_number = data.reg_number;
  if (data.engine_size !== undefined && data.engine_size !== null) res.engine_size = data.engine_size;
  if (data.fuel_type !== undefined && data.fuel_type !== null) res.fuel_type = data.fuel_type;
  if (data.color !== undefined && data.color !== null) res.color = data.color;
  if (data.transmission !== undefined && data.transmission !== null) res.transmission = data.transmission;
  if (data.estimated_trade_value !== undefined) res.estimated_trade_value = data.estimated_trade_value;
  if (trade_in_offer || data.trade_in_offer) res.trade_in_offer = trade_in_offer || data.trade_in_offer;
  if (loan_settlement || data.loan_settlement) res.loan_settlement = loan_settlement || data.loan_settlement;
  if (is_negative_equity_rolled !== undefined) res.is_negative_equity_rolled = is_negative_equity_rolled;
  if (base_advance !== undefined) res.base_advance = base_advance;

  // Always compute running costs & TCO
  res.running_cost_breakdown = calculateRunningCosts(res);

  return res;
}

export function heuristicExtractFromText(text: string): Partial<FinanceComparisonObject> {
  let car_name = 'Vehicle Finance Deal';
  const carLine = text.match(/(?:Vehicle|Car|Model|Quote for):\s*([^\n\r]+)/i);
  if (carLine) {
    car_name = carLine[1].replace(/Saloon|Sedan|Hatchback/i, (m) => m).trim();
  } else {
    const yearMatch = text.match(/\b(202[0-6]\s+[A-Za-z0-9\-]+(?:\s+[A-Za-z0-9\-]+){1,4})/);
    if (yearMatch) {
      car_name = yearMatch[1].trim();
    }
  }

  let base_advance = 0;
  const baseAdvMatch = text.match(/(?:Vehicle Base Advance|Base Advance|Base Financed|Vehicle Base Financed)[:\s]*[\$£€]?\s*([\d,]+(?:\.\d+)?)/i);
  if (baseAdvMatch) {
    base_advance = parseFloat(baseAdvMatch[1].replace(/,/g, ''));
  }

  let advance = 0;
  const advanceMatch = text.match(/(?:Total Financed Advance|Financed Advance|Advance|Amount of Credit|Balance to finance|Financed Amount|Loan Amount|Net Financed)[:\s]*[\$£€]?\s*([\d,]+(?:\.\d+)?)/i);
  if (advanceMatch) {
    advance = parseFloat(advanceMatch[1].replace(/,/g, ''));
  } else {
    const priceMatch = text.match(/(?:Cash Price|Selling Price|Purchase Price|Vehicle Price|Agreed Price|Agreed Vehicle Price|MSRP)[:\s]*[\$£€]?\s*([\d,]+(?:\.\d+)?)/i);
    const depositMatch = text.match(/(?:Customer Deposit|Down Payment|Deposit|Down Payment Cash)[:\s]*[\$£€]?\s*([\d,]+(?:\.\d+)?)/i);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ''));
      const deposit = depositMatch ? parseFloat(depositMatch[1].replace(/,/g, '')) : 0;
      base_advance = Math.max(0, price - deposit);
      advance = base_advance;
    }
  }

  let term_months = 36;
  const termMatch = text.match(/(?:Term|Duration|Agreement Duration|Period)[:\s]*(\d+)\s*(?:months|mo|m)?/i) ||
                    text.match(/(\d+)\s*(?:Monthly Payments|Payments of|months|mo)\b/i);
  if (termMatch) {
    term_months = parseInt(termMatch[1], 10);
  }

  let monthly_payment = 0;
  const monthlyMatch = text.match(/(?:Monthly Payment|Monthly Installment|Monthly Re-payment|Monthly Repayment|Monthly)[:\s]*[\$£€]?\s*([\d,]+(?:\.\d+)?)/i) ||
                       text.match(/[\$£€]\s*([\d,]+(?:\.\d+)?)\s*(?:\/|\s*per|\s*a)\s*month/i);
  if (monthlyMatch) {
    monthly_payment = parseFloat(monthlyMatch[1].replace(/,/g, ''));
  }

  let balloon = 0;
  const balloonMatch = text.match(/(?:Balloon|Optional Final Payment|Final Payment|GFV|Guaranteed Future Value|Residual)[:\s]*[\$£€]?\s*([\d,]+(?:\.\d+)?)/i);
  if (balloonMatch) {
    balloon = parseFloat(balloonMatch[1].replace(/,/g, ''));
  }

  let apr = 0;
  const aprMatch = text.match(/(?:Contract APR|Representative APR|Annual Percentage Rate|APR)[:\s]*(\d+(?:\.\d+)?)\s*%/i) ||
                   text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:Contract\s*)?APR/i);
  if (aprMatch) {
    apr = parseFloat(aprMatch[1]);
  }

  let flat_rate = 0;
  const flatMatch = text.match(/(?:Flat Rate|Flat Interest Rate|Flat Interest|Fixed Flat Rate)[:\s]*(\d+(?:\.\d+)?)\s*%/i) ||
                    text.match(/(\d+(?:\.\d+)?)\s*%\s*flat/i);
  if (flatMatch) {
    flat_rate = parseFloat(flatMatch[1]);
  }

  let annual_mileage = 10000;
  const mileageMatch = text.match(/(?:Annual Mileage|Mileage Allowance|Permitted Miles)[:\s]*([\d,]+)/i);
  if (mileageMatch) {
    annual_mileage = parseInt(mileageMatch[1].replace(/,/g, ''), 10);
  }

  let negative_equity = 0;
  const negEqMatch = text.match(/(?:Negative Equity|Trade-in Shortfall|Settlement Deficit|Prior Loan Balance|Deficit)[:\s]*[\$£€]?\s*([\d,]+(?:\.\d+)?)/i);
  if (negEqMatch) {
    negative_equity = parseFloat(negEqMatch[1].replace(/,/g, ''));
  }

  let trade_in_offer = 0;
  const tradeOfferMatch = text.match(/(?:Dealer Trade-In Offer|Trade-In Offer|Trade-In Allowance|Trade Offer)[:\s]*[\$£€]?\s*([\d,]+(?:\.\d+)?)/i);
  if (tradeOfferMatch) {
    trade_in_offer = parseFloat(tradeOfferMatch[1].replace(/,/g, ''));
  }

  let loan_settlement = 0;
  const settlementMatch = text.match(/(?:Prior Loan Balance Owed|Settlement Balance|Loan Settlement|Settlement Owed|Settlement)[:\s]*[\$£€]?\s*([\d,]+(?:\.\d+)?)/i);
  if (settlementMatch) {
    loan_settlement = parseFloat(settlementMatch[1].replace(/,/g, ''));
  }

  if (loan_settlement > 0 && trade_in_offer > 0 && negative_equity === 0) {
    negative_equity = Math.max(0, loan_settlement - trade_in_offer);
  }

  let customer_deposit = 0;
  const depositMatch = text.match(/(?:Customer Deposit|Down Payment|Deposit|Upfront Deposit|Down Payment Cash)[:\s]*[\$£€]?\s*([\d,]+(?:\.\d+)?)/i);
  if (depositMatch) {
    customer_deposit = parseFloat(depositMatch[1].replace(/,/g, ''));
  }

  let bonus_discount = 0;
  const bonusMatch = text.match(/(?:Trade-in Bonus|Bonus Discount|Dealer Contribution|Deposit Contribution|Assistance Bonus|Allowance Bonus|Bonus Incentive)[:\s]*[\$£€]?\s*([\d,]+(?:\.\d+)?)/i);
  if (bonusMatch) {
    bonus_discount = parseFloat(bonusMatch[1].replace(/,/g, ''));
  }

  let is_negative_equity_rolled = false;
  if (/negative equity rolled|deficit rolled|rolled into new loan|rolled into loan|rolled into advance|deficit rolled\):/i.test(text)) {
    is_negative_equity_rolled = true;
  }

  if (is_negative_equity_rolled && negative_equity > 0) {
    if (base_advance > 0 && advance === base_advance) {
      advance = Math.round((base_advance + negative_equity) * 100) / 100;
    }
  }

  return {
    car_name,
    advance,
    base_advance: base_advance || undefined,
    term_months,
    monthly_payment,
    balloon,
    apr,
    flat_rate,
    annual_mileage,
    negative_equity,
    trade_in_offer: trade_in_offer || undefined,
    loan_settlement: loan_settlement || undefined,
    is_negative_equity_rolled,
    bonus_discount,
    customer_deposit,
  };
}

export function toStrictJsonObject(data: FinanceComparisonObject) {
  return {
    car_name: data.car_name,
    advance: data.advance,
    term_months: data.term_months,
    monthly_payment: data.monthly_payment,
    balloon: data.balloon,
    apr: data.apr,
    flat_rate: data.flat_rate || 0,
    annual_mileage: data.annual_mileage,
    negative_equity: data.negative_equity,
    bonus_discount: data.bonus_discount,
    total_interest: data.total_interest,
    net_upfront_deficit: data.net_upfront_deficit,
    dead_money: data.dead_money,
    customer_deposit: data.customer_deposit || 0,
    total_amount_payable: data.total_amount_payable || 0,
    vt_threshold_amount: data.vt_threshold_amount || 0,
    vt_month: data.vt_month || 0,
    verdict: data.verdict,
  };
}

export const SAMPLE_PRESETS: QuotePreset[] = [
  {
    id: 'pcp-trap',
    title: 'PCP High Interest Quote',
    subtitle: 'PCP Quote with High Balloon & 9.9% APR',
    badge: 'High Interest',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    text: `Dealer PCP Finance Quote Sheet
Vehicle: PCP Saloon Offer
On the Road Cash Price: £44,500.00
Customer Deposit: £4,500.00
Amount of Credit / Advance: £40,000.00
Agreement Duration: 48 Months
Monthly Payment: £685.20
Optional Final Payment (Balloon / GFV): £18,450.00
Representative APR: 9.9%
Annual Mileage Allowance: 10,000 miles
Trade-in Equity: £0.00
Dealer Contribution Bonus: £1,000.00`,
  },
  {
    id: 'underwater-tradein',
    title: 'C40 Deal (XC90 Trade-In)',
    subtitle: '£25,000 XC90 Offer vs £27,731 Settlement',
    badge: 'Deficit Rolled into Loan (£2,731)',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    text: `Dealership Finance Worksheet
Vehicle: 2023 Volvo C40 Recharge Ultimate Twin AWD
Agreed Vehicle Cash Price: £45,000.00
Customer Down Payment Cash: £1,500.00
Trade-in Vehicle: 2021 Volvo XC90 (KN21 ZCZ)
Dealer Trade-In Offer Allowance: £25,000.00
XC90 Prior Loan Balance Owed / Settlement: £27,731.00
Trade-in Shortfall / Negative Equity: £2,731.00
Dealer Trade-In Assistance Bonus: £0.00
Vehicle Base Advance: £43,500.00
Total Financed Advance (Vehicle £43,500 + £2,731 Deficit Rolled): £46,231.00
Duration / Term: 48 Months
Monthly Payment: £572.00
Optional Final Payment (Balloon / GFV): £16,500.00
Contract APR: 7.9%
Annual Mileage Allowance: 10,000 miles`,
  },
  {
    id: 'clean-zero-apr',
    title: '0.0% APR Special Offer',
    subtitle: '0.0% APR Promotional Incentive',
    badge: 'Clean Deal (0% APR)',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    text: `Manufacturer Special Promotion Offer
Vehicle: Electric Vehicle Promotional Offer
MSRP / Purchase Price: £48,000.00
Customer Cash Down: £8,000.00
Financed Advance: £40,000.00
Term: 36 Months
Monthly Payment: £1,111.11
Balloon / Residual: £0.00
Annual Percentage Rate (APR): 0.0%
Annual Mileage: 10,000 miles
Trade-in Negative Equity: £0.00
Retail Bonus Incentive: £2,500.00 applied to principal`,
  },
  {
    id: 'subprime-lease',
    title: 'Subprime Dealer Trap',
    subtitle: 'Subprime 13.9% Dealer Trap',
    badge: 'Critical Dead Money',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    text: `Finance Pre-approval Quote
Vehicle: Premium Luxury Offer
Selling Price: £47,000.00
Down Payment: £3,000.00
Net Balance to Finance (Advance): £44,000.00
Term Length: 48 Months
Monthly Re-payment: £920.00
Guaranteed Future Value / Balloon: £14,000.00
Tier 3 Subprime APR: 13.9%
Current Car Settlement Deficit (Negative Equity): £3,800.00
Conquest Bonus Allowance: £800.00
Permitted Miles / Year: 8,000 miles`,
  },
];

export function getLocalizedPresets(currency = '£'): QuotePreset[] {
  return SAMPLE_PRESETS.map((p) => ({
    ...p,
    text: formatVerdictCurrency(p.text, currency),
  }));
}

export interface AmortizationMonth {
  month: number;
  opening_balance: number;
  payment: number;
  principal_paid: number;
  interest_charged: number;
  closing_balance: number;
  cumulative_principal: number;
  cumulative_interest: number;
  cumulative_paid: number;
  is_vt_eligible: boolean;
}

export function calculateAmortizationSchedule(
  deal: FinanceComparisonObject
): AmortizationMonth[] {
  const advance = Math.max(0, Number(deal.advance) || 0);
  const term_months = Math.max(1, Math.round(Number(deal.term_months) || 36));
  const monthly_payment = Math.max(0, Number(deal.monthly_payment) || 0);
  const apr = Math.max(0, Number(deal.apr) || 0);
  const deposit = Math.max(0, Number(deal.customer_deposit) || 0);

  const total_amount_payable = deal.total_amount_payable || (deposit + advance + (deal.total_interest || 0));
  const vt_threshold = deal.vt_threshold_amount || (total_amount_payable / 2);

  const schedule: AmortizationMonth[] = [];
  const monthly_rate = apr / 100 / 12;

  let balance = advance;
  let cum_interest = 0;
  let cum_principal = 0;

  for (let m = 1; m <= term_months; m++) {
    const opening_balance = balance;

    let interest_charged = apr === 0 ? 0 : opening_balance * monthly_rate;
    interest_charged = Math.round(interest_charged * 100) / 100;

    let principal_paid = monthly_payment - interest_charged;
    if (principal_paid < 0) principal_paid = 0;
    principal_paid = Math.min(principal_paid, opening_balance);
    principal_paid = Math.round(principal_paid * 100) / 100;

    const closing_balance = Math.max(0, Math.round((opening_balance - principal_paid) * 100) / 100);
    balance = closing_balance;

    cum_interest = Math.round((cum_interest + interest_charged) * 100) / 100;
    cum_principal = Math.round((cum_principal + principal_paid) * 100) / 100;

    const cumulative_paid = Math.round((deposit + (monthly_payment * m)) * 100) / 100;
    const is_vt_eligible = cumulative_paid >= vt_threshold;

    schedule.push({
      month: m,
      opening_balance,
      payment: monthly_payment,
      principal_paid,
      interest_charged,
      closing_balance,
      cumulative_principal: cum_principal,
      cumulative_interest: cum_interest,
      cumulative_paid,
      is_vt_eligible,
    });
  }

  return schedule;
}
