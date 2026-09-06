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
  ArrowRight
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { Lead, Meeting } from '../../types';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import { MeetingOutcomeModal } from './MeetingOutcomeModal';

interface MeetingsKanbanProps {
  onSelectLead: (leadId: string) => void;
}

export const MeetingsKanban: React.FC<MeetingsKanbanProps> = ({ onSelectLead }) => {
  const { leads, meetings, updateMeeting, rescheduleMeeting, togglePending } = useLeads();

  const [rescheduleLeadId, setRescheduleLeadId] = useState<string | null>(null);
  const [outcomeLeadId, setOutcomeLeadId] = useState<string | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // Group leads into the 5 Kanban columns strictly per requirements 40-47
  const now = new Date();

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

  const pendingLeads = leads.filter((l) => l.is_pending);

  // Drag and Drop handlers
  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDrop = async (targetColumn: string) => {
    if (!draggedLeadId) return;
    const leadId = draggedLeadId;
    setDraggedLeadId(null);

    if (targetColumn === 'count_yes' || targetColumn === 'count_no') {
      setOutcomeLeadId(leadId);
    } else if (targetColumn === 'scheduled') {
      setRescheduleLeadId(leadId);
    } else if (targetColumn === 'pending') {
      await togglePending(leadId, true);
    }
  };

  const columns = [
    {
      id: 'scheduled',
      title: 'Meeting Scheduled',
      leads: scheduledLeads,
      color: '#00C2FF',
      borderColor: 'border-[#00C2FF]/30',
      badgeBg: 'bg-[#00C2FF]/15 text-[#00C2FF]',
    },
    {
      id: 'missed',
      title: 'Missed Meetings',
      leads: missedLeads,
      color: '#F97316',
      borderColor: 'border-[#F97316]/30',
      badgeBg: 'bg-[#F97316]/15 text-[#F97316]',
    },
    {
      id: 'count_yes',
      title: 'Meeting Count YES',
      leads: countYesLeads,
      color: '#00E5A0',
      borderColor: 'border-[#00E5A0]/30',
      badgeBg: 'bg-[#00E5A0]/15 text-[#00E5A0]',
    },
    {
      id: 'count_no',
      title: 'Meeting Count NO',
      leads: countNoLeads,
      color: '#94A3B8',
      borderColor: 'border-[#94A3B8]/30',
      badgeBg: 'bg-[#94A3B8]/15 text-[#94A3B8]',
    },
    {
      id: 'pending',
      title: 'Pending YES',
      leads: pendingLeads,
      color: '#EC4899',
      borderColor: 'border-[#EC4899]/30',
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
            Drag cards across stages to synchronize database meeting records, outcomes, and pending follow-ups.
          </p>
        </div>
      </div>

      {/* 5 Column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start min-h-[600px]">
        {columns.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.id)}
            className="bg-[#0A0A0A] border border-[#1E3A5F]/70 rounded-xl flex flex-col max-h-[750px] shadow-lg overflow-hidden"
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
                  No cards in this column
                </div>
              ) : (
                col.leads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    onClick={() => onSelectLead(lead.id)}
                    className="p-3 bg-[#111827] hover:bg-[#182234] border border-[#1E3A5F] hover:border-[#00C2FF]/60 rounded-lg transition-all cursor-grab active:cursor-grabbing shadow-md text-xs space-y-2 group"
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

                    {/* Meeting Schedule Details */}
                    {lead.meeting_date && (
                      <div className="p-2 bg-[#0A0A0A] rounded border border-[#1E3A5F]/50 flex items-center justify-between text-[11px]">
                        <div className="flex items-center space-x-1.5 text-[#00C2FF]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="font-mono">{lead.meeting_date}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-[#94A3B8] font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{lead.meeting_time || 'TBD'}</span>
                        </div>
                      </div>
                    )}

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-1 text-[10px] text-[#7B7B7B]">
                      {lead.brand_name && (
                        <span className="px-1.5 py-0.5 bg-[#0E1522] rounded border border-[#1E3A5F]/40">
                          {lead.brand_name}
                        </span>
                      )}
                      {lead.account_name && (
                        <span className="px-1.5 py-0.5 bg-[#0E1522] rounded border border-[#1E3A5F]/40">
                          {lead.account_name}
                        </span>
                      )}
                    </div>

                    {/* Footer Rep & Actions */}
                    <div className="pt-2 border-t border-[#1E3A5F]/40 flex items-center justify-between text-[10px] text-[#7B7B7B]">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-[#00C2FF]" />
                        <span>{lead.assigned_user_name || 'Unassigned'}</span>
                      </div>

                      {lead.meeting_link && (
                        <a
                          href={lead.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#00C2FF] hover:underline flex items-center space-x-0.5"
                        >
                          <span>Meet</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Outcome Confirmation Modal */}
      <MeetingOutcomeModal
        leadId={outcomeLeadId}
        isOpen={Boolean(outcomeLeadId)}
        onClose={() => setOutcomeLeadId(null)}
      />

      {/* Reschedule Modal */}
      <ScheduleMeetingModal
        leadId={rescheduleLeadId}
        isOpen={Boolean(rescheduleLeadId)}
        onClose={() => setRescheduleLeadId(null)}
      />
    </div>
  );
};
