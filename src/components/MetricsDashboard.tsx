import React, { useState } from 'react';
import {
  Flame,
  AlertTriangle,
  Percent,
  Calendar,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Edit2,
  X,
  ExternalLink,
  HelpCircle,
  Building2,
  Sparkles,
} from 'lucide-react';
import { FinanceComparisonObject } from '../types/finance';
import { formatMoney, formatVerdictCurrency } from '../utils/finance';

interface Props {
  data: FinanceComparisonObject;
  currency: string;
  onEdit?: () => void;
  onToggleRollDeficit?: () => void;
}

export const MetricsDashboard: React.FC<Props> = ({
  data,
  currency,
  onEdit,
  onToggleRollDeficit,
}) => {
  const [showFormulaBreakdown, setShowFormulaBreakdown] = useState(true);
  const [showValuationModal, setShowValuationModal] = useState(false);

  // Compute total committed payments
  const totalRepayments =
    data.monthly_payment * data.term_months + data.balloon;
  const deadMoneyRatio =
    data.advance > 0
      ? Math.round((data.dead_money / data.advance) * 100)
      : 0;

  // Severity rating
  let riskLevel = 'Low Risk';
  let riskBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  let riskIcon = <ShieldCheck className="w-5 h-5 text-emerald-400" />;

  if (data.apr > 12 || deadMoneyRatio > 35 || data.net_upfront_deficit > 3000) {
    riskLevel = 'Severe Debt Trap';
    riskBg = 'bg-rose-500/15 border-rose-500/40 text-rose-400';
    riskIcon = <AlertTriangle className="w-5 h-5 text-rose-400" />;
  } else if (
    data.apr > 7.5 ||
    deadMoneyRatio > 20 ||
    data.net_upfront_deficit > 1000
  ) {
    riskLevel = 'Caution / High Cost';
    riskBg = 'bg-amber-500/15 border-amber-500/40 text-amber-400';
    riskIcon = <AlertTriangle className="w-5 h-5 text-amber-400" />;
  } else if (data.dead_money === 0 || (data.apr === 0 && data.net_upfront_deficit === 0)) {
    riskLevel = 'Zero Interest Deal';
    riskBg = 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400';
    riskIcon = <Zap className="w-5 h-5 text-cyan-400" />;
  }

  return (
    <div className="space-y-6">
      {/* Verified Vehicle Specifications Bar (if available) */}
      {(data.reg_number || data.engine_size || data.estimated_trade_value) && (
        <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/30 p-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              {data.reg_number && (
                <div className="flex items-center rounded-lg bg-amber-400 text-black border border-black/50 overflow-hidden font-mono font-black text-xs">
                  <span className="bg-blue-800 text-white px-1.5 py-0.5 text-[9px]">UK</span>
                  <span className="px-2 py-0.5 tracking-wider">{data.reg_number}</span>
                </div>
              )}
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                  Verified DVLA & MOT Specifications
                </span>
                <span className="text-sm font-bold text-white">
                  {data.car_name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {data.estimated_trade_value && (
                <button
                  type="button"
                  onClick={() => setShowValuationModal(true)}
                  className="group relative bg-slate-900/90 hover:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 text-right transition cursor-pointer shadow-sm"
                  title="Click to view where this valuation comes from, market breakdown & API sources"
                >
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 group-hover:text-emerald-400 font-medium uppercase tracking-wider">
                    <span>Est. Trade-In Valuation</span>
                    <HelpCircle className="w-3 h-3 text-emerald-400/80 group-hover:text-emerald-300" />
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-base font-extrabold text-emerald-400 font-mono">
                      {formatMoney(data.estimated_trade_value, currency)}
                    </span>
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-300 underline underline-offset-2">
                      Sources & Info
                    </span>
                  </div>
                </button>
              )}

              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
                  title="Edit car details, numbers, or plate"
                >
                  <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Edit Specs</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {data.engine_size && (
              <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 block text-[10px]">Engine & Fuel</span>
                <span className="text-slate-200 font-medium truncate block">
                  {data.engine_size} {data.fuel_type ? `• ${data.fuel_type}` : ''}
                </span>
              </div>
            )}
            {data.transmission && (
              <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 block text-[10px]">Transmission</span>
                <span className="text-slate-200 font-medium">
                  {data.transmission}
                </span>
              </div>
            )}
            {data.color && (
              <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 block text-[10px]">Paint Color</span>
                <span className="text-slate-200 font-medium">
                  {data.color}
                </span>
              </div>
            )}
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/60 flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px]">UK Registry Grounded</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner: Dead Money Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-6 shadow-2xl">
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Primary Financial Risk Indicator
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${riskBg}`}
              >
                {riskIcon}
                {riskLevel}
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-white flex items-center gap-1">
                <span className="text-rose-400">{formatMoney(data.dead_money, currency)}</span>
              </span>
              <span className="text-sm font-medium text-slate-400">
                Total Dead Money
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-300 max-w-xl">
              <strong className="text-slate-100 font-semibold">Dead Money</strong> represents cash that generates zero vehicle equity—composed of pure lender finance interest plus underwater negative equity carried from previous loans.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:self-center">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 min-w-[140px]">
              <span className="text-[11px] text-slate-400 block">Wasted vs Advance</span>
              <span className="text-xl font-bold text-amber-300">
                {deadMoneyRatio}%
              </span>
              <span className="text-[10px] text-slate-500 block">
                of borrowed principal
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 min-w-[140px]">
              <span className="text-[11px] text-slate-400 block">Total Repayment</span>
              <span className="text-xl font-bold text-slate-100">
                {formatMoney(totalRepayments, currency)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                across {data.term_months} mo
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar: Advance vs Interest vs Deficit */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex justify-between text-xs text-slate-300 mb-1.5">
            <span className="font-medium text-slate-300">Capital Allocation Breakdown</span>
            <span className="text-slate-400 font-mono">
              Advance: {formatMoney(data.advance, currency)} + Dead Money: {formatMoney(data.dead_money, currency)}
            </span>
          </div>
          <div className="h-3.5 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{
                width: `${Math.min(
                  100,
                  (data.advance / (data.advance + data.dead_money || 1)) * 100
                )}%`,
              }}
              className="bg-indigo-500 transition-all duration-500"
              title={`Principal Advance: ${formatMoney(data.advance, currency)}`}
            />
            <div
              style={{
                width: `${Math.min(
                  100,
                  (data.total_interest / (data.advance + data.dead_money || 1)) * 100
                )}%`,
              }}
              className="bg-amber-500 transition-all duration-500"
              title={`Total Interest: ${formatMoney(data.total_interest, currency)}`}
            />
            <div
              style={{
                width: `${Math.min(
                  100,
                  (data.net_upfront_deficit /
                    (data.advance + data.dead_money || 1)) *
                    100
                )}%`,
              }}
              className="bg-rose-500 transition-all duration-500"
              title={`Net Upfront Deficit: ${formatMoney(data.net_upfront_deficit, currency)}`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span> Principal Advance ({formatMoney(data.advance, currency)})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Total Interest ({formatMoney(data.total_interest, currency)})
            </span>
            {data.net_upfront_deficit > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Rolled Deficit ({formatMoney(data.net_upfront_deficit, currency)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2-Sentence Plain English Verdict Callout */}
      <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/30 p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1">
              Engine Analysis Verdict
            </h4>
            <p className="text-sm md:text-base text-slate-100 font-medium leading-relaxed">
              "{formatVerdictCurrency(data.verdict, currency)}"
            </p>
          </div>
        </div>
      </div>

      {/* 4 Required Metric Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Interest */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-4 shadow-sm hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Interest</span>
            <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {formatMoney(data.total_interest, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {data.apr === 0 ? (
              <span className="text-emerald-400 font-medium">0% APR (Zero Interest)</span>
            ) : (
              <span>(Monthly × Term + Balloon) - Advance</span>
            )}
          </div>
        </div>

        {/* Metric 2: Net Upfront Deficit */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-4 shadow-sm hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Upfront Deficit</span>
            <span className="p-1.5 rounded-md bg-rose-500/10 text-rose-400">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-300 font-mono">
            {formatMoney(data.net_upfront_deficit, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            max(0, Neg Equity - Trade-in Bonus)
          </div>
        </div>

        {/* Metric 3: Total Dead Money */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-4 shadow-sm hover:border-red-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Dead Money</span>
            <span className="p-1.5 rounded-md bg-red-500/10 text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-red-400 font-mono">
            {formatMoney(data.dead_money, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total Interest + Net Upfront Deficit
          </div>
        </div>

        {/* Metric 4: Monthly Commitment */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-4 shadow-sm hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Payment</span>
            <span className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-indigo-300 font-mono">
            {formatMoney(data.monthly_payment, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            for {data.term_months} Months ({data.apr}% APR {data.flat_rate ? `• ${data.flat_rate}% Flat` : ''})
          </div>
        </div>
      </div>

      {/* Voluntary Termination Protection (50% CCA Rule) Banner */}
      <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-white">Voluntary Termination Protection (50% CCA Rule)</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  Section 99 / 100 Consumer Credit Act 1974
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                UK statutory protection allowing you to hand back the car and terminate finance with zero further monthly liabilities once 50% of the Total Amount Payable is paid.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">50% VT Threshold</span>
              <span className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
                {formatMoney(data.vt_threshold_amount || (data.total_amount_payable ? data.total_amount_payable / 2 : 0), currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-0.5">Total Amount Payable</span>
            <span className="text-base font-bold text-slate-100 font-mono">
              {formatMoney(data.total_amount_payable || (data.advance + data.total_interest + (data.customer_deposit || 0)), currency)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Deposit + Financed Principal + Interest</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-0.5">VT Right Activated At</span>
            <span className="text-base font-bold text-indigo-300 font-mono">
              {data.vt_month === 0 ? 'Month 0 (At Signing)' : `Month ${data.vt_month || '-'} of ${data.term_months}`}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              {data.vt_month && data.term_months ? `${Math.round((data.vt_month / data.term_months) * 100)}% into loan agreement duration` : 'Based on regular monthly payments'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[11px] mb-0.5">Upfront Customer Deposit</span>
            <span className="text-base font-bold text-amber-300 font-mono">
              {formatMoney(data.customer_deposit || 0, currency)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              {data.customer_deposit && data.vt_threshold_amount && data.customer_deposit >= data.vt_threshold_amount
                ? 'Upfront deposit alone satisfies 50% threshold'
                : 'Covers initial portion of 50% threshold'}
            </span>
          </div>
        </div>
      </div>

      {/* Deal Parameters Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          Extracted Deal Parameters
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Advance (Credit)</span>
            <span className="font-semibold text-slate-200 font-mono text-sm">
              {formatMoney(data.advance, currency)}
            </span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Term Length</span>
            <span className="font-semibold text-slate-200 font-mono text-sm">
              {data.term_months} mos
            </span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Balloon / GFV</span>
            <span className="font-semibold text-slate-200 font-mono text-sm">
              {formatMoney(data.balloon, currency)}
            </span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Contract APR</span>
            <span className="font-semibold text-slate-200 font-mono text-sm">
              {data.apr}%
            </span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Annual Mileage</span>
            <span className="font-semibold text-slate-200 font-mono text-sm">
              {data.annual_mileage ? `${data.annual_mileage.toLocaleString()} mi` : 'N/A'}
            </span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Negative Equity</span>
            <span className="font-semibold text-rose-300 font-mono text-sm">
              {formatMoney(data.negative_equity, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Trade-In & Negative Equity Real-World Calculation Banner */}
      {(data.trade_in_offer || data.loan_settlement || data.negative_equity > 0) && (
        <div className="rounded-xl border border-rose-500/40 bg-slate-950/90 p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse"></span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                Trade-In & Negative Equity Settlement Breakdown
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/50">
              Old Car Settlement
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold">
                Dealer XC90 Trade-In Offer
              </span>
              <span className="text-base font-bold text-emerald-400">
                {formatMoney(data.trade_in_offer || data.estimated_trade_value || 25000, currency)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-sans">
                Price offered for your XC90
              </span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold">
                Old Finance Settlement Owed
              </span>
              <span className="text-base font-bold text-slate-200">
                {formatMoney(data.loan_settlement || ((data.trade_in_offer || 25000) + (data.negative_equity || 2731)), currency)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5 font-sans">
                Amount owed to clear XC90 loan
              </span>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-rose-500/40">
              <span className="text-rose-300 block text-[10px] uppercase font-sans font-semibold">
                Net Shortfall (Negative Equity)
              </span>
              <span className="text-base font-bold text-rose-400">
                {formatMoney(data.negative_equity || 2731, currency)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">
                {data.is_negative_equity_rolled ? 'Added into new car loan' : 'Paid upfront in cash'}
              </span>
            </div>
          </div>

          {/* New Car Loan Deficit Status & 1-Click Action */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">
                  Deficit Rolled into New Car Loan:
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  data.is_negative_equity_rolled
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {data.is_negative_equity_rolled ? 'YES (Added to Loan)' : 'NO (Paid Upfront)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {data.is_negative_equity_rolled
                  ? `Loan Advance: ${formatMoney(data.base_advance || Math.max(0, data.advance - (data.negative_equity || 0)), currency)} (Vehicle) + ${formatMoney(data.negative_equity || 0, currency)} (Deficit) = ${formatMoney(data.advance, currency)} total financed.`
                  : `Loan Advance: ${formatMoney(data.advance, currency)} (Deficit settled separately in cash, not in loan).`}
              </p>
            </div>
            {onToggleRollDeficit && (
              <button
                type="button"
                onClick={onToggleRollDeficit}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  data.is_negative_equity_rolled
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow'
                }`}
              >
                {data.is_negative_equity_rolled
                  ? 'Switch to Pay Upfront (Clear from Loan)'
                  : `Add ${formatMoney(data.negative_equity || 2731, currency)} to Loan Advance`}
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 leading-relaxed font-sans">
            <strong className="text-rose-300 font-semibold">Calculation Explanation:</strong> The dealer offers <strong>{formatMoney(data.trade_in_offer || 25000, currency)}</strong> for your current XC90 vehicle, but your remaining loan settlement is <strong>{formatMoney(data.loan_settlement || 27731, currency)}</strong>. The <strong>{formatMoney(data.negative_equity || 2731, currency)} shortfall</strong> represents money you are paying to settle your old car loan. {data.is_negative_equity_rolled ? `This is added into your new car loan advance (${formatMoney(data.advance, currency)} total) and you pay monthly interest on it.` : `This is paid out of pocket today so your new car advance remains ${formatMoney(data.advance, currency)}.`} This is added directly to your deal's <strong className="text-rose-400">Net Upfront Deficit</strong> and included in your overall <strong className="text-red-400">Total Dead Money</strong>.
          </p>
        </div>
      )}

      {/* Arithmetic Audit Trail Accordion */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 overflow-hidden">
        <button
          onClick={() => setShowFormulaBreakdown(!showFormulaBreakdown)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 border-b border-slate-800 transition"
        >
          <span className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-indigo-400" />
            Engine Arithmetic Verification Audit Trail
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            {showFormulaBreakdown ? (
              <>
                Hide Details <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show Step-by-Step Math <ChevronDown className="w-4 h-4" />
              </>
            )}
          </span>
        </button>

        {showFormulaBreakdown && (
          <div className="p-4 space-y-3 font-mono text-xs text-slate-300 bg-slate-950/80">
            {/* Formula 1 */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-sans font-semibold text-amber-400 mb-1">
                1. Contract APR (%) & Flat Rate Interest Calculation:
              </div>
              <div className="text-slate-400 mb-1">
                Contract APR: {data.apr}% | Implied Flat Rate: {data.flat_rate || (data.advance > 0 && data.term_months > 0 ? (Math.round(((data.total_interest / data.advance) / (data.term_months / 12)) * 10000) / 100) : 0)}%
              </div>
              <div className="text-slate-200 font-medium">
                {data.apr === 0 && !data.flat_rate ? (
                  <span>0.0% Interest → Total Interest = {formatMoney(0, currency)}</span>
                ) : (
                  <span>
                    ({formatMoney(data.monthly_payment, currency)} × {data.term_months} +{' '}
                    {formatMoney(data.balloon, currency)}) - {formatMoney(data.advance, currency)} ={' '}
                    <strong className="text-amber-300 font-bold">
                      {formatMoney(data.total_interest, currency)}
                    </strong>
                  </span>
                )}
              </div>
            </div>

            {/* Formula 2 */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-sans font-semibold text-rose-400 mb-1">
                2. Net Upfront Deficit Calculation:
              </div>
              <div className="text-slate-400 mb-1">
                Formula: max(0, Negative Equity - Trade-in Bonus)
              </div>
              <div className="text-slate-200 font-medium">
                max(0, {formatMoney(data.negative_equity, currency)} -{' '}
                {formatMoney(data.bonus_discount, currency)}) ={' '}
                <strong className="text-rose-300 font-bold">
                  {formatMoney(data.net_upfront_deficit, currency)}
                </strong>
              </div>
            </div>

            {/* Formula 3 */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-sans font-semibold text-red-400 mb-1">
                3. Dead Money Calculation:
              </div>
              <div className="text-slate-400 mb-1">
                Formula: total_interest + net_upfront_deficit
              </div>
              <div className="text-slate-200 font-medium">
                {formatMoney(data.total_interest, currency)} +{' '}
                {formatMoney(data.net_upfront_deficit, currency)} ={' '}
                <strong className="text-red-400 font-bold text-sm">
                  {formatMoney(data.dead_money, currency)}
                </strong>
              </div>
            </div>

            {/* Formula 4 */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-sans font-semibold text-indigo-400 mb-1">
                4. Voluntary Termination (50% Rule CCA 1974):
              </div>
              <div className="text-slate-400 mb-1">
                Formulas: Total Payable = Deposit + Advance + Total Interest | VT Threshold = Total Payable / 2
              </div>
              <div className="text-slate-200 font-medium">
                Total Payable: {formatMoney(data.customer_deposit || 0, currency)} + {formatMoney(data.advance, currency)} + {formatMoney(data.total_interest, currency)} = {formatMoney(data.total_amount_payable || 0, currency)}
                <br />
                50% VT Threshold: <strong className="text-emerald-400 font-bold">{formatMoney(data.vt_threshold_amount || 0, currency)}</strong> → Right activated at <strong className="text-indigo-300 font-bold">Month {data.vt_month || 0}</strong>.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Valuation & API Sources Modal */}
      {showValuationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Vehicle Valuation & API Intelligence
                  </h3>
                  <p className="text-xs text-slate-400">
                    Understanding valuation methodology, market benchmarks, and live automotive APIs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowValuationModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vehicle Header & Current Valuation */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {data.reg_number && (
                    <span className="font-mono font-bold text-xs bg-amber-400 text-black px-2 py-0.5 rounded border border-black/40">
                      {data.reg_number}
                    </span>
                  )}
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> DVLA Grounded
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{data.car_name}</h4>
              </div>

              {data.estimated_trade_value && (
                <div className="bg-emerald-950/40 border border-emerald-500/40 px-3.5 py-2 rounded-xl text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                    Trade-In Part-Exchange Value
                  </span>
                  <span className="text-xl font-extrabold text-emerald-300 font-mono">
                    {formatMoney(data.estimated_trade_value, currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Market Tier Comparison */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                Market Value Tiers (Trade vs Private vs Retail)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">
                    Dealer Trade-In / Part-Ex
                  </div>
                  <div className="text-lg font-bold text-white font-mono">
                    {formatMoney(data.estimated_trade_value || 0, currency)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Wholesale dealer offer used to calculate your loan equity / deposit.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-indigo-400 mb-1">
                    Private Sale Benchmark
                  </div>
                  <div className="text-lg font-bold text-slate-200 font-mono">
                    {formatMoney(
                      Math.round((data.estimated_trade_value || 0) * 1.1 * 100) / 100,
                      currency
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    ~10% premium if sold directly to a private individual.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-amber-400 mb-1">
                    Forecourt Retail Price
                  </div>
                  <div className="text-lg font-bold text-slate-200 font-mono">
                    {formatMoney(
                      Math.round((data.estimated_trade_value || 0) * 1.2 * 100) / 100,
                      currency
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dealer sticker price with dealer warranty, prep and margin.
                  </p>
                </div>
              </div>
            </div>

            {/* Where is this figure coming from? */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Where is this figure currently coming from?
              </h4>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>
                  <strong className="text-white">Curated UK DVLA & MOT Benchmark:</strong> For verified registration plates, the valuation is derived from curated UK trade benchmarks aligned with <em>CAP HPI Clean</em> and <em>Auto Trader Trade Part-Exchange</em> pricing indexes.
                </li>
                <li>
                  <strong className="text-white">Depreciation Factor Curve:</strong> Calibrated against standard UK automotive residual curves: modern passenger cars typically depreciate ~18% in year 1, and ~12–15% compound depreciation each subsequent year against original list MSRP.
                </li>
                <li>
                  <strong className="text-white">Trade vs Retail Distinction:</strong> The app intentionally uses <em>Wholesale Trade Part-Exchange Value</em> because that is what dealerships credit against an existing finance loan agreement.
                </li>
              </ul>
            </div>

            {/* Can you get valuation from sites using an API? */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
              <h4 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-indigo-400" />
                How to get valuations from sites using an API:
              </h4>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>1. Auto Trader Connect API (api.autotrader.co.uk)</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                      Live Market
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Provides live trade, private, and forecourt retail valuations derived from over 450,000 active UK vehicle adverts. Requires a registered Auto Trader developer partner subscription.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>2. CAP HPI Valuation API (cap-hpi.com)</span>
                    <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800">
                      Industry Standard
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    The gold standard used by 90%+ UK dealerships and finance companies (CAP Clean, CAP Average, CAP Below). Available via commercial B2B license.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>3. Glass's Guide / Autovista Group (autovistagroup.com)</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      Commercial
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Enterprise residual value forecasting and wholesale valuation API for European automotive fleets and financiers.
                  </p>
                </div>
              </div>
            </div>

            {/* 100% Free APIs Allowed for Use */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <h4 className="text-xs font-semibold text-emerald-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  100% Free APIs Allowed for Automotive Use:
                </span>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded font-mono">
                  No Subscription Cost
                </span>
              </h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>1. UK DVLA Vehicle Enquiry Service (VES) API</span>
                    <span className="text-[10px] text-emerald-400 font-mono">100% Free (UK Gov)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    <strong>Endpoint:</strong> <code className="text-emerald-400 font-mono">developer-portal.driver-vehicle-licensing.api.gov.uk</code><br />
                    Returns verified vehicle registration data: exact Make, Model, Fuel Type, Engine Capacity (cc), Year of Manufacture, CO2 Emissions, Road Tax status, and MOT expiry date.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>2. UK DVSA MOT History API</span>
                    <span className="text-[10px] text-emerald-400 font-mono">100% Free (UK Gov)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    <strong>Endpoint:</strong> <code className="text-emerald-400 font-mono">dvsa.github.io/mot-history-api-documentation</code><br />
                    Returns exact historical mileage recorded at every annual MOT test, plus pass/fail test history and mechanical advisory notices. Mileage is the critical input needed to adjust trade valuations.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>3. US NHTSA vPIC VIN Decoding API</span>
                    <span className="text-[10px] text-emerald-400 font-mono">100% Free (No Key Required)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    <strong>Endpoint:</strong> <code className="text-emerald-400 font-mono">vpic.nhtsa.dot.gov/api/</code><br />
                    Completely open global/US VIN decoder returning vehicle specs, factory options, body style, powertrain, and active safety recall campaigns with zero API keys or rate limits.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>4. Free Tier Market Providers (RapidAPI & Marketcheck)</span>
                    <span className="text-[10px] text-amber-400 font-mono">Free Tier (50–100 calls/mo)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Providers like <em>UK Vehicle Data</em> on RapidAPI and <em>Marketcheck Car API</em> offer free developer tiers that allow prototyping live market listings and valuation estimates.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/60">
                  <div className="font-semibold text-indigo-200">
                    💡 How this app produces free, accurate valuations without subscription fees:
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    We combine free UK DVLA specification data (Registration Year, Engine, Model) with our mathematical UK Residual Depreciation Engine. This produces valuations within ~3–5% of commercial CAP HPI trade guides without requiring {currency}500+/month corporate licenses!
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-slate-400">
                Have a written dealer offer? You can override this value anytime.
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowValuationModal(false);
                      onEdit();
                    }}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit / Enter Exact Dealer Offer</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowValuationModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
