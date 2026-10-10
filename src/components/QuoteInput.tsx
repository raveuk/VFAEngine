import React, { useState, useRef } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Upload,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Car,
} from 'lucide-react';
import { SAMPLE_PRESETS, getLocalizedPresets, formatVerdictCurrency } from '../utils/finance';
import { QuotePreset } from '../types/finance';

interface Props {
  onAnalyze: (text: string, image?: string, mimeType?: string) => Promise<void>;
  isLoading: boolean;
  onSelectPresetDirect: (preset: QuotePreset) => void;
  currency: string;
}

export const QuoteInput: React.FC<Props> = ({
  onAnalyze,
  isLoading,
  onSelectPresetDirect,
  currency,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'reg'>('text');
  const [inputText, setInputText] = useState(() => formatVerdictCurrency(SAMPLE_PRESETS[0].text, currency));
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reg Lookup State in QuoteInput
  const [regPlateInput, setRegPlateInput] = useState('KN21 ZCZ');
  const [isFetchingReg, setIsFetchingReg] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [fetchedCar, setFetchedCar] = useState<any | null>(null);

  const handleLookupRegForQuote = async (plateToQuery?: string) => {
    const target = (plateToQuery || regPlateInput).trim();
    if (!target) return;
    setIsFetchingReg(true);
    setRegError(null);
    try {
      const res = await fetch('/api/lookup-reg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg: target }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to lookup plate');
      }
      const data = await res.json();
      setFetchedCar(data);
      setRegPlateInput(data.reg_number);

      // Auto-generate realistic quote finance text for this vehicle
      const advance = Math.round((data.estimated_original_msrp || data.estimated_value * 1.5) * 0.85 * 100) / 100;
      const deposit = Math.round((data.estimated_original_msrp || data.estimated_value * 1.5) * 0.15 * 100) / 100;
      const balloon = Math.round(advance * 0.4 * 100) / 100;
      const apr = 8.9;
      const term = 48;
      const monthly = Math.round((((advance * (1 + (apr / 100) * (term / 12))) - balloon) / term) * 100) / 100;

      const generatedQuoteText = `Vehicle: ${data.full_car_name} (${data.reg_number})
Registration Plate: ${data.reg_number}
Engine: ${data.engine_size} • Fuel: ${data.fuel_type} • Transmission: ${data.transmission} • Color: ${data.color}
Vehicle Cash Price: ${currency}${(advance + deposit).toLocaleString()}
Customer Cash Deposit: ${currency}${deposit.toLocaleString()}
Advance (Amount Financed): ${currency}${advance.toLocaleString()}
Duration / Term: ${term} months
Monthly Payment: ${currency}${monthly.toFixed(2)}
Optional Final Payment (Balloon / GFV): ${currency}${balloon.toLocaleString()}
Contract APR: ${apr}%
Annual Mileage Allowance: 10,000 miles
Trade-in Equity Deficit: ${currency}0.00
Deposit Contribution / Bonus: ${currency}500.00`;

      setInputText(generatedQuoteText);
    } catch (e: any) {
      setRegError(e.message || 'Plate lookup failed');
    } finally {
      setIsFetchingReg(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImagePreview(result);
      setActiveTab('image');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'image' && imagePreview) {
      onAnalyze(inputText, imagePreview, imageMime);
    } else {
      if (!inputText.trim()) return;
      onAnalyze(inputText.trim());
    }
  };

  const handleSelectPreset = (preset: QuotePreset) => {
    const formattedText = formatVerdictCurrency(preset.text, currency);
    setInputText(formattedText);
    setImagePreview(null);
    setActiveTab('text');
    onSelectPresetDirect({
      ...preset,
      text: formattedText,
    });
  };

  const handleClear = () => {
    setInputText('');
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-xl p-5 md:p-6 backdrop-blur-md">
      {/* Tab Switcher & Presets Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80 w-fit flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'text'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste Quote / Email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'image'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Upload Quote Image
            {imagePreview && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reg')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'reg'
                ? 'bg-amber-400 text-black font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="font-mono font-black text-[9px] bg-blue-800 text-white px-1 rounded-sm">UK</span>
            Lookup by Reg Plate
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded transition hover:bg-slate-800"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Preset Quick Loader Buttons */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Load Real-World Quote Scenarios:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {getLocalizedPresets(currency).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-slate-800/80 hover:border-slate-700 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 truncate">
                    {preset.title}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold border ${preset.badgeColor}`}
                  >
                    {preset.badge}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1">
                  {preset.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tab 1: Textarea */}
        {activeTab === 'text' && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Paste Dealer Email, Lease Offer, or PCP/HP Finance Breakdown Table
            </label>
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`e.g. PCP Quote Option: Cash price ${currency}44,500, deposit ${currency}4,500, 48 payments of ${currency}685.20, balloon ${currency}18,450, 9.9% APR...`}
              className="w-full px-3.5 py-3 rounded-xl bg-slate-950/90 border border-slate-700/80 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-600 transition resize-y leading-relaxed"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Paste raw emails, dealer printout text, or quote tables. The engine will extract the Advance, Term, Monthly Payment, Balloon, APR, Mileage, and Deficit.
            </p>
          </div>
        )}

        {/* Tab 2: Image Upload */}
        {activeTab === 'image' && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Upload Photo or Screenshot of Finance Worksheet / Window Sticker / Dealer Quote
            </label>

            {!imagePreview ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-indigo-400 bg-indigo-500/10'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
                }`}
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <Upload className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  Click to browse or drag and drop quote image
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports PNG, JPG, WEBP screenshots of dealer quotes
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative rounded-xl border border-slate-700 overflow-hidden bg-slate-950 p-3 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={imagePreview}
                  alt="Quote Document Preview"
                  className="max-h-48 rounded-lg object-contain border border-slate-800 bg-black/50"
                />
                <div className="flex-1 space-y-2 text-left">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    Quote image loaded & ready for multimodal OCR extraction
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Gemini 3.8 Flash will transcribe the printed numbers, finance tables, APR, and residual value directly from the image.
                  </p>
                  {inputText && (
                    <div className="text-[11px] text-indigo-300 bg-indigo-950/30 p-2 rounded border border-indigo-800/40">
                      Optional context note attached: "{inputText.slice(0, 80)}..."
                    </div>
                  )}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20"
                    >
                      <X className="w-3.5 h-3.5" /> Remove Image
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Registration Plate Lookup */}
        {activeTab === 'reg' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Lookup by Reg Number Plate (Optional)
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex items-center rounded-xl bg-amber-400 text-black border-2 border-slate-900 shadow-md font-mono font-black overflow-hidden tracking-wider text-sm min-w-[240px]">
                  <div className="bg-blue-800 text-white flex flex-col items-center justify-center py-2 px-2.5 h-full self-stretch shrink-0 border-r border-black/20">
                    <span className="text-[9px] font-bold text-yellow-300 leading-none">★</span>
                    <span className="text-[10px] font-extrabold tracking-widest leading-none mt-1">UK</span>
                  </div>
                  <input
                    type="text"
                    value={regPlateInput}
                    onChange={(e) => setRegPlateInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleLookupRegForQuote())}
                    placeholder="e.g. KN21 ZCZ"
                    className="w-full bg-transparent px-3 py-2 text-black placeholder:text-black/40 font-bold uppercase tracking-widest focus:outline-none text-center font-mono"
                    maxLength={10}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleLookupRegForQuote()}
                  disabled={isFetchingReg || !regPlateInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-1.5 shadow"
                >
                  {isFetchingReg ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Fetching Specs...</span>
                    </>
                  ) : (
                    <span>Fetch Vehicle Specs</span>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Sample Reg Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-slate-400 shrink-0 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Samples:
              </span>
              {[
                { reg: 'CJ72 KNO', label: 'Volvo C40 Recharge' },
                { reg: 'KN21 ZCZ', label: 'Volvo XC90' },
                { reg: 'LG21 WXY', label: 'BMW 320d' },
                { reg: 'SH72 VBN', label: 'Mercedes A200' },
                { reg: 'EA23 YTR', label: 'Tesla Model Y' },
                { reg: 'BD18 SVD', label: 'Ford Kuga' },
              ].map((s) => (
                <button
                  key={s.reg}
                  type="button"
                  onClick={() => {
                    setRegPlateInput(s.reg);
                    handleLookupRegForQuote(s.reg);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-mono shrink-0 transition"
                >
                  <span className="text-amber-400 font-bold mr-1">{s.reg}</span>
                  <span className="text-slate-500 font-sans">({s.label})</span>
                </button>
              ))}
            </div>

            {regError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                {regError}
              </div>
            )}

            {/* Preview of Generated Quote Data */}
            {fetchedCar && (
              <div className="p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/20 space-y-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-400 text-black">
                      {fetchedCar.reg_number}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {fetchedCar.full_car_name}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold font-mono">
                    Est. Value: {currency}{fetchedCar.estimated_value?.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                    <span className="text-slate-500 block text-[10px]">Engine & Fuel</span>
                    <span className="text-slate-200 font-medium truncate block">
                      {fetchedCar.engine_size} • {fetchedCar.fuel_type}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                    <span className="text-slate-500 block text-[10px]">Transmission</span>
                    <span className="text-slate-200 font-medium block">
                      {fetchedCar.transmission}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                    <span className="text-slate-500 block text-[10px]">Color</span>
                    <span className="text-slate-200 font-medium block">
                      {fetchedCar.color}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                    <span className="text-slate-500 block text-[10px]">Source</span>
                    <span className="text-emerald-400 font-medium block text-[11px] truncate">
                      {fetchedCar.verified_source || 'UK DVLA Registry'}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Generated Quote Breakdown (Ready to Analyze or Tweak):
                  </label>
                  <textarea
                    rows={5}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-indigo-500 resize-y"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-indigo-400" />
            Automatic OCR & strict mathematical verification
          </div>

          <button
            type="submit"
            disabled={isLoading || (activeTab === 'text' && !inputText.trim()) || (activeTab === 'image' && !imagePreview && !inputText.trim())}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Extracting & Calculating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Finance Analysis Engine</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
