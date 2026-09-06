import React, { useState } from 'react';
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
  GripVertical
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
    setDragOverColumn(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;
    setDraggedLeadId(null);

    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    if (targetColumn === 'count_yes') {
      await setMeetingCount(leadId, 'YES');
    } else if (targetColumn === 'count_no') {
      await setMeetingCount(leadId, 'NO');
    } else if (targetColumn === 'pending') {
      if (lead.meeting_count_type !== 'NO') {
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
      {/* Top Description */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide">
            Meetings & Outcomes Kanban Board
          </h2>
          <p className="text-xs text-[#7B7B7B]">
            Drag & drop cards across columns or use quick stage move buttons. Times displayed in 12-hour format.
          </p>
        </div>
      </div>

      {/* 5 Column Kanban Grid */}
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
              <div className={`p-3 border-b border-[#1E3A5F]/80 flex items-center justify-between bg-[#111827]`}>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                  <h3 className="font-semibold text-xs text-white tracking-wide">
                    {col.title}
                  </h3>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                  {col.leads.length}
                </span>
              </div>

              {/* Column Body Cards */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-[160px]">
                {col.leads.length === 0 ? (
                  <div className="border border-dashed border-[#1E3A5F]/40 rounded-lg p-6 text-center text-[#7B7B7B] text-[11px]">
                    Drag cards here
                  </div>
                ) : (
                  col.leads.map((lead) => {
                    const isBeingDragged = draggedLeadId === lead.id;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onSelectLead(lead.id)}
                        className={`p-3 bg-[#111827] hover:bg-[#182234] border rounded-lg transition-all cursor-grab active:cursor-grabbing shadow-md text-xs space-y-2 group select-none ${
                          isBeingDragged ? 'opacity-40 border-[#00C2FF] scale-95' : 'border-[#1E3A5F] hover:border-[#00C2FF]/60'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="truncate">
                            <h4 className="font-bold text-white group-hover:text-[#00C2FF] transition-colors truncate">
                              {lead.first_name || lead.last_name
                                ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                                : lead.company_name}
                            </h4>
                            <p className="text-[11px] text-[#94A3B8] truncate">
                              {lead.company_name || 'Individual'}
                            </p>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                              lead.priority === 'High'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-[#1E3A5F]/40 text-[#94A3B8]'
                            }`}
                          >
                            {lead.priority}
                          </span>
                        </div>

                        {/* Meeting Schedule Details (Strict 12-hour format) */}
                        {lead.meeting_date && (
                          <div className="p-2 rounded bg-[#0A0A0A] border border-[#1E3A5F]/60 flex items-center justify-between text-[11px] font-mono text-[#00C2FF]">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{lead.meeting_date}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-white">
                              <Clock className="w-3 h-3 text-[#00E5A0]" />
                              <span>{formatTo12Hour(lead.meeting_time)}</span>
                            </div>
                          </div>
                        )}

                        {/* WhatsApp / Rep details */}
                        <div className="flex items-center justify-between text-[11px] text-[#94A3B8] pt-1 border-t border-[#1E3A5F]/40">
                          <span className="truncate">
                            {lead.assigned_user_name || 'Unassigned'}
                          </span>
                          {lead.whatsapp_number && (
                            <span className="text-[#00E5A0] font-mono flex items-center gap-0.5">
                              <Phone className="w-3 h-3" />
                              <span>WA</span>
                            </span>
                          )}
                        </div>

                        {/* Quick Move Action Buttons (Convenient 1-click stage changes) */}
                        <div
                          className="pt-1 flex flex-wrap items-center gap-1 opacity-80 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {col.id !== 'count_yes' && (
                            <button
                              onClick={() => setMeetingCount(lead.id, 'YES')}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-[#00E5A0]/15 text-[#00E5A0] hover:bg-[#00E5A0]/30 border border-[#00E5A0]/30 transition-colors"
                              title="Move to Count YES"
                            >
                              Count YES
                            </button>
                          )}
                          {col.id !== 'count_no' && (
                            <button
                              onClick={() => setMeetingCount(lead.id, 'NO')}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-[#F97316]/15 text-[#F97316] hover:bg-[#F97316]/30 border border-[#F97316]/30 transition-colors"
                              title="Move to Count NO (cannot be pending)"
                            >
                              Count NO
                            </button>
                          )}
                          {/* Rule: Count NO is NEVER pending */}
                          {lead.meeting_count_type !== 'NO' && col.id !== 'pending' && (
                            <button
                              onClick={() => togglePending(lead.id, true)}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-300 hover:bg-pink-500/30 border border-pink-500/30 transition-colors"
                              title="Set Pending YES"
                            >
                              Pending "YES"
                            </button>
                          )}
                          <button
                            onClick={() => setRescheduleLeadId(lead.id)}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-[#111827] text-[#94A3B8] hover:text-white border border-[#1E3A5F] transition-colors ml-auto"
                            title="Reschedule Meeting"
                          >
                            Resched
                          </button>
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

      {/* Modals */}
      {rescheduleLeadId && (
        <ScheduleMeetingModal
          leadId={rescheduleLeadId}
          isOpen={Boolean(rescheduleLeadId)}
          onClose={() => setRescheduleLeadId(null)}
        />
      )}

      {outcomeLeadId && (
        <MeetingOutcomeModal
          leadId={outcomeLeadId}
          isOpen={Boolean(outcomeLeadId)}
          onClose={() => setOutcomeLeadId(null)}
        />
      )}
    </div>
  );
};
