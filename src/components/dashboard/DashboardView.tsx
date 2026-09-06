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
  Filter
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import {
  calculateLifetimeMetrics,
  calculateDateScopedMetrics,
  getDayBounds
} from '../../lib/countingLogic';

export type DateFilterOption = 'today' | 'yesterday' | 'week' | 'month' | 'lifetime' | 'custom';

export const DashboardView: React.FC = () => {
  const { leads, activities } = useLeads();
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Calculate Lifetime Metrics (Single source of truth)
  const lifetimeMetrics = useMemo(() => {
    return calculateLifetimeMetrics(leads, activities);
  }, [leads, activities]);

  // Calculate Date-Scoped Metrics
  const scopedMetrics = useMemo(() => {
    if (dateFilter === 'lifetime') {
      return lifetimeMetrics;
    }

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (dateFilter === 'today') {
      const bounds = getDayBounds(now);
      startDate = bounds.start;
      endDate = bounds.end;
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const bounds = getDayBounds(yesterday);
      startDate = bounds.start;
      endDate = bounds.end;
    } else if (dateFilter === 'week') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      startDate = sevenDaysAgo;
      endDate = new Date(now.setHours(23, 59, 59, 999));
    } else if (dateFilter === 'month') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      startDate = thirtyDaysAgo;
      endDate = new Date(now.setHours(23, 59, 59, 999));
    } else if (dateFilter === 'custom' && customStart && customEnd) {
      startDate = new Date(`${customStart}T00:00:00`);
      endDate = new Date(`${customEnd}T23:59:59`);
    }

    return calculateDateScopedMetrics(leads, activities, startDate, endDate);
  }, [leads, activities, dateFilter, customStart, customEnd, lifetimeMetrics]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-[#1E3A5F]/70 p-4 rounded-xl">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <span>Sales & Lead Operations Dashboard</span>
          </h2>
          <p className="text-xs text-[#7B7B7B] mt-0.5">
            Single central source of truth for cumulative pipeline progression and daily team velocity.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center space-x-1.5 bg-[#0A0A0A] p-1 rounded-lg border border-[#1E3A5F] text-xs">
          {(['today', 'yesterday', 'week', 'month', 'lifetime'] as DateFilterOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setDateFilter(opt)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all ${
                dateFilter === opt
                  ? 'bg-[#00C2FF] text-black font-semibold shadow-[0_0_10px_rgba(0,194,255,0.25)]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {opt === 'week' ? 'This Week' : opt === 'month' ? 'This Month' : opt}
            </button>
          ))}
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
          <div className="text-3xl font-bold font-sans text-[#00E5A0] mt-2">
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
          <div className="text-3xl font-bold font-sans text-[#00E5A0] mt-2">
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
          <div className="text-3xl font-bold font-sans text-[#00E5A0] mt-2">
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
          <div className="text-3xl font-bold font-sans text-[#00E5A0] mt-2">
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
          <div className="text-3xl font-bold font-sans text-[#F97316] mt-2">
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
              <div className="text-xs text-[#94A3B8]">Calls Logged</div>
              <div className="text-lg font-bold text-white font-mono">{scopedMetrics.callsDone}</div>
            </div>
          </div>
          <span className="text-[10px] text-[#7B7B7B]">Lifetime: {lifetimeMetrics.callsDone}</span>
        </div>

        <div className="p-3.5 bg-[#0E1522] border border-[#1E3A5F]/60 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00E5A0]/10 flex items-center justify-center text-[#00E5A0]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-[#94A3B8]">Meeting Count YES</div>
              <div className="text-lg font-bold text-[#00E5A0] font-mono">{scopedMetrics.meetingCountYes}</div>
            </div>
          </div>
          <span className="text-[10px] text-[#7B7B7B]">Lifetime: {lifetimeMetrics.meetingCountYes}</span>
        </div>

        <div className="p-3.5 bg-[#0E1522] border border-[#1E3A5F]/60 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 flex items-center justify-center text-[#F97316]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-[#94A3B8]">Meeting Count NO</div>
              <div className="text-lg font-bold text-[#F97316] font-mono">{scopedMetrics.meetingCountNo}</div>
            </div>
          </div>
          <span className="text-[10px] text-[#7B7B7B]">Counts as Meeting Done</span>
        </div>
      </div>

      {/* Conversion Funnel Card */}
      <div className="p-5 bg-[#111827] border border-[#1E3A5F] rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider text-[#00C2FF]">
            Cumulative Conversion Funnel (Lifetime Single Source of Truth)
          </h3>
          <span className="text-xs text-[#7B7B7B]">
            Total Leads Registered: <strong className="text-white font-mono">{leads.length}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Funnel Step 1 */}
          <div className="p-4 bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg">
            <span className="text-[11px] text-[#94A3B8]">1. Interested Leads</span>
            <div className="text-2xl font-bold font-sans text-white mt-1">
              {lifetimeMetrics.totalInterested}
            </div>
            <div className="text-[10px] text-[#00E5A0] mt-1">
              {leads.length > 0 ? Math.round((lifetimeMetrics.totalInterested / leads.length) * 100) : 0}% of all leads
            </div>
          </div>

          {/* Funnel Step 2 */}
          <div className="p-4 bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg">
            <span className="text-[11px] text-[#94A3B8]">2. Meetings Scheduled</span>
            <div className="text-2xl font-bold font-sans text-white mt-1">
              {lifetimeMetrics.totalMeetingScheduled}
            </div>
            <div className="text-[10px] text-[#00C2FF] mt-1">
              {lifetimeMetrics.totalInterested > 0
                ? Math.round((lifetimeMetrics.totalMeetingScheduled / lifetimeMetrics.totalInterested) * 100)
                : 0}% booked rate
            </div>
          </div>

          {/* Funnel Step 3 */}
          <div className="p-4 bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg">
            <span className="text-[11px] text-[#94A3B8]">3. Meetings Completed</span>
            <div className="text-2xl font-bold font-sans text-white mt-1">
              {lifetimeMetrics.totalMeetingDone}
            </div>
            <div className="text-[10px] text-[#00E5A0] mt-1">
              {lifetimeMetrics.totalMeetingScheduled > 0
                ? Math.round((lifetimeMetrics.totalMeetingDone / lifetimeMetrics.totalMeetingScheduled) * 100)
                : 0}% completion rate
            </div>
          </div>

          {/* Funnel Step 4 */}
          <div className="p-4 bg-[#0A0A0A] border border-[#00C2FF]/40 rounded-lg shadow-[0_0_12px_rgba(0,194,255,0.1)]">
            <span className="text-[11px] text-[#00C2FF] font-semibold">4. Meeting Count (Target)</span>
            <div className="text-2xl font-bold font-sans text-[#00E5A0] mt-1">
              {lifetimeMetrics.totalMeetingCount}
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-1">
              {lifetimeMetrics.totalMeetingDone > 0
                ? Math.round((lifetimeMetrics.totalMeetingCount / lifetimeMetrics.totalMeetingDone) * 100)
                : 0}% qualification rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
