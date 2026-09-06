import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Users,
  User,
  Filter,
  Download,
  Edit3,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { calculateTeamReport, calculateDayByDayReport, getDayBounds } from '../../lib/countingLogic';
import { TeamReportRow, DayReportRow } from '../../types';

export const ReportsView: React.FC = () => {
  const { leads, activities } = useLeads();
  const { allUsers, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'team' | 'my'>('team');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');

  // Manual Overrides state (Section 38)
  const [manualOverrides, setManualOverrides] = useState<Record<string, number>>({});
  const [isEditingOverride, setIsEditingOverride] = useState(false);

  // Compute date boundaries
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (dateRange === 'today') {
      const b = getDayBounds(now);
      return { startDate: b.start, endDate: b.end };
    } else if (dateRange === 'week') {
      const s = new Date(now);
      s.setDate(s.getDate() - 7);
      s.setHours(0, 0, 0, 0);
      return { startDate: s, endDate: new Date(now.setHours(23, 59, 59, 999)) };
    } else if (dateRange === 'month') {
      const s = new Date(now);
      s.setDate(s.getDate() - 30);
      s.setHours(0, 0, 0, 0);
      return { startDate: s, endDate: new Date(now.setHours(23, 59, 59, 999)) };
    }
    return { startDate: undefined, endDate: undefined };
  }, [dateRange]);

  // Calculate Team Report (Screenshot 2 replication)
  const teamReportRows: TeamReportRow[] = useMemo(() => {
    const usersToReport =
      selectedUserFilter === 'all'
        ? allUsers
        : allUsers.filter((u) => u.id === selectedUserFilter);
    return calculateTeamReport(usersToReport, leads, activities, startDate, endDate);
  }, [allUsers, leads, activities, startDate, endDate, selectedUserFilter]);

  // Totals for Team Report
  const teamTotals = useMemo(() => {
    return teamReportRows.reduce(
      (acc, r) => ({
        interested: acc.interested + r.interested,
        meetingScheduled: acc.meetingScheduled + r.meetingScheduled,
        meetingDone: acc.meetingDone + r.meetingDone,
        meetingCount: acc.meetingCount + r.meetingCount,
        meetingCountYes: acc.meetingCountYes + r.meetingCountYes,
        meetingCountNo: acc.meetingCountNo + r.meetingCountNo,
        pending: acc.pending + r.pending,
        whatsapp: acc.whatsapp + r.whatsapp,
        calls: acc.calls + r.calls,
      }),
      {
        interested: 0,
        meetingScheduled: 0,
        meetingDone: 0,
        meetingCount: 0,
        meetingCountYes: 0,
        meetingCountNo: 0,
        pending: 0,
        whatsapp: 0,
        calls: 0,
      }
    );
  }, [teamReportRows]);

  // Calculate Day-by-Day Report (Screenshot 3 replication)
  const dayByDayRows: DayReportRow[] = useMemo(() => {
    return calculateDayByDayReport(leads, activities, 14);
  }, [leads, activities]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#00C2FF]" />
            <span>Operational & Activity Reports</span>
          </h2>
          <p className="text-xs text-[#7B7B7B] mt-0.5">
            Automated aggregation reproducing and standardizing existing Google Sheet reports.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-[#111827] p-1 rounded-lg border border-[#1E3A5F] text-xs">
          <button
            onClick={() => setActiveTab('team')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'team'
                ? 'bg-[#00C2FF] text-black shadow-[0_0_10px_rgba(0,194,255,0.2)]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Team Report (Sheet 2)
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'my'
                ? 'bg-[#00C2FF] text-black shadow-[0_0_10px_rgba(0,194,255,0.2)]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Day-to-Day Report (Sheet 3)
          </button>
        </div>
      </div>

      {activeTab === 'team' ? (
        /* Team Report (Replicating Screenshot 2 with yellow header and green totals row) */
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-3.5 bg-[#111827] border border-[#1E3A5F] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 text-[#94A3B8]">
                <Calendar className="w-3.5 h-3.5 text-[#00C2FF]" />
                <span>Period:</span>
              </div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF]"
              >
                <option value="all">All Time (Cumulative)</option>
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="month">Past 30 Days</option>
              </select>

              <div className="flex items-center space-x-1.5 text-[#94A3B8] ml-2">
                <Users className="w-3.5 h-3.5 text-[#00C2FF]" />
                <span>Rep:</span>
              </div>
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF]"
              >
                <option value="all">All Team Members</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>

            <div className="text-[#7B7B7B] text-[11px] font-mono">
              Report Generated: {new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}
            </div>
          </div>

          {/* Table Container Styled per Screenshot 2 */}
          <div className="border border-[#1E3A5F] rounded-xl overflow-hidden shadow-2xl bg-[#0A0A0A]">
            <div className="p-3 bg-[#111827] border-b border-[#1E3A5F] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">
                Team Performance Breakdown
              </h3>
              <span className="text-[11px] text-[#00C2FF] font-mono font-semibold">
                Auto-Derived from Central Lead DB
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                {/* Yellow Header (Exact visual cue from screenshot 2) */}
                <thead className="bg-[#EAB308] text-black font-bold border-b border-black">
                  <tr>
                    <th className="py-2.5 px-4 text-left font-bold text-black uppercase tracking-wider">
                      Name
                    </th>
                    <th className="py-2.5 px-4 font-bold text-black uppercase tracking-wider">
                      Interested
                    </th>
                    <th className="py-2.5 px-4 font-bold text-black uppercase tracking-wider">
                      Meeting Scheduled
                    </th>
                    <th className="py-2.5 px-4 font-bold text-black uppercase tracking-wider">
                      Meeting Done
                    </th>
                    <th className="py-2.5 px-4 font-bold text-black uppercase tracking-wider">
                      Meeting Count
                    </th>
                    <th className="py-2.5 px-4 font-bold text-black uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="py-2.5 px-4 font-bold text-black uppercase tracking-wider">
                      WhatsApp
                    </th>
                    <th className="py-2.5 px-4 font-bold text-black uppercase tracking-wider">
                      Calls
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/40 bg-[#0A0A0A] font-medium text-white">
                  {teamReportRows.map((row) => (
                    <tr key={row.userId} className="hover:bg-[#111827] transition-colors">
                      <td className="py-3 px-4 text-left font-bold text-white font-sans flex items-center space-x-2">
                        <span>{row.name}</span>
                        {row.userId === currentUser.id && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-[#00C2FF]/20 text-[#00C2FF] rounded">
                            You
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">{row.interested}</td>
                      <td className="py-3 px-4 font-mono">{row.meetingScheduled}</td>
                      <td className="py-3 px-4 font-mono">{row.meetingDone}</td>
                      <td className="py-3 px-4 font-mono text-[#00E5A0] font-bold">
                        {row.meetingCount}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#F97316]">{row.pending}</td>
                      <td className="py-3 px-4 font-mono text-[#94A3B8]">{row.whatsapp}</td>
                      <td className="py-3 px-4 font-mono text-[#94A3B8]">{row.calls}</td>
                    </tr>
                  ))}
                </tbody>
                {/* Green Total Footer (Exact visual cue from screenshot 2) */}
                <tfoot className="bg-[#00E5A0] text-black font-extrabold border-t-2 border-black">
                  <tr>
                    <td className="py-3 px-4 text-left uppercase tracking-wider text-black text-sm">
                      Total
                    </td>
                    <td className="py-3 px-4 font-mono text-black text-sm">{teamTotals.interested}</td>
                    <td className="py-3 px-4 font-mono text-black text-sm">{teamTotals.meetingScheduled}</td>
                    <td className="py-3 px-4 font-mono text-black text-sm">{teamTotals.meetingDone}</td>
                    <td className="py-3 px-4 font-mono text-black text-sm font-black">{teamTotals.meetingCount}</td>
                    <td className="py-3 px-4 font-mono text-black text-sm">{teamTotals.pending}</td>
                    <td className="py-3 px-4 font-mono text-black text-sm">{teamTotals.whatsapp}</td>
                    <td className="py-3 px-4 font-mono text-black text-sm">{teamTotals.calls}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Day-to-Day Report (Replicating Screenshot 3: Date, Meeting Sched, Meeting Done, Meeting Count, Pending "Yes") */
        <div className="space-y-4">
          <div className="p-3.5 bg-[#111827] border border-[#1E3A5F] rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-white">Daily Operational Velocity</span>
              <p className="text-[#7B7B7B] mt-0.5">Chronological day-by-day milestone logs</p>
            </div>
          </div>

          <div className="border border-[#1E3A5F] rounded-xl overflow-hidden shadow-2xl bg-[#0A0A0A]">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                {/* Header matching screenshot 3 columns */}
                <thead className="bg-[#111827] text-[#94A3B8] border-b border-[#1E3A5F]">
                  <tr>
                    <th className="py-3 px-4 text-left font-bold text-white">Date</th>
                    <th className="py-3 px-4 font-bold text-white">Meeting Scheduled</th>
                    <th className="py-3 px-4 font-bold text-white">Meeting Done</th>
                    <th className="py-3 px-4 font-bold text-[#00E5A0]">Meeting Count</th>
                    <th className="py-3 px-4 font-bold text-[#F97316]">Pending &quot;Yes&quot;</th>
                    <th className="py-3 px-4 font-bold text-[#94A3B8]">WhatsApp</th>
                    <th className="py-3 px-4 font-bold text-[#94A3B8]">Calls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/40 bg-[#0A0A0A]">
                  {dayByDayRows.map((row) => (
                    <tr key={row.date} className="hover:bg-[#111827] transition-colors">
                      <td className="py-3 px-4 text-left font-mono font-bold text-[#00C2FF]">
                        {row.date}
                      </td>
                      <td className="py-3 px-4 font-mono text-white">
                        {row.meetingScheduled > 0 ? (
                          <span className="font-bold">{row.meetingScheduled}</span>
                        ) : (
                          <span className="text-[#7B7B7B]">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-white">
                        {row.meetingDone > 0 ? (
                          <span className="font-bold text-[#00E5A0]">{row.meetingDone}</span>
                        ) : (
                          <span className="text-[#7B7B7B]">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-white">
                        {row.meetingCount > 0 ? (
                          <span className="font-bold text-[#00E5A0]">{row.meetingCount}</span>
                        ) : (
                          <span className="text-[#7B7B7B]">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {row.pendingYes > 0 ? (
                          <span className="font-bold text-[#F97316]">{row.pendingYes}</span>
                        ) : (
                          <span className="text-[#7B7B7B]">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#94A3B8]">
                        {row.whatsapp > 0 ? row.whatsapp : <span className="text-[#7B7B7B]">0</span>}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#94A3B8]">
                        {row.calls > 0 ? row.calls : <span className="text-[#7B7B7B]">0</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
