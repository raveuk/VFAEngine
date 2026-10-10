import React, { useState } from 'react';
import { Sliders, RefreshCw, Sparkles, RotateCcw } from 'lucide-react';
import { FinanceComparisonObject } from '../types/finance';
import { recalculateFinance } from '../utils/finance';

interface Props {
  currentData: FinanceComparisonObject;
  onChange: (updated: FinanceComparisonObject) => void;
  currency: string;
}

export const InteractiveTweaker: React.FC<Props> = ({
  currentData,
  onChange,
  currency,
}) => {
  const [isRegeneratingVerdict, setIsRegeneratingVerdict] = useState(false);
  const [initialSnapshot] = useState<FinanceComparisonObject>(currentData);

  const handleFieldChange = (
    field: keyof FinanceComparisonObject,
    value: any
  ) => {
    const updated = {
      ...currentData,
      [field]: value,
    };
    const recalculated = recalculateFinance(updated, currency);
    onChange(recalculated);
  };

  const handleReset = () => {
    onChange(initialSnapshot);
  };

  const handleRegenerateVerdict = async () => {
    setIsRegeneratingVerdict(true);
    try {
      const res = await fetch('/api/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentData,
          currency,
          regenerateVerdict: true,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        onChange(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegeneratingVerdict(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Interactive Parameter Stress Tester
            </h3>
            <p className="text-[11px] text-slate-400">
              Modify loan variables to simulate dealer counter-offers and live recalculation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Reset to originally extracted quote numbers"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleRegenerateVerdict}
            disabled={isRegeneratingVerdict}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium shadow-sm transition disabled:opacity-50"
          >
            {isRegeneratingVerdict ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            )}
            <span>Refresh AI Verdict</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Car Name */}
        <div className="col-span-full">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Vehicle Specification / Deal Title
          </label>
          <input
            type="text"
            value={currentData.car_name}
            onChange={(e) => handleFieldChange('car_name', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Advance (Financed Principal) */}
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
            <span>Advance (Borrowed Principal)</span>
            <span className="font-mono text-indigo-400">
              {currency}{currentData.advance.toLocaleString()}
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={currentData.advance}
            onChange={(e) =>
              handleFieldChange('advance', parseFloat(e.target.value) || 0)
            }
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Monthly Payment */}
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
            <span>Monthly Payment</span>
            <span className="font-mono text-indigo-400">
              {currency}{currentData.monthly_payment.toLocaleString()}
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={currentData.monthly_payment}
            onChange={(e) =>
              handleFieldChange('monthly_payment', parseFloat(e.target.value) || 0)
            }
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Balloon / GFV */}
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
            <span>Balloon / GFV Payment</span>
            <span className="font-mono text-indigo-400">
              {currency}{currentData.balloon.toLocaleString()}
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={currentData.balloon}
            onChange={(e) =>
              handleFieldChange('balloon', parseFloat(e.target.value) || 0)
            }
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Term Months Slider & Input */}
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
            <span>Term Duration</span>
            <span className="font-mono text-indigo-400">
              {currentData.term_months} Months
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="12"
              max="84"
              step="6"
              value={currentData.term_months}
              onChange={(e) =>
                handleFieldChange('term_months', parseInt(e.target.value, 10))
              }
              className="w-full accent-indigo-500"
            />
            <span className="text-xs font-mono text-slate-300 w-10 text-right">
              {currentData.term_months}m
            </span>
          </div>
        </div>

        {/* APR (%) */}
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
            <span>Contract APR (%)</span>
            <span className="font-mono text-indigo-400">
              {currentData.apr}%
            </span>
          </div>
          <input
            type="number"
            min="0"
            max="50"
            step="any"
            value={currentData.apr}
            onChange={(e) =>
              handleFieldChange('apr', parseFloat(e.target.value) || 0)
            }
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            placeholder="e.g. 6.9 or 12.9"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Contract Annual Percentage Rate
          </p>
        </div>

        {/* Flat Rate (%) */}
        <div>
          <div className="flex justify-between text-xs font-medium text-amber-300 mb-1">
            <span>Flat Rate (%)</span>
            <span className="font-mono text-amber-400">
              {currentData.flat_rate ? `${currentData.flat_rate}%` : 'Not set'}
            </span>
          </div>
          <input
            type="number"
            min="0"
            max="50"
            step="any"
            value={currentData.flat_rate || ''}
            onChange={(e) =>
              handleFieldChange('flat_rate', parseFloat(e.target.value) || 0)
            }
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none placeholder:text-slate-600"
            placeholder="e.g. 6.7"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Flat interest rate (e.g. 6.7% flat)
          </p>
        </div>

        {/* Annual Mileage */}
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
            <span>Annual Mileage</span>
            <span className="font-mono text-indigo-400">
              {currentData.annual_mileage.toLocaleString()} mi
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="1000"
            value={currentData.annual_mileage}
            onChange={(e) =>
              handleFieldChange('annual_mileage', parseInt(e.target.value, 10) || 0)
            }
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Trade-in Offer */}
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
            <span>Dealer Trade-in Offer</span>
            <span className="font-mono text-emerald-400">
              {currency}{(currentData.trade_in_offer || currentData.estimated_trade_value || 0).toLocaleString()}
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={currentData.trade_in_offer || ''}
            onChange={(e) => {
              const offer = parseFloat(e.target.value) || 0;
              const settlement = currentData.loan_settlement || 0;
              const neg = settlement > offer ? settlement - offer : 0;
              onChange(recalculateFinance({
                ...currentData,
                trade_in_offer: offer,
                negative_equity: neg,
              }, currency));
            }}
            placeholder="e.g. 25000"
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Loan Settlement */}
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
            <span>Old Loan Settlement Owed</span>
            <span className="font-mono text-slate-300">
              {currency}{(currentData.loan_settlement || 0).toLocaleString()}
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={currentData.loan_settlement || ''}
            onChange={(e) => {
              const settlement = parseFloat(e.target.value) || 0;
              const offer = currentData.trade_in_offer || currentData.estimated_trade_value || 0;
              const neg = settlement > offer ? settlement - offer : 0;
              onChange(recalculateFinance({
                ...currentData,
                loan_settlement: settlement,
                negative_equity: neg,
              }, currency));
            }}
            placeholder="e.g. 27731"
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Negative Equity */}
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
            <span className="text-rose-300">Calculated Negative Equity</span>
            <span className="font-mono text-rose-400">
              {currency}{currentData.negative_equity.toLocaleString()}
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={currentData.negative_equity}
            onChange={(e) =>
              handleFieldChange('negative_equity', parseFloat(e.target.value) || 0)
            }
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-1 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        {/* Roll Deficit into Advance Toggle */}
        {currentData.negative_equity > 0 && !currentData.isMyCar && (
          <div className="col-span-full p-3 rounded-xl border border-rose-500/30 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-200 block">
                Add Old Car Deficit into New Loan Advance?
              </span>
              <span className="text-[11px] text-slate-400">
                {currentData.is_negative_equity_rolled
                  ? `Active: Deficit is rolled into loan advance (${currency}${(currentData.base_advance || (currentData.advance - currentData.negative_equity)).toLocaleString()} base + ${currency}${currentData.negative_equity.toLocaleString()} deficit = ${currency}${currentData.advance.toLocaleString()} total financed).`
                  : `Inactive: Deficit of ${currency}${currentData.negative_equity.toLocaleString()} is paid upfront in cash. Advance remains ${currency}${(currentData.base_advance || currentData.advance).toLocaleString()}.`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextRolled = !currentData.is_negative_equity_rolled;
                const netDef = Math.max(0, (currentData.negative_equity || 0) - (currentData.bonus_discount || 0));
                const baseAdv = currentData.base_advance !== undefined
                  ? currentData.base_advance
                  : (currentData.is_negative_equity_rolled ? Math.max(0, currentData.advance - netDef) : currentData.advance);
                const newAdv = nextRolled ? Math.round((baseAdv + netDef) * 100) / 100 : baseAdv;
                onChange(recalculateFinance({
                  ...currentData,
                  base_advance: baseAdv,
                  advance: newAdv,
                  is_negative_equity_rolled: nextRolled,
                }, currency));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                currentData.is_negative_equity_rolled
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {currentData.is_negative_equity_rolled
                ? `✓ Added to Loan Advance (+${currency}${currentData.negative_equity.toLocaleString()})`
                : 'Pay Deficit Upfront'}
            </button>
          </div>
        )}

        {/* Customer Deposit */}
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
            <span>Customer Down Deposit</span>
            <span className="font-mono text-indigo-400">
              {currency}{(currentData.customer_deposit || 0).toLocaleString()}
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={currentData.customer_deposit || 0}
            onChange={(e) =>
              handleFieldChange('customer_deposit', parseFloat(e.target.value) || 0)
            }
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Trade-in Bonus / Discount */}
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
            <span className="text-emerald-300">Trade-in Bonus / Discount</span>
            <span className="font-mono text-emerald-400">
              {currency}{currentData.bonus_discount.toLocaleString()}
            </span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={currentData.bonus_discount}
            onChange={(e) =>
              handleFieldChange('bonus_discount', parseFloat(e.target.value) || 0)
            }
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Running Cost & TCO Summary Banner */}
      {currentData.running_cost_breakdown && (
        <div className="mt-5 p-4 rounded-xl border border-teal-500/30 bg-teal-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-teal-300 uppercase text-[10px] tracking-wider block">
              Estimated Running Costs & Total Cost of Ownership ({currentData.running_cost_breakdown.fuel_type})
            </span>
            <span className="text-slate-200 font-medium">
              Fuel/Energy ({currentData.running_cost_breakdown.efficiency_label}) + Tax + Servicing + Insurance = <strong className="text-teal-300">{currency}{currentData.running_cost_breakdown.estimated_monthly_running}/mo</strong> ({currency}{currentData.running_cost_breakdown.estimated_total_annual_running}/yr)
            </span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block">Total Monthly TCO (Finance + Running)</span>
            <span className="font-mono text-teal-300 font-bold text-sm">
              {currency}{currentData.running_cost_breakdown.estimated_monthly_tco}/mo
            </span>
          </div>
        </div>
      )}

      {/* Voluntary Termination Live Summary Banner */}
      <div className="mt-5 p-4 rounded-xl border border-indigo-500/30 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-indigo-300 uppercase text-[10px] tracking-wider block">
            Voluntary Termination Protection (50% Rule CCA 1974)
          </span>
          <span className="text-slate-200 font-medium">
            50% Threshold: {currency}{(currentData.vt_threshold_amount || 0).toLocaleString()} • Reached at <strong className="text-indigo-400">Month {currentData.vt_month || 0}</strong> of {currentData.term_months}
          </span>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-400 block">Total Amount Payable</span>
          <span className="font-mono text-slate-100 font-bold">
            {currency}{(currentData.total_amount_payable || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
