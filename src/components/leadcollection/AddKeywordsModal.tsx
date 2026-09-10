import React, { useState, useMemo } from 'react';
import { X, Key, Plus, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useLeads } from '../../context/LeadContext';

interface AddKeywordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSetId?: string;
}

export const AddKeywordsModal: React.FC<AddKeywordsModalProps> = ({
  isOpen,
  onClose,
  defaultSetId,
}) => {
  const { keywordSets, addKeywordSet, addKeywordsToSet } = useLeads();

  const [mode, setMode] = useState<'existing' | 'new'>(defaultSetId ? 'existing' : 'existing');
  const [selectedSetId, setSelectedSetId] = useState<string>(defaultSetId || keywordSets[0]?.id || '');
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [rawText, setRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Parse lines, deduplicate, and trim
  const { parsedKeywords, duplicateCount } = useMemo(() => {
    if (!rawText.trim()) return { parsedKeywords: [], duplicateCount: 0 };
    const lines = rawText.split('\n');
    const seen = new Set<string>();
    const unique: string[] = [];
    let dups = 0;

    for (const line of lines) {
      const clean = line.trim();
      if (!clean) continue;
      const lower = clean.toLowerCase();
      if (seen.has(lower)) {
        dups++;
      } else {
        seen.add(lower);
        unique.push(clean);
      }
    }

    return { parsedKeywords: unique, duplicateCount: dups };
  }, [rawText]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (parsedKeywords.length === 0) {
      setFeedback({ type: 'error', message: 'Please enter at least one keyword (one per line).' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'new') {
        if (!newSetName.trim()) {
          setFeedback({ type: 'error', message: 'Please enter a name for the new Keyword Set.' });
          setIsSubmitting(false);
          return;
        }

        await addKeywordSet(newSetName.trim(), newSetDescription.trim() || undefined, parsedKeywords);
        setFeedback({
          type: 'success',
          message: `Successfully created set "${newSetName.trim()}" with ${parsedKeywords.length} keyword(s)!`,
        });
      } else {
        if (!selectedSetId) {
          setFeedback({ type: 'error', message: 'Please select an existing Keyword Set.' });
          setIsSubmitting(false);
          return;
        }

        const res = await addKeywordsToSet(selectedSetId, parsedKeywords);
        setFeedback({
          type: 'success',
          message: `Added ${res.addedCount} new keyword(s) (${res.duplicatesCount} already existed in this set).`,
        });
      }

      setTimeout(() => {
        setRawText('');
        setNewSetName('');
        setNewSetDescription('');
        setIsSubmitting(false);
        onClose();
      }, 800);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save keywords.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#111827] border border-[#00C2FF]/40 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#1E3A5F] flex items-center justify-between bg-[#0E1522]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center">
              <Key className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Bulk Add Keywords</h3>
              <p className="text-[11px] text-[#7B7B7B]">
                Paste multiple keywords at once — parsed one per line.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1E3A5F] rounded text-[#94A3B8] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {feedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-[#00E5A0]/10 border-[#00E5A0]/40 text-[#00E5A0]'
                  : 'bg-red-950/30 border-red-500/40 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex bg-[#0A0A0A] p-1 rounded-lg border border-[#1E3A5F]">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                mode === 'existing'
                  ? 'bg-[#111827] text-[#00C2FF] border border-[#00C2FF]/40 shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Add to Existing Set
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                mode === 'new'
                  ? 'bg-[#111827] text-[#00C2FF] border border-[#00C2FF]/40 shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              + Create New Keyword Set
            </button>
          </div>

          {/* Set Picker or New Set Form */}
          {mode === 'existing' ? (
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                Select Keyword Set *
              </label>
              {keywordSets.length === 0 ? (
                <div className="p-3 bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg text-[#7B7B7B]">
                  No keyword sets found. Please toggle above to create your first keyword set.
                </div>
              ) : (
                <select
                  value={selectedSetId}
                  onChange={(e) => setSelectedSetId(e.target.value)}
                  required
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00C2FF]"
                >
                  {keywordSets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.description ? `(${s.description})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="space-y-3 p-3 bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl">
              <div>
                <label className="text-[11px] font-semibold text-white block mb-1">
                  New Keyword Set Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Care Services, Training, Dental Practices..."
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  required={mode === 'new'}
                  className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[#00C2FF]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-white block mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Niche target keywords for UK & Ireland campaigns"
                  value={newSetDescription}
                  onChange={(e) => setNewSetDescription(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[#00C2FF]"
                />
              </div>
            </div>
          )}

          {/* Multiline Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-white">
                Keywords List (1 per line) *
              </label>
              <div className="text-[11px] font-mono text-[#00E5A0]">
                {parsedKeywords.length} keyword(s) detected
                {duplicateCount > 0 && (
                  <span className="text-[#F97316] ml-1">({duplicateCount} duplicate(s) removed)</span>
                )}
              </div>
            </div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`homecare agency\ndomiciliary care agency\nhome care services\nlive-in care agency\ncare at home provider\nelderly care agency`}
              className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-[#00C2FF] leading-relaxed resize-y"
            />
            <p className="text-[10px] text-[#7B7B7B] mt-1">
              Tip: Paste directly from Google Sheets or Excel. Blank lines and exact duplicates are automatically filtered out.
            </p>
          </div>

          {/* Live Preview Chips */}
          {parsedKeywords.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#94A3B8] mb-1.5">Parsed Preview:</div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg">
                {parsedKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-[#111827] border border-[#00C2FF]/30 text-[11px] text-white flex items-center gap-1 font-mono"
                  >
                    <span className="text-[#00C2FF]">#{i + 1}</span> {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-[#1E3A5F] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#111827] hover:bg-[#1E3A5F] text-[#94A3B8] hover:text-white rounded-lg transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || parsedKeywords.length === 0}
              className="px-5 py-2 bg-[#00C2FF] hover:bg-[#00C2FF]/90 text-black font-semibold rounded-lg transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : `Add ${parsedKeywords.length} Keyword(s)`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};