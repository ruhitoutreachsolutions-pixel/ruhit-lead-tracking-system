import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Building,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Plus,
  Send,
  Flag,
  Share2,
  ExternalLink,
  Tag,
  History,
  PhoneCall
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { Lead } from '../../types';

interface LeadDetailModalProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenScheduleMeeting?: (leadId: string) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  leadId,
  isOpen,
  onClose,
  onOpenScheduleMeeting,
}) => {
  const {
    leads,
    activities,
    reminders,
    updateLead,
    markInterested,
    markMeetingDone,
    setMeetingCount,
    togglePending,
    recordWhatsAppSent,
    recordCallDone,
    addNote,
    addReminder,
    completeReminder,
  } = useLeads();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'reminders'>('timeline');
  const [newNote, setNewNote] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('11:00');
  const [newReminderNote, setNewReminderNote] = useState('');
  const [isAddingReminder, setIsAddingReminder] = useState(false);

  if (!isOpen || !leadId) return null;

  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return null;

  const leadActivities = activities.filter((a) => a.lead_id === leadId);
  const leadReminders = reminders.filter((r) => r.lead_id === leadId);

  const handleSendWhatsApp = () => {
    if (!lead.whatsapp_number) return;
    const cleanNum = lead.whatsapp_number.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNum}`, '_blank');
    recordWhatsAppSent(lead.id, `Opened WhatsApp link for ${lead.whatsapp_number}`);
  };

  const handleRecordCall = () => {
    recordCallDone(lead.id, 'Logged completed call with lead');
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    await addNote(lead.id, newNote.trim());
    setNewNote('');
  };

  const handleAddReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderDate || !newReminderTime) return;
    await addReminder({
      lead_id: lead.id,
      lead_name: `${lead.first_name} ${lead.last_name}`.trim() || lead.company_name,
      lead_company: lead.company_name,
      reminder_type: 'Follow-up',
      reminder_date: newReminderDate,
      reminder_time: newReminderTime,
      note: newReminderNote,
      user_id: currentUser.id,
      is_completed: false,
    });
    setNewReminderDate('');
    setNewReminderNote('');
    setIsAddingReminder(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-5 border-b border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#182234] border border-[#00C2FF]/40 flex items-center justify-center text-[#00C2FF] font-bold text-base">
              {lead.first_name ? lead.first_name[0] : lead.company_name ? lead.company_name[0] : 'L'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  {lead.first_name || lead.last_name
                    ? `${lead.first_name} ${lead.last_name}`.trim()
                    : 'Unnamed Prospect'}
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                    lead.priority === 'High'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : lead.priority === 'DNC'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-[#1E3A5F]/40 text-[#94A3B8]'
                  }`}
                >
                  {lead.priority}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] flex items-center space-x-2 mt-0.5">
                <span>{lead.company_name || 'No Company'}</span>
                {lead.country && <span>? {lead.country}</span>}
                <span className="text-[#00C2FF] font-mono">? {lead.email}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1 text-[#7B7B7B] hover:text-white rounded hover:bg-[#1E3A5F]/40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Quick Bar */}
        <div className="px-6 py-2.5 bg-[#0E1522] border-b border-[#1E3A5F]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            {lead.whatsapp_number ? (
              <button
                onClick={handleSendWhatsApp}
                className="flex items-center space-x-1.5 px-3 py-1 bg-[#00E5A0]/15 hover:bg-[#00E5A0]/25 text-[#00E5A0] border border-[#00E5A0]/40 rounded-lg transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp ({lead.whatsapp_number})</span>
              </button>
            ) : (
              <span className="text-[#7B7B7B] italic text-[11px]">No WhatsApp Number</span>
            )}

            <button
              onClick={handleRecordCall}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#111827] hover:bg-[#182234] text-[#94A3B8] hover:text-white border border-[#1E3A5F] rounded-lg transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#00C2FF]" />
              <span>Log Call Done</span>
            </button>

            {onOpenScheduleMeeting && (
              <button
                onClick={() => onOpenScheduleMeeting(lead.id)}
                className="flex items-center space-x-1.5 px-3 py-1 bg-[#00C2FF]/15 hover:bg-[#00C2FF]/25 text-[#00C2FF] border border-[#00C2FF]/40 rounded-lg transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Meeting</span>
              </button>
            )}
          </div>

          {/* Pending Toggle */}
          <button
            onClick={() => togglePending(lead.id, !lead.is_pending)}
            className={`px-3 py-1 rounded-lg border font-medium transition-all ${
              lead.is_pending
                ? 'bg-[#F97316]/20 border-[#F97316] text-[#F97316] shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                : 'bg-[#111827] border-[#1E3A5F] text-[#7B7B7B] hover:text-white'
            }`}
          >
            Pending: {lead.is_pending ? 'YES' : 'NO'}
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* Left Column: Details & Milestone Engine */}
          <div className="lg:col-span-1 space-y-5">
            {/* Cumulative Milestone Progress Card */}
            <div className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider text-[#00C2FF]">
                Cumulative Lifecycle Milestones
              </h4>

              {/* Stage 1: Interested */}
              <div className="p-2.5 rounded-lg bg-[#0A0A0A] border border-[#1E3A5F]/40 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      lead.is_interested ? 'bg-[#00E5A0]' : 'bg-[#1E3A5F]'
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-white">Stage 1 ? Interested</span>
                    {lead.interested_at && (
                      <p className="text-[10px] text-[#7B7B7B]">
                        {new Date(lead.interested_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {!lead.is_interested && (
                  <button
                    onClick={() => markInterested(lead.id)}
                    className="text-[10px] px-2 py-0.5 bg-[#00C2FF]/15 text-[#00C2FF] rounded hover:bg-[#00C2FF]/30"
                  >
                    Mark YES
                  </button>
                )}
              </div>

              {/* Stage 2: Meeting Scheduled */}
              <div className="p-2.5 rounded-lg bg-[#0A0A0A] border border-[#1E3A5F]/40 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      lead.is_meeting_scheduled ? 'bg-[#00E5A0]' : 'bg-[#1E3A5F]'
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-white">Stage 2 ? Meeting Sched</span>
                    {lead.meeting_date && (
                      <p className="text-[10px] text-[#00C2FF]">
                        {lead.meeting_date} at {lead.meeting_time || 'TBD'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stage 3: Meeting Done */}
              <div className="p-2.5 rounded-lg bg-[#0A0A0A] border border-[#1E3A5F]/40 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      lead.is_meeting_done ? 'bg-[#00E5A0]' : 'bg-[#1E3A5F]'
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-white">Stage 3 ? Meeting Done</span>
                    {lead.meeting_done_at && (
                      <p className="text-[10px] text-[#7B7B7B]">
                        {new Date(lead.meeting_done_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {!lead.is_meeting_done && (
                  <button
                    onClick={() => markMeetingDone(lead.id)}
                    className="text-[10px] px-2 py-0.5 bg-[#00E5A0]/15 text-[#00E5A0] rounded hover:bg-[#00E5A0]/30"
                  >
                    Mark Done
                  </button>
                )}
              </div>

              {/* Stage 4: Meeting Count (YES / NO) */}
              <div className="p-2.5 rounded-lg bg-[#0A0A0A] border border-[#1E3A5F]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Stage 4 ? Meeting Count</span>
                  <span
                    className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                      lead.meeting_count_type === 'YES'
                        ? 'bg-[#00E5A0]/20 text-[#00E5A0]'
                        : lead.meeting_count_type === 'NO'
                        ? 'bg-[#F97316]/20 text-[#F97316]'
                        : 'bg-[#1E3A5F]/40 text-[#7B7B7B]'
                    }`}
                  >
                    {lead.meeting_count_type || 'NOT SET'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setMeetingCount(lead.id, 'YES')}
                    className={`py-1 rounded font-medium border text-center transition-all ${
                      lead.meeting_count_type === 'YES'
                        ? 'bg-[#00E5A0] text-black border-[#00E5A0]'
                        : 'bg-[#111827] text-[#94A3B8] border-[#1E3A5F] hover:text-white'
                    }`}
                  >
                    Count YES
                  </button>
                  <button
                    onClick={() => setMeetingCount(lead.id, 'NO')}
                    className={`py-1 rounded font-medium border text-center transition-all ${
                      lead.meeting_count_type === 'NO'
                        ? 'bg-[#F97316] text-black border-[#F97316]'
                        : 'bg-[#111827] text-[#94A3B8] border-[#1E3A5F] hover:text-white'
                    }`}
                  >
                    Count NO
                  </button>
                </div>
                <p className="text-[10px] text-[#7B7B7B] leading-tight">
                  Rule: Meeting Count NO counts as Meeting Done, but does NOT increment Total Meeting Count.
                </p>
              </div>
            </div>

            {/* Campaign & Assignment Metadata */}
            <div className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-white uppercase text-[11px] text-[#94A3B8]">
                Outbound Metadata
              </h4>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-[#7B7B7B]">Campaign:</span>
                  <span className="text-white font-medium">{lead.campaign_name || '?'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7B7B7B]">Brand:</span>
                  <span className="text-white font-medium">{lead.brand_name || '?'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7B7B7B]">Account:</span>
                  <span className="text-white font-medium">{lead.account_name || '?'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7B7B7B]">Assigned Rep:</span>
                  <span className="text-[#00C2FF] font-medium">{lead.assigned_user_name || '?'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7B7B7B]">Created:</span>
                  <span className="text-[#94A3B8] font-mono text-[11px]">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tabbed Timeline, Notes, and Reminders */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
            {/* Tabs Header */}
            <div className="flex items-center space-x-3 border-b border-[#1E3A5F] pb-2">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center space-x-1.5 pb-2 text-xs font-semibold transition-all ${
                  activeTab === 'timeline'
                    ? 'text-[#00C2FF] border-b-2 border-[#00C2FF]'
                    : 'text-[#7B7B7B] hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Activity Timeline ({leadActivities.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center space-x-1.5 pb-2 text-xs font-semibold transition-all ${
                  activeTab === 'notes'
                    ? 'text-[#00C2FF] border-b-2 border-[#00C2FF]'
                    : 'text-[#7B7B7B] hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Notes Log</span>
              </button>
              <button
                onClick={() => setActiveTab('reminders')}
                className={`flex items-center space-x-1.5 pb-2 text-xs font-semibold transition-all ${
                  activeTab === 'reminders'
                    ? 'text-[#00C2FF] border-b-2 border-[#00C2FF]'
                    : 'text-[#7B7B7B] hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Reminders ({leadReminders.length})</span>
              </button>
            </div>

            {/* Tab: Activity Timeline */}
            {activeTab === 'timeline' && (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-96 pr-2">
                {leadActivities.length === 0 ? (
                  <p className="text-center py-10 text-[#7B7B7B]">No activity recorded yet.</p>
                ) : (
                  leadActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 bg-[#111827] border border-[#1E3A5F]/60 rounded-lg flex items-start space-x-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#00C2FF] mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{act.activity_type}</span>
                          <span className="text-[10px] text-[#7B7B7B] font-mono">
                            {new Date(act.created_at).toLocaleDateString()} {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {act.description && (
                          <p className="text-[#94A3B8] text-[11px] mt-0.5 leading-relaxed">
                            {act.description}
                          </p>
                        )}
                        {act.user_name && (
                          <span className="text-[10px] text-[#00C2FF]/70 block mt-1">
                            By {act.user_name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Notes Log */}
            {activeTab === 'notes' && (
              <div className="space-y-4 flex-1 flex flex-col">
                <form onSubmit={handleAddNoteSubmit} className="space-y-2">
                  <textarea
                    rows={3}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write a note about this lead or conversation..."
                    className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg p-3 text-xs focus:outline-none focus:border-[#00C2FF]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newNote.trim()}
                      className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#00C2FF] text-black font-semibold rounded-lg hover:bg-[#00C2FF]/90 transition-all disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>Post Note</span>
                    </button>
                  </div>
                </form>

                <div className="border-t border-[#1E3A5F]/60 pt-3">
                  <h5 className="font-semibold text-white mb-2 text-[11px] uppercase tracking-wider text-[#94A3B8]">
                    Existing Notes History
                  </h5>
                  <div className="p-3 bg-[#111827] border border-[#1E3A5F] rounded-lg whitespace-pre-wrap font-mono text-[11px] text-[#94A3B8] leading-relaxed max-h-60 overflow-y-auto">
                    {lead.notes || 'No notes currently recorded for this prospect.'}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Reminders */}
            {activeTab === 'reminders' && (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Lead Follow-up Reminders</span>
                  <button
                    onClick={() => setIsAddingReminder(!isAddingReminder)}
                    className="text-xs text-[#00C2FF] hover:underline"
                  >
                    {isAddingReminder ? 'Cancel' : '+ Set New Reminder'}
                  </button>
                </div>

                {isAddingReminder && (
                  <form
                    onSubmit={handleAddReminderSubmit}
                    className="p-3 bg-[#111827] border border-[#00C2FF]/30 rounded-lg space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#94A3B8] text-[11px] mb-1">Date</label>
                        <input
                          type="date"
                          required
                          value={newReminderDate}
                          onChange={(e) => setNewReminderDate(e.target.value)}
                          className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-1.5 focus:border-[#00C2FF]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#94A3B8] text-[11px] mb-1">Time</label>
                        <input
                          type="time"
                          required
                          value={newReminderTime}
                          onChange={(e) => setNewReminderTime(e.target.value)}
                          className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-1.5 focus:border-[#00C2FF]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#94A3B8] text-[11px] mb-1">Reminder Note</label>
                      <input
                        type="text"
                        placeholder="e.g. Call back regarding quote"
                        value={newReminderNote}
                        onChange={(e) => setNewReminderNote(e.target.value)}
                        className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-1.5 focus:border-[#00C2FF]"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#00E5A0] text-black font-semibold rounded hover:bg-[#00E5A0]/90"
                      >
                        Save Reminder
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {leadReminders.length === 0 ? (
                    <p className="text-center py-8 text-[#7B7B7B]">No reminders set for this lead.</p>
                  ) : (
                    leadReminders.map((rem) => (
                      <div
                        key={rem.id}
                        className={`p-3 rounded-lg border flex items-center justify-between ${
                          rem.is_completed
                            ? 'bg-[#111827]/40 border-[#1E3A5F]/30 opacity-60'
                            : 'bg-[#111827] border-[#1E3A5F]'
                        }`}
                      >
                        <div>
                          <p className={`font-semibold text-white ${rem.is_completed ? 'line-through' : ''}`}>
                            {rem.note || 'Follow up'}
                          </p>
                          <span className="text-[10px] text-[#00C2FF] font-mono">
                            {rem.reminder_date} at {rem.reminder_time}
                          </span>
                        </div>
                        {!rem.is_completed && (
                          <button
                            onClick={() => completeReminder(rem.id)}
                            className="text-[11px] px-2 py-1 bg-[#00E5A0]/15 text-[#00E5A0] border border-[#00E5A0]/30 rounded hover:bg-[#00E5A0]/25"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
