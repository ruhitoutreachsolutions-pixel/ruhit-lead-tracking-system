import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Users,
  Filter,
  Download,
  Edit3,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Plus,
  Save,
  RotateCcw,
  X
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { calculateTeamReport, calculateDayByDayReport, getDayBounds } from '../../lib/countingLogic';
import { TeamReportRow, DayReportRow } from '../../types';

// Sender aliases excluded from sales rep operational report
const EXCLUDED_SENDER_NAMES = [
  'farzan hussain',
  'kamran hussain',
  'sagar ali',
  'anisur rahman'
];

export const ReportsView: React.FC = () => {
  const { leads, activities } = useLeads();
  const { allUsers, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'team' | 'daybyday'>('team');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');

  // Inline Number Editing State
  const [isEditingNumbers, setIsEditingNumbers] = useState<boolean>(false);
  const [manualTeamOverrides, setManualTeamOverrides] = useState<Record<string, Partial<TeamReportRow>>>(() => {
    const saved = localStorage.getItem('ruhit_team_report_overrides');
    return saved ? JSON.parse(saved) : {};
  });

  // Custom Day to Day Entries State
  const [customDayEntries, setCustomDayEntries] = useState<DayReportRow[]>(() => {
    const saved = localStorage.getItem('ruhit_custom_day_entries');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal for adding custom Day-to-Day report entry
  const [isAddDayEntryOpen, setIsAddDayEntryOpen] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMeetingScheduled, setNewMeetingScheduled] = useState(0);
  const [newMeetingDone, setNewMeetingDone] = useState(0);
  const [newMeetingCount, setNewMeetingCount] = useState(0);
  const [newPendingYes, setNewPendingYes] = useState(0);
  const [newWhatsApp, setNewWhatsApp] = useState(0);
  const [newCalls, setNewCalls] = useState(0);

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

  // Actual sales reps (excluding mailbox sender aliases)
  const actualReps = useMemo(() => {
    return allUsers.filter((u) => {
      const cleanName = u.full_name.toLowerCase().trim();
      return !EXCLUDED_SENDER_NAMES.includes(cleanName);
    });
  }, [allUsers]);

  // Calculate Base Team Report Rows
  const baseTeamReportRows: TeamReportRow[] = useMemo(() => {
    const usersToReport =
      selectedUserFilter === 'all'
        ? actualReps
        : actualReps.filter((u) => u.id === selectedUserFilter);
    return calculateTeamReport(usersToReport, leads, activities, startDate, endDate);
  }, [actualReps, leads, activities, startDate, endDate, selectedUserFilter]);

  // Merge with manual overrides
  const teamReportRows: TeamReportRow[] = useMemo(() => {
    return baseTeamReportRows.map((r) => {
      const override = manualTeamOverrides[r.userId];
      if (override) {
        return { ...r, ...override };
      }
      return r;
    });
  }, [baseTeamReportRows, manualTeamOverrides]);

  const handleUpdateTeamCell = (userId: string, field: keyof TeamReportRow, val: number) => {
    setManualTeamOverrides((prev) => {
      const userOver = prev[userId] || {};
      const updated = {
        ...prev,
        [userId]: {
          ...userOver,
          [field]: Math.max(0, val),
        },
      };
      localStorage.setItem('ruhit_team_report_overrides', JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetTeamOverrides = () => {
    setManualTeamOverrides({});
    localStorage.removeItem('ruhit_team_report_overrides');
  };

  // Totals for Team Report
  const teamTotals = useMemo(() => {
    return teamReportRows.reduce(
      (acc, r) => ({
        interested: acc.interested + r.interested,
        meetingScheduled: acc.meetingScheduled + r.meetingScheduled,
        meetingDone: acc.meetingDone + r.meetingDone,
        meetingCount: acc.meetingCount + r.meetingCount,
        meetingCountYes: acc.meetingCountYes + (r.meetingCountYes ?? r.meetingCount),
        meetingCountNo: acc.meetingCountNo + (r.meetingCountNo ?? 0),
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

  // Calculate Base Day-by-Day Report Rows
  const baseDayByDayRows: DayReportRow[] = useMemo(() => {
    return calculateDayByDayReport(leads, activities, 14);
  }, [leads, activities]);

  // Combine auto daily rows with custom added daily entries
  const combinedDayByDayRows: DayReportRow[] = useMemo(() => {
    const map = new Map<string, DayReportRow>();
    baseDayByDayRows.forEach((r) => map.set(r.date, { ...r }));
    customDayEntries.forEach((c) => map.set(c.date, { ...c }));

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [baseDayByDayRows, customDayEntries]);

  const handleAddDayEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: DayReportRow = {
      date: newEntryDate,
      meetingScheduled: Number(newMeetingScheduled),
      meetingDone: Number(newMeetingDone),
      meetingCount: Number(newMeetingCount),
      pendingYes: Number(newPendingYes),
      whatsapp: Number(newWhatsApp),
      calls: Number(newCalls),
    };

    const updated = [entry, ...customDayEntries.filter((e) => e.date !== newEntryDate)];
    setCustomDayEntries(updated);
    localStorage.setItem('ruhit_custom_day_entries', JSON.stringify(updated));
    setIsAddDayEntryOpen(false);
  };

  const handleExportReportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = '';

    if (activeTab === 'team') {
      filename = `ruhit_team_report_${new Date().toISOString().split('T')[0]}.csv`;
      headers = [
        'Rep Name',
        'Interested',
        'Meeting Scheduled',
        'Meeting Done',
        'Meeting Count',
        'Pending YES',
        'WhatsApp',
        'Calls',
      ];
      rows = teamReportRows.map((r) => [
        r.name,
        r.interested,
        r.meetingScheduled,
        r.meetingDone,
        r.meetingCount,
        r.pending,
        r.whatsapp,
        r.calls,
      ]);
      rows.push([
        'Total',
        teamTotals.interested,
        teamTotals.meetingScheduled,
        teamTotals.meetingDone,
        teamTotals.meetingCount,
        teamTotals.pending,
        teamTotals.whatsapp,
        teamTotals.calls,
      ]);
    } else {
      filename = `ruhit_day_report_${new Date().toISOString().split('T')[0]}.csv`;
      headers = [
        'Date',
        'Meeting Scheduled',
        'Meeting Done',
        'Meeting Count',
        'Pending "Yes"',
        'WhatsApp',
        'Calls',
      ];
      rows = combinedDayByDayRows.map((r) => [
        r.date,
        r.meetingScheduled,
        r.meetingDone,
        r.meetingCount,
        r.pendingYes,
        r.whatsapp,
        r.calls,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#00C2FF]" />
            <span>Operational & Activity Reports</span>
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Real-time pipeline metrics matching Google Sheet specifications. Sender aliases excluded from sales rep tracking.
          </p>
        </div>

        {/* Global Report Actions */}
        <div className="flex items-center space-x-2">
          {activeTab === 'team' && (
            <button
              onClick={() => setIsEditingNumbers(!isEditingNumbers)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
                isEditingNumbers
                  ? 'bg-[#00C2FF] text-black border-[#00C2FF] shadow-[0_0_10px_rgba(0,194,255,0.4)]'
                  : 'bg-[#111827] text-white border-[#1E3A5F] hover:border-[#00C2FF]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingNumbers ? 'Done Editing' : 'Edit Numbers'}</span>
            </button>
          )}

          {activeTab === 'daybyday' && (
            <button
              onClick={() => setIsAddDayEntryOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#00E5A0] hover:bg-[#00E5A0]/80 text-black border border-[#00E5A0] rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Day Report Entry</span>
            </button>
          )}

          <button
            onClick={handleExportReportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#182234] text-white border border-[#1E3A5F] rounded-lg text-xs transition-all hover:border-[#00C2FF]"
          >
            <Download className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl text-xs">
        {/* Left: Tab Selectors */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'team'
                ? 'bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/40'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Report (By Rep)</span>
          </button>

          <button
            onClick={() => setActiveTab('daybyday')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'daybyday'
                ? 'bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/40'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Day-to-Day Report</span>
          </button>
        </div>

        {/* Right: Date Range Filter & Reset */}
        <div className="flex items-center space-x-2">
          {activeTab === 'team' && Object.keys(manualTeamOverrides).length > 0 && (
            <button
              onClick={handleResetTeamOverrides}
              className="text-[11px] text-[#F97316] hover:underline flex items-center gap-1 mr-2"
            >
              <RotateCcw className="w-3 h-3" /> Reset Edits
            </button>
          )}

          {activeTab === 'team' && (
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs focus:border-[#00C2FF]"
            >
              <option value="all">All Sales Reps</option>
              {actualReps.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          )}

          <div className="flex bg-[#111827] border border-[#1E3A5F] rounded-lg p-0.5">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: '30 Days' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setDateRange(t.id as any)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  dateRange === t.id
                    ? 'bg-[#00C2FF] text-black font-semibold'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab 1: Team Report (Replicating exact Sheet 2 styling) */}
      {activeTab === 'team' && (
        <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              {/* Yellow Sheet 2 Header */}
              <thead className="bg-[#EAB308] text-black font-extrabold select-none">
                <tr className="border-b-2 border-yellow-600">
                  <th className="py-3 px-4 uppercase tracking-wider font-bold">NAME</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-center">INTERESTED</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-center">MEETING SCHEDULED</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-center">MEETING DONE</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-center">MEETING COUNT</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-center">PENDING "YES"</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-center">WHATSAPP</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-center">CALLS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1E3A5F]/40 bg-[#0A0A0A] text-white">
                {teamReportRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[#7B7B7B]">
                      No reps found.
                    </td>
                  </tr>
                ) : (
                  teamReportRows.map((row, idx) => (
                    <tr
                      key={row.userId}
                      className={`transition-colors ${
                        idx % 2 === 0 ? 'bg-[#0A0A0A]' : 'bg-[#0E1522]'
                      } hover:bg-[#111827]`}
                    >
                      <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                        <span>{row.name}</span>
                      </td>

                      {/* INTERESTED */}
                      <td className="py-3 px-4 text-center font-mono font-semibold">
                        {isEditingNumbers ? (
                          <input
                            type="number"
                            value={row.interested}
                            onChange={(e) =>
                              handleUpdateTeamCell(row.userId, 'interested', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-16 bg-[#111827] text-center border border-[#00C2FF] rounded py-0.5 text-xs text-white"
                          />
                        ) : (
                          row.interested
                        )}
                      </td>

                      {/* MEETING SCHEDULED */}
                      <td className="py-3 px-4 text-center font-mono font-semibold">
                        {isEditingNumbers ? (
                          <input
                            type="number"
                            value={row.meetingScheduled}
                            onChange={(e) =>
                              handleUpdateTeamCell(row.userId, 'meetingScheduled', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-16 bg-[#111827] text-center border border-[#00C2FF] rounded py-0.5 text-xs text-white"
                          />
                        ) : (
                          row.meetingScheduled
                        )}
                      </td>

                      {/* MEETING DONE */}
                      <td className="py-3 px-4 text-center font-mono font-semibold">
                        {isEditingNumbers ? (
                          <input
                            type="number"
                            value={row.meetingDone}
                            onChange={(e) =>
                              handleUpdateTeamCell(row.userId, 'meetingDone', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-16 bg-[#111827] text-center border border-[#00C2FF] rounded py-0.5 text-xs text-white"
                          />
                        ) : (
                          row.meetingDone
                        )}
                      </td>

                      {/* MEETING COUNT */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#00E5A0]">
                        {isEditingNumbers ? (
                          <input
                            type="number"
                            value={row.meetingCount}
                            onChange={(e) =>
                              handleUpdateTeamCell(row.userId, 'meetingCount', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-16 bg-[#111827] text-center border border-[#00E5A0] rounded py-0.5 text-xs text-[#00E5A0]"
                          />
                        ) : (
                          row.meetingCount
                        )}
                      </td>

                      {/* PENDING "YES" */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-[#F97316]">
                        {isEditingNumbers ? (
                          <input
                            type="number"
                            value={row.pending}
                            onChange={(e) =>
                              handleUpdateTeamCell(row.userId, 'pending', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-16 bg-[#111827] text-center border border-[#F97316] rounded py-0.5 text-xs text-[#F97316]"
                          />
                        ) : (
                          row.pending
                        )}
                      </td>

                      {/* WHATSAPP */}
                      <td className="py-3 px-4 text-center font-mono">
                        {isEditingNumbers ? (
                          <input
                            type="number"
                            value={row.whatsapp}
                            onChange={(e) =>
                              handleUpdateTeamCell(row.userId, 'whatsapp', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-16 bg-[#111827] text-center border border-[#1E3A5F] rounded py-0.5 text-xs text-white"
                          />
                        ) : (
                          row.whatsapp
                        )}
                      </td>

                      {/* CALLS */}
                      <td className="py-3 px-4 text-center font-mono">
                        {isEditingNumbers ? (
                          <input
                            type="number"
                            value={row.calls}
                            onChange={(e) =>
                              handleUpdateTeamCell(row.userId, 'calls', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-16 bg-[#111827] text-center border border-[#1E3A5F] rounded py-0.5 text-xs text-white"
                          />
                        ) : (
                          row.calls
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Green Sheet 2 Totals Footer */}
              <tfoot className="bg-[#00E5A0] text-black font-extrabold select-none border-t-2 border-emerald-600">
                <tr>
                  <td className="py-3 px-4 uppercase tracking-wider font-bold">TOTAL</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                    {teamTotals.interested}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                    {teamTotals.meetingScheduled}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                    {teamTotals.meetingDone}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                    {teamTotals.meetingCount}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                    {teamTotals.pending}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                    {teamTotals.whatsapp}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                    {teamTotals.calls}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Day-by-Day Report (Replicating exact Sheet 3 styling) */}
      {activeTab === 'daybyday' && (
        <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#111827] text-[#00C2FF] font-mono border-b border-[#1E3A5F]">
                <tr>
                  <th className="py-3 px-4 font-bold">DATE</th>
                  <th className="py-3 px-4 font-bold text-center">MEETING SCHEDULED</th>
                  <th className="py-3 px-4 font-bold text-center">MEETING DONE</th>
                  <th className="py-3 px-4 font-bold text-center">MEETING COUNT</th>
                  <th className="py-3 px-4 font-bold text-center">PENDING "YES"</th>
                  <th className="py-3 px-4 font-bold text-center">WHATSAPP</th>
                  <th className="py-3 px-4 font-bold text-center">CALLS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1E3A5F]/40 bg-[#0A0A0A] text-white">
                {combinedDayByDayRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[#7B7B7B]">
                      No daily records found. Click "Add Day Report Entry" to add one.
                    </td>
                  </tr>
                ) : (
                  combinedDayByDayRows.map((row, idx) => (
                    <tr
                      key={row.date}
                      className={`transition-colors ${
                        idx % 2 === 0 ? 'bg-[#0A0A0A]' : 'bg-[#0E1522]'
                      } hover:bg-[#111827]`}
                    >
                      <td className="py-2.5 px-4 font-mono font-semibold text-white">
                        {row.date}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono">
                        {row.meetingScheduled}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono">
                        {row.meetingDone}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-[#00E5A0]">
                        {row.meetingCount}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-[#F97316]">
                        {row.pendingYes}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono">
                        {row.whatsapp}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono">
                        {row.calls}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Day to Day Report Entry */}
      {isAddDayEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#00C2FF]" />
                <span>Add Day-to-Day Report Entry</span>
              </h3>
              <button
                onClick={() => setIsAddDayEntryOpen(false)}
                className="p-1 text-[#7B7B7B] hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDayEntrySubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-white block mb-1">Date:</label>
                <input
                  type="date"
                  required
                  value={newEntryDate}
                  onChange={(e) => setNewEntryDate(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-[#00C2FF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#94A3B8] block mb-1">Meeting Scheduled:</label>
                  <input
                    type="number"
                    min={0}
                    value={newMeetingScheduled}
                    onChange={(e) => setNewMeetingScheduled(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#94A3B8] block mb-1">Meeting Done:</label>
                  <input
                    type="number"
                    min={0}
                    value={newMeetingDone}
                    onChange={(e) => setNewMeetingDone(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#00E5A0] font-semibold block mb-1">Meeting Count:</label>
                  <input
                    type="number"
                    min={0}
                    value={newMeetingCount}
                    onChange={(e) => setNewMeetingCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#111827] border border-[#00E5A0]/60 rounded-lg px-3 py-1.5 text-xs text-[#00E5A0] font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#F97316] font-semibold block mb-1">Pending "Yes":</label>
                  <input
                    type="number"
                    min={0}
                    value={newPendingYes}
                    onChange={(e) => setNewPendingYes(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#111827] border border-[#F97316]/60 rounded-lg px-3 py-1.5 text-xs text-[#F97316] font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#94A3B8] block mb-1">WhatsApp Sent:</label>
                  <input
                    type="number"
                    min={0}
                    value={newWhatsApp}
                    onChange={(e) => setNewWhatsApp(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#94A3B8] block mb-1">Calls Done:</label>
                  <input
                    type="number"
                    min={0}
                    value={newCalls}
                    onChange={(e) => setNewCalls(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-[#1E3A5F]">
                <button
                  type="button"
                  onClick={() => setIsAddDayEntryOpen(false)}
                  className="px-3 py-1.5 border border-[#1E3A5F] text-[#94A3B8] hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00E5A0] hover:bg-[#00E5A0]/80 text-black font-bold rounded-lg"
                >
                  Save Daily Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
