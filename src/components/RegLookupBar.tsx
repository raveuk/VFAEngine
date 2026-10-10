import React, { useState } from 'react';
import {
  Search,
  Check,
  AlertCircle,
  Car,
  Fuel,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Info,
  Edit2,
  Save,
} from 'lucide-react';
import { VehicleRegLookupResult } from '../types/finance';
import { formatMoney } from '../utils/finance';

interface Props {
  onVehicleFound: (
    vehicle: VehicleRegLookupResult,
    targetMode: 'my-car' | 'quote'
  ) => void;
  currency: string;
}

const SAMPLE_PLATES = [
  { reg: 'CJ72 KNO', label: '2023 Volvo C40 Recharge Twin' },
  { reg: 'KN21 ZCZ', label: '2021 Volvo XC90 R-Design' },
  { reg: 'LG21 WXY', label: '2021 BMW 3 Series' },
  { reg: 'SH72 VBN', label: '2022 Mercedes A-Class' },
  { reg: 'EA23 YTR', label: '2023 Tesla Model Y' },
  { reg: 'BD18 SVD', label: '2018 Ford Kuga' },
  { reg: 'VO24 KMR', label: '2024 Audi Q4 e-tron' },
];

export const RegLookupBar: React.FC<Props> = ({
  onVehicleFound,
  currency,
}) => {
  const [regInput, setRegInput] = useState('KN21 ZCZ');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] =
    useState<VehicleRegLookupResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleLookup = async (plateToQuery?: string) => {
    const target = plateToQuery || regInput;
    if (!target.trim()) return;

    setIsLoading(true);
    setError(null);
    setIsEditing(false);

    try {
      const res = await fetch('/api/lookup-reg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg: target }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to lookup registration');
      }

      const data: VehicleRegLookupResult = await res.json();
      setLookupResult(data);
      setRegInput(data.reg_number);
    } catch (e: any) {
      setError(e.message || 'Could not fetch vehicle details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = (plate: string) => {
    setRegInput(plate);
    handleLookup(plate);
  };

  const handleFieldChange = (field: keyof VehicleRegLookupResult, value: any) => {
    if (!lookupResult) return;
    const updated = { ...lookupResult, [field]: value };
    if (field === 'make' || field === 'model' || field === 'trim' || field === 'year') {
      updated.full_car_name = `${updated.year} ${updated.make} ${updated.model} ${updated.trim}`;
    }
    setLookupResult(updated);
  };

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-xl p-5 backdrop-blur-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Registration Number Plate Lookup
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                UK & Global Plates
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Enter your vehicle registration to automatically extract model, year, and estimated trade-in value
            </p>
          </div>
        </div>
      </div>

      {/* Reg Input & Plate Box */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Visual Registration Plate Styling */}
        <div className="relative flex items-center rounded-xl bg-amber-400 text-black border-2 border-slate-900 shadow-md font-mono font-black overflow-hidden tracking-wider text-sm sm:text-base min-w-[280px] sm:min-w-[320px]">
          {/* Blue Euro/UK strip on left */}
          <div className="bg-blue-800 text-white flex flex-col items-center justify-between py-1.5 px-2.5 h-full self-stretch shrink-0 border-r border-black/20">
            <span className="text-[9px] font-bold text-yellow-300 leading-none">★</span>
            <span className="text-[10px] font-extrabold tracking-widest leading-none mt-1">UK</span>
          </div>

          <input
            type="text"
            value={regInput}
            onChange={(e) => setRegInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            placeholder="ENTER REG (e.g. LG21 WXY)"
            className="w-full bg-transparent px-3 py-2.5 text-black placeholder:text-black/40 font-bold uppercase tracking-widest focus:outline-none text-center font-mono"
            maxLength={10}
          />
        </div>

        <button
          onClick={() => handleLookup()}
          disabled={isLoading || !regInput.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Fetching DVLA Specs...</span>
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>Fetch Vehicle Details</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Test Reg Plates */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-slate-400 shrink-0 font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Try Sample Reg:
        </span>
        {SAMPLE_PLATES.map((sample) => (
          <button
            key={sample.reg}
            onClick={() => handleApplyPreset(sample.reg)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition text-[11px] font-mono shrink-0"
          >
            <span className="text-amber-400 font-bold">{sample.reg}</span>
            <span className="text-slate-500 font-sans">({sample.label})</span>
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Fetched Details Card */}
      {lookupResult && (
        <div className="mt-3 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-slate-950 via-indigo-950/20 to-slate-950 p-4 space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-400 text-black">
                  {lookupResult.reg_number}
                </span>
                <span className="text-xs text-indigo-400 font-semibold">
                  {lookupResult.year} Registration
                </span>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800 transition"
                >
                  <Edit2 className="w-3 h-3 text-indigo-400" />
                  <span>{isEditing ? 'Done' : 'Edit Specs'}</span>
                </button>
              </div>

              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={lookupResult.full_car_name}
                    onChange={(e) => handleFieldChange('full_car_name', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold w-full max-w-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Full vehicle name"
                  />
                </div>
              ) : (
                <div>
                  <h4 className="text-base font-bold text-white mt-1">
                    {lookupResult.full_car_name}
                  </h4>
                  {lookupResult.verified_source && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-0.5 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{lookupResult.verified_source}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-right self-start sm:self-auto bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Estimated Trade-in Value
              </span>
              {isEditing ? (
                <div className="flex items-center gap-1 justify-end mt-1">
                  <span className="text-xs text-slate-400">{currency}</span>
                  <input
                    type="number"
                    value={lookupResult.estimated_value}
                    onChange={(e) => handleFieldChange('estimated_value', parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold text-sm text-right focus:outline-none"
                  />
                </div>
              ) : (
                <span className="text-lg font-extrabold text-emerald-400 font-mono">
                  {formatMoney(lookupResult.estimated_value, currency)}
                </span>
              )}
            </div>
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
              <span className="text-slate-500 block text-[10px]">Fuel & Engine</span>
              {isEditing ? (
                <input
                  type="text"
                  value={lookupResult.engine_size}
                  onChange={(e) => handleFieldChange('engine_size', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200 mt-0.5"
                />
              ) : (
                <span className="text-slate-200 font-medium truncate block">
                  {lookupResult.fuel_type} • {lookupResult.engine_size}
                </span>
              )}
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
              <span className="text-slate-500 block text-[10px]">Transmission</span>
              {isEditing ? (
                <input
                  type="text"
                  value={lookupResult.transmission}
                  onChange={(e) => handleFieldChange('transmission', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200 mt-0.5"
                />
              ) : (
                <span className="text-slate-200 font-medium">
                  {lookupResult.transmission}
                </span>
              )}
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
              <span className="text-slate-500 block text-[10px]">Color</span>
              {isEditing ? (
                <input
                  type="text"
                  value={lookupResult.color}
                  onChange={(e) => handleFieldChange('color', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200 mt-0.5"
                />
              ) : (
                <span className="text-slate-200 font-medium">
                  {lookupResult.color}
                </span>
              )}
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
              <span className="text-slate-500 block text-[10px]">Original MSRP</span>
              <span className="text-slate-200 font-mono">
                {formatMoney(lookupResult.estimated_original_msrp, currency)}
              </span>
            </div>
          </div>

          {/* Action buttons to apply to deal */}
          <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => onVehicleFound(lookupResult, 'my-car')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow cursor-pointer"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Set as My Current Car</span>
            </button>
            <button
              onClick={() => onVehicleFound(lookupResult, 'quote')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer"
            >
              <span>Create Quote for this Car</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
