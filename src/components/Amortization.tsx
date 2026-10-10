import React, { useState, useMemo } from 'react';
import {
  Calendar,
  TrendingDown,
  Percent,
  ShieldCheck,
  Download,
  Filter,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  DollarSign,
  PieChart,
  BarChart3,
  HelpCircle,
  Table as TableIcon,
} from 'lucide-react';
import { FinanceComparisonObject } from '../types/finance';
import { formatMoney, calculateAmortizationSchedule } from '../utils/finance';

interface Props {
  data: FinanceComparisonObject;
  currency: string;
}

export const Amortization: React.FC<Props> = ({ data, currency }) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly' | 'vt-milestone'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Compute full monthly schedule
  const schedule = useMemo(() => calculateAmortizationSchedule(data), [data]);

  // Aggregate yearly schedule
  const yearlySchedule = useMemo(() => {
    const years: {
      year: number;
      startMonth: number;
      endMonth: number;
      totalPayments: number;
      totalPrincipal: number;
      totalInterest: number;
      endBalance: number;
      isVtReachedInYear: boolean;
    }[] = [];

    const totalYears = Math.ceil(schedule.length / 12);

    for (let y = 1; y <= totalYears; y++) {
      const startIdx = (y - 1) * 12;
      const endIdx = Math.min(y * 12, schedule.length);
      const monthsInYear = schedule.slice(startIdx, endIdx);

      if (monthsInYear.length === 0) continue;

      const totalPayments = monthsInYear.reduce((acc, m) => acc + m.payment, 0);
      const totalPrincipal = monthsInYear.reduce((acc, m) => acc + m.principal_paid, 0);
      const totalInterest = monthsInYear.reduce((acc, m) => acc + m.interest_charged, 0);
      const endBalance = monthsInYear[monthsInYear.length - 1].closing_balance;
      const isVtReachedInYear = monthsInYear.some((m) => m.is_vt_eligible);

      years.push({
        year: y,
        startMonth: startIdx + 1,
        endMonth: endIdx,
        totalPayments: Math.round(totalPayments * 100) / 100,
        totalPrincipal: Math.round(totalPrincipal * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        endBalance,
        isVtReachedInYear,
      });
    }

    return years;
  }, [schedule]);

  // Max interest in a single month for chart scaling
  const maxMonthlyInterest = useMemo(() => {
    if (schedule.length === 0) return 1;
    return Math.max(...schedule.map((m) => m.interest_charged), 1);
  }, [schedule]);

  // Selected month detail
  const activeMonthData = useMemo(() => {
    if (selectedMonth === null) return schedule[0] || null;
    return schedule.find((m) => m.month === selectedMonth) || schedule[0] || null;
  }, [selectedMonth, schedule]);

  // Filter schedule based on search/filter query
  const filteredSchedule = useMemo(() => {
    if (!searchQuery.trim()) return schedule;
    const query = searchQuery.toLowerCase().trim();
    return schedule.filter((m) => {
      if (query === 'vt') return m.is_vt_eligible;
      if (query === 'pre-vt') return !m.is_vt_eligible;
      return m.month.toString().includes(query);
    });
  }, [schedule, searchQuery]);

  // Download CSV export handler
  const handleExportCSV = () => {
    if (schedule.length === 0) return;

    const headers = [
      'Month',
      'Opening Balance',
      'Monthly Payment',
      'Principal Paid',
      'Interest Charged',
      'Closing Balance',
      'Cumulative Principal',
      'Cumulative Interest',
      'Cumulative Total Paid',
      '50% VT Protection Status',
    ];

    const rows = schedule.map((m) => [
      m.month,
      m.opening_balance.toFixed(2),
      m.payment.toFixed(2),
      m.principal_paid.toFixed(2),
      m.interest_charged.toFixed(2),
      m.closing_balance.toFixed(2),
      m.cumulative_principal.toFixed(2),
      m.cumulative_interest.toFixed(2),
      m.cumulative_paid.toFixed(2),
      m.is_vt_eligible ? 'VT Protection Active' : 'Pre-VT',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeName = data.car_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('download', `amortization_schedule_${safeName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const vtMonth = data.vt_month || 0;
  const vtThreshold = data.vt_threshold_amount || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Vehicle Summary Header */}
      <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Loan Amortization Engine
              </span>
              {data.reg_number && (
                <span className="text-[10px] font-mono font-bold bg-amber-400 text-black px-2 py-0.5 rounded border border-black/40">
                  {data.reg_number}
                </span>
              )}
              {data.isMyCar && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ★ Baseline Car
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {data.car_name}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Month-by-month repayment trajectory decomposing regular payments into pure borrowed principal reduction versus lender interest charges across the full {data.term_months}-month term.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              title="Download full month-by-month amortization schedule as CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Schedule</span>
            </button>
          </div>
        </div>

        {/* 5 Key Metric Pillars */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Borrowed Advance</span>
            <span className="text-lg font-extrabold text-indigo-300 font-mono">
              {formatMoney(data.advance, currency)}
            </span>
            <span className="text-[10px] text-slate-500 block">Initial principal</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total Borrowing Interest</span>
            <span className="text-lg font-extrabold text-amber-300 font-mono">
              {formatMoney(data.total_interest, currency)}
            </span>
            <span className="text-[10px] text-slate-500 block">At {data.apr}% APR</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Monthly Installment</span>
            <span className="text-lg font-extrabold text-white font-mono">
              {formatMoney(data.monthly_payment, currency)}
            </span>
            <span className="text-[10px] text-slate-500 block">for {data.term_months} months</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-indigo-500/30 bg-indigo-950/20">
            <span className="text-indigo-300 block text-[11px] font-medium">50% VT Protection</span>
            <span className="text-lg font-extrabold text-emerald-400 font-mono">
              Month {vtMonth || '-'}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {formatMoney(vtThreshold, currency)} paid
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-slate-400 block text-[11px]">Balloon / GFV at Term End</span>
            <span className="text-lg font-extrabold text-slate-200 font-mono">
              {formatMoney(data.balloon, currency)}
            </span>
            <span className="text-[10px] text-slate-500 block">Final payment at M{data.term_months}</span>
          </div>
        </div>
      </div>

      {/* Visual Amortization Breakdown Chart */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Monthly Principal vs Interest Breakdown Chart
              </h3>
              <p className="text-[11px] text-slate-400">
                Interactive month-by-month payment composition (Hover or click any bar to inspect)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
              Principal
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
              Interest
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              50% VT Protection
            </span>
          </div>
        </div>

        {/* Stacked Bars Visualizer Container */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="h-44 flex items-end gap-1 sm:gap-1.5 overflow-x-auto pb-6 pt-4 px-1">
            {schedule.map((m) => {
              const total = m.payment || 1;
              const interestPct = (m.interest_charged / total) * 100;
              const principalPct = (m.principal_paid / total) * 100;
              const isSelected = activeMonthData?.month === m.month;
              const isVtMilestone = m.month === vtMonth;

              return (
                <div
                  key={m.month}
                  onClick={() => setSelectedMonth(m.month)}
                  className={`flex-1 min-w-[12px] max-w-[28px] h-full flex flex-col justify-end group cursor-pointer relative transition ${
                    isSelected ? 'scale-105' : 'opacity-85 hover:opacity-100'
                  }`}
                  title={`Month ${m.month}: Principal ${formatMoney(m.principal_paid, currency)}, Interest ${formatMoney(m.interest_charged, currency)}`}
                >
                  {/* VT Protection Milestone Marker */}
                  {isVtMilestone && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20 animate-pulse" />
                    </div>
                  )}

                  {/* Stacked bar segments */}
                  <div
                    className={`w-full rounded-t-sm overflow-hidden flex flex-col justify-end border transition ${
                      isSelected ? 'border-indigo-400 ring-2 ring-indigo-500/50' : 'border-transparent'
                    }`}
                  >
                    {/* Interest segment (Amber) */}
                    <div
                      style={{ height: `${Math.max(4, interestPct)}%` }}
                      className="bg-amber-500 hover:bg-amber-400 transition"
                    />
                    {/* Principal segment (Indigo) */}
                    <div
                      style={{ height: `${Math.max(4, principalPct)}%` }}
                      className="bg-indigo-600 hover:bg-indigo-500 transition"
                    />
                  </div>

                  {/* Month Label below bar */}
                  <span
                    className={`text-[9px] font-mono text-center block mt-1.5 transition ${
                      isSelected
                        ? 'text-indigo-300 font-bold'
                        : isVtMilestone
                        ? 'text-emerald-400 font-bold'
                        : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  >
                    M{m.month}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Active Month Detail Callout Card */}
          {activeMonthData && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-900/80 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
                  M{activeMonthData.month}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">
                      Month {activeMonthData.month} Payment Breakdown
                    </h4>
                    {activeMonthData.is_vt_eligible ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 50% VT Protection Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        Pre-VT Period
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Opening Balance: {formatMoney(activeMonthData.opening_balance, currency)} → Closing Balance: {formatMoney(activeMonthData.closing_balance, currency)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Payment</span>
                  <span className="font-bold text-white">
                    {formatMoney(activeMonthData.payment, currency)}
                  </span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-indigo-500/30">
                  <span className="text-[10px] text-indigo-300 block">Principal Paid</span>
                  <span className="font-bold text-indigo-300">
                    {formatMoney(activeMonthData.principal_paid, currency)}
                  </span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-amber-500/30">
                  <span className="text-[10px] text-amber-300 block">Interest Charged</span>
                  <span className="font-bold text-amber-300">
                    {formatMoney(activeMonthData.interest_charged, currency)}
                  </span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Cum. Interest</span>
                  <span className="font-bold text-slate-200">
                    {formatMoney(activeMonthData.cumulative_interest, currency)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Amortization Schedule View Controls & Filters */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Loan Repayment Schedule
              </h3>
              <p className="text-[11px] text-slate-400">
                Inspect month-by-month principal vs interest allocations and Voluntary Termination eligibility
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Segmented Controls */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  viewMode === 'monthly'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monthly Schedule ({schedule.length}m)
              </button>
              <button
                onClick={() => setViewMode('yearly')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  viewMode === 'yearly'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Yearly Summary ({yearlySchedule.length}y)
              </button>
              <button
                onClick={() => setViewMode('vt-milestone')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  viewMode === 'vt-milestone'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                50% VT Focus
              </button>
            </div>

            {/* Quick Filter Search input */}
            {viewMode === 'monthly' && (
              <input
                type="text"
                placeholder="Filter month / 'vt'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono w-36 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* View 1: Monthly Detailed Table */}
        {viewMode === 'monthly' && (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Month</th>
                  <th className="py-3 px-3">Opening Principal</th>
                  <th className="py-3 px-3">Monthly Payment</th>
                  <th className="py-3 px-3 text-indigo-300">Principal Paid</th>
                  <th className="py-3 px-3 text-amber-300">Interest Charged</th>
                  <th className="py-3 px-3">Closing Principal</th>
                  <th className="py-3 px-3">Cum. Interest</th>
                  <th className="py-3 px-3 text-right">50% VT Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredSchedule.map((m) => {
                  const isVtMilestone = m.month === vtMonth;
                  const isSelected = activeMonthData?.month === m.month;

                  return (
                    <tr
                      key={m.month}
                      onClick={() => setSelectedMonth(m.month)}
                      className={`transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/40 border-l-2 border-indigo-500'
                          : isVtMilestone
                          ? 'bg-emerald-950/20 border-l-2 border-emerald-500'
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-200">
                        <span className="inline-flex items-center gap-1">
                          M{m.month}
                          {isVtMilestone && (
                            <span className="text-[9px] font-sans font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                              50% VT Point
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {formatMoney(m.opening_balance, currency)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {formatMoney(m.payment, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-indigo-300 font-semibold">
                        {formatMoney(m.principal_paid, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-amber-300 font-semibold">
                        {formatMoney(m.interest_charged, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">
                        {formatMoney(m.closing_balance, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {formatMoney(m.cumulative_interest, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        {m.is_vt_eligible ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> VT Active
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">
                            Pre-50%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* View 2: Yearly Aggregated Table */}
        {viewMode === 'yearly' && (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Agreement Year</th>
                  <th className="py-3 px-3">Months Range</th>
                  <th className="py-3 px-3">Total Payments</th>
                  <th className="py-3 px-3 text-indigo-300">Total Principal Paid</th>
                  <th className="py-3 px-3 text-amber-300">Total Interest Charged</th>
                  <th className="py-3 px-3">Year-End Loan Balance</th>
                  <th className="py-3 px-3 text-right">VT Protection Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {yearlySchedule.map((y) => (
                  <tr key={y.year} className="hover:bg-slate-900/60 transition">
                    <td className="py-3 px-3 font-bold text-white font-sans text-sm">
                      Year {y.year}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      Month {y.startMonth} – Month {y.endMonth}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-200">
                      {formatMoney(y.totalPayments, currency)}
                    </td>
                    <td className="py-3 px-3 font-bold text-indigo-300">
                      {formatMoney(y.totalPrincipal, currency)}
                    </td>
                    <td className="py-3 px-3 font-bold text-amber-300">
                      {formatMoney(y.totalInterest, currency)}
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      {formatMoney(y.endBalance, currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      {y.isVtReachedInYear ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> VT Eligible
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          Pending VT Threshold
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View 3: 50% Voluntary Termination Focus */}
        {viewMode === 'vt-milestone' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 text-xs space-y-2">
              <h4 className="font-bold text-indigo-300 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Section 99 / 100 Consumer Credit Act 1974 Overview
              </h4>
              <p className="text-slate-300 leading-relaxed">
                Under UK law, once you have paid 50% of the Total Amount Payable ({formatMoney(vtThreshold, currency)}), you hold the unconditional right to terminate the finance agreement and return the car without penalty or further monthly payments.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-indigo-200 pt-1 font-mono font-semibold">
                <span>50% Threshold: {formatMoney(vtThreshold, currency)}</span>
                <span>•</span>
                <span>VT Activated at Month: {vtMonth || '-'}</span>
                <span>•</span>
                <span>Total Agreement Cost: {formatMoney(data.total_amount_payable || (data.advance + data.total_interest), currency)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pre-VT Months summary */}
              <div className="p-4 rounded-xl border border-amber-500/30 bg-slate-950/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                  Pre-VT Phase (Months 1 to {vtMonth ? vtMonth - 1 : data.term_months})
                </h4>
                <p className="text-xs text-slate-400">
                  During this phase, total cumulative payments remain below 50% of the Total Amount Payable. Standard termination charges would apply if ending early.
                </p>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Duration:</span>
                    <span>{vtMonth ? vtMonth - 1 : data.term_months} Months</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>Cumulative Payments:</span>
                    <span>{formatMoney(Math.max(0, vtThreshold - data.monthly_payment), currency)}</span>
                  </div>
                </div>
              </div>

              {/* Post-VT Protected Phase */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-slate-950/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Protected Phase (Month {vtMonth || '-'} to Month {data.term_months})
                </h4>
                <p className="text-xs text-slate-400">
                  From Month {vtMonth} onwards, you hold statutory Voluntary Termination rights. You can return the vehicle and walk away with zero remaining debt if market value drops below your remaining loan balance.
                </p>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Protected Duration:</span>
                    <span>{vtMonth ? data.term_months - vtMonth + 1 : 0} Months</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Cumulative Paid at VT Entry:</span>
                    <span>{formatMoney(vtThreshold, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
