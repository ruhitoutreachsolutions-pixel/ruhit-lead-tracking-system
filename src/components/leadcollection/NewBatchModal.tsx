import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Layers,
  Sparkles,
  MapPin,
  Key,
  Calculator,
  AlertTriangle,
  Check,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { CollectionLocation } from '../../types';

interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialKeywordSetId?: string;
  initialCountry?: string;
  initialBatchSize?: number;
  onBatchCreated?: (batchId: string) => void;
}

export const NewBatchModal: React.FC<NewBatchModalProps> = ({
  isOpen,
  onClose,
  initialKeywordSetId,
  initialCountry = 'Ireland',
  initialBatchSize = 20,
  onBatchCreated,
}) => {
  const {
    keywordSets,
    keywords,
    locations,
    getNextAvailableLocations,
    checkLocationOverlap,
    createCollectionBatch,
  } = useLeads();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const activeKeywordSets = useMemo(
    () => keywordSets.filter((s) => s.status === 'active'),
    [keywordSets]
  );

  const [selectedSetId, setSelectedSetId] = useState(
    initialKeywordSetId || activeKeywordSets[0]?.id || ''
  );
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedLocations, setSelectedLocations] = useState<CollectionLocation[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [bypassOverlap, setBypassOverlap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available countries derived from location library
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    locations.forEach((l) => {
      if (l.country) set.add(l.country);
    });
    if (set.size === 0) set.add('Ireland');
    return Array.from(set);
  }, [locations]);

  // Selected keyword set object & its keywords
  const selectedSet = useMemo(
    () => keywordSets.find((s) => s.id === selectedSetId),
    [keywordSets, selectedSetId]
  );

  const setKeywords = useMemo(
    () => keywords.filter((k) => k.keyword_set_id === selectedSetId),
    [keywords, selectedSetId]
  );

  // Count available unused locations for current selection
  const availableCountForCriteria = useMemo(() => {
    if (!selectedCountry) return 0;
    return getNextAvailableLocations(selectedCountry, selectedSetId, 9999).length;
  }, [selectedCountry, selectedSetId, getNextAvailableLocations]);

  // Handler for selecting NEXT N locations automatically
  const handleSelectNext = (count: number) => {
    setIsCustomMode(false);
    setErrorMessage(null);
    setBypassOverlap(false);

    const nextLocations = getNextAvailableLocations(selectedCountry, selectedSetId, count);
    if (nextLocations.length === 0) {
      setErrorMessage(
        `No available unused locations found for ${selectedCountry} and ${selectedSet?.name || 'this keyword set'}.`
      );
    } else if (nextLocations.length < count) {
      setErrorMessage(
        `Notice: Only ${nextLocations.length} available location(s) remaining for this criteria.`
      );
    }
    setSelectedLocations(nextLocations);
  };

  const handleApplyCustomSize = () => {
    const num = parseInt(customSizeInput, 10);
    if (isNaN(num) || num <= 0) {
      setErrorMessage('Please enter a valid positive number for custom batch size.');
      return;
    }
    handleSelectNext(num);
  };

  // Initial load auto-selection
  useEffect(() => {
    if (isOpen) {
      const setId = initialKeywordSetId || activeKeywordSets[0]?.id || '';
      setSelectedSetId(setId);
      setSelectedCountry(initialCountry);
      setBatchName('');
      setBatchNotes('');
      setBypassOverlap(false);
      setErrorMessage(null);

      // Automatically select initial batch size
      const initial = getNextAvailableLocations(initialCountry, setId, initialBatchSize);
      setSelectedLocations(initial);
    }
  }, [isOpen, initialKeywordSetId, initialCountry, initialBatchSize]);

  // Overlap verification
  const overlapInfo = useMemo(() => {
    if (selectedLocations.length === 0) return { overlapping: [] };
    return checkLocationOverlap(selectedLocations.map((l) => l.id));
  }, [selectedLocations, checkLocationOverlap]);

  const hasOverlap = overlapInfo.overlapping.length > 0;

  // Potential search combinations calculation: Keywords × Locations
  const keywordCount = setKeywords.length;
  const locationCount = selectedLocations.length;
  const combinationCount = keywordCount * locationCount;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedSetId) {
      setErrorMessage('Please select a Keyword Set.');
      return;
    }

    if (selectedLocations.length === 0) {
      setErrorMessage('Please select at least one location for this collection batch.');
      return;
    }

    if (hasOverlap && !bypassOverlap && !isAdmin) {
      setErrorMessage(
        `Cannot proceed: ${overlapInfo.overlapping.length} location(s) are already claimed by an active batch.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCollectionBatch({
        name: batchName.trim() || undefined,
        keywordSetId: selectedSetId,
        country: selectedCountry,
        locationIds: selectedLocations.map((l) => l.id),
        notes: batchNotes.trim() || undefined,
        bypassOverlap: hasOverlap && bypassOverlap && isAdmin,
      });

      if (!res.success || !res.batch) {
        setErrorMessage(res.error || 'Failed to create collection batch.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onClose();
      if (onBatchCreated) {
        onBatchCreated(res.batch.id);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error creating collection batch.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#111827] border border-[#00C2FF]/50 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 border-b border-[#1E3A5F] flex items-center justify-between bg-[#0E1522]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00C2FF]/10 border border-[#00C2FF]/40 flex items-center justify-center shadow-[0_0_12px_rgba(0,194,255,0.2)]">
              <Layers className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">New Collection Batch</h3>
              <p className="text-[11px] text-[#7B7B7B]">
                Configure and claim a location batch for external scraper execution.
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
          {errorMessage && (
            <div className="p-3 bg-red-950/30 border border-red-500/40 text-red-300 rounded-xl flex items-start gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Overlapping Warning Banner */}
          {hasOverlap && (
            <div className="p-3.5 bg-amber-950/30 border border-amber-500/50 text-amber-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>OVERLAPPING COLLECTION WARNING</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                <strong>{overlapInfo.overlapping.length}</strong> of your selected location(s) are already being processed by active{' '}
                <span className="font-mono underline font-semibold">
                  {overlapInfo.activeBatch?.batch_number || 'Batch'}
                </span>
                .
              </p>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto bg-black/40 p-2 rounded border border-amber-500/30">
                {overlapInfo.overlapping.map((l) => (
                  <span
                    key={l.id}
                    className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-200 text-[10px] font-mono border border-amber-500/30"
                  >
                    {l.city}
                  </span>
                ))}
              </div>
              {isAdmin ? (
                <label className="flex items-center space-x-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={bypassOverlap}
                    onChange={(e) => setBypassOverlap(e.target.checked)}
                    className="rounded border-amber-500 text-[#00C2FF] focus:ring-0 bg-[#0A0A0A]"
                  />
                  <span className="text-[11px] font-semibold text-white">
                    Admin Override: Continue anyway and force-claim overlapping locations
                  </span>
                </label>
              ) : (
                <p className="text-[10px] text-red-300 font-medium">
                  Please click NEXT below to pick available non-conflicting locations or contact an Admin.
                </p>
              )}
            </div>
          )}

          {/* Row 1: Keyword Set & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                A. Select Keyword Set *
              </label>
              <select
                value={selectedSetId}
                onChange={(e) => {
                  setSelectedSetId(e.target.value);
                  setErrorMessage(null);
                }}
                required
                className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00C2FF]"
              >
                {activeKeywordSets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-[#7B7B7B] mt-1 flex items-center justify-between">
                <span>{setKeywords.length} keyword(s) in this set</span>
                {setKeywords.length === 0 && (
                  <span className="text-red-400">Warning: Set has no keywords</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                B. Select Country *
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setErrorMessage(null);
                }}
                required
                className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00C2FF]"
              >
                {availableCountries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-[#00E5A0] mt-1 font-mono">
                {availableCountForCriteria} available location(s) ready in {selectedCountry}
              </div>
            </div>
          </div>

          {/* Row 2: Location Batch Quick Selectors */}
          <div className="space-y-2 p-3.5 bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00E5A0]" />
                <span>C. Auto-Select Location Batch</span>
              </label>
              <span className="text-[10px] text-[#94A3B8]">
                Selects next unused cities automatically
              </span>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {[5, 10, 15, 20].map((sz) => {
                const isCurrent = !isCustomMode && selectedLocations.length === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSelectNext(sz)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all border ${
                      isCurrent
                        ? 'bg-[#00E5A0] text-black border-[#00E5A0] shadow-[0_0_10px_rgba(0,229,160,0.2)]'
                        : 'bg-[#111827] text-white border-[#1E3A5F] hover:border-[#00E5A0]/60'
                    }`}
                  >
                    NEXT {sz}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all border ${
                  isCustomMode
                    ? 'bg-[#00C2FF] text-black border-[#00C2FF]'
                    : 'bg-[#111827] text-[#94A3B8] border-[#1E3A5F] hover:text-white'
                }`}
              >
                CUSTOM
              </button>
            </div>

            {/* Custom Input */}
            {isCustomMode && (
              <div className="flex items-center gap-2 pt-2 animate-in fade-in duration-100">
                <span className="text-[11px] text-[#94A3B8]">Custom Number:</span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  placeholder="e.g. 25, 37, 50, 100"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  className="w-32 bg-[#111827] border border-[#1E3A5F] rounded-lg px-2.5 py-1 text-white font-mono focus:border-[#00C2FF] focus:outline-none text-xs"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomSize}
                  className="px-3 py-1 bg-[#00C2FF] text-black font-semibold rounded-lg hover:bg-[#00C2FF]/90 text-xs"
                >
                  Select Next
                </button>
              </div>
            )}
          </div>

          {/* Selected Cities Tag Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-white">
                Selected Locations ({selectedLocations.length})
              </span>
              <button
                type="button"
                onClick={() => setSelectedLocations([])}
                className="text-[10px] text-[#64748B] hover:text-red-400"
              >
                Clear selection
              </button>
            </div>

            {selectedLocations.length === 0 ? (
              <div className="p-4 text-center bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl text-[#7B7B7B] text-xs">
                No locations selected. Click one of the "NEXT N" buttons above to auto-select available cities.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl">
                {selectedLocations.map((loc, i) => (
                  <span
                    key={loc.id}
                    className="px-2 py-0.5 rounded bg-[#111827] border border-[#1E3A5F] text-[11px] text-white flex items-center gap-1 font-mono"
                  >
                    <span className="text-[#00E5A0]">#{i + 1}</span> {loc.city}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedLocations((prev) => prev.filter((l) => l.id !== loc.id))
                      }
                      className="text-[#64748B] hover:text-red-400 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* THEORETICAL COMBINATIONS PREVIEW BOX */}
          <div className="p-4 bg-[#0A0A0A] border border-[#00C2FF]/40 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-2">
              <div className="font-bold text-white text-xs flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#00C2FF]" />
                <span>COLLECTION BATCH PREVIEW</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#00C2FF]/15 text-[#00C2FF] font-mono text-[10px] font-semibold uppercase">
                STATUS: READY
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <div className="text-[10px] text-[#7B7B7B]">Keyword Set</div>
                <div className="font-semibold text-white truncate">
                  {selectedSet?.name || 'None'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#7B7B7B]">Keywords Count</div>
                <div className="font-mono font-semibold text-[#00C2FF]">
                  {keywordCount} keywords
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#7B7B7B]">Locations Count</div>
                <div className="font-mono font-semibold text-[#00E5A0]">
                  {locationCount} locations
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#7B7B7B]">Potential Searches</div>
                <div className="font-mono font-bold text-white">
                  {keywordCount} × {locationCount} ={' '}
                  <span className="text-[#00C2FF] text-sm font-bold">
                    {combinationCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Name & Notes (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                Batch Name (Optional)
              </label>
              <input
                type="text"
                placeholder={
                  selectedSet
                    ? `${selectedSet.name} — ${selectedCountry} — ${locationCount} Locations`
                    : 'Auto-generated if empty'
                }
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[#00C2FF] text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                Batch Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. For Google Maps scraper, targeting direct numbers..."
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-[#00C2FF] text-xs"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              disabled={
                isSubmitting ||
                selectedLocations.length === 0 ||
                setKeywords.length === 0 ||
                (hasOverlap && !bypassOverlap && !isAdmin)
              }
              className="px-5 py-2 bg-[#00C2FF] hover:bg-[#00C2FF]/90 text-black font-semibold rounded-lg transition-colors text-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Batch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};