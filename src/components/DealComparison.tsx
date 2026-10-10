import React, { useState } from 'react';
import {
  Columns,
  ArrowRight,
  Trophy,
  Trash2,
  CheckCircle2,
  Car,
  TrendingDown,
  TrendingUp,
  PlusCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle,
  Edit2,
} from 'lucide-react';
import { FinanceComparisonObject } from '../types/finance';
import { formatMoney } from '../utils/finance';
import { AIComparisonExplainer } from './AIComparisonExplainer';

interface Props {
  deals: FinanceComparisonObject[];
  onSelectDeal: (deal: FinanceComparisonObject) => void;
  onRemoveDeal: (index: number) => void;
  onEditDeal?: (deal: FinanceComparisonObject, index: number) => void;
  activeDeal: FinanceComparisonObject;
  currency: string;
  onOpenAddModal: (isMyCar: boolean) => void;
  onSetAsMyCar: (index: number) => void;
}

export const DealComparison: React.FC<Props> = ({
  deals,
  onSelectDeal,
  onRemoveDeal,
  onEditDeal,
  activeDeal,
  currency,
  onOpenAddModal,
  onSetAsMyCar,
}) => {
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

  if (deals.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-4">
        <Car className="w-12 h-12 text-slate-500 mx-auto" />
        <div>
          <h3 className="text-base font-semibold text-slate-200">
            No Deals to Compare Yet
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Add your current car or analyze a dealer quote to start benchmarking true borrowing costs.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onOpenAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
          >
            <Car className="w-3.5 h-3.5" /> Add My Car
          </button>
          <button
            onClick={() => onOpenAddModal(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Add Quote Option
          </button>
        </div>
      </div>
    );
  }

  // Find user's baseline car if flagged, or default to first deal
  const myCarDeal = deals.find((d) => d.isMyCar);
  const baseline = myCarDeal || deals[0];

  // Find lowest dead money deal
  const minDeadMoney = Math.min(...deals.map((d) => d.dead_money));
  const bestDeal = deals.find((d) => d.dead_money === minDeadMoney);

  return (
    <div className="space-y-6">
      {/* Top Banner: Simple Winner / Savings Breakdown */}
      {deals.length > 1 && bestDeal && (
        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                Recommended Deal Analysis
              </span>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                {bestDeal.car_name} is the Best Value
                <span className="text-xs font-normal text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  Lowest Dead Money
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                {bestDeal.dead_money === 0
                  ? `With 0% APR, this option eliminates all finance charges (${formatMoney(0, currency)} dead money).`
                  : `Incurs only ${formatMoney(bestDeal.dead_money, currency)} in dead money, keeping pure interest and rolled debt to an absolute minimum.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => onSelectDeal(bestDeal)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
            >
              <span>View Winner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* AI Intelligent Plain-English Comparison Explainer */}
      <AIComparisonExplainer deals={deals} currency={currency} activeDeal={activeDeal} />

      {/* Comparison Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Columns className="w-4 h-4 text-indigo-400" />
            Side-by-Side Summary Cards ({deals.length} Options)
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAddModal(true)}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition"
            >
              <Car className="w-3 h-3" />
              <span>{myCarDeal ? 'Edit My Car' : '+ Add My Car'}</span>
            </button>
            <button
              onClick={() => onOpenAddModal(false)}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
            >
              <PlusCircle className="w-3 h-3" />
              <span>+ Add Quote</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((deal, idx) => {
            const isBest = deal.dead_money === minDeadMoney && deals.length > 1;
            const isCurrentMyCar = !!deal.isMyCar;
            const isCurrentlyActive =
              deal.car_name === activeDeal.car_name &&
              deal.dead_money === activeDeal.dead_money;

            // Delta vs baseline
            const monthlyDelta = deal.monthly_payment - baseline.monthly_payment;
            const deadMoneyDelta = deal.dead_money - baseline.dead_money;

            return (
              <div
                key={idx}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition relative shadow-lg ${
                  isCurrentlyActive
                    ? 'border-indigo-500/80 bg-slate-900/95 ring-1 ring-indigo-500/50'
                    : isBest
                    ? 'border-emerald-500/50 bg-slate-900/80'
                    : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                }`}
              >
                {/* Badges row */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isCurrentMyCar && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          <Car className="w-3 h-3" /> My Car
                        </span>
                      )}
                      {isBest && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <Trophy className="w-3 h-3" /> Best Deal
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {deal.apr}% APR • {deal.term_months}m
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {onEditDeal && (
                        <button
                          onClick={() => onEditDeal(deal, idx)}
                          className="text-slate-400 hover:text-indigo-300 p-1 transition"
                          title="Edit vehicle details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {confirmDeleteIdx === idx ? (
                        <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-500/40 rounded px-1.5 py-0.5 animate-fadeIn">
                          <span className="text-[10px] text-rose-300 font-medium">Remove?</span>
                          <button
                            onClick={() => {
                              onRemoveDeal(idx);
                              setConfirmDeleteIdx(null);
                            }}
                            className="text-[10px] font-bold text-rose-200 hover:text-white px-1.5 py-0.5 bg-rose-600 rounded transition"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDeleteIdx(null)}
                            className="text-[10px] text-slate-400 hover:text-slate-200 px-1 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteIdx(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition"
                          title="Remove deal from comparison"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-white line-clamp-1">
                    {deal.car_name}
                  </h4>
                  {deal.reg_number && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-mono font-bold bg-amber-400 text-black px-1.5 py-0.2 rounded border border-black/40">
                        {deal.reg_number}
                      </span>
                      {deal.engine_size && (
                        <span className="text-[10px] text-slate-400">
                          {deal.engine_size}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Monthly & Dead Money Cards */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block">Monthly</span>
                      <span className="text-lg font-bold text-indigo-300 font-mono">
                        {formatMoney(deal.monthly_payment, currency)}
                      </span>
                      {deal !== baseline && monthlyDelta !== 0 && (
                        <span
                          className={`text-[10px] flex items-center font-mono mt-0.5 ${
                            monthlyDelta > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {monthlyDelta > 0 ? (
                            <>
                              <ArrowUpRight className="w-3 h-3 inline" /> +
                              {formatMoney(monthlyDelta, currency)}/mo
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3 h-3 inline" />{' '}
                              {formatMoney(monthlyDelta, currency)}/mo
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block">Dead Money</span>
                      <span
                        className={`text-lg font-bold font-mono ${
                          deal.dead_money === 0
                            ? 'text-emerald-400'
                            : deal.dead_money > 10000
                            ? 'text-rose-400'
                            : 'text-amber-300'
                        }`}
                      >
                        {formatMoney(deal.dead_money, currency)}
                      </span>
                      {deal !== baseline && deadMoneyDelta !== 0 && (
                        <span
                          className={`text-[10px] flex items-center font-mono mt-0.5 ${
                            deadMoneyDelta > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {deadMoneyDelta > 0 ? (
                            <>
                              <ArrowUpRight className="w-3 h-3 inline" /> +
                              {formatMoney(deadMoneyDelta, currency)} dead
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3 h-3 inline" /> Saves{' '}
                              {formatMoney(Math.abs(deadMoneyDelta), currency)}
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details pill row */}
                  <div className="mt-3 text-[11px] text-slate-400 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Advance (Principal):</span>
                      <span className="text-slate-200">{formatMoney(deal.advance, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Balloon / GFV:</span>
                      <span className="text-slate-200">{formatMoney(deal.balloon, currency)}</span>
                    </div>
                    {deal.net_upfront_deficit > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span className="font-sans">
                          {deal.is_negative_equity_rolled ? 'Rolled Deficit in Loan:' : 'Deficit (Paid Upfront):'}
                        </span>
                        <span>+{formatMoney(deal.net_upfront_deficit, currency)}</span>
                      </div>
                    )}
                  </div>

                  {/* Running Costs & Total Monthly TCO */}
                  {deal.running_cost_breakdown && (
                    <div className="mt-3 p-2.5 rounded-xl bg-teal-950/30 border border-teal-500/20 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-teal-300 font-semibold">
                        <span>Est. Running Cost ({deal.running_cost_breakdown.fuel_type}):</span>
                        <span className="font-mono">{formatMoney(deal.running_cost_breakdown.estimated_monthly_running, currency)}/mo</span>
                      </div>
                      <div className="flex items-center justify-between text-white font-bold pt-1 border-t border-teal-500/20">
                        <span>Total Monthly TCO:</span>
                        <span className="font-mono text-teal-300">{formatMoney(deal.running_cost_breakdown.estimated_monthly_tco, currency)}/mo</span>
                      </div>
                    </div>
                  )}

                  {/* Switch Reasoning vs Baseline Pill */}
                  {deal !== baseline && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Vs Baseline ({baseline.car_name})</span>
                        <span className={deal.dead_money > baseline.dead_money ? 'text-rose-400' : 'text-emerald-400'}>
                          {deal.dead_money > baseline.dead_money ? 'Higher Cost Shift' : 'Financial Saving'}
                        </span>
                      </div>
                      <p className="text-slate-200 leading-snug">
                        {deal.dead_money > baseline.dead_money
                          ? `Switching to ${deal.car_name} increases your total dead money by ${formatMoney(deadMoneyDelta, currency)} and monthly commitment by ${formatMoney(monthlyDelta, currency)}/mo.`
                          : `Switching to ${deal.car_name} saves ${formatMoney(Math.abs(deadMoneyDelta), currency)} in overall dead money.`}
                        {deal.negative_equity > 0 && ` Note: Contains ${formatMoney(deal.negative_equity, currency)} trade-in deficit.`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {!isCurrentMyCar && (
                    <button
                      onClick={() => onSetAsMyCar(idx)}
                      className="text-[11px] text-slate-400 hover:text-indigo-300 transition"
                    >
                      Make Baseline
                    </button>
                  )}
                  {isCurrentMyCar && (
                    <span className="text-[11px] text-indigo-400 font-medium">
                      Current Baseline
                    </span>
                  )}

                  <button
                    onClick={() => onSelectDeal(deal)}
                    className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                      isCurrentlyActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isCurrentlyActive ? 'Loaded in Dashboard' : 'View Full Details'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Side-by-Side Comparison Matrix Table */}
      <div className="rounded-xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl overflow-hidden">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          Detailed Comparison Table
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 bg-slate-950/40 rounded-l-lg">Metric</th>
                {deals.map((deal, idx) => (
                  <th key={idx} className="py-2.5 px-3 text-left font-semibold text-slate-200">
                    <span className="truncate max-w-[150px] inline-block font-bold">
                      {deal.isMyCar ? `★ ${deal.car_name}` : deal.car_name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr>
                <td className="py-2.5 px-3 text-slate-400 font-sans">Customer Deposit</td>
                {deals.map((deal, idx) => (
                  <td key={idx} className="py-2.5 px-3 text-slate-200">
                    {formatMoney(deal.customer_deposit || 0, currency)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-400 font-sans">Advance (Financed)</td>
                {deals.map((deal, idx) => (
                  <td key={idx} className="py-2.5 px-3 text-slate-200">
                    {formatMoney(deal.advance, currency)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-400 font-sans">Monthly Payment</td>
                {deals.map((deal, idx) => (
                  <td key={idx} className="py-2.5 px-3 text-indigo-300 font-medium">
                    {formatMoney(deal.monthly_payment, currency)} / mo ({deal.term_months}m)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-400 font-sans">Balloon / GFV</td>
                {deals.map((deal, idx) => (
                  <td key={idx} className="py-2.5 px-3 text-slate-300">
                    {formatMoney(deal.balloon, currency)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-400 font-sans">Contract APR (%)</td>
                {deals.map((deal, idx) => (
                  <td
                    key={idx}
                    className={`py-2.5 px-3 font-semibold ${
                      deal.apr === 0
                        ? 'text-emerald-400'
                        : deal.apr > 10
                        ? 'text-rose-400'
                        : 'text-amber-300'
                    }`}
                  >
                    {deal.apr}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-400 font-sans">Flat Rate (%)</td>
                {deals.map((deal, idx) => (
                  <td key={idx} className="py-2.5 px-3 text-slate-300">
                    {deal.flat_rate
                      ? `${deal.flat_rate}%`
                      : deal.advance > 0 && deal.term_months > 0 && deal.total_interest > 0
                      ? `${(Math.round(((deal.total_interest / deal.advance) / (deal.term_months / 12)) * 10000) / 100)}%`
                      : '0.0%'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-amber-400 font-sans font-medium">
                  Total Interest
                </td>
                {deals.map((deal, idx) => (
                  <td key={idx} className="py-2.5 px-3 text-amber-300 font-bold">
                    {formatMoney(deal.total_interest, currency)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-rose-400 font-sans font-medium">
                  Net Upfront Deficit
                </td>
                {deals.map((deal, idx) => (
                  <td key={idx} className="py-2.5 px-3 text-rose-300 font-bold">
                    {formatMoney(deal.net_upfront_deficit, currency)}
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-950/40">
                <td className="py-2.5 px-3 text-slate-300 font-sans font-medium">
                  Total Amount Payable
                </td>
                {deals.map((deal, idx) => (
                  <td key={idx} className="py-2.5 px-3 text-slate-200 font-bold">
                    {formatMoney(deal.total_amount_payable || (deal.advance + deal.total_interest + (deal.customer_deposit || 0)), currency)}
                  </td>
                ))}
              </tr>
              <tr className="bg-indigo-950/30 text-indigo-300">
                <td className="py-2.5 px-3 font-sans font-semibold">
                  50% Voluntary Termination Point
                </td>
                {deals.map((deal, idx) => (
                  <td key={idx} className="py-2.5 px-3 font-bold text-indigo-300">
                    Month {deal.vt_month ?? '-'} ({formatMoney(deal.vt_threshold_amount || 0, currency)})
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-950/60 font-semibold border-y border-slate-700">
                <td className="py-3 px-3 text-red-400 font-sans font-bold">
                  Dead Money Total
                </td>
                {deals.map((deal, idx) => (
                  <td
                    key={idx}
                    className={`py-3 px-3 text-sm font-extrabold ${
                      deal.dead_money === minDeadMoney ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatMoney(deal.dead_money, currency)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
