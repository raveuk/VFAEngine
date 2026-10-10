import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Trophy,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Percent,
  Settings,
  KeyRound,
  Eye,
  EyeOff,
  X,
  Check,
  SlidersHorizontal,
  Bot,
  Scale,
  Brain,
  Fuel,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { FinanceComparisonObject, AIRunningCostAnalysis } from '../types/finance';

export interface AISwitchReasoning {
  verdict_title: string;
  verdict_badge?: string;
  monthly_impact: string;
  trade_in_impact?: string;
  dead_money_impact: string;
  detailed_financial_logic: string;
  recommendation: string;
}

interface AIExplanationResult {
  summary: string;
  winner_name?: string;
  winner_reason?: string;
  switch_reasoning?: AISwitchReasoning;
  running_cost_analysis?: AIRunningCostAnalysis;
  rate_insights?: string;
  traps_to_avoid?: string;
  vt_comparison?: string;
  actionable_advice?: string;
  answer_to_question?: string;
}

interface Props {
  deals: FinanceComparisonObject[];
  currency: string;
  activeDeal?: FinanceComparisonObject;
}

export const AIComparisonExplainer: React.FC<Props> = ({
  deals,
  currency,
}) => {
  const [explanation, setExplanation] = useState<AIExplanationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<string>('');
  const [activeQuestion, setActiveQuestion] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Settings State initialized from localStorage
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('ai_advisor_custom_key') || '';
  });
  const [showKeyText, setShowKeyText] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const saved = localStorage.getItem('ai_advisor_model');
    if (!saved || saved === 'gemini-2.5-flash' || saved === 'gemini-2.5-flash-lite') {
      return 'gemini-3.1-flash-lite';
    }
    return saved;
  });
  const [persona, setPersona] = useState<string>(() => {
    return localStorage.getItem('ai_advisor_persona') || 'Expert UK Car Finance Advisor';
  });
  const [analysisFocus, setAnalysisFocus] = useState<string>(() => {
    return localStorage.getItem('ai_advisor_focus') || 'Total Dead Money & Contract APR vs Flat Rate';
  });

  const [settingsSavedMessage, setSettingsSavedMessage] = useState<boolean>(false);

  const fetchAIExplanation = async (userQuery = '') => {
    if (deals.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const storedKey = localStorage.getItem('ai_advisor_custom_key') || customApiKey || '';
      const storedModel = localStorage.getItem('ai_advisor_model') || selectedModel;
      const storedPersona = localStorage.getItem('ai_advisor_persona') || persona;
      const storedFocus = localStorage.getItem('ai_advisor_focus') || analysisFocus;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (storedKey.trim()) {
        headers['x-user-api-key'] = storedKey.trim();
      }

      const res = await fetch('/api/ai-explain', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          deals,
          currency,
          question: userQuery,
          customApiKey: storedKey.trim(),
          selectedModel: storedModel,
          persona: storedPersona,
          analysisFocus: storedFocus,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate AI explanation');
      }

      const data = await res.json();
      setExplanation(data);
      if (userQuery) {
        setActiveQuestion(userQuery);
      }
    } catch (err: any) {
      console.error('Error fetching AI explanation:', err);
      setError('AI model connection busy or key invalid. You can set a custom API key in Settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (deals.length > 0) {
      fetchAIExplanation();
    }
  }, [deals.length, currency]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ai_advisor_custom_key', customApiKey.trim());
    localStorage.setItem('ai_advisor_model', selectedModel);
    localStorage.setItem('ai_advisor_persona', persona);
    localStorage.setItem('ai_advisor_focus', analysisFocus);

    setSettingsSavedMessage(true);
    setTimeout(() => setSettingsSavedMessage(false), 2500);
    setShowSettingsModal(false);

    // Re-trigger analysis with updated model/key/persona settings
    fetchAIExplanation(question);
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    fetchAIExplanation(question.trim());
  };

  const PRESET_QUESTIONS = [
    'How sure can I be that the C40 is not expensive to run compared to my car?',
    'Why does switching from my XC90 to C40 cost more or less overall?',
    'Break down the exact running cost savings (fuel/electricity, VED tax, servicing) for C40.',
    'Break down the exact cost of rolling my £2,731 negative equity into the new loan.',
  ];

  if (deals.length === 0) return null;

  const isCustomKeyActive = Boolean(customApiKey.trim());

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 p-5 shadow-2xl backdrop-blur-md space-y-5 relative">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">
                AI Intelligent Plain-English Advisor
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Bot className="w-3 h-3 text-indigo-400" />
                {selectedModel.replace('-flash', '')}
              </span>
              {isCustomKeyActive ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-emerald-400" />
                  Custom Key Active
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                  Built-In Key
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Instant plain-English comparison summaries, flat rate vs APR insights, and trap alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Settings / Custom API Key Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition"
            title="Configure LLM API Key, Model & Persona"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Setup</span>
          </button>

          <button
            onClick={() => fetchAIExplanation(question)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Refresh AI Summary'}</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-1 border-t border-slate-800/80">
          {error && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="underline font-semibold hover:text-white text-indigo-300"
                >
                  Set Custom Key
                </button>
                <span>•</span>
                <button
                  onClick={() => fetchAIExplanation()}
                  className="underline font-semibold hover:text-white"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {isLoading && !explanation && (
            <div className="py-8 text-center space-y-3">
              <div className="inline-block p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <Sparkles className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
              <p className="text-xs font-medium text-indigo-300">
                Synthesizing plain-English comparison breakdown using {selectedModel}...
              </p>
            </div>
          )}

          {explanation && (
            <div className="space-y-4">
              {/* Executive Plain English Summary */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Executive AI Summary ({persona})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Focus: {analysisFocus.split('&')[0]}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {explanation.summary}
                </p>
              </div>

              {/* My Car vs Quote Switch Decision & Reasoning Hero Card */}
              {explanation.switch_reasoning && (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 space-y-3.5 shadow-lg">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                          My Car vs Quote Decision Reasoning
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          {explanation.switch_reasoning.verdict_title}
                        </h4>
                      </div>
                    </div>
                    {explanation.switch_reasoning.verdict_badge && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                        {explanation.switch_reasoning.verdict_badge}
                      </span>
                    )}
                  </div>

                  {/* Impact Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-0.5">
                      <span className="text-slate-400 text-[10px] font-medium block">Monthly Impact</span>
                      <span className="text-slate-200 font-semibold">{explanation.switch_reasoning.monthly_impact}</span>
                    </div>
                    {explanation.switch_reasoning.trade_in_impact && (
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-0.5">
                        <span className="text-slate-400 text-[10px] font-medium block">Trade-in Shortfall</span>
                        <span className="text-rose-300 font-semibold">{explanation.switch_reasoning.trade_in_impact}</span>
                      </div>
                    )}
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-0.5">
                      <span className="text-slate-400 text-[10px] font-medium block">Total Dead Money Shift</span>
                      <span className="text-amber-300 font-semibold">{explanation.switch_reasoning.dead_money_impact}</span>
                    </div>
                  </div>

                  {/* Deep Financial Reasoning */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1">
                      <Brain className="w-3 h-3 text-indigo-400" />
                      Financial Logic & Reasoning
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {explanation.switch_reasoning.detailed_financial_logic}
                    </p>
                  </div>

                  {/* Advisor Recommendation */}
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2 text-xs">
                    <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-300 block">Advisor Recommendation:</span>
                      <span className="text-slate-200">{explanation.switch_reasoning.recommendation}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Running Costs & Total Cost of Ownership (TCO) Confidence Matrix */}
              {explanation.running_cost_analysis && (
                <div className="p-4 rounded-xl border border-teal-500/40 bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400">
                          Running Cost & TCO Confidence Matrix
                        </span>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          {explanation.running_cost_analysis.monthly_running_savings > 0 ? (
                            <span className="text-emerald-400">
                              Saves {currency}{explanation.running_cost_analysis.monthly_running_savings}/mo in Running Costs
                            </span>
                          ) : (
                            <span className="text-amber-400">
                              Costs {currency}{Math.abs(explanation.running_cost_analysis.monthly_running_savings)}/mo More in Running
                            </span>
                          )}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-teal-400" />
                        {explanation.running_cost_analysis.confidence_score_percent}% {explanation.running_cost_analysis.confidence_level}
                      </span>
                    </div>
                  </div>

                  {/* Running Cost Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-0.5">
                      <span className="text-slate-400 text-[10px] font-medium block">Current Car Running</span>
                      <span className="text-slate-200 font-semibold">{currency}{explanation.running_cost_analysis.my_car_monthly_running}/mo</span>
                      <span className="text-[9px] text-slate-500 block">Fuel, Tax & Servicing</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-0.5">
                      <span className="text-slate-400 text-[10px] font-medium block">New Quote Running</span>
                      <span className="text-teal-300 font-semibold">{currency}{explanation.running_cost_analysis.quote_monthly_running}/mo</span>
                      <span className="text-[9px] text-teal-500/80 block">Electricity / Energy & Tax</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-0.5">
                      <span className="text-slate-400 text-[10px] font-medium block">Monthly Running Savings</span>
                      <span className="text-emerald-300 font-bold">
                        {explanation.running_cost_analysis.monthly_running_savings >= 0
                          ? `+${currency}${explanation.running_cost_analysis.monthly_running_savings}/mo`
                          : `-${currency}${Math.abs(explanation.running_cost_analysis.monthly_running_savings)}/mo`}
                      </span>
                      <span className="text-[9px] text-emerald-500/80 block">{currency}{explanation.running_cost_analysis.monthly_running_savings * 12}/year</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-0.5">
                      <span className="text-slate-400 text-[10px] font-medium block">Net Monthly TCO Diff</span>
                      <span className="text-indigo-300 font-bold">
                        {explanation.running_cost_analysis.net_monthly_tco_difference <= 0
                          ? `${currency}${Math.abs(explanation.running_cost_analysis.net_monthly_tco_difference)}/mo CHEAPER`
                          : `+${currency}${explanation.running_cost_analysis.net_monthly_tco_difference}/mo HIGHER`}
                      </span>
                      <span className="text-[9px] text-indigo-400/80 block">Finance + Running Combined</span>
                    </div>
                  </div>

                  {/* Charging & Assumptions Banner */}
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-[11px] font-medium">{explanation.running_cost_analysis.charging_assumption}</span>
                  </div>

                  {/* Detailed Explanation Text */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-teal-300 flex items-center gap-1">
                      <Brain className="w-3 h-3 text-teal-400" />
                      Running Cost Certainty Breakdown
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {explanation.running_cost_analysis.explanation_text}
                    </p>
                    {explanation.running_cost_analysis.key_factors && explanation.running_cost_analysis.key_factors.length > 0 && (
                      <ul className="mt-2 space-y-1 pl-1">
                        {explanation.running_cost_analysis.key_factors.map((factor, idx) => (
                          <li key={idx} className="text-[11px] text-teal-200/90 flex items-start gap-1.5">
                            <span className="text-teal-400 font-bold">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Specific Question Answer Block if present */}
              {explanation.answer_to_question && (
                <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold">
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                    <span>Answer to: "{activeQuestion}"</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {explanation.answer_to_question}
                  </p>
                </div>
              )}

              {/* Grid of Key AI Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Best Deal Winner */}
                {explanation.winner_name && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <Trophy className="w-4 h-4" />
                      <span>Recommended Best Value</span>
                    </div>
                    <div className="text-xs font-semibold text-white">
                      {explanation.winner_name}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      {explanation.winner_reason}
                    </p>
                  </div>
                )}

                {/* Flat Rate vs APR Plain English */}
                {explanation.rate_insights && (
                  <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                      <Percent className="w-4 h-4" />
                      <span>Flat Rate vs Contract APR Explained</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      {explanation.rate_insights}
                    </p>
                  </div>
                )}

                {/* Traps & Warnings */}
                {explanation.traps_to_avoid && (
                  <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Financial Traps & Risk Alerts</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      {explanation.traps_to_avoid}
                    </p>
                  </div>
                )}

                {/* Voluntary Termination 50% Protection */}
                {explanation.vt_comparison && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1.5">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Voluntary Termination Protection</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      {explanation.vt_comparison}
                    </p>
                  </div>
                )}
              </div>

              {/* Actionable Advice */}
              {explanation.actionable_advice && (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                      Next Negotiation Step
                    </span>
                    <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                      {explanation.actionable_advice}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive "Ask AI Advisor" Box */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              Ask AI Advisor a specific question in plain English:
            </span>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_QUESTIONS.map((pq, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(pq);
                    fetchAIExplanation(pq);
                  }}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-[11px] text-slate-300 hover:text-white border border-slate-700/80 transition text-left"
                >
                  "{pq}"
                </button>
              ))}
            </div>

            <form onSubmit={handleAskQuestion} className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask e.g. Is 6.7% flat rate better than my XC90? or Which deal is best if I keep 3 years?"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
              />
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shrink-0"
              >
                <span>Ask AI</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI SETUP & LLM API KEY MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">AI Advisor Setup & API Key</h4>
                  <p className="text-[11px] text-slate-400">
                    Configure LLM key, model preference & advisor persona
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSettings} className="p-5 space-y-4 overflow-y-auto">
              {/* Custom API Key Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    Custom Gemini / LLM API Key
                  </label>
                  <span className="text-[10px] text-slate-400">Optional</span>
                </div>
                <div className="relative">
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="AIzaSy... (Leave empty for default system key)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
                  >
                    {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  You can enter your personal Google Gemini API key here. Any user can provide their own key to power AI summaries. If empty, the app defaults to the built-in AI Studio key or math engine.
                </p>
              </div>

              {/* Model Choice */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  Select LLM Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Recommended - High Free-Tier Quota & Fast)</option>
                  <option value="gemini-flash-latest">Gemini Flash (Latest Version)</option>
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Preview - Low 20 req/day limit)</option>
                </select>
              </div>

              {/* Advisor Persona */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                  Advisor Tone / Persona
                </label>
                <select
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Expert UK Car Finance Advisor">🇬🇧 Expert UK Car Finance Advisor (Balanced & Clear)</option>
                  <option value="Strict Financial Auditor">⚖️ Strict Financial Auditor (Unforgiving on interest traps & balloon risk)</option>
                  <option value="Plain-English Consumer Friend">💬 Plain-English Consumer Friend (Simple analogies, zero jargon)</option>
                  <option value="Aggressive Dealer Negotiator">⚡ Aggressive Dealer Negotiator (Provides counter-offer scripts)</option>
                </select>
              </div>

              {/* Primary Analysis Focus */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-amber-400" />
                  Primary Analysis Focus
                </label>
                <select
                  value={analysisFocus}
                  onChange={(e) => setAnalysisFocus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Total Dead Money & Contract APR vs Flat Rate">Total Dead Money & Contract APR vs Flat Rate</option>
                  <option value="50% Voluntary Termination Safety & Early Exit">50% Voluntary Termination Safety & Early Exit</option>
                  <option value="Monthly Budget & Cash Flow Protection">Monthly Budget & Cash Flow Protection</option>
                </select>
              </div>

              {/* Status summary box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Current Setup Overview
                </div>
                <div>• Key Source: {isCustomKeyActive ? 'User Custom API Key' : 'Built-in AI Studio Key / Math Proxy'}</div>
                <div>• Model: {selectedModel}</div>
                <div>• Tone: {persona}</div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save & Apply Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
