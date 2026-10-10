import React, { useState, useEffect } from 'react';
import {
  X,
  Car,
  Calculator,
  HelpCircle,
  PlusCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  Save,
} from 'lucide-react';
import { FinanceComparisonObject } from '../types/finance';
import { recalculateFinance, formatMoney } from '../utils/finance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: FinanceComparisonObject) => void;
  onDelete?: () => void;
  currency: string;
  initialDeal?: Partial<FinanceComparisonObject> | null;
  isMyCarMode?: boolean;
  isEditing?: boolean;
}

export const MyCarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  currency,
  initialDeal,
  isMyCarMode = false,
  isEditing = false,
}) => {
  const [carName, setCarName] = useState(
    initialDeal?.car_name || (isMyCarMode ? '2021 Volvo XC90 R-Design Pro B5 MHEV AWD (KN21 ZCZ)' : 'New Quote Option')
  );
  const [advance, setAdvance] = useState<number>(initialDeal?.advance ?? (isMyCarMode ? 38000 : 28000));
  const [customerDeposit, setCustomerDeposit] = useState<number>(
    initialDeal?.customer_deposit ?? (isMyCarMode ? 2000 : 1500)
  );
  const [monthlyPayment, setMonthlyPayment] = useState<number>(
    initialDeal?.monthly_payment ?? (isMyCarMode ? 585 : 480)
  );
  const [termMonths, setTermMonths] = useState<number>(
    initialDeal?.term_months ?? 48
  );
  const [balloon, setBalloon] = useState<number>(initialDeal?.balloon ?? (isMyCarMode ? 15500 : 0));
  const [apr, setApr] = useState<number>(initialDeal?.apr ?? (isMyCarMode ? 5.9 : 6.9));
  const [flatRate, setFlatRate] = useState<number>(initialDeal?.flat_rate ?? 0);
  const [annualMileage, setAnnualMileage] = useState<number>(
    initialDeal?.annual_mileage ?? 10000
  );

  // Trade-in equity helper
  const [showEquityHelper, setShowEquityHelper] = useState(false);
  const [tradeInValue, setTradeInValue] = useState<number>(initialDeal?.estimated_trade_value ?? (isMyCarMode ? 33485 : 0));
  const [loanSettlement, setLoanSettlement] = useState<number>(0);
  const [negativeEquity, setNegativeEquity] = useState<number>(
    initialDeal?.negative_equity ?? 0
  );
  const [isNegativeEquityRolled, setIsNegativeEquityRolled] = useState<boolean>(
    initialDeal?.is_negative_equity_rolled ?? true
  );
  const [baseAdvance, setBaseAdvance] = useState<number>(
    initialDeal?.base_advance ?? initialDeal?.advance ?? (isMyCarMode ? 38000 : 43500)
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bonusDiscount, setBonusDiscount] = useState<number>(
    initialDeal?.bonus_discount ?? 0
  );
  const [isCurrentCar, setIsCurrentCar] = useState(
    initialDeal?.isMyCar ?? isMyCarMode
  );

  // Quick Reg Lookup within Modal
  const [modalRegInput, setModalRegInput] = useState(initialDeal?.reg_number || (isMyCarMode ? 'KN21 ZCZ' : ''));
  const [fuelType, setFuelType] = useState<string>(initialDeal?.fuel_type || (isMyCarMode ? 'Hybrid' : 'EV'));
  const [isFetchingReg, setIsFetchingReg] = useState(false);
  const [regFetchMsg, setRegFetchMsg] = useState<string | null>(null);

  // Sync state whenever initialDeal or isOpen changes
  useEffect(() => {
    if (isOpen) {
      if (initialDeal) {
        setCarName(initialDeal.car_name || '');
        setFuelType(initialDeal.fuel_type || (initialDeal.car_name?.toLowerCase().includes('c40') || initialDeal.car_name?.toLowerCase().includes('ev') ? 'EV' : 'Petrol'));
        setCustomerDeposit(initialDeal.customer_deposit ?? (isMyCarMode ? 2000 : 1500));
        setMonthlyPayment(initialDeal.monthly_payment ?? (isMyCarMode ? 585 : 480));
        setTermMonths(initialDeal.term_months ?? 48);
        setBalloon(initialDeal.balloon ?? (isMyCarMode ? 15500 : 0));
        setApr(initialDeal.apr ?? (isMyCarMode ? 5.9 : 6.9));
        setFlatRate(initialDeal.flat_rate ?? 0);
        setAnnualMileage(initialDeal.annual_mileage ?? 10000);
        setNegativeEquity(initialDeal.negative_equity ?? 0);
        setBonusDiscount(initialDeal.bonus_discount ?? 0);
        setIsCurrentCar(initialDeal.isMyCar ?? isMyCarMode);
        setModalRegInput(initialDeal.reg_number ?? (isMyCarMode ? 'KN21 ZCZ' : ''));
        const tradeVal = initialDeal.trade_in_offer ?? initialDeal.estimated_trade_value ?? (isMyCarMode ? 25000 : 0);
        const settlementVal = initialDeal.loan_settlement ?? (initialDeal.negative_equity ? tradeVal + initialDeal.negative_equity : 0);
        setTradeInValue(tradeVal);
        setLoanSettlement(settlementVal);

        const isRolled = initialDeal.is_negative_equity_rolled ?? true;
        setIsNegativeEquityRolled(isRolled);
        const netDef = Math.max(0, (initialDeal.negative_equity || 0) - (initialDeal.bonus_discount || 0));
        const base = initialDeal.base_advance !== undefined
          ? initialDeal.base_advance
          : (isRolled && netDef > 0 ? Math.max(0, (initialDeal.advance || 0) - netDef) : (initialDeal.advance ?? (isMyCarMode ? 38000 : 43500)));
        setBaseAdvance(base);
        setAdvance(isRolled && netDef > 0 ? base + netDef : (initialDeal.advance ?? base));
      } else {
        setCarName(isMyCarMode ? '2021 Volvo XC90 R-Design Pro B5 MHEV AWD (KN21 ZCZ)' : '2023 Volvo C40 Ultimate Recharge Twin EV AWD');
        setBaseAdvance(isMyCarMode ? 38000 : 43500);
        setAdvance(isMyCarMode ? 38000 : 46231);
        setCustomerDeposit(isMyCarMode ? 2000 : 1500);
        setMonthlyPayment(isMyCarMode ? 585 : 572);
        setTermMonths(48);
        setBalloon(isMyCarMode ? 15500 : 16500);
        setApr(isMyCarMode ? 5.9 : 7.9);
        setFlatRate(0);
        setAnnualMileage(10000);
        setNegativeEquity(isMyCarMode ? 0 : 2731);
        setBonusDiscount(0);
        setIsCurrentCar(isMyCarMode);
        setModalRegInput(isMyCarMode ? 'KN21 ZCZ' : '');
        setTradeInValue(isMyCarMode ? 33485 : 25000);
        setLoanSettlement(isMyCarMode ? 0 : 27731);
        setIsNegativeEquityRolled(true);
      }
      setRegFetchMsg(null);
    }
  }, [isOpen, initialDeal, isMyCarMode]);

  if (!isOpen) return null;

  const handleModalRegLookup = async () => {
    if (!modalRegInput.trim()) return;
    setIsFetchingReg(true);
    setRegFetchMsg(null);
    try {
      const res = await fetch('/api/lookup-reg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg: modalRegInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setCarName(data.full_car_name);
        if (data.estimated_value) {
          setTradeInValue(data.estimated_value);
          if (loanSettlement > data.estimated_value) {
            setNegativeEquity(loanSettlement - data.estimated_value);
          } else {
            setNegativeEquity(0);
          }
        }
        setRegFetchMsg(`Found: ${data.full_car_name} (Est. Trade-in: ${formatMoney(data.estimated_value, currency)})`);
      } else {
        const err = await res.json();
        setRegFetchMsg(err.error || 'Vehicle not found');
      }
    } catch {
      setRegFetchMsg('Lookup failed');
    } finally {
      setIsFetchingReg(false);
    }
  };

  // Auto calculate negative equity if equity helper inputs change
  const handleSettlementChange = (val: number) => {
    setLoanSettlement(val);
    const neg = val > tradeInValue ? Math.max(0, val - tradeInValue) : 0;
    setNegativeEquity(neg);
    if (isNegativeEquityRolled && !isCurrentCar) {
      setAdvance(Math.round((baseAdvance + neg) * 100) / 100);
    }
  };

  const handleTradeInChange = (val: number) => {
    setTradeInValue(val);
    const neg = loanSettlement > val ? Math.max(0, loanSettlement - val) : 0;
    setNegativeEquity(neg);
    if (isNegativeEquityRolled && !isCurrentCar) {
      setAdvance(Math.round((baseAdvance + neg) * 100) / 100);
    }
  };

  // Preview live computed values
  const previewData = recalculateFinance({
    car_name: carName,
    advance,
    base_advance: baseAdvance,
    is_negative_equity_rolled: isNegativeEquityRolled,
    trade_in_offer: tradeInValue,
    loan_settlement: loanSettlement,
    customer_deposit: customerDeposit,
    term_months: termMonths,
    monthly_payment: monthlyPayment,
    balloon,
    apr,
    flat_rate: flatRate,
    annual_mileage: annualMileage,
    negative_equity: negativeEquity,
    bonus_discount: bonusDiscount,
    isMyCar: isCurrentCar,
    reg_number: modalRegInput || initialDeal?.reg_number,
    engine_size: initialDeal?.engine_size,
    fuel_type: fuelType,
    color: initialDeal?.color,
    transmission: initialDeal?.transmission,
    estimated_trade_value: tradeInValue || initialDeal?.estimated_trade_value,
  }, currency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(previewData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing
                  ? `Edit ${carName || 'Vehicle'}`
                  : isCurrentCar
                  ? 'Add My Car (Baseline)'
                  : 'Add New Vehicle Quote'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update numbers, loan commitments, or trade-in valuation'
                  : 'Simple 30-second form to benchmark your numbers against other deals'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {/* Baseline Checkbox */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs">
            <label className="flex items-center gap-2 text-indigo-200 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={isCurrentCar}
                onChange={(e) => setIsCurrentCar(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
              />
              Mark this vehicle as "My Current Car / Baseline"
            </label>
            <span className="text-[11px] text-slate-400">
              Used to compare other dealer offers against what you currently have
            </span>
          </div>

          {/* Reg Number Lookup Box */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Lookup by Reg Number Plate (Optional)
              </span>
              <span className="text-[11px] text-slate-500">Auto-fills specs & valuation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg bg-amber-400 text-black border border-black/40 overflow-hidden font-mono font-bold text-xs h-9">
                <div className="bg-blue-800 text-white px-2 h-full flex flex-col justify-center items-center text-[9px] font-black">
                  <span>UK</span>
                </div>
                <input
                  type="text"
                  value={modalRegInput}
                  onChange={(e) => setModalRegInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleModalRegLookup();
                    }
                  }}
                  placeholder="e.g. LG21 WXY"
                  maxLength={10}
                  className="bg-transparent px-2.5 text-black placeholder:text-black/40 font-bold uppercase tracking-wider focus:outline-none w-28 sm:w-36"
                />
              </div>
              <button
                type="button"
                onClick={handleModalRegLookup}
                disabled={isFetchingReg || !modalRegInput.trim()}
                className="px-3 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isFetchingReg ? 'Fetching...' : 'Fetch Specs'}
              </button>
            </div>
            {regFetchMsg && (
              <p className="text-[11px] text-indigo-300 bg-indigo-950/40 p-1.5 rounded border border-indigo-800/40">
                {regFetchMsg}
              </p>
            )}
          </div>

          {/* Car Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vehicle Name / Description
              </label>
              <input
                type="text"
                required
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                placeholder="e.g. My 2021 Volvo XC90 or 2023 Volvo C40"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fuel / Powertrain
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Petrol">Petrol</option>
                <option value="EV">Electric (EV)</option>
                <option value="PHEV">Plug-in Hybrid (PHEV)</option>
                <option value="Hybrid">Mild/Full Hybrid</option>
                <option value="Diesel">Diesel</option>
              </select>
            </div>
          </div>

          {/* Core Numbers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Advance */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Amount Financed / Advance ({currency})
                </label>
                {negativeEquity > 0 && isNegativeEquityRolled && (
                  <span className="text-[10px] text-rose-300 font-mono font-semibold">
                    +{currency}{negativeEquity.toLocaleString()} deficit rolled
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={advance}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setAdvance(val);
                  setBaseAdvance(isNegativeEquityRolled && negativeEquity > 0 ? Math.max(0, val - negativeEquity) : val);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {isNegativeEquityRolled && negativeEquity > 0
                  ? `Base Vehicle: ${currency}${baseAdvance.toLocaleString()} + Rolled Deficit: ${currency}${negativeEquity.toLocaleString()} = ${currency}${advance.toLocaleString()}`
                  : 'Total borrowed loan balance principal'}
              </span>
            </div>

            {/* Customer Deposit */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Customer Down Deposit ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={customerDeposit}
                onChange={(e) => setCustomerDeposit(parseFloat(e.target.value) || 0)}
                placeholder={`e.g. ${currency}2,000`}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">
                Initial cash deposit paid upfront
              </span>
            </div>

            {/* Monthly Payment */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Monthly Payment ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={monthlyPayment}
                onChange={(e) =>
                  setMonthlyPayment(parseFloat(e.target.value) || 0)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">
                Regular monthly installment
              </span>
            </div>

            {/* Term Months */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  Term Duration (Months)
                </label>
                <span className="text-xs font-mono text-indigo-400">
                  {termMonths} mo
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                {[24, 36, 48, 60, 72].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTermMonths(t)}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-semibold border transition ${
                      termMonths === t
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {t}m
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="6"
                max="120"
                value={termMonths}
                onChange={(e) => setTermMonths(parseInt(e.target.value, 10) || 36)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Contract APR (%) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Contract APR (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="any"
                value={apr}
                onChange={(e) => setApr(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 6.9 or 12.9"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Annual Percentage Rate
              </span>
            </div>

            {/* Flat Rate (%) */}
            <div>
              <label className="block text-xs font-medium text-amber-300 mb-1 flex items-center justify-between">
                <span>Flat Rate (%)</span>
                {previewData.flat_rate ? (
                  <span className="text-[10px] text-amber-400 font-mono">
                    Calc: {previewData.flat_rate}%
                  </span>
                ) : null}
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="any"
                value={flatRate || ''}
                onChange={(e) => setFlatRate(parseFloat(e.target.value) || 0)}
                placeholder={previewData.flat_rate ? `e.g. ${previewData.flat_rate}` : 'e.g. 6.7'}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-600"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Flat interest rate (e.g. 6.7% flat rate)
              </span>
            </div>

            {/* Balloon / GFV */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Balloon / Final Payment / GFV ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={balloon}
                onChange={(e) => setBalloon(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">
                {currency}0 if standard hire purchase or personal loan
              </span>
            </div>

            {/* Annual Mileage */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Annual Mileage Allowance
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={annualMileage}
                onChange={(e) =>
                  setAnnualMileage(parseInt(e.target.value, 10) || 0)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">
                e.g. 8,000, 10,000 or 12,000 miles
              </span>
            </div>
          </div>

          {/* Optional Trade-in / Negative Equity Helper */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowEquityHelper(!showEquityHelper)}
              className="w-full flex items-center justify-between p-3.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-900 transition"
            >
              <span className="flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                Trade-in & Negative Equity Calculator (Optional)
              </span>
              <span className="text-slate-500 flex items-center gap-1">
                {showEquityHelper ? (
                  <>Hide <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>Expand <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </span>
            </button>

            {showEquityHelper && (
              <div className="p-4 space-y-3 border-t border-slate-800 bg-slate-950/70">
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs">
                  <div className="text-slate-300">
                    <span className="font-semibold text-indigo-300">Quick C40 Deal Preset: </span>
                    Dealer offering {currency}25,000 for XC90 with {currency}27,731 loan settlement ({currency}2,731 negative equity).
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTradeInValue(25000);
                      setLoanSettlement(27731);
                      setNegativeEquity(2731);
                      setIsNegativeEquityRolled(true);
                      const base = baseAdvance > 0 ? baseAdvance : 43500;
                      setBaseAdvance(base);
                      setAdvance(base + 2731);
                      setMonthlyPayment(572);
                    }}
                    className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition shrink-0"
                  >
                    Apply {currency}2,731 XC90 Shortfall
                  </button>
                </div>

                {/* Deficit Rolled vs Paid Upfront Toggle */}
                {negativeEquity > 0 && !isCurrentCar && (
                  <div className="p-3.5 rounded-xl border border-indigo-500/40 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          Add Old Car Deficit into New Loan Advance?
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isNegativeEquityRolled
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isNegativeEquityRolled ? 'Rolled into Loan' : 'Paid Upfront in Cash'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        {isNegativeEquityRolled
                          ? `The ${currency}${negativeEquity.toLocaleString()} deficit is added into the new loan advance (Vehicle: ${currency}${baseAdvance.toLocaleString()} + Deficit: ${currency}${negativeEquity.toLocaleString()} = Total Financed: ${currency}${(baseAdvance + negativeEquity).toLocaleString()}). You pay interest on your old car's remaining debt.`
                          : `Deficit paid upfront in cash. The ${currency}${negativeEquity.toLocaleString()} shortfall is settled out of pocket today. New loan only finances ${currency}${baseAdvance.toLocaleString()}.`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isNegativeEquityRolled;
                        setIsNegativeEquityRolled(next);
                        if (next) {
                          setAdvance(Math.round((baseAdvance + negativeEquity) * 100) / 100);
                        } else {
                          setAdvance(baseAdvance);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        isNegativeEquityRolled
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isNegativeEquityRolled
                        ? `✓ Added to Loan (+${currency}${negativeEquity.toLocaleString()})`
                        : `Pay Deficit Upfront in Cash`}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      Dealer Trade-in Offer ({currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={tradeInValue || ''}
                      onChange={(e) =>
                        handleTradeInChange(parseFloat(e.target.value) || 0)
                      }
                      placeholder={`e.g. ${currency}25,000`}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      Old Vehicle Settlement Balance Owed ({currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={loanSettlement || ''}
                      onChange={(e) =>
                        handleSettlementChange(parseFloat(e.target.value) || 0)
                      }
                      placeholder={`e.g. ${currency}27,731`}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-rose-300 mb-1">
                      Calculated Negative Equity Deficit ({currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={negativeEquity}
                      onChange={(e) =>
                        setNegativeEquity(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-rose-300 font-mono text-xs focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-emerald-300 mb-1">
                      Trade-in Bonus / Dealer Contribution ({currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={bonusDiscount}
                      onChange={(e) =>
                        setBonusDiscount(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {tradeInValue > 0 && loanSettlement > 0 && (
                  <div className={`p-2.5 rounded-lg border text-xs font-mono ${
                    negativeEquity > 0
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                      : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  }`}>
                    {negativeEquity > 0 ? (
                      <div>
                        <strong>Shortfall Breakdown:</strong> Dealer Offer ({currency}{tradeInValue.toLocaleString()}) minus Settlement Owed ({currency}{loanSettlement.toLocaleString()}) = <span className="font-extrabold text-rose-400">-{currency}{negativeEquity.toLocaleString()} Negative Equity</span>. You (or the C40 finance package) pay this {currency}{negativeEquity.toLocaleString()} deficit to clear your XC90 loan.
                      </div>
                    ) : (
                      <div>
                        <strong>Positive Equity:</strong> Dealer Offer ({currency}{tradeInValue.toLocaleString()}) clears Settlement ({currency}{loanSettlement.toLocaleString()}) with <span className="font-extrabold text-emerald-400">+{currency}{(tradeInValue - loanSettlement).toLocaleString()} Positive Equity</span> applied toward your new deposit!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real-time Preview Pill */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Computed Borrowing Metrics
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-extrabold text-red-400 font-mono">
                  {formatMoney(previewData.dead_money, currency)}
                </span>
                <span className="text-xs text-slate-400">Total Dead Money</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
              <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                Interest: {formatMoney(previewData.total_interest, currency)}
              </span>
              <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                Deficit: {formatMoney(previewData.net_upfront_deficit, currency)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
            <div>
              {onDelete && (
                confirmDelete ? (
                  <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500/40 rounded-xl px-3 py-1.5 animate-fadeIn">
                    <span className="text-xs text-rose-300 font-medium">Delete this vehicle?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete();
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 text-xs text-slate-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete Vehicle</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
              >
                {isEditing ? <Save className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                <span>{isEditing ? 'Save Changes' : 'Save & Compare Vehicle'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
