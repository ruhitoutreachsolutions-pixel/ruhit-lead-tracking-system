import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  MapPin,
  Tag,
  Hash,
  ArrowRight,
  Info,
} from 'lucide-react';
import { CollectionBatch, CollectionLocation } from '../../types';
import { useLeads } from '../../context/LeadContext';

interface CompleteBatchModalProps {
  batch: CollectionBatch;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (completedBatch: CollectionBatch, createNext: boolean) => void;
}

export const CompleteBatchModal: React.FC<CompleteBatchModalProps> = ({
  batch,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { locations, completeCollectionBatch } = useLeads();

  const [leadsCollected, setLeadsCollected] = useState<string>('');
  const [notes, setNotes] = useState<string>(batch.notes || '');
  const [isPartial, setIsPartial] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Map batch locations
  const batchLocs = batch.locations || [];
  const [selectedLocIds, setSelectedLocIds] = useState<Set<string>>(
    () => new Set(batchLocs.map((l) => l.location_id))
  );

  if (!isOpen) return null;

  const totalPossible = (batch.keyword_count || 0) * (batch.location_count || 0);

  const toggleLocation = (id: string) => {
    setSelectedLocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedLocIds(new Set(batchLocs.map((l) => l.location_id)));
  };

  const handleDeselectAll = () => {
    setSelectedLocIds(new Set());
  };

  const handleSubmit = async (createNext: boolean = false) => {
    const leadsNum = parseInt(leadsCollected, 10);
    if (isNaN(leadsNum) || leadsNum < 0) {
      setErrorMessage('Please enter a valid non-negative number for Total Leads Collected.');
      return;
    }

    if (isPartial && selectedLocIds.size === 0) {
      setErrorMessage('Partial completion requires at least one location to be marked as completed.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const completedIds = isPartial ? Array.from(selectedLocIds) : undefined;
      await completeCollectionBatch(batch.id, leadsNum, notes, isPartial, completedIds);

      if (onSuccess) {
        onSuccess(batch, createNext);
      }
      onClose();
    } catch (err) {
      console.error('Failed to complete batch:', err);
      setErrorMessage('Failed to complete batch. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0A0E17] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,194,255,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                COMPLETE SCRAPING BATCH
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  {batch.batch_code || batch.name}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Record your final scraping results and return unused locations to the available pool.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Batch Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-cyan-400" /> Keyword Set
              </span>
              <span className="text-sm font-semibold text-white truncate block">
                {batch.keyword_set_name || 'Custom'}
              </span>
              <span className="text-xs text-cyan-400 font-mono">
                {batch.keyword_count} keywords
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" /> Target
              </span>
              <span className="text-sm font-semibold text-white truncate block">
                {batch.country}
              </span>
              <span className="text-xs text-emerald-400 font-mono">
                {batch.location_count} cities
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3 text-purple-400" /> Total Combos
              </span>
              <span className="text-sm font-semibold text-white font-mono">
                {totalPossible.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">K × L pairs</span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Batch Status
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {batch.status}
              </span>
            </div>
          </div>

          {/* Lead Count Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Total Leads Collected <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={leadsCollected}
                onChange={(e) => setLeadsCollected(e.target.value)}
                placeholder="e.g. 4827"
                className="w-full px-4 py-3 pl-11 bg-slate-900/90 border border-emerald-500/40 focus:border-emerald-400 rounded-xl text-lg font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-all shadow-inner"
                autoFocus
              />
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-400">
              Enter the total count of valid business contacts scraped from Google Maps / scraper output.
            </p>
          </div>

          {/* Partial Completion Toggle */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-slate-200 cursor-pointer select-none">
                  Partial Batch Completion
                </label>
                <p className="text-xs text-slate-400">
                  Enable if some cities failed, had zero results, or were skipped.
                </p>
              </div>
              <input
                type="checkbox"
                id="partialToggle"
                checked={isPartial}
                onChange={(e) => setIsPartial(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-700 focus:ring-cyan-500 cursor-pointer"
              />
            </div>

            {isPartial && (
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Mark which cities were successfully scraped ({selectedLocIds.size}/{batchLocs.length} selected):
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
                    >
                      All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-xs text-slate-400 hover:text-white font-mono"
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="max-h-40 overflow-y-auto border border-slate-800 rounded-lg p-2 bg-slate-950/60 divide-y divide-slate-800/50">
                  {batchLocs.map((bl) => {
                    const isChecked = selectedLocIds.has(bl.location_id);
                    return (
                      <label
                        key={bl.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                          isChecked ? 'bg-cyan-950/20 text-cyan-200' : 'text-slate-400 hover:bg-slate-900/60'
                        }`}
                      >
                        <span className="text-xs font-mono">{bl.city}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleLocation(bl.location_id)}
                          className="w-3.5 h-3.5 rounded text-cyan-500 bg-slate-800 border-slate-700 focus:ring-cyan-500 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Unselected cities will return to the "Available" pool for future batches.</span>
                </div>
              </div>
            )}
          </div>

          {/* Operational Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Batch Notes & Observations (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Rate limits, data quality observations, duplicate rates, tool settings..."
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800/80 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Locations will be permanently tracked as completed for this keyword set.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-900 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Batch
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              title="Complete this batch and immediately configure the next available batch"
            >
              Complete & Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
