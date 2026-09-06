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

  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  const [isPending, setIsPending] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !leadId) return null;

  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Set Meeting Done and Meeting Count
      await setMeetingCount(lead.id, outcome, note);
      if (isPending) {
        await togglePending(lead.id, true, note);
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
          {/* Outcome Choice */}
          <div>
            <label className="block text-[#94A3B8] font-medium mb-2">
              Did this meeting qualify for Meeting Count?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOutcome('YES')}
                className={`p-3 rounded-lg border text-center transition-all ${
                  outcome === 'YES'
                    ? 'bg-[#00E5A0]/20 border-[#00E5A0] text-[#00E5A0] font-bold shadow-[0_0_12px_rgba(0,229,160,0.2)]'
                    : 'bg-[#111827] border-[#1E3A5F] text-[#7B7B7B] hover:text-white'
                }`}
              >
                <div className="text-sm font-bold">COUNT YES</div>
                <div className="text-[10px] opacity-80 mt-0.5">Increments Total Count</div>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('NO')}
                className={`p-3 rounded-lg border text-center transition-all ${
                  outcome === 'NO'
                    ? 'bg-[#F97316]/20 border-[#F97316] text-[#F97316] font-bold shadow-[0_0_12px_rgba(249,115,22,0.2)]'
                    : 'bg-[#111827] border-[#1E3A5F] text-[#7B7B7B] hover:text-white'
                }`}
              >
                <div className="text-sm font-bold">COUNT NO</div>
                <div className="text-[10px] opacity-80 mt-0.5">Meeting Done only</div>
              </button>
            </div>
            <p className="text-[10px] text-[#7B7B7B] mt-2 leading-relaxed">
              <strong>Crucial Rule:</strong> Both options mark <em>Meeting Done = YES</em> in the database. Only <em>COUNT YES</em> increments the official Meeting Count KPI.
            </p>
          </div>

          {/* Pending Toggle */}
          <div className="p-3 bg-[#111827] border border-[#1E3A5F]/60 rounded-lg flex items-center justify-between">
            <div>
              <span className="font-semibold text-white">Require Pending Follow-up?</span>
              <p className="text-[10px] text-[#7B7B7B]">Keeps lead active in the Pending column</p>
            </div>
            <input
              type="checkbox"
              checked={isPending}
              onChange={(e) => setIsPending(e.target.checked)}
              className="w-4 h-4 rounded border-[#1E3A5F] text-[#F97316] bg-[#0A0A0A]"
            />
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
