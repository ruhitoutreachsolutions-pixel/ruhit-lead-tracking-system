import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useLeads } from '../../context/LeadContext';

interface MeetingOutcomeModalProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MeetingOutcomeModal: React.FC<MeetingOutcomeModalProps> = ({
  leadId,
  isOpen,
  onClose,
}) => {
  const { leads, markMeetingDone, setMeetingCount, togglePending } = useLeads();

  const [outcomeChoice, setOutcomeChoice] = useState<'COUNT_YES' | 'COUNT_NO' | 'PENDING_YES'>('COUNT_YES');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !leadId) return null;

  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (outcomeChoice === 'PENDING_YES') {
        await setMeetingCount(lead.id, 'YES', note);
        await togglePending(lead.id, true, note);
      } else if (outcomeChoice === 'COUNT_NO') {
        await setMeetingCount(lead.id, 'NO', note);
        await togglePending(lead.id, false, note);
      } else {
        await setMeetingCount(lead.id, 'YES', note);
        await togglePending(lead.id, false, note);
      }
      onClose();
    } catch (err) {
      console.error('Failed to submit meeting outcome:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00E5A0]/10 border border-[#00E5A0]/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#00E5A0]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Meeting Outcome</h3>
              <p className="text-xs text-[#7B7B7B]">
                For {lead.first_name || lead.company_name}
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
          {/* Outcome Choice: 3 Options */}
          <div>
            <label className="block text-[#94A3B8] font-medium mb-2">
              Select Meeting Qualification & Stage Outcome:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOutcomeChoice('COUNT_YES')}
                className={`p-3 rounded-lg border text-center transition-all ${
                  outcomeChoice === 'COUNT_YES'
                    ? 'bg-[#00E5A0]/20 border-[#00E5A0] text-[#00E5A0] font-bold shadow-[0_0_12px_rgba(0,229,160,0.2)]'
                    : 'bg-[#111827] border-[#1E3A5F] text-[#7B7B7B] hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">COUNT YES</div>
                <div className="text-[10px] opacity-80 mt-0.5">Increments Count</div>
              </button>

              <button
                type="button"
                onClick={() => setOutcomeChoice('PENDING_YES')}
                className={`p-3 rounded-lg border text-center transition-all ${
                  outcomeChoice === 'PENDING_YES'
                    ? 'bg-[#F97316]/20 border-[#F97316] text-[#F97316] font-bold shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                    : 'bg-[#111827] border-[#1E3A5F] text-[#7B7B7B] hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">PENDING "YES"</div>
                <div className="text-[10px] opacity-80 mt-0.5">Active Follow-up</div>
              </button>

              <button
                type="button"
                onClick={() => setOutcomeChoice('COUNT_NO')}
                className={`p-3 rounded-lg border text-center transition-all ${
                  outcomeChoice === 'COUNT_NO'
                    ? 'bg-neutral-800 border-neutral-500 text-neutral-200 font-bold'
                    : 'bg-[#111827] border-[#1E3A5F] text-[#7B7B7B] hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">COUNT NO</div>
                <div className="text-[10px] opacity-80 mt-0.5">Done only</div>
              </button>
            </div>
            <p className="text-[10px] text-[#7B7B7B] mt-2 leading-relaxed">
              <strong>Rules:</strong> All options mark <em>Meeting Done = YES</em>. <em>COUNT YES</em> and <em>PENDING "YES"</em> increment Meeting Count KPI. <em>PENDING "YES"</em> also keeps the lead in the active Pending Kanban column for continuous follow-up.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[#94A3B8] font-medium mb-1">Outcome Notes</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Summary of meeting discussion, key takeaways, next steps..."
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
              className="px-5 py-2 text-xs font-semibold text-black bg-[#00E5A0] hover:bg-[#00E5A0]/90 rounded-lg transition-all shadow-[0_0_12px_rgba(0,229,160,0.3)] disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Outcome'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
