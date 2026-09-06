import React, { useState } from 'react';
import { X, Calendar, Clock, Video, FileText } from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { formatTo12Hour } from '../../lib/formatTime';

interface ScheduleMeetingModalProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  leadId,
  isOpen,
  onClose,
}) => {
  const { leads, scheduleMeeting } = useLeads();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [meetingType, setMeetingType] = useState('Google Meet');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !leadId) return null;

  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    setIsSubmitting(true);
    try {
      // Form ISO timestamp string
      const scheduledIso = new Date(`${date}T${time}:00`).toISOString();
      await scheduleMeeting(lead.id, {
        scheduled_at: scheduledIso,
        meeting_date: date,
        meeting_time: time,
        duration_minutes: duration,
        meeting_link: meetingLink,
        meeting_type: meetingType,
        notes,
      });
      onClose();
    } catch (err) {
      console.error('Failed to schedule meeting:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Schedule Meeting</h3>
              <p className="text-xs text-[#7B7B7B]">
                With {lead.first_name || lead.company_name} ({lead.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#7B7B7B] hover:text-white rounded hover:bg-[#1E3A5F]/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Meeting Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg p-2 focus:border-[#00C2FF]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#94A3B8] font-medium">Meeting Time</label>
                <span className="text-[#00C2FF] font-mono font-bold text-xs">{formatTo12Hour(time)}</span>
              </div>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg p-2 focus:border-[#00C2FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Meeting Type</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg p-2 focus:border-[#00C2FF]"
              >
                <option value="Google Meet">Google Meet</option>
                <option value="Zoom">Zoom</option>
                <option value="Phone Call">Phone Call</option>
                <option value="Microsoft Teams">Microsoft Teams</option>
              </select>
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Duration (Minutes)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg p-2 focus:border-[#00C2FF]"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#94A3B8] font-medium mb-1">Meeting Link / Location</label>
            <input
              type="text"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/xyz-abcd-efg"
              className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg p-2 focus:border-[#00C2FF]"
            />
          </div>

          <div>
            <label className="block text-[#94A3B8] font-medium mb-1">Agenda / Meeting Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Discussion topics, preliminary requirements..."
              className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg p-2 focus:border-[#00C2FF]"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#1E3A5F] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#7B7B7B] hover:text-white rounded-lg hover:bg-[#111827]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-black bg-[#00C2FF] hover:bg-[#00C2FF]/90 rounded-lg transition-all shadow-[0_0_12px_rgba(0,194,255,0.3)] disabled:opacity-50"
            >
              {isSubmitting ? 'Scheduling...' : 'Confirm & Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
