import React, { useState, useEffect } from 'react';
import {
  Car,
  Calculator,
  Sliders,
  Columns,
  PlusCircle,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Wrench,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
  BarChart3,
  Database,
} from 'lucide-react';
import { FinanceComparisonObject, QuotePreset, VehicleRegLookupResult } from './types/finance';
import { SAMPLE_PRESETS, recalculateFinance, heuristicExtractFromText, formatVerdictCurrency } from './utils/finance';
import { QuoteInput } from './components/QuoteInput';
import { MetricsDashboard } from './components/MetricsDashboard';
import { InteractiveTweaker } from './components/InteractiveTweaker';
import { DealComparison } from './components/DealComparison';
import { MyCarModal } from './components/MyCarModal';
import { RegLookupBar } from './components/RegLookupBar';
import { Amortization } from './components/Amortization';
import { AIComparisonExplainer } from './components/AIComparisonExplainer';
import {
  loadDeals,
  saveDeal,
  saveAllDeals,
  deleteDeal,
  saveActiveDealName,
  getActiveDealName,
} from './services/dealService';

// Initial verified baseline and comparison deals
const MY_CURRENT_CAR_RAW: Partial<FinanceComparisonObject> = {
  car_name: '2021 Volvo XC90 R-Design Pro B5 MHEV AWD (KN21 ZCZ)',
  advance: 38000,
  customer_deposit: 2000,
  term_months: 48,
  monthly_payment: 585.0,
  balloon: 15500,
  apr: 5.9,
  annual_mileage: 10000,
  negative_equity: 0,
  bonus_discount: 0,
  isMyCar: true,
  reg_number: 'KN21 ZCZ',
  engine_size: '2.0L (1969cc)',
  fuel_type: 'Diesel Mild Hybrid (MHEV)',
  color: 'Onyx Black Metallic',
  transmission: '8-Speed Geartronic Auto',
  estimated_trade_value: 33485,
};

const MY_CURRENT_CAR = recalculateFinance(MY_CURRENT_CAR_RAW, '£');

export default function App() {
  const [currency, setCurrency] = useState('£');
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'compare' | 'amortization' | 'stress-test'
  >('dashboard');
  const [currentDeal, setCurrentDeal] = useState<FinanceComparisonObject>(MY_CURRENT_CAR);
  const [savedDeals, setSavedDeals] = useState<FinanceComparisonObject[]>([
    MY_CURRENT_CAR,
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showQuoteImporter, setShowQuoteImporter] = useState(false);
  const [showRegLookup, setShowRegLookup] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIsMyCarMode, setModalIsMyCarMode] = useState(false);
  const [editingDeal, setEditingDeal] = useState<FinanceComparisonObject | null>(null);
  const [editingDealIndex, setEditingDealIndex] = useState<number | null>(null);

  // Load initial deals from Firestore / localStorage
  useEffect(() => {
    async function initDeals() {
      const stored = await loadDeals();
      if (stored && stored.length > 0) {
        setSavedDeals(stored);
        const activeName = getActiveDealName();
        const foundActive = stored.find((d) => d.car_name === activeName);
        if (foundActive) {
          setCurrentDeal(foundActive);
        } else {
          setCurrentDeal(stored[0]);
        }
      } else {
        saveDeal(MY_CURRENT_CAR);
      }
    }
    initDeals();
  }, []);

  const handleEditDeal = (deal: FinanceComparisonObject, index?: number) => {
    setEditingDeal(deal);
    const resolvedIndex = typeof index === 'number'
      ? index
      : savedDeals.findIndex((d) => d.car_name === deal.car_name);
    setEditingDealIndex(resolvedIndex >= 0 ? resolvedIndex : null);
    setModalIsMyCarMode(!!deal.isMyCar);
    setIsModalOpen(true);
  };

  const handleToggleRollDeficit = (deal: FinanceComparisonObject) => {
    const isCurrentlyRolled = deal.is_negative_equity_rolled ?? false;
    const nextRolled = !isCurrentlyRolled;
    const netDeficit = Math.max(0, (deal.negative_equity || 0) - (deal.bonus_discount || 0));
    const baseAdvance = deal.base_advance !== undefined
      ? deal.base_advance
      : (isCurrentlyRolled ? Math.max(0, deal.advance - netDeficit) : deal.advance);

    const newAdvance = nextRolled ? Math.round((baseAdvance + netDeficit) * 100) / 100 : baseAdvance;

    // Recalculate monthly payment if APR > 0
    let newMonthly = deal.monthly_payment;
    if (deal.apr > 0 && newAdvance > 0 && deal.term_months > 0) {
      const r = (deal.apr / 100) / 12;
      const num = (newAdvance * r * Math.pow(1 + r, deal.term_months)) - (deal.balloon * r);
      const den = Math.pow(1 + r, deal.term_months) - 1;
      if (den > 0) {
        newMonthly = Math.round((num / den) * 100) / 100;
      }
    }

    const updated = recalculateFinance({
      ...deal,
      base_advance: baseAdvance,
      advance: newAdvance,
      is_negative_equity_rolled: nextRolled,
      monthly_payment: newMonthly,
    }, currency);

    setCurrentDeal(updated);
    const updatedList = savedDeals.map((d) => (d.car_name === deal.car_name ? updated : d));
    setSavedDeals(updatedList);
    saveDeal(updated);
  };

  const handleOpenAddModal = (isMyCar: boolean) => {
    setEditingDeal(null);
    setEditingDealIndex(null);
    setModalIsMyCarMode(isMyCar);
    setIsModalOpen(true);
  };

  const handleDeleteModalDeal = () => {
    if (editingDealIndex !== null) {
      handleRemoveDeal(editingDealIndex);
    } else if (editingDeal) {
      const remaining = savedDeals.filter((d) => d.car_name !== editingDeal.car_name);
      setSavedDeals(remaining);
      saveAllDeals(remaining);
      deleteDeal(editingDeal.car_name);
      if (currentDeal.car_name === editingDeal.car_name && remaining.length > 0) {
        setCurrentDeal(remaining[0]);
        saveActiveDealName(remaining[0].car_name);
      }
    }
    setIsModalOpen(false);
    setEditingDeal(null);
    setEditingDealIndex(null);
  };

  const [lastAttempt, setLastAttempt] = useState<{
    text?: string;
    image?: string;
    mimeType?: string;
  } | null>(null);

  const handleVehicleFromReg = (
    vehicle: VehicleRegLookupResult,
    targetMode: 'my-car' | 'quote'
  ) => {
    const isMyCar = targetMode === 'my-car';
    // Calculate realistic baseline loan terms for this vehicle
    const advance = Math.round(vehicle.estimated_value * 0.9);
    const term_months = 48;
    const apr = isMyCar ? 5.9 : 8.9;
    const balloon = isMyCar ? Math.round(advance * 0.35) : Math.round(advance * 0.4);
    // monthly payment approximate
    const monthly_payment = Math.round(
      (((advance * (1 + (apr / 100) * (term_months / 12))) - balloon) / term_months) * 100
    ) / 100;

    const deal = recalculateFinance({
      car_name: `${vehicle.full_car_name} (${vehicle.reg_number})`,
      advance,
      term_months,
      monthly_payment,
      balloon,
      apr,
      annual_mileage: 10000,
      negative_equity: 0,
      bonus_discount: 0,
      isMyCar,
      reg_number: vehicle.reg_number,
      engine_size: vehicle.engine_size,
      fuel_type: vehicle.fuel_type,
      color: vehicle.color,
      transmission: vehicle.transmission,
      estimated_trade_value: vehicle.estimated_value,
    }, currency);

    setCurrentDeal(deal);
    saveActiveDealName(deal.car_name);
    setShowRegLookup(false);
    setActiveTab('dashboard');

    let newList: FinanceComparisonObject[];
    if (isMyCar) {
      newList = [
        deal,
        ...savedDeals
          .filter((d) => d.car_name !== deal.car_name)
          .map((d) => ({ ...d, isMyCar: false })),
      ];
    } else {
      newList = [
        deal,
        ...savedDeals.filter((d) => d.car_name !== deal.car_name),
      ];
    }
    setSavedDeals(newList);
    saveAllDeals(newList);
  };

  const handleAnalyze = async (
    text: string,
    image?: string,
    mimeType?: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLastAttempt({ text, image, mimeType });

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, image, mimeType, currency }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze quote');
      }

      const data: FinanceComparisonObject = await response.json();
      const normalizedData = {
        ...data,
        verdict: formatVerdictCurrency(data.verdict, currency),
      };
      setCurrentDeal(normalizedData);
      saveActiveDealName(normalizedData.car_name);
      setActiveTab('dashboard');
      setShowQuoteImporter(false);

      // Add to saved deals list and persist
      const newList = [normalizedData, ...savedDeals.filter((d) => d.car_name !== normalizedData.car_name)];
      setSavedDeals(newList);
      saveAllDeals(newList);
    } catch (err: any) {
      console.error(err);
      const is503 =
        err.message &&
        (err.message.includes('503') ||
          err.message.includes('high demand') ||
          err.message.includes('UNAVAILABLE'));
      setErrorMessage(
        is503
          ? 'The AI model is experiencing temporary high demand (503). You can retry or immediately use the offline heuristic calculation engine.'
          : err.message || 'Analysis failed. Please check that the quote contains finance numbers.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunFallbackParser = () => {
    if (!lastAttempt?.text) return;
    const parsed = heuristicExtractFromText(lastAttempt.text);
    const verified = recalculateFinance(parsed, currency);
    setCurrentDeal(verified);
    saveActiveDealName(verified.car_name);
    setErrorMessage(null);
    setShowQuoteImporter(false);
    setActiveTab('dashboard');

    const newList = [
      verified,
      ...savedDeals.filter((d) => d.car_name !== verified.car_name),
    ];
    setSavedDeals(newList);
    saveAllDeals(newList);
  };

  const handleSelectPresetDirect = (preset: QuotePreset) => {
    let newDeal: FinanceComparisonObject;
    if (preset.id === 'underwater-tradein') {
      newDeal = recalculateFinance({
        car_name: '2023 Volvo C40 Ultimate Recharge Twin EV AWD',
        base_advance: 43500,
        advance: 46231,
        customer_deposit: 1500,
        term_months: 48,
        monthly_payment: 572.0,
        balloon: 16500,
        apr: 7.9,
        annual_mileage: 10000,
        negative_equity: 2731,
        trade_in_offer: 25000,
        loan_settlement: 27731,
        is_negative_equity_rolled: true,
        bonus_discount: 0,
        verdict:
          `This Volvo C40 agreement includes your ${currency}2,731.00 XC90 trade-in deficit rolled directly into the new car loan (Total Advance: ${currency}46,231.00). You are financing your old car's remaining debt at 7.9% APR, adding to your total dead money.`,
      }, currency);
    } else if (preset.id === 'clean-zero-apr') {
      newDeal = recalculateFinance({
        car_name: '2025 Hyundai Ioniq 5 AWD (0% APR)',
        advance: 40000,
        term_months: 36,
        monthly_payment: 1111.11,
        balloon: 0,
        apr: 0,
        annual_mileage: 10000,
        negative_equity: 0,
        bonus_discount: 2500,
        verdict:
          `With a 0% promotional APR, this deal carries zero finance charges, resulting in exactly ${currency}0.00 in dead money. Provided trade-in value matches expectations at term end, this is an exceptionally sound financing structure.`,
      }, currency);
    } else if (preset.id === 'subprime-lease') {
      newDeal = recalculateFinance({
        car_name: '2024 Mercedes-Benz C300 4MATIC',
        advance: 44000,
        term_months: 48,
        monthly_payment: 920.0,
        balloon: 14000,
        apr: 13.9,
        annual_mileage: 8000,
        negative_equity: 3800,
        bonus_discount: 800,
        verdict:
          `This quote represents an extreme interest trap with ${currency}17,160.00 in dead money triggered by a punishing 13.9% subprime APR and ${currency}3,000.00 in rolled debt. The combination of high interest and deferred balloon payment leaves you in deep negative equity throughout the term.`,
      }, currency);
    } else {
      newDeal = recalculateFinance({
        car_name: 'PCP Dealer Quote Option',
        advance: 35000,
        customer_deposit: 2000,
        term_months: 48,
        monthly_payment: 590.0,
        balloon: 14500,
        apr: 8.9,
        annual_mileage: 10000,
        negative_equity: 0,
        bonus_discount: 500,
      }, currency);
    }

    setCurrentDeal(newDeal);
    saveActiveDealName(newDeal.car_name);
    const newList = [
      newDeal,
      ...savedDeals.filter((d) => d.car_name !== newDeal.car_name),
    ];
    setSavedDeals(newList);
    saveAllDeals(newList);
    setShowQuoteImporter(false);
  };

  const handleSaveModalDeal = (deal: FinanceComparisonObject) => {
    setCurrentDeal(deal);
    saveActiveDealName(deal.car_name);
    let newList: FinanceComparisonObject[];
    if (editingDealIndex !== null && savedDeals[editingDealIndex]) {
      const updated = [...savedDeals];
      updated[editingDealIndex] = deal;
      if (deal.isMyCar) {
        newList = updated.map((d, i) => (i === editingDealIndex ? d : { ...d, isMyCar: false }));
      } else {
        newList = updated;
      }
    } else {
      if (deal.isMyCar) {
        newList = [
          deal,
          ...savedDeals
            .filter((d) => d.car_name !== deal.car_name)
            .map((d) => ({ ...d, isMyCar: false })),
        ];
      } else {
        newList = [
          deal,
          ...savedDeals.filter((d) => d.car_name !== deal.car_name),
        ];
      }
    }
    setSavedDeals(newList);
    saveAllDeals(newList);
    setEditingDeal(null);
    setEditingDealIndex(null);
    setActiveTab('dashboard');
  };

  const handleSetAsMyCar = (index: number) => {
    const newList = savedDeals.map((d, i) => ({
      ...d,
      isMyCar: i === index,
    }));
    setSavedDeals(newList);
    saveAllDeals(newList);
  };

  const handleRemoveDeal = (index: number) => {
    const targetDeal = savedDeals[index];
    if (targetDeal) {
      deleteDeal(targetDeal.car_name);
    }
    const remaining = savedDeals.filter((_, i) => i !== index);
    setSavedDeals(remaining);
    saveAllDeals(remaining);
    if (remaining.length > 0 && targetDeal?.car_name === currentDeal.car_name) {
      setCurrentDeal(remaining[0]);
      saveActiveDealName(remaining[0].car_name);
    }
  };

  const handleCurrencyChange = (sym: string) => {
    setCurrency(sym);
    setCurrentDeal((prev) => recalculateFinance(prev, sym));
    setSavedDeals((prev) => prev.map((d) => recalculateFinance(d, sym)));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">
                  Vehicle Finance Analysis Engine
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-400" />
                  Cloud Saved
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Compare your car vs dealer quotes & eliminate dead money
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Currency selector */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
              {['$', '£', '€'].map((sym) => (
                <button
                  key={sym}
                  onClick={() => handleCurrencyChange(sym)}
                  className={`w-6 h-6 rounded flex items-center justify-center font-semibold transition ${
                    currency === sym
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={`Set currency to ${sym}`}
                >
                  {sym}
                </button>
              ))}
            </div>

            {/* Quick Add My Car Button */}
            <button
              onClick={() => handleOpenAddModal(true)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shadow-sm cursor-pointer"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Add My Car</span>
            </button>

            {/* Quick Add Quote Button */}
            <button
              onClick={() => handleOpenAddModal(false)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>+ Add Quote</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 w-full">
        {/* Error notification */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-200">{errorMessage}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The engine automatically retries with backoff and supports instant local extraction.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {lastAttempt && (
                <button
                  onClick={() =>
                    handleAnalyze(
                      lastAttempt.text || '',
                      lastAttempt.image,
                      lastAttempt.mimeType
                    )
                  }
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Retry
                </button>
              )}
              {lastAttempt?.text && (
                <button
                  onClick={handleRunFallbackParser}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition"
                >
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  Instant Parse
                </button>
              )}
              <button
                onClick={() => setErrorMessage(null)}
                className="text-slate-400 hover:text-white text-xs underline px-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Quick Car Switcher Chips Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
              Vehicles:
            </span>
            {savedDeals.map((deal, idx) => {
              const isSelected =
                deal.car_name === currentDeal.car_name &&
                deal.dead_money === currentDeal.dead_money;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentDeal(deal);
                    setActiveTab('dashboard');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {deal.isMyCar ? (
                    <Car className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                  )}
                  <span>{deal.car_name}</span>
                  {deal.isMyCar && (
                    <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-normal">
                      Mine
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setShowRegLookup(!showRegLookup);
                if (!showRegLookup) setShowQuoteImporter(false);
              }}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                showRegLookup
                  ? 'bg-amber-400 text-black border-amber-500 font-bold shadow'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <span className="font-mono font-black text-[10px] bg-blue-800 text-white px-1 rounded-sm">UK</span>
              <span>Reg Lookup</span>
              {showRegLookup ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => {
                setShowQuoteImporter(!showQuoteImporter);
                if (!showQuoteImporter) setShowRegLookup(false);
              }}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Paste/OCR Quote</span>
              {showQuoteImporter ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Reg Lookup Component */}
        {showRegLookup && (
          <div className="animate-fadeIn">
            <RegLookupBar
              onVehicleFound={handleVehicleFromReg}
              currency={currency}
            />
          </div>
        )}

        {/* Collapsible Quote Importer (Paste or OCR) */}
        {showQuoteImporter && (
          <div className="animate-fadeIn">
            <QuoteInput
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              onSelectPresetDirect={handleSelectPresetDirect}
              currency={currency}
            />
          </div>
        )}

        {/* Primary Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Viewing Details:
              </span>
              {currentDeal.isMyCar && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ★ My Baseline Car
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <h2 className="text-xl font-bold text-white">
                {currentDeal.car_name}
              </h2>
              <button
                type="button"
                onClick={() => handleEditDeal(currentDeal)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition cursor-pointer"
                title="Edit vehicle details, specs, or numbers"
              >
                <span>Edit / Delete</span>
              </button>
            </div>
          </div>

          {/* Clean Segmented Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'compare'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Compare ({savedDeals.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('amortization')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'amortization'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Amortization</span>
            </button>

            <button
              onClick={() => setActiveTab('stress-test')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'stress-test'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Stress Tester</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Financial Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <MetricsDashboard
              data={currentDeal}
              currency={currency}
              onEdit={() => handleEditDeal(currentDeal)}
              onToggleRollDeficit={() => handleToggleRollDeficit(currentDeal)}
            />
            <AIComparisonExplainer
              deals={savedDeals}
              currency={currency}
              activeDeal={currentDeal}
            />
          </div>
        )}

        {/* Tab 2: Compare Deals */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <DealComparison
              deals={savedDeals}
              onSelectDeal={(deal) => {
                setCurrentDeal(deal);
                setActiveTab('dashboard');
              }}
              onRemoveDeal={handleRemoveDeal}
              onEditDeal={handleEditDeal}
              activeDeal={currentDeal}
              currency={currency}
              onOpenAddModal={handleOpenAddModal}
              onSetAsMyCar={handleSetAsMyCar}
            />
          </div>
        )}

        {/* Tab 3: Amortization Schedule */}
        {activeTab === 'amortization' && (
          <div className="space-y-6">
            <Amortization data={currentDeal} currency={currency} />
          </div>
        )}

        {/* Tab 4: Interactive Stress Tester */}
        {activeTab === 'stress-test' && (
          <div className="space-y-6">
            <InteractiveTweaker
              currentData={currentDeal}
              onChange={(updated) => {
                setCurrentDeal(updated);
                setSavedDeals((prev) =>
                  prev.map((d) =>
                    d.car_name === currentDeal.car_name ? updated : d
                  )
                );
              }}
              currency={currency}
            />
            <MetricsDashboard
              data={currentDeal}
              currency={currency}
              onEdit={() => handleEditDeal(currentDeal)}
            />
          </div>
        )}
      </main>

      {/* Modal: Add My Car or Add Quote */}
      <MyCarModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDeal(null);
          setEditingDealIndex(null);
        }}
        onSave={handleSaveModalDeal}
        onDelete={editingDeal ? handleDeleteModalDeal : undefined}
        currency={currency}
        initialDeal={editingDeal}
        isMyCarMode={modalIsMyCarMode}
        isEditing={!!editingDeal}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>
            Vehicle Finance Analysis Engine • Evaluates PCP, HP, Lease & Personal Loans
          </p>
          <p className="text-slate-400">
            Dead Money = Total Interest + max(0, Negative Equity - Bonus)
          </p>
        </div>
      </footer>
    </div>
  );
}
