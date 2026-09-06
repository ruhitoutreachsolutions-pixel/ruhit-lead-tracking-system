import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Phone,
  User,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { Reminder } from '../../types';
import { formatTo12Hour } from '../../lib/formatTime';

interface RemindersViewProps {
  onSelectLead: (leadId: string) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({ onSelectLead }) => {
  const { reminders, leads, completeReminder, snoozeReminder, deleteReminder, addReminder } = useLeads();
  const { currentUser } = useAuth();

  const [filterState, setFilterState] = useState<'pending' | 'completed' | 'all'>('pending');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [reminderType, setReminderType] = useState('Follow-up Call');
  const [reminderDate, setReminderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reminderTime, setReminderTime] = useState('11:00');
  const [note, setNote] = useState('');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const filteredReminders = reminders.filter((r) => {
    if (filterState === 'pending') return !r.is_completed;
    if (filterState === 'completed') return r.is_completed;
    return true;
  });

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !reminderDate || !reminderTime) return;

    const lead = leads.find((l) => l.id === selectedLeadId);
    await addReminder({
      lead_id: selectedLeadId,
      lead_name: `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim() || lead?.company_name,
      lead_company: lead?.company_name,
      reminder_type: reminderType,
      reminder_date: reminderDate,
      reminder_time: reminderTime,
      note,
      user_id: currentUser.id,
      is_completed: false,
    });

    setIsAdding(false);
    setNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#00C2FF]" />
            <span>Lead Follow-up Reminders</span>
          </h2>
          <p className="text-xs text-[#7B7B7B] mt-0.5">
            Track scheduled follow-ups, calls, and outreach tasks.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Filter toggle */}
          <div className="flex items-center space-x-1 bg-[#111827] p-1 rounded-lg border border-[#1E3A5F] text-xs">
            <button
              onClick={() => setFilterState('pending')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                filterState === 'pending'
                  ? 'bg-[#00C2FF] text-black shadow-[0_0_10px_rgba(0,194,255,0.2)]'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Pending ({reminders.filter((r) => !r.is_completed).length})
            </button>
            <button
              onClick={() => setFilterState('completed')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                filterState === 'completed'
                  ? 'bg-[#00C2FF] text-black'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Completed ({reminders.filter((r) => r.is_completed).length})
            </button>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#00E5A0] text-black font-semibold text-xs rounded-lg hover:bg-[#00E5A0]/90 transition-all shadow-[0_0_12px_rgba(0,229,160,0.3)]"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" />
            <span>+ Add Reminder</span>
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateReminder}
          className="p-5 bg-[#111827] border border-[#00C2FF]/40 rounded-xl space-y-4 text-xs animate-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">Schedule New Follow-up Reminder</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-[#7B7B7B] hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Target Lead</label>
              <select
                required
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg p-2 focus:border-[#00C2FF]"
              >
                <option value="">-- Choose Lead --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.first_name || l.last_name ? `${l.first_name || ''} ${l.last_name || ''}`.trim() : l.email} ({l.company_name || 'No Co'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Reminder Type</label>
              <select
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg p-2 focus:border-[#00C2FF]"
              >
                <option value="Follow-up Call">Follow-up Call</option>
                <option value="Send WhatsApp">Send WhatsApp</option>
                <option value="Check Response">Check Response</option>
                <option value="Contract Review">Contract Review</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Date</label>
              <input
                type="date"
                required
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg p-2 focus:border-[#00C2FF]"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Time</label>
              <input
                type="time"
                required
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg p-2 focus:border-[#00C2FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#94A3B8] font-medium mb-1">Reminder Note / Task</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Call John regarding revised Q3 quote..."
              className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg p-2 focus:border-[#00C2FF]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-[#00E5A0] text-black font-semibold rounded-lg hover:bg-[#00E5A0]/90"
            >
              Save Reminder
            </button>
          </div>
        </form>
      )}

      {/* Reminders List */}
      <div className="space-y-3">
        {filteredReminders.length === 0 ? (
          <div className="p-12 text-center bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl text-[#7B7B7B] text-xs">
            <Clock className="w-8 h-8 text-[#00C2FF]/40 mx-auto mb-2" />
            <p>No reminders found in this view.</p>
          </div>
        ) : (
          filteredReminders.map((rem) => {
            const isOverdue = !rem.is_completed && rem.reminder_date < todayStr;
            const isToday = !rem.is_completed && rem.reminder_date === todayStr;

            return (
              <div
                key={rem.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  rem.is_completed
                    ? 'bg-[#0E1522] border-[#1E3A5F]/30 opacity-60'
                    : isOverdue
                    ? 'bg-[#181116] border-[#F97316]/50 shadow-[0_0_12px_rgba(249,115,22,0.1)]'
                    : isToday
                    ? 'bg-[#111827] border-[#00C2FF]/40 shadow-[0_0_12px_rgba(0,194,255,0.1)]'
                    : 'bg-[#111827] border-[#1E3A5F]'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {rem.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[#00E5A0]" />
                    ) : isOverdue ? (
                      <AlertTriangle className="w-5 h-5 text-[#F97316]" />
                    ) : (
                      <Clock className="w-5 h-5 text-[#00C2FF]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-sm font-bold text-white ${rem.is_completed ? 'line-through' : ''}`}>
                        {rem.note || rem.reminder_type}
                      </h4>
                      {isOverdue && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-[#F97316]/20 text-[#F97316] font-bold">
                          OVERDUE
                        </span>
                      )}
                      {isToday && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-[#00C2FF]/20 text-[#00C2FF] font-bold">
                          TODAY
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#94A3B8] mt-1">
                      <span
                        onClick={() => onSelectLead(rem.lead_id)}
                        className="text-[#00C2FF] font-medium hover:underline cursor-pointer flex items-center space-x-1"
                      >
                        <span>{rem.lead_name || 'Prospect'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                      {rem.lead_company && <span>? {rem.lead_company}</span>}
                      <span className="font-mono text-[11px] text-[#7B7B7B]">
                        📅 {rem.reminder_date} at {formatTo12Hour(rem.reminder_time)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  {!rem.is_completed ? (
                    <>
                      <button
                        onClick={() => snoozeReminder(rem.id, 1)}
                        className="px-2.5 py-1 text-xs bg-[#0A0A0A] hover:bg-[#182234] text-[#94A3B8] hover:text-white border border-[#1E3A5F] rounded-lg transition-colors"
                        title="Snooze 1 Day"
                      >
                        +1 Day
                      </button>
                      <button
                        onClick={() => snoozeReminder(rem.id, 3)}
                        className="px-2.5 py-1 text-xs bg-[#0A0A0A] hover:bg-[#182234] text-[#94A3B8] hover:text-white border border-[#1E3A5F] rounded-lg transition-colors"
                        title="Snooze 3 Days"
                      >
                        +3 Days
                      </button>
                      <button
                        onClick={() => completeReminder(rem.id)}
                        className="flex items-center space-x-1 px-3 py-1 text-xs bg-[#00E5A0]/15 hover:bg-[#00E5A0]/25 text-[#00E5A0] border border-[#00E5A0]/40 rounded-lg font-medium transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-[#7B7B7B] italic">Completed</span>
                  )}

                  <button
                    onClick={() => deleteReminder(rem.id)}
                    className="p-1.5 text-[#7B7B7B] hover:text-red-400 rounded hover:bg-red-950/40 transition-colors"
                    title="Delete Reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
