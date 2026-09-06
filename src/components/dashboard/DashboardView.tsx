import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  PhoneCall,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Users,
  Layers,
  Filter,
  Mail,
  Send,
  Inbox
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import {
  calculateLifetimeMetrics,
  calculateDateScopedMetrics,
  calculateOutreachEmailMetrics,
  getDayBounds,
  getRunningMonthBounds
} from '../../lib/countingLogic';

export type DateFilterOption = 'running_month' | 'today' | 'yesterday' | 'week' | 'lifetime';

export const DashboardView: React.FC = () => {
  const { leads, activities } = useLeads();
  const now = useMemo(() => new Date(), []);
  const currentMonthInfo = useMemo(() => getRunningMonthBounds(now), [now]);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('running_month');

  // Calculate Lifetime Metrics (Single source of truth)
  const lifetimeMetrics = useMemo(() => {
    return calculateLifetimeMetrics(leads, activities);
  }, [leads, activities]);

  // Calculate Email & Follow-up Metrics (Today & Running Month)
  const outreachEmailMetrics = useMemo(() => {
    return calculateOutreachEmailMetrics(leads, now);
  }, [leads, now]);

  // Calculate Date-Scoped Metrics
  const scopedMetrics = useMemo(() => {
    if (dateFilter === 'lifetime') {
      return lifetimeMetrics;
    }

    if (dateFilter === 'running_month') {
      const { start, end } = currentMonthInfo;
      return calculateDateScopedMetrics(leads, activities, start, end);
    }

    if (dateFilter === 'today') {
      const { start, end } = getDayBounds(now);
      return calculateDateScopedMetrics(leads, activities, start, end);
    }

    if (dateFilter === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const { start, end } = getDayBounds(yest);
      return calculateDateScopedMetrics(leads, activities, start, end);
    }

    if (dateFilter === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(now);
      weekEnd.setHours(23, 59, 59, 999);
      return calculateDateScopedMetrics(leads, activities, weekStart, weekEnd);
    }

    return lifetimeMetrics;
  }, [dateFilter, leads, activities, now, currentMonthInfo, lifetimeMetrics]);

  // Conversion Rates
  const interestedToScheduledRate = useMemo(() => {
    if (lifetimeMetrics.totalInterested === 0) return 0;
    return Math.round((lifetimeMetrics.totalMeetingScheduled / lifetimeMetrics.totalInterested) * 100);
  }, [lifetimeMetrics]);

  const scheduledToCountRate = useMemo(() => {
    if (lifetimeMetrics.totalMeetingScheduled === 0) return 0;
    return Math.round((lifetimeMetrics.totalMeetingCount / lifetimeMetrics.totalMeetingScheduled) * 100);
  }, [lifetimeMetrics]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-[#1E3A5F]/70 p-4 rounded-xl shadow-lg">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <span>Sales & Lead Operations Dashboard</span>
          </h2>
          <p className="text-xs text-[#7B7B7B] mt-0.5">
            Single central source of truth for cumulative pipeline progression and monthly team velocity.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center space-x-1.5 bg-[#0A0A0A] p-1 rounded-lg border border-[#1E3A5F] text-xs flex-wrap gap-y-1">
          <button
            onClick={() => setDateFilter('running_month')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              dateFilter === 'running_month'
                ? 'bg-[#00E5A0] text-black font-semibold shadow-[0_0_12px_rgba(0,229,160,0.3)]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Running Month ({currentMonthInfo.monthName})
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              dateFilter === 'today'
                ? 'bg-[#00C2FF] text-black font-semibold shadow-[0_0_10px_rgba(0,194,255,0.25)]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateFilter('yesterday')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              dateFilter === 'yesterday'
                ? 'bg-[#00C2FF] text-black font-semibold shadow-[0_0_10px_rgba(0,194,255,0.25)]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setDateFilter('week')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              dateFilter === 'week'
                ? 'bg-[#00C2FF] text-black font-semibold shadow-[0_0_10px_rgba(0,194,255,0.25)]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setDateFilter('lifetime')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              dateFilter === 'lifetime'
                ? 'bg-[#1E3A5F] text-[#00C2FF] font-semibold border border-[#00C2FF]/40'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            All-Time History
          </button>
        </div>
      </div>

      {/* Running Month Confirmation Notice */}
      {dateFilter === 'running_month' && (
        <div className="p-3 bg-[#00E5A0]/10 border border-[#00E5A0]/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#00E5A0]">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#00E5A0] shrink-0" />
            <span className="font-medium">
              <strong>Running Month Active ({currentMonthInfo.monthName} {currentMonthInfo.year}):</strong> Metrics reflect leads and milestone outcomes updated during the current month.
            </span>
          </div>
          <span className="text-[11px] text-[#94A3B8] font-mono shrink-0">
            Historical leads from previous months are strictly excluded
          </span>
        </div>
      )}

      {/* Outreach Email & Follow-Up Counters (Today & Running Month) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#94A3B8]">
          <span className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-[#00C2FF]" />
            <span>Outreach Email & Follow-Up Velocity</span>
          </span>
          <span className="text-[11px] text-[#00C2FF] font-mono">
            Month: {currentMonthInfo.monthName} {currentMonthInfo.year}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Email Sent Today */}
          <div className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs">
              <span>Total Email Sent</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#00C2FF]/10 text-[#00C2FF] font-semibold border border-[#00C2FF]/30">
                Today
              </span>
            </div>
            <div className="text-3xl font-bold font-sans text-[#00E5A0] mt-2 font-mono">
              {outreachEmailMetrics.totalEmailSentToday}
            </div>
            <div className="text-[11px] text-[#7B7B7B] mt-1">
              Initial & Sequence Dispatches
            </div>
            <div className="absolute top-0 right-0 w-12 h-12 bg-[#00C2FF]/5 rounded-bl-full pointer-events-none" />
          </div>

          {/* Total Follow Up Email Sent Today */}
          <div className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs">
              <span>Follow Up Email Sent</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#A855F7]/10 text-[#A855F7] font-semibold border border-[#A855F7]/30">
                Today
              </span>
            </div>
            <div className="text-3xl font-bold font-sans text-[#A855F7] mt-2 font-mono">
              {outreachEmailMetrics.totalFollowUpEmailSentToday}
            </div>
            <div className="text-[11px] text-[#7B7B7B] mt-1">
              Interested Follow-ups (FW1/2/3)
            </div>
            <div className="absolute top-0 right-0 w-12 h-12 bg-[#A855F7]/5 rounded-bl-full pointer-events-none" />
          </div>

          {/* Total Email Sent (Running Month) */}
          <div className="p-4 bg-[#111827] border border-[#00E5A0]/40 rounded-xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs">
              <span className="text-white font-semibold">Total Email Sent</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#00E5A0]/20 text-[#00E5A0] font-bold border border-[#00E5A0]/40">
                Running Month
              </span>
            </div>
            <div className="text-3xl font-bold font-sans text-[#00E5A0] mt-2 font-mono">
              {outreachEmailMetrics.totalEmailSentMonth}
            </div>
            <div className="text-[11px] text-[#7B7B7B] mt-1">
              {currentMonthInfo.monthName} Monthly Outbound
            </div>
            <div className="absolute top-0 right-0 w-12 h-12 bg-[#00E5A0]/10 rounded-bl-full pointer-events-none" />
          </div>

          {/* Total Follow Up Sent (Running Month) */}
          <div className="p-4 bg-[#111827] border border-[#F97316]/40 rounded-xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-[#94A3B8] text-xs">
              <span className="text-white font-semibold">Total Follow Up Sent</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#F97316]/20 text-[#F97316] font-bold border border-[#F97316]/40">
                Running Month
              </span>
            </div>
            <div className="text-3xl font-bold font-sans text-[#F97316] mt-2 font-mono">
              {outreachEmailMetrics.totalFollowUpEmailSentMonth}
            </div>
            <div className="text-[11px] text-[#7B7B7B] mt-1">
              {currentMonthInfo.monthName} Nurture Dispatches
            </div>
            <div className="absolute top-0 right-0 w-12 h-12 bg-[#F97316]/10 rounded-bl-full pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Signal Green #00E5A0 for stats per brand kit) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* 1. Interested Leads */}
        <div className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs">
            <span>Interested (M1)</span>
            <span className="text-[10px] font-mono text-[#00C2FF]">Stage 1</span>
          </div>
          <div className="text-3xl font-bold font-sans text-[#00E5A0] mt-2 font-mono">
            {scopedMetrics.totalInterested}
          </div>
          <div className="text-[11px] text-[#7B7B7B] mt-1">
            Lifetime: <span className="font-mono text-white font-medium">{lifetimeMetrics.totalInterested}</span>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#00E5A0]/5 rounded-bl-full pointer-events-none" />
        </div>

        {/* 2. Meeting Scheduled */}
        <div className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs">
            <span>Meeting Scheduled</span>
            <span className="text-[10px] font-mono text-[#00C2FF]">Stage 2</span>
          </div>
          <div className="text-3xl font-bold font-sans text-[#00E5A0] mt-2 font-mono">
            {scopedMetrics.totalMeetingScheduled}
          </div>
          <div className="text-[11px] text-[#7B7B7B] mt-1">
            Lifetime: <span className="font-mono text-white font-medium">{lifetimeMetrics.totalMeetingScheduled}</span>
          </div>
        </div>

        {/* 3. Meeting Done */}
        <div className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs">
            <span>Meeting Done</span>
            <span className="text-[10px] font-mono text-[#00C2FF]">Stage 3</span>
          </div>
          <div className="text-3xl font-bold font-sans text-[#00E5A0] mt-2 font-mono">
            {scopedMetrics.totalMeetingDone}
          </div>
          <div className="text-[11px] text-[#7B7B7B] mt-1">
            Lifetime: <span className="font-mono text-white font-medium">{lifetimeMetrics.totalMeetingDone}</span>
          </div>
        </div>

        {/* 4. Meeting Count (YES ONLY) */}
        <div className="p-4 bg-[#111827] border border-[#00C2FF]/40 rounded-xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs">
            <span className="text-white font-semibold">Total Meeting Count</span>
            <span className="text-[10px] font-mono text-[#00E5A0]">Stage 4</span>
          </div>
          <div className="text-3xl font-bold font-sans text-[#00E5A0] mt-2 font-mono">
            {scopedMetrics.totalMeetingCount}
          </div>
          <div className="text-[11px] text-[#7B7B7B] mt-1">
            Lifetime: <span className="font-mono text-white font-medium">{lifetimeMetrics.totalMeetingCount}</span> (YES only)
          </div>
        </div>

        {/* 5. Pending YES */}
        <div className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-[#94A3B8] text-xs">
            <span>Pending Follow-ups</span>
            <span className="text-[10px] font-mono text-[#F97316]">Active</span>
          </div>
          <div className="text-3xl font-bold font-sans text-[#F97316] mt-2 font-mono">
            {scopedMetrics.pendingYes}
          </div>
          <div className="text-[11px] text-[#7B7B7B] mt-1">
            Independent Action State
          </div>
        </div>
      </div>

      {/* Secondary Velocity Metrics (WhatsApp, Calls, Outcomes) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3.5 bg-[#0E1522] border border-[#1E3A5F]/60 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00E5A0]/10 flex items-center justify-center text-[#00E5A0]">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-[#94A3B8]">WhatsApp (WP/WA)</div>
              <div className="text-lg font-bold text-white font-mono">{scopedMetrics.whatsappSent}</div>
            </div>
          </div>
          <span className="text-[10px] text-[#7B7B7B]">Lifetime: {lifetimeMetrics.whatsappSent}</span>
        </div>

        <div className="p-3.5 bg-[#0E1522] border border-[#1E3A5F]/60 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00C2FF]/10 flex items-center justify-center text-[#00C2FF]">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-[#94A3B8]">Calls Done</div>
              <div className="text-lg font-bold text-white font-mono">{scopedMetrics.callsDone}</div>
            </div>
          </div>
          <span className="text-[10px] text-[#7B7B7B]">Lifetime: {lifetimeMetrics.callsDone}</span>
        </div>

        <div className="p-3.5 bg-[#0E1522] border border-[#1E3A5F]/60 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-[#94A3B8]">Missed Meetings</div>
              <div className="text-lg font-bold text-white font-mono">{scopedMetrics.missedMeetings}</div>
            </div>
          </div>
          <span className="text-[10px] text-[#7B7B7B]">Need Reschedule</span>
        </div>

        <div className="p-3.5 bg-[#0E1522] border border-[#1E3A5F]/60 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 flex items-center justify-center text-[#F97316]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-[#94A3B8]">Scheduled &rarr; Count Rate</div>
              <div className="text-lg font-bold text-[#00E5A0] font-mono">{scheduledToCountRate}%</div>
            </div>
          </div>
          <span className="text-[10px] text-[#7B7B7B]">{lifetimeMetrics.totalMeetingCount} of {lifetimeMetrics.totalMeetingScheduled}</span>
        </div>
      </div>

      {/* Cumulative Pipeline Conversion Funnel */}
      <div className="p-5 bg-[#111827] border border-[#1E3A5F] rounded-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-wide flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-[#00C2FF]" />
            <span>Cumulative Funnel Efficiency (Lifetime)</span>
          </h3>
          <span className="text-xs text-[#00C2FF] font-mono">Cumulative Milestones</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-[#0A0A0A] rounded-lg border border-[#1E3A5F]/50 flex items-center justify-between">
            <div>
              <div className="text-xs text-[#94A3B8]">Interested &rarr; Scheduled</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">{interestedToScheduledRate}%</div>
              <div className="text-[10px] text-[#7B7B7B] mt-0.5">
                {lifetimeMetrics.totalMeetingScheduled} of {lifetimeMetrics.totalInterested} leads
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-[#00C2FF]" />
          </div>

          <div className="p-3 bg-[#0A0A0A] rounded-lg border border-[#1E3A5F]/50 flex items-center justify-between">
            <div>
              <div className="text-xs text-[#94A3B8]">Scheduled &rarr; Done</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">
                {lifetimeMetrics.totalMeetingScheduled > 0
                  ? Math.round((lifetimeMetrics.totalMeetingDone / lifetimeMetrics.totalMeetingScheduled) * 100)
                  : 0}%
              </div>
              <div className="text-[10px] text-[#7B7B7B] mt-0.5">
                {lifetimeMetrics.totalMeetingDone} of {lifetimeMetrics.totalMeetingScheduled} completed
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-[#00C2FF]" />
          </div>

          <div className="p-3 bg-[#0A0A0A] rounded-lg border border-[#1E3A5F]/50 flex items-center justify-between">
            <div>
              <div className="text-xs text-[#94A3B8]">Done &rarr; Meeting Count (YES)</div>
              <div className="text-xl font-bold text-white mt-1 font-mono">
                {lifetimeMetrics.totalMeetingDone > 0
                  ? Math.round((lifetimeMetrics.totalMeetingCount / lifetimeMetrics.totalMeetingDone) * 100)
                  : 0}%
              </div>
              <div className="text-[10px] text-[#7B7B7B] mt-0.5">
                {lifetimeMetrics.totalMeetingCount} of {lifetimeMetrics.totalMeetingDone} qualified
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-[#00E5A0]" />
          </div>
        </div>
      </div>
    </div>
  );
};
