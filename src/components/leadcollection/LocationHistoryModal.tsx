import React from 'react';
import {
  X,
  MapPin,
  Calendar,
  User,
  Tag,
  Clock,
  Layers,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { CollectionLocation, CollectionBatch } from '../../types';
import { useLeads } from '../../context/LeadContext';

interface LocationHistoryModalProps {
  location: CollectionLocation | null;
  isOpen: boolean;
  onClose: () => void;
  onViewBatch?: (batchId: string) => void;
}

export const LocationHistoryModal: React.FC<LocationHistoryModalProps> = ({
  location,
  isOpen,
  onClose,
  onViewBatch,
}) => {
  const { collectionBatches, keywordSets, updateLocation } = useLeads();

  if (!isOpen || !location) return null;

  // Find all batches containing this location
  const historyBatches = collectionBatches.filter((b) =>
    b.locations?.some((loc) => loc.location_id === location.id)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Available
          </span>
        );
      case 'in_progress':
      case 'claimed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Clock className="w-3 h-3 animate-spin" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <CheckCircle className="w-3 h-3 text-cyan-400" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  const handleResetToAvailable = async () => {
    if (
      window.confirm(
        `Are you sure you want to reset "${location.city}" back to Available? This will make it eligible for selection in new batches again.`
      )
    ) {
      await updateLocation(location.id, {
        status: 'available',
      });
      onClose();
    }
  };

  const lastKwSet = location.last_used_keyword_set_id
    ? keywordSets.find((k) => k.id === location.last_used_keyword_set_id)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0A0E17] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,194,255,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  {location.city}
                </h3>
                {getStatusBadge(location.status)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {[location.state_region, location.country].filter(Boolean).join(', ')}
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
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Country / Region
              </span>
              <span className="text-xs font-semibold text-white">
                {location.country} {location.state_region ? `(${location.state_region})` : ''}
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Last Scraping Date
              </span>
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                {location.last_used_date
                  ? new Date(location.last_used_date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Never Used'}
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Last Keyword Set
              </span>
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5 truncate">
                <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                {lastKwSet ? lastKwSet.name : location.last_used_keyword_set_id || 'None'}
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Last Collected By
              </span>
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {location.last_used_by_name || '—'}
              </span>
            </div>
          </div>

          {/* Usage History Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Batch History ({historyBatches.length})
              </h4>
            </div>

            {historyBatches.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 text-center text-xs text-slate-500">
                This location has not been included in any batches yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {historyBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {batch.batch_code || batch.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase ${
                            batch.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : batch.status === 'in_progress'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {batch.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                        <span>Set: {batch.keyword_set_name}</span>
                        <span>•</span>
                        <span>
                          {batch.completed_at
                            ? new Date(batch.completed_at).toLocaleDateString()
                            : new Date(batch.created_at).toLocaleDateString()}
                        </span>
                        {batch.leads_collected !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-mono">
                              +{batch.leads_collected} leads
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {onViewBatch && (
                      <button
                        onClick={() => {
                          onViewBatch(batch.id);
                          onClose();
                        }}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="View Batch"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between gap-3">
          {location.status !== 'available' ? (
            <button
              type="button"
              onClick={handleResetToAvailable}
              className="px-3 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Available
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
