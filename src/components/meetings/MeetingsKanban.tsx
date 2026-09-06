import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MoreVertical,
  Plus,
  Phone,
  User,
  ArrowRight,
  GripVertical,
  LayoutGrid,
  List,
  Search,
  Check,
  RotateCcw
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { Lead, Meeting } from '../../types';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import { MeetingOutcomeModal } from './MeetingOutcomeModal';
import { formatTo12Hour } from '../../lib/formatTime';

interface MeetingsKanbanProps {
  onSelectLead: (leadId: string) => void;
}

export const MeetingsKanban: React.FC<MeetingsKanbanProps> = ({ onSelectLead }) => {
  const { leads, meetings, updateMeeting, rescheduleMeeting, togglePending, setMeetingCount, markMeetingDone } = useLeads();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [listSearch, setListSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'missed' | 'count_yes' | 'count_no' | 'pending'>('all');

  const [rescheduleLeadId, setRescheduleLeadId] = useState<string | null>(null);
  const [outcomeLeadId, setOutcomeLeadId] = useState<string | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const now = new Date();

  // 5 Kanban columns
  const scheduledLeads = leads.filter(
    (l) =>
      l.is_meeting_scheduled &&
      !l.is_meeting_done &&
      l.meeting_date &&
      new Date(`${l.meeting_date}T${l.meeting_time || '23:59'}:00`).getTime() >= now.getTime() - 15 * 60 * 1000
  );

  const missedLeads = leads.filter(
    (l) =>
      l.is_meeting_scheduled &&
      !l.is_meeting_done &&
      l.meeting_date &&
      new Date(`${l.meeting_date}T${l.meeting_time || '23:59'}:00`).getTime() < now.getTime() - 15 * 60 * 1000
  );

  const countYesLeads = leads.filter(
    (l) => l.is_meeting_done && l.meeting_count_type === 'YES'
  );

  const countNoLeads = leads.filter(
    (l) => l.is_meeting_done && l.meeting_count_type === 'NO'
  );

  // Rule: Count NO is NEVER pending
  const pendingLeads = leads.filter((l) => l.is_pending && l.meeting_count_type !== 'NO');

  // Combined all meetings list for List View
  const allMeetingLeads = useMemo(() => {
    return leads.filter((l) => l.is_meeting_scheduled || l.is_meeting_done || l.is_pending);
  }, [leads]);

  const filteredMeetingList = useMemo(() => {
    return allMeetingLeads.filter((l) => {
      // Filter by status
      if (statusFilter === 'scheduled') {
        const isSched = l.is_meeting_scheduled && !l.is_meeting_done && l.meeting_date && new Date(`${l.meeting_date}T${l.meeting_time || '23:59'}:00`).getTime() >= now.getTime() - 15 * 60 * 1000;
        if (!isSched) return false;
      } else if (statusFilter === 'missed') {
        const isMiss = l.is_meeting_scheduled && !l.is_meeting_done && l.meeting_date && new Date(`${l.meeting_date}T${l.meeting_time || '23:59'}:00`).getTime() < now.getTime() - 15 * 60 * 1000;
        if (!isMiss) return false;
      } else if (statusFilter === 'count_yes') {
        if (!(l.is_meeting_done && l.meeting_count_type === 'YES')) return false;
      } else if (statusFilter === 'count_no') {
        if (!(l.is_meeting_done && l.meeting_count_type === 'NO')) return false;
      } else if (statusFilter === 'pending') {
        if (!(l.is_pending && l.meeting_count_type !== 'NO')) return false;
      }

      // Filter by search query
      if (listSearch.trim()) {
        const q = listSearch.toLowerCase();
        const name = `${l.first_name || ''} ${l.last_name || ''}`.toLowerCase();
        const company = (l.company_name || '').toLowerCase();
        const email = (l.email || '').toLowerCase();
        const phone = (l.whatsapp_number || l.alternative_phone || '').toLowerCase();
        if (!name.includes(q) && !company.includes(q) && !email.includes(q) && !phone.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allMeetingLeads, statusFilter, listSearch, now]);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    setDraggedLeadId(null);
    setDragOverColumn(null);

    if (!leadId) return;

    if (targetColumn === 'count_yes') {
      await setMeetingCount(leadId, 'YES');
    } else if (targetColumn === 'count_no') {
      await setMeetingCount(leadId, 'NO');
    } else if (targetColumn === 'pending') {
      const lead = leads.find((l) => l.id === leadId);
      if (lead && lead.meeting_count_type === 'NO') {
        alert('Validation Error: Meeting Count NO can never be Pending.');
        return;
      }
      if (!lead?.is_meeting_done) {
        await setMeetingCount(leadId, 'YES');
        await togglePending(leadId, true);
      } else {
        await togglePending(leadId, true);
      }
    } else if (targetColumn === 'scheduled' || targetColumn === 'missed') {
      setRescheduleLeadId(leadId);
    }
  };

  const columns = [
    {
      id: 'scheduled',
      title: 'Meeting Scheduled',
      leads: scheduledLeads,
      color: '#00C2FF',
      borderColor: 'border-[#00C2FF]/40',
      badgeBg: 'bg-[#00C2FF]/15 text-[#00C2FF]',
    },
    {
      id: 'missed',
      title: 'Missed Meetings',
      leads: missedLeads,
      color: '#F97316',
      borderColor: 'border-[#F97316]/40',
      badgeBg: 'bg-[#F97316]/15 text-[#F97316]',
    },
    {
      id: 'count_yes',
      title: 'Meeting Count YES',
      leads: countYesLeads,
      color: '#00E5A0',
      borderColor: 'border-[#00E5A0]/40',
      badgeBg: 'bg-[#00E5A0]/15 text-[#00E5A0]',
    },
    {
      id: 'count_no',
      title: 'Meeting Count NO',
      leads: countNoLeads,
      color: '#94A3B8',
      borderColor: 'border-[#94A3B8]/40',
      badgeBg: 'bg-[#94A3B8]/15 text-[#94A3B8]',
    },
    {
      id: 'pending',
      title: 'Pending "YES"',
      leads: pendingLeads,
      color: '#EC4899',
      borderColor: 'border-[#EC4899]/40',
      badgeBg: 'bg-[#EC4899]/15 text-[#EC4899]',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827] border border-[#1E3A5F]/70 p-4 rounded-xl shadow-lg">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <span>Meetings & Outcomes Hub</span>
            <span className="text-[11px] font-mono text-[#00C2FF] bg-[#1E3A5F]/40 px-2 py-0.5 rounded border border-[#00C2FF]/20">
              Total: {allMeetingLeads.length}
            </span>
          </h2>
          <p className="text-xs text-[#7B7B7B] mt-0.5">
            Switch seamlessly between Kanban stages and data List view. Times displayed in 12-hour format.
          </p>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center space-x-1 bg-[#0A0A0A] border border-[#1E3A5F] p-1 rounded-xl text-xs">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === 'kanban'
                ? 'bg-[#00C2FF] text-black font-bold shadow-md'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-[#00C2FF] text-black font-bold shadow-md'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* 5 Column Kanban Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start min-h-[600px]">
          {columns.map((col) => {
            const isOver = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`bg-[#0A0A0A] border rounded-xl flex flex-col max-h-[750px] shadow-lg overflow-hidden transition-all ${
                  isOver ? 'border-[#00C2FF] ring-2 ring-[#00C2FF]/30 bg-[#111827]/80' : 'border-[#1E3A5F]/70'
                }`}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-[#1E3A5F]/80 flex items-center justify-between bg-[#111827]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <h3 className="font-semibold text-xs text-white">{col.title}</h3>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${col.badgeBg}`}>
                    {col.leads.length}
                  </span>
                </div>

                {/* Column Dropzone / Cards Container */}
                <div className="p-3 overflow-y-auto space-y-2.5 flex-1 min-h-[150px]">
                  {col.leads.length === 0 ? (
                    <div className="h-32 border border-dashed border-[#1E3A5F]/40 rounded-lg flex flex-col items-center justify-center text-[11px] text-[#7B7B7B]">
                      <span>No prospects here</span>
                      <span className="text-[9px] text-[#64748B] mt-0.5">Drag cards here</span>
                    </div>
                  ) : (
                    col.leads.map((lead) => {
                      const isDragged = draggedLeadId === lead.id;

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-[#111827] border border-[#1E3A5F] rounded-lg p-3 space-y-2 text-xs hover:border-[#00C2FF]/60 cursor-grab active:cursor-grabbing transition-all group shadow-md ${
                            isDragged ? 'opacity-30 scale-95' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 cursor-pointer" onClick={() => onSelectLead(lead.id)}>
                              <h4 className="font-bold text-white hover:text-[#00C2FF] transition-colors leading-tight">
                                {lead.first_name || lead.last_name ? `${lead.first_name} ${lead.last_name}` : lead.company_name}
                              </h4>
                              {lead.company_name && (lead.first_name || lead.last_name) && (
                                <p className="text-[11px] text-[#7B7B7B] mt-0.5">{lead.company_name}</p>
                              )}
                            </div>
                            <GripVertical className="w-3.5 h-3.5 text-[#64748B] opacity-0 group-hover:opacity-100 shrink-0 ml-1 cursor-grab" />
                          </div>

                          {/* Meeting Schedule info */}
                          {lead.meeting_date && (
                            <div className="flex items-center space-x-1.5 text-[11px] font-mono text-[#00C2FF] bg-[#0A0A0A] px-2 py-1 rounded border border-[#1E3A5F]/40">
                              <Clock className="w-3 h-3 text-[#00C2FF] shrink-0" />
                              <span>{lead.meeting_date} &bull; {formatTo12Hour(lead.meeting_time)}</span>
                            </div>
                          )}

                          {/* Contact Badges */}
                          <div className="flex items-center space-x-2 text-[10px] text-[#94A3B8]">
                            {lead.whatsapp_number && (
                              <span className="flex items-center space-x-1 text-[#00E5A0]">
                                <Phone className="w-3 h-3" />
                                <span className="font-mono">{lead.whatsapp_number}</span>
                              </span>
                            )}
                            {lead.brand_name && (
                              <span className="truncate max-w-[90px] text-[#7B7B7B]">
                                {lead.brand_name}
                              </span>
                            )}
                          </div>

                          {/* Card Quick Action Bar */}
                          <div className="pt-2 border-t border-[#1E3A5F]/40 flex items-center justify-between">
                            <button
                              onClick={() => onSelectLead(lead.id)}
                              className="text-[10px] text-[#7B7B7B] hover:text-[#00C2FF] transition-colors"
                            >
                              Details &rarr;
                            </button>

                            <div className="flex items-center space-x-1">
                              {!lead.is_meeting_done ? (
                                <>
                                  <button
                                    onClick={() => setOutcomeLeadId(lead.id)}
                                    className="px-2 py-0.5 text-[10px] bg-[#00E5A0]/20 text-[#00E5A0] border border-[#00E5A0]/30 rounded hover:bg-[#00E5A0]/30 transition-all font-semibold"
                                  >
                                    Outcome
                                  </button>
                                  <button
                                    onClick={() => setRescheduleLeadId(lead.id)}
                                    className="px-2 py-0.5 text-[10px] bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20 rounded hover:bg-[#00C2FF]/20 transition-all"
                                  >
                                    Reschedule
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setOutcomeLeadId(lead.id)}
                                  className="px-2 py-0.5 text-[10px] bg-[#1E3A5F]/40 text-[#94A3B8] border border-[#1E3A5F] rounded hover:text-white transition-all"
                                >
                                  Edit Outcome
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Comprehensive Meetings List View */
        <div className="space-y-3">
          {/* Filter and Search Bar for List View */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827] p-3 rounded-xl border border-[#1E3A5F]/70">
            {/* Search */}
            <div className="flex items-center relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search prospect, company, phone..."
                className="w-full bg-[#0A0A0A] text-xs text-white pl-9 pr-3 py-1.5 rounded-lg border border-[#1E3A5F] focus:outline-none focus:border-[#00C2FF]"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto text-[11px]">
              {[
                { id: 'all', label: `All (${allMeetingLeads.length})` },
                { id: 'scheduled', label: `Scheduled (${scheduledLeads.length})` },
                { id: 'missed', label: `Missed (${missedLeads.length})` },
                { id: 'count_yes', label: `Count YES (${countYesLeads.length})` },
                { id: 'count_no', label: `Count NO (${countNoLeads.length})` },
                { id: 'pending', label: `Pending (${pendingLeads.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-[#00C2FF]/20 text-[#00C2FF] border border-[#00C2FF]/40 font-bold'
                      : 'text-[#94A3B8] hover:text-white bg-[#0A0A0A] border border-[#1E3A5F]/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List View Table */}
          <div className="border border-[#1E3A5F] rounded-xl overflow-hidden shadow-lg bg-[#0A0A0A]">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#111827] text-[#00C2FF] border-b border-[#1E3A5F]">
                <tr>
                  <th className="p-3">Status</th>
                  <th className="p-3">Meeting Schedule (12-hr)</th>
                  <th className="p-3">Prospect & Company</th>
                  <th className="p-3">Contact (WhatsApp / Alt)</th>
                  <th className="p-3">Brand / Campaign</th>
                  <th className="p-3">Assigned Rep</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3A5F]/40">
                {filteredMeetingList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#7B7B7B]">
                      No meetings match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredMeetingList.map((lead) => {
                    const isMissed = lead.is_meeting_scheduled && !lead.is_meeting_done && lead.meeting_date && new Date(`${lead.meeting_date}T${lead.meeting_time || '23:59'}:00`).getTime() < now.getTime() - 15 * 60 * 1000;
                    const isCountYes = lead.is_meeting_done && lead.meeting_count_type === 'YES';
                    const isCountNo = lead.is_meeting_done && lead.meeting_count_type === 'NO';
                    const isPending = lead.is_pending && lead.meeting_count_type !== 'NO';

                    return (
                      <tr key={lead.id} className="hover:bg-[#111827]/50 transition-colors">
                        <td className="p-3">
                          {isPending ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/30 font-bold">
                              Pending YES
                            </span>
                          ) : isCountYes ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#00E5A0]/20 text-[#00E5A0] border border-[#00E5A0]/30 font-bold">
                              Count YES
                            </span>
                          ) : isCountNo ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#94A3B8]/20 text-[#94A3B8] border border-[#94A3B8]/30 font-medium">
                              Count NO
                            </span>
                          ) : isMissed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30 font-bold">
                              Missed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#00C2FF]/20 text-[#00C2FF] border border-[#00C2FF]/30 font-bold">
                              Scheduled
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-mono text-[#00C2FF] text-[11px]">
                          {lead.meeting_date ? (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-[#00C2FF] shrink-0" />
                              <span>{lead.meeting_date} &bull; {formatTo12Hour(lead.meeting_time)}</span>
                            </div>
                          ) : (
                            <span className="text-[#64748B]">Not set</span>
                          )}
                        </td>

                        <td className="p-3">
                          <button
                            onClick={() => onSelectLead(lead.id)}
                            className="text-left hover:underline"
                          >
                            <div className="font-bold text-white text-xs">
                              {lead.first_name || lead.last_name ? `${lead.first_name} ${lead.last_name}` : lead.company_name}
                            </div>
                            <div className="text-[10px] text-[#94A3B8]">{lead.company_name}</div>
                          </button>
                        </td>

                        <td className="p-3 font-mono text-[11px]">
                          <div className="text-[#00E5A0]">{lead.whatsapp_number || '—'}</div>
                          {lead.alternative_phone && (
                            <div className="text-[#00C2FF] text-[10px]">{lead.alternative_phone}</div>
                          )}
                        </td>

                        <td className="p-3 text-[11px] text-[#94A3B8]">
                          <div className="text-white">{lead.brand_name || '—'}</div>
                          <div className="text-[10px] text-[#64748B]">{lead.campaign_name}</div>
                        </td>

                        <td className="p-3 text-[11px] text-[#94A3B8]">
                          {lead.assigned_user_name || 'Ruhit (Owner)'}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setOutcomeLeadId(lead.id)}
                              className="px-2.5 py-1 text-[10px] bg-[#00E5A0]/20 text-[#00E5A0] border border-[#00E5A0]/30 rounded-lg hover:bg-[#00E5A0]/30 transition-all font-bold"
                            >
                              Outcome
                            </button>
                            <button
                              onClick={() => setRescheduleLeadId(lead.id)}
                              className="px-2.5 py-1 text-[10px] bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 rounded-lg hover:bg-[#00C2FF]/20 transition-all"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => onSelectLead(lead.id)}
                              className="px-2 py-1 text-[10px] text-[#94A3B8] hover:text-white rounded hover:bg-[#1E3A5F]/40"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Outcome Modal */}
      {outcomeLeadId && (
        <MeetingOutcomeModal
          isOpen={!!outcomeLeadId}
          leadId={outcomeLeadId}
          onClose={() => setOutcomeLeadId(null)}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleLeadId && (
        <ScheduleMeetingModal
          isOpen={!!rescheduleLeadId}
          leadId={rescheduleLeadId}
          onClose={() => setRescheduleLeadId(null)}
        />
      )}
    </div>
  );
};
