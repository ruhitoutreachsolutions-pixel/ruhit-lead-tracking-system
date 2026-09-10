import React, { useState, useMemo } from 'react';
import { X, MapPin, Plus, Check, AlertCircle, Globe } from 'lucide-react';
import { useLeads } from '../../context/LeadContext';

interface AddLocationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCountry?: string;
}

const COMMON_COUNTRIES = [
  'Ireland',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'New Zealand',
  'Germany',
  'France',
  'Netherlands',
];

export const AddLocationsModal: React.FC<AddLocationsModalProps> = ({
  isOpen,
  onClose,
  defaultCountry = 'Ireland',
}) => {
  const { bulkImportLocations } = useLeads();

  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [customCountry, setCustomCountry] = useState('');
  const [rawText, setRawText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const effectiveCountry = selectedCountry === 'Other' ? customCountry.trim() : selectedCountry;

  // Live parser
  const { parsedLocations, duplicateCount } = useMemo(() => {
    if (!rawText.trim()) return { parsedLocations: [], duplicateCount: 0 };
    const lines = rawText.split('\n');
    const seen = new Set<string>();
    const unique: { city: string; country: string }[] = [];
    let dups = 0;

    for (const line of lines) {
      const clean = line.trim();
      if (!clean) continue;

      let city = clean;
      let country = effectiveCountry || 'Ireland';

      if (clean.includes(',')) {
        const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          city = parts[0];
          country = parts[parts.length - 1]; // last element as country
        }
      }

      const key = `${city.toLowerCase()}, ${country.toLowerCase()}`;
      if (seen.has(key)) {
        dups++;
      } else {
        seen.add(key);
        unique.push({ city, country });
      }
    }

    return { parsedLocations: unique, duplicateCount: dups };
  }, [rawText, effectiveCountry]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (parsedLocations.length === 0) {
      setFeedback({ type: 'error', message: 'Please enter at least one location (one per line).' });
      return;
    }

    setIsSubmitting(true);
    try {
      const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
      const res = await bulkImportLocations(lines, effectiveCountry || 'Ireland');

      setFeedback({
        type: 'success',
        message: `Successfully imported ${res.importedCount} new location(s)! (${res.duplicatesCount} already existed in your library).`,
      });

      setTimeout(() => {
        setRawText('');
        setIsSubmitting(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to import locations.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#111827] border border-[#00C2FF]/40 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-[#1E3A5F] flex items-center justify-between bg-[#0E1522]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00E5A0]/10 border border-[#00E5A0]/30 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#00E5A0]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Bulk Add Locations</h3>
              <p className="text-[11px] text-[#7B7B7B]">
                Import cities or "City, Country" pairs in bulk for scraper batches.
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

        {/* Body */}
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

          {/* Default Country Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                Default Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00C2FF]"
              >
                {COMMON_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Other">Other (Type custom country...)</option>
              </select>
            </div>

            {selectedCountry === 'Other' && (
              <div>
                <label className="text-[11px] font-semibold text-white block mb-1">
                  Custom Country Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Singapore, South Africa..."
                  value={customCountry}
                  onChange={(e) => setCustomCountry(e.target.value)}
                  required
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00C2FF]"
                />
              </div>
            )}
          </div>

          {/* Multiline Locations Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-white">
                Locations List (1 per line) *
              </label>
              <div className="text-[11px] font-mono text-[#00E5A0]">
                {parsedLocations.length} location(s) detected
                {duplicateCount > 0 && (
                  <span className="text-[#F97316] ml-1">({duplicateCount} duplicate(s) removed)</span>
                )}
              </div>
            </div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Longford, Ireland\nDungarvan, Ireland\nNenagh, Ireland\nTrim, Ireland\nNew Ross, Ireland\n(or just city names)`}
              className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-[#00C2FF] leading-relaxed resize-y"
            />
            <p className="text-[10px] text-[#7B7B7B] mt-1">
              Formats accepted: <code className="text-[#00C2FF]">Longford, Ireland</code> or just <code className="text-[#00C2FF]">Longford</code> (which auto-assigns the selected default country).
            </p>
          </div>

          {/* Live Preview */}
          {parsedLocations.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#94A3B8] mb-1.5">Parsed Preview:</div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg">
                {parsedLocations.map((loc, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-[#111827] border border-[#00E5A0]/30 text-[11px] text-white flex items-center gap-1 font-mono"
                  >
                    <span className="text-[#00E5A0]">#{i + 1}</span>
                    <span>{loc.city}</span>
                    <span className="text-[#7B7B7B]">({loc.country})</span>
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
              disabled={isSubmitting || parsedLocations.length === 0}
              className="px-5 py-2 bg-[#00E5A0] hover:bg-[#00E5A0]/90 text-black font-semibold rounded-lg transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : `Import ${parsedLocations.length} Location(s)`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};