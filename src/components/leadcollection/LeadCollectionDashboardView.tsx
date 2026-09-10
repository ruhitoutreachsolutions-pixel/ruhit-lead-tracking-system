import React, { useState, useMemo } from 'react';
import {
  Layers,
  Database,
  MapPin,
  Tag,
  Plus,
  Play,
  CheckCircle,
  Copy,
  Check,
  RotateCcw,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Download,
  Trash2,
  ExternalLink,
  ChevronRight,
  Clock,
  Sparkles,
  AlertCircle,
  Hash,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import {
  CollectionBatch,
  CollectionKeywordSet,
  CollectionLocation,
  CollectionBatchStatus,
} from '../../types';
import { AddKeywordsModal } from './AddKeywordsModal';
import { AddLocationsModal } from './AddLocationsModal';
import { NewBatchModal } from './NewBatchModal';
import { CompleteBatchModal } from './CompleteBatchModal';
import { LocationHistoryModal } from './LocationHistoryModal';
import {
  copyToClipboard,
  formatKeywordsForScraper,
  formatLocationsForScraper,
} from '../../lib/clipboard';

type CollectionSubTab = 'overview' | 'batches' | 'keywords' | 'locations' | 'history';

export const LeadCollectionDashboardView: React.FC = () => {
  const {
    keywordSets,
    keywords,
    locations,
    collectionBatches,
    batchLocations,
    getNextAvailableLocations,
    startCollectionBatch,
    cancelCollectionBatch,
    deleteKeywordSet,
    deleteKeyword,
    deleteLocation,
    updateLocation,
  } = useLeads();

  // Navigation Sub-tab
  const [subTab, setSubTab] = useState<CollectionSubTab>('overview');

  // Modals state
  const [isAddKeywordsOpen, setIsAddKeywordsOpen] = useState(false);
  const [isAddLocationsOpen, setIsAddLocationsOpen] = useState(false);
  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false);
  const [completeBatchTarget, setCompleteBatchTarget] = useState<CollectionBatch | null>(null);
  const [inspectLocation, setInspectLocation] = useState<CollectionLocation | null>(null);

  // New Batch prefill state
  const [newBatchInitialCountry, setNewBatchInitialCountry] = useState<string>('Ireland');
  const [newBatchInitialKeywordSetId, setNewBatchInitialKeywordSetId] = useState<string>('');
  const [newBatchInitialCount, setNewBatchInitialCount] = useState<number>(10);

  // Clipboard feedback tracking
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedLocId, setCopiedLocId] = useState<string | null>(null);
  const [copiedBothId, setCopiedBothId] = useState<string | null>(null);

  // Batches filter
  const [batchStatusFilter, setBatchStatusFilter] = useState<string>('all');
  const [batchSearch, setBatchSearch] = useState<string>('');

  // Location filter
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [locationCountryFilter, setLocationCountryFilter] = useState<string>('all');
  const [locationStatusFilter, setLocationStatusFilter] = useState<string>('all');

  // Keywords set selection in Keyword Library
  const [selectedKwSetId, setSelectedKwSetId] = useState<string>(
    () => keywordSets[0]?.id || ''
  );

  // Countries list
  const countries = useMemo(() => {
    const set = new Set<string>();
    locations.forEach((l) => {
      if (l.country) set.add(l.country);
    });
    return Array.from(set).sort();
  }, [locations]);

  // Default Quick Action Country & Keyword Set
  const [quickCountry, setQuickCountry] = useState<string>(() => countries[0] || 'Ireland');
  const [quickKeywordSetId, setQuickKeywordSetId] = useState<string>(
    () => keywordSets[0]?.id || ''
  );

  // KPIs
  const totalKeywords = keywords.length;
  const totalLocations = locations.length;
  const availableLocationsCount = locations.filter((l) => l.status === 'available').length;
  const usedLocationsCount = locations.filter((l) => l.status === 'completed').length;
  const activeBatchesCount = collectionBatches.filter(
    (b) => b.status === 'ready' || b.status === 'in_progress'
  ).length;
  const completedBatchesCount = collectionBatches.filter(
    (b) => b.status === 'completed' || b.status === 'partial'
  ).length;
  const totalLeadsCollected = collectionBatches.reduce(
    (acc, b) => acc + (b.leads_collected || 0),
    0
  );

  // Leads collected this month
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const leadsThisMonth = collectionBatches
    .filter((b) => b.completed_at && new Date(b.completed_at) >= currentMonthStart)
    .reduce((acc, b) => acc + (b.leads_collected || 0), 0);

  // Available in Quick Action selection
  const quickAvailableLocations = useMemo(() => {
    if (!quickCountry) return [];
    return getNextAvailableLocations(quickCountry, quickKeywordSetId, 9999);
  }, [quickCountry, quickKeywordSetId, getNextAvailableLocations]);

  // Fast trigger for Next Batch with prefill
  const handleLaunchBatchWithCount = (count: number) => {
    setNewBatchInitialCountry(quickCountry);
    setNewBatchInitialKeywordSetId(quickKeywordSetId);
    setNewBatchInitialCount(count);
    setIsNewBatchOpen(true);
  };

  // Launch Next Batch from an existing batch
  const handleCreateNextFromBatch = (batch: CollectionBatch) => {
    setNewBatchInitialCountry(batch.country);
    setNewBatchInitialKeywordSetId(batch.keyword_set_id);
    setNewBatchInitialCount(batch.location_count || 10);
    setIsNewBatchOpen(true);
  };

  // Copy helpers
  const handleCopyKeywords = async (batch: CollectionBatch) => {
    // Get keywords for batch
    const kwList = keywords.filter((k) => k.keyword_set_id === batch.keyword_set_id);
    const kwText = formatKeywordsForScraper(kwList.map((k) => k.keyword));
    const success = await copyToClipboard(kwText);
    if (success) {
      setCopiedKeyId(batch.id);
      setTimeout(() => setCopiedKeyId(null), 2000);
    }
  };

  const handleCopyLocations = async (batch: CollectionBatch) => {
    const locs = batch.locations?.map((l) => ({ city: l.city, country: l.country })) || [];
    const locText = formatLocationsForScraper(locs);
    const success = await copyToClipboard(locText);
    if (success) {
      setCopiedLocId(batch.id);
      setTimeout(() => setCopiedLocId(null), 2000);
    }
  };

  const handleCopyBoth = async (batch: CollectionBatch) => {
    const kwList = keywords.filter((k) => k.keyword_set_id === batch.keyword_set_id);
    const kwText = formatKeywordsForScraper(kwList.map((k) => k.keyword));
    const locs = batch.locations?.map((l) => ({ city: l.city, country: l.country })) || [];
    const locText = formatLocationsForScraper(locs);

    const combined = ['=== KEYWORDS (' + kwList.length + ') ===', kwText, '', '=== LOCATIONS (' + locs.length + ') ===', locText].join('\n');
    const success = await copyToClipboard(combined);
    if (success) {
      setCopiedBothId(batch.id);
      setTimeout(() => setCopiedBothId(null), 2000);
    }
  };

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    return collectionBatches.filter((b) => {
      const matchStatus = batchStatusFilter === 'all' || b.status === batchStatusFilter;
      const matchSearch =
        !batchSearch ||
        b.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
        b.batch_code?.toLowerCase().includes(batchSearch.toLowerCase()) ||
        b.country.toLowerCase().includes(batchSearch.toLowerCase()) ||
        b.keyword_set_name?.toLowerCase().includes(batchSearch.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [collectionBatches, batchStatusFilter, batchSearch]);

  // Filtered Locations
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchCountry =
        locationCountryFilter === 'all' || loc.country === locationCountryFilter;
      const matchStatus =
        locationStatusFilter === 'all' || loc.status === locationStatusFilter;
      const matchSearch =
        !locationSearch ||
        loc.city.toLowerCase().includes(locationSearch.toLowerCase()) ||
        loc.country.toLowerCase().includes(locationSearch.toLowerCase()) ||
        (loc.state_region &&
          loc.state_region.toLowerCase().includes(locationSearch.toLowerCase()));
      return matchCountry && matchStatus && matchSearch;
    });
  }, [locations, locationCountryFilter, locationStatusFilter, locationSearch]);

  // Export History CSV
  const handleExportCSV = () => {
    const headers = [
      'Batch Code',
      'Batch Name',
      'Status',
      'Country',
      'Keyword Set',
      'Keywords Count',
      'Locations Count',
      'Combinations',
      'Leads Collected',
      'Created By',
      'Created At',
      'Completed At',
      'Notes',
    ];

    const rows = collectionBatches.map((b) => [
      `"${b.batch_code || ''}"`,
      `"${b.name || ''}"`,
      `"${b.status}"`,
      `"${b.country}"`,
      `"${b.keyword_set_name || ''}"`,
      b.keyword_count || 0,
      b.location_count || 0,
      (b.keyword_count || 0) * (b.location_count || 0),
      b.leads_collected || 0,
      `"${b.created_by_name || ''}"`,
      `"${b.created_at || ''}"`,
      `"${b.completed_at || ''}"`,
      `"${(b.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `lead_collection_batches_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-200 pb-16">
      {/* Top Header */}
      <div className="border-b border-cyan-500/20 bg-gradient-to-r from-[#0B132B]/80 via-[#0A0E17]/90 to-[#070A0F] px-6 py-6 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,194,255,0.25)]">
              <Layers className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-wider font-mono">
                  LEAD COLLECTION COMMAND CENTER
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  SYSTEM READY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Batch scraper orchestrator, geographic rotation & combination tracker
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddKeywordsOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              + Add Keywords
            </button>
            <button
              onClick={() => setIsAddLocationsOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              + Add Locations
            </button>
            <button
              onClick={() => {
                setNewBatchInitialCountry(quickCountry);
                setNewBatchInitialKeywordSetId(quickKeywordSetId);
                setNewBatchInitialCount(10);
                setIsNewBatchOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-[0_0_20px_rgba(0,194,255,0.3)] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              NEW BATCH
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="max-w-7xl mx-auto mt-6 flex items-center gap-2 border-b border-slate-800/80 overflow-x-auto pb-0.5">
          {[
            { id: 'overview', label: 'Command Center', icon: Layers },
            {
              id: 'batches',
              label: 'Collection Batches',
              icon: Database,
              count: activeBatchesCount,
            },
            {
              id: 'keywords',
              label: 'Keyword Library',
              icon: Tag,
              count: totalKeywords,
            },
            {
              id: 'locations',
              label: 'Location Library',
              icon: MapPin,
              count: totalLocations,
            },
            {
              id: 'history',
              label: 'Collection History',
              icon: FileSpreadsheet,
              count: completedBatchesCount,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as CollectionSubTab)}
                className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap relative ${
                  isActive
                    ? 'text-cyan-400 bg-cyan-950/30 border-t-2 border-cyan-400 shadow-[0_-5px_15px_rgba(0,194,255,0.1)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        {/* KPI Row (Always Visible on Overview, Batches) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Active Batches
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {activeBatchesCount}
              </span>
              <span className="text-xs text-slate-500">running</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Total Keywords
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {totalKeywords}
              </span>
              <span className="text-xs text-cyan-400/80 font-mono">
                {keywordSets.length} sets
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Available Cities
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {availableLocationsCount}
              </span>
              <span className="text-xs text-slate-500">/ {totalLocations}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Cities Used
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-purple-400">
                {usedLocationsCount}
              </span>
              <span className="text-xs text-slate-500">scraped</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Total Leads
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-teal-300">
                {totalLeadsCollected.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Leads This Month
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-300">
                {leadsThisMonth.toLocaleString()}
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SUBTAB 1: COMMAND CENTER (OVERVIEW)                          */}
        {/* ============================================================ */}
        {subTab === 'overview' && (
          <div className="space-y-6">
            {/* WORKFLOW STEP-BY-STEP EXPLAINER */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900/60 border border-cyan-500/30 shadow-lg">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-inner">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      SCRAPING WORKFLOW — HOW IT WORKS
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Follow these 4 simple steps to scrape keywords & cities and track your leads.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">1</span>
                    <span>PICK COUNTRY & SIZE</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Select <strong className="text-slate-200">Wales</strong>, <strong className="text-slate-200">England</strong>, or <strong className="text-slate-200">Ireland</strong> below and click <span className="text-cyan-300 font-mono font-bold">NEXT 10</span>. The system auto-picks your next unused cities.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">2</span>
                    <span>COPY KEYWORDS</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click <span className="text-cyan-300 font-mono font-bold">1. Copy Keywords</span>. All keywords are copied 1 per line to your clipboard. Paste them into your calendar or keyword scraper box.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">3</span>
                    <span>COPY CITIES</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click <span className="text-emerald-300 font-mono font-bold">2. Copy Cities</span>. All cities are copied 1 per line. Paste into your scraper city/location box and run your scraping tool.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">4</span>
                    <span>COMPLETE & ADVANCE</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    When scraping finishes, click <span className="text-purple-300 font-mono font-bold">Complete</span> and enter total leads collected. The system marks cities done and gives you the next batch!
                  </p>
                </div>
              </div>
            </div>

            {/* NEXT COLLECTION QUICK ACTION WIDGET */}
            <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#0E1A33] to-[#080E1A] border border-cyan-500/30 shadow-[0_0_40px_rgba(0,194,255,0.12)]">
              <div className="absolute -right-10 -top-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                      RAPID SCRAPER LAUNCHPAD
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                    Ready for your next scraping run?
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Select your target country and keyword set. The system will automatically claim
                    the next unworked locations, calculate combinations, and prepare clean one-click
                    copy strings.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {/* Country Selector */}
                    <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <select
                        value={quickCountry}
                        onChange={(e) => setQuickCountry(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
                      >
                        {countries.length === 0 ? (
                          <option value="Ireland">Ireland</option>
                        ) : (
                          countries.map((c) => (
                            <option key={c} value={c} className="bg-slate-900 text-white">
                              {c}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Keyword Set Selector */}
                    <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700">
                      <Tag className="w-3.5 h-3.5 text-cyan-400" />
                      <select
                        value={quickKeywordSetId}
                        onChange={(e) => setQuickKeywordSetId(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer max-w-[180px] truncate"
                      >
                        {keywordSets.map((ks) => (
                          <option key={ks.id} value={ks.id} className="bg-slate-900 text-white">
                            {ks.name} ({ks.keyword_count || 0} kw)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Available Badge */}
                    <div className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
                      {quickAvailableLocations.length} cities available
                    </div>
                  </div>
                </div>

                {/* Batch Size Quick Buttons */}
                <div className="flex flex-col items-start lg:items-end gap-3 bg-slate-950/60 p-5 rounded-2xl border border-cyan-500/20">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Claim Next Batch of Cities:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleLaunchBatchWithCount(num)}
                        disabled={quickAvailableLocations.length === 0}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold font-mono bg-cyan-950/50 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        NEXT {num}
                      </button>
                    ))}
                    <button
                      onClick={() => handleLaunchBatchWithCount(10)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400 transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95"
                    >
                      CUSTOM...
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Zero duplicate overlap • Auto-advances
                  </span>
                </div>
              </div>
            </div>

            {/* Active Batches in Progress Workspace */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Active Scraping Workspace ({collectionBatches.filter((b) => b.status === 'ready' || b.status === 'in_progress').length})
                  </h3>
                </div>
                <button
                  onClick={() => setSubTab('batches')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  View All Batches <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {collectionBatches.filter((b) => b.status === 'ready' || b.status === 'in_progress').length === 0 ? (
                <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                    <Database className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">
                    No active batches right now.
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Click "NEXT 10" or "NEW BATCH" above to pull your next set of unused cities and start scraping.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {collectionBatches
                    .filter((b) => b.status === 'ready' || b.status === 'in_progress')
                    .map((batch) => renderBatchCard(batch))}
                </div>
              )}
            </div>

            {/* Workflow Explainer Banner */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold font-mono">
                  <span>01</span>
                  <span>ONE-CLICK ROTATION</span>
                </div>
                <p className="text-xs text-slate-400">
                  Pick country & keyword set. "NEXT 10" picks the exact next unworked cities.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold font-mono">
                  <span>02</span>
                  <span>CLIPBOARD EXPORT</span>
                </div>
                <p className="text-xs text-slate-400">
                  Click COPY KEYWORDS and COPY LOCATIONS to paste directly into Google Maps or your scraping software.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
                  <span>03</span>
                  <span>RECORD TOTAL LEADS</span>
                </div>
                <p className="text-xs text-slate-400">
                  When scrape completes, enter leads collected. System updates your monthly metrics.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-bold font-mono">
                  <span>04</span>
                  <span>NEXT RUN AUTOMATION</span>
                </div>
                <p className="text-xs text-slate-400">
                  Hit "CREATE NEXT BATCH" to advance seamlessly to the next batch without re-entering settings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SUBTAB 2: BATCHES WORKSPACE                                  */}
        {/* ============================================================ */}
        {subTab === 'batches' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search batches by code, name, country..."
                  value={batchSearch}
                  onChange={(e) => setBatchSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {['all', 'ready', 'in_progress', 'completed', 'partial', 'cancelled'].map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setBatchStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                        batchStatusFilter === st
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : 'bg-slate-800/60 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Batches Grid */}
            {filteredBatches.length === 0 ? (
              <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/30">
                <Database className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">No batches match your filter.</p>
                <p className="text-xs text-slate-500 mt-1">Try resetting the status filter or search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBatches.map((batch) => renderBatchCard(batch))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SUBTAB 3: KEYWORD LIBRARY                                    */}
        {/* ============================================================ */}
        {subTab === 'keywords' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-cyan-400" />
                  KEYWORD LIBRARY
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Organize keywords into Sets. Keywords are reusable across multiple countries without being consumed.
                </p>
              </div>

              <button
                onClick={() => setIsAddKeywordsOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Add Keywords
              </button>
            </div>

            {/* Keyword Sets Grid / Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Keyword Sets List */}
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Keyword Sets ({keywordSets.length})
                </span>
                <div className="space-y-2">
                  {keywordSets.map((ks) => {
                    const isSelected = selectedKwSetId === ks.id;
                    const kwCount = keywords.filter((k) => k.keyword_set_id === ks.id).length;
                    return (
                      <div
                        key={ks.id}
                        onClick={() => setSelectedKwSetId(ks.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_20px_rgba(0,194,255,0.15)]'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <h4 className="text-sm font-bold text-white truncate">{ks.name}</h4>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {ks.description || 'No description'}
                          </p>
                          <span className="text-[11px] font-mono text-cyan-400 mt-1 inline-block">
                            {kwCount} keywords
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  `Are you sure you want to delete set "${ks.name}"? Active batches using it will be preserved.`
                                )
                              ) {
                                deleteKeywordSet(ks.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                            title="Delete Set"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isSelected ? 'text-cyan-400 translate-x-1' : 'text-slate-600'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Keywords in Selected Set */}
              <div className="lg:col-span-2 bg-slate-900/40 rounded-2xl border border-slate-800 p-5 space-y-4">
                {(() => {
                  const currentSet = keywordSets.find((ks) => ks.id === selectedKwSetId);
                  const currentSetKeywords = keywords.filter(
                    (k) => k.keyword_set_id === selectedKwSetId
                  );

                  if (!currentSet) {
                    return (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        Select a keyword set to view its keywords.
                      </div>
                    );
                  }

                  const handleCopyAllSetKeywords = async () => {
                    const text = formatKeywordsForScraper(currentSetKeywords.map((k) => k.keyword));
                    const ok = await copyToClipboard(text);
                    if (ok) {
                      setCopiedKeyId(currentSet.id);
                      setTimeout(() => setCopiedKeyId(null), 2000);
                    }
                  };

                  return (
                    <>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <h3 className="text-base font-bold text-white">{currentSet.name}</h3>
                          <span className="text-xs text-slate-400">
                            {currentSetKeywords.length} keywords in this set
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopyAllSetKeywords}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
                          >
                            {copiedKeyId === currentSet.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Copy Clean List</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
                        {currentSetKeywords.map((kw, idx) => (
                          <div
                            key={kw.id}
                            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between group"
                          >
                            <span className="text-xs font-mono text-slate-300 truncate">
                              <span className="text-slate-600 mr-2">{idx + 1}.</span>
                              {kw.keyword}
                            </span>
                            <button
                              onClick={() => deleteKeyword(kw.id)}
                              className="p-1 text-slate-600 group-hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete keyword"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SUBTAB 4: LOCATION LIBRARY                                   */}
        {/* ============================================================ */}
        {subTab === 'locations' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  LOCATION LIBRARY
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete geographical database. Track which cities have been scraped and which are available.
                </p>
              </div>

              <button
                onClick={() => setIsAddLocationsOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Add Locations
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search city, region, country..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Country filter */}
                <select
                  value={locationCountryFilter}
                  onChange={(e) => setLocationCountryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Countries ({totalLocations})</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Status filter */}
                <select
                  value={locationStatusFilter}
                  onChange={(e) => setLocationStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available ({availableLocationsCount})</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed ({usedLocationsCount})</option>
                </select>
              </div>
            </div>

            {/* Locations Table */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">City / Location</th>
                      <th className="px-4 py-3">Country / Region</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Last Scraping Date</th>
                      <th className="px-4 py-3">Last Keyword Set</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLocations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-500">
                          No locations match your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredLocations.map((loc) => {
                        return (
                          <tr
                            key={loc.id}
                            onClick={() => setInspectLocation(loc)}
                            className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-3 font-semibold text-white">
                              {loc.city}
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {loc.country}
                              {loc.state_region ? ` (${loc.state_region})` : ''}
                            </td>
                            <td className="px-4 py-3">
                              {loc.status === 'available' ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Available
                                </span>
                              ) : loc.status === 'in_progress' ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                  <Clock className="w-3 h-3 animate-spin" />
                                  In Progress
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                  <CheckCircle className="w-3 h-3 text-cyan-400" />
                                  Completed
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-400 font-mono">
                              {loc.last_used_date
                                ? new Date(loc.last_used_date).toLocaleDateString()
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-400 truncate max-w-[150px]">
                              {loc.last_used_keyword_set_id
                                ? keywordSets.find(
                                    (k) => k.id === loc.last_used_keyword_set_id
                                  )?.name || loc.last_used_keyword_set_id
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div
                                className="flex items-center justify-end gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {loc.status !== 'available' && (
                                  <button
                                    onClick={() =>
                                      updateLocation(loc.id, { status: 'available' })
                                    }
                                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Reset to Available"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Delete location "${loc.city}"? This action cannot be undone.`
                                      )
                                    ) {
                                      deleteLocation(loc.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Delete location"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SUBTAB 5: COLLECTION HISTORY                                 */}
        {/* ============================================================ */}
        {subTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                  COLLECTION AUDIT HISTORY
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete historical archive of finished and archived scraping batches.
                </p>
              </div>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 flex items-center gap-2 self-start sm:self-auto transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Batches CSV
              </button>
            </div>

            {/* History Table */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-4 py-3">Country</th>
                      <th className="px-4 py-3">Keyword Set</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 font-mono">Cities</th>
                      <th className="px-4 py-3 font-mono">Combos</th>
                      <th className="px-4 py-3 font-mono">Leads Collected</th>
                      <th className="px-4 py-3">Date Completed</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {collectionBatches.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-10 text-slate-500">
                          No batches recorded yet.
                        </td>
                      </tr>
                    ) : (
                      collectionBatches.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-cyan-400 block">
                              {b.batch_code || b.name}
                            </span>
                            <span className="text-[10px] text-slate-500">{b.created_by_name}</span>
                          </td>
                          <td className="px-4 py-3 text-white">{b.country}</td>
                          <td className="px-4 py-3 text-slate-300">{b.keyword_set_name}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                                b.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : b.status === 'in_progress'
                                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                  : b.status === 'partial'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-200">
                            {b.location_count || 0}
                          </td>
                          <td className="px-4 py-3 font-mono text-purple-400">
                            {((b.keyword_count || 0) * (b.location_count || 0)).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                            {b.leads_collected !== undefined
                              ? b.leads_collected.toLocaleString()
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-400 font-mono">
                            {b.completed_at
                              ? new Date(b.completed_at).toLocaleDateString()
                              : new Date(b.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">
                            {b.notes || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RENDER BATCH CARD HELPER */}
      {/* Defined in function scope */}

      {/* MODALS */}
      <AddKeywordsModal
        isOpen={isAddKeywordsOpen}
        onClose={() => setIsAddKeywordsOpen(false)}
      />

      <AddLocationsModal
        isOpen={isAddLocationsOpen}
        onClose={() => setIsAddLocationsOpen(false)}
      />

      <NewBatchModal
        isOpen={isNewBatchOpen}
        onClose={() => setIsNewBatchOpen(false)}
        initialCountry={newBatchInitialCountry}
        initialKeywordSetId={newBatchInitialKeywordSetId}
        initialBatchSize={newBatchInitialCount}
      />

      {completeBatchTarget && (
        <CompleteBatchModal
          batch={completeBatchTarget}
          isOpen={true}
          onClose={() => setCompleteBatchTarget(null)}
          onSuccess={(completed, createNext) => {
            if (createNext) {
              handleCreateNextFromBatch(completed);
            }
          }}
        />
      )}

      <LocationHistoryModal
        location={inspectLocation}
        isOpen={!!inspectLocation}
        onClose={() => setInspectLocation(null)}
      />
    </div>
  );

  // Function to render a batch card
  function renderBatchCard(batch: CollectionBatch) {
    const isReady = batch.status === 'ready';
    const isInProgress = batch.status === 'in_progress';
    const isCompleted = batch.status === 'completed' || batch.status === 'partial';
    const totalCombos = (batch.keyword_count || 0) * (batch.location_count || 0);

    return (
      <div
        key={batch.id}
        className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
          isInProgress
            ? 'bg-gradient-to-br from-cyan-950/30 via-slate-900/80 to-slate-950 border-cyan-500/50 shadow-[0_0_25px_rgba(0,194,255,0.12)]'
            : isReady
            ? 'bg-slate-900/70 border-slate-700 hover:border-cyan-500/40'
            : 'bg-slate-900/40 border-slate-800'
        }`}
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-cyan-400 tracking-wider">
                  {batch.batch_code || batch.name}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase border font-semibold ${
                    isInProgress
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                      : isReady
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                      : isCompleted
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {batch.status}
                </span>
              </div>
              <h4 className="text-xs text-slate-300 mt-1 font-medium">{batch.name}</h4>
            </div>

            {batch.leads_collected !== undefined && (
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Collected
                </span>
                <span className="text-base font-black font-mono text-emerald-400">
                  +{batch.leads_collected.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs mb-4">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                Country
              </span>
              <span className="font-semibold text-white">{batch.country}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                Keywords
              </span>
              <span className="font-semibold text-cyan-400 font-mono">
                {batch.keyword_count || 0}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                Combos
              </span>
              <span className="font-semibold text-purple-400 font-mono">
                {totalCombos.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Cities Chips Preview */}
          <div className="mb-4">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1.5">
              Locations ({batch.locations?.length || 0}):
            </span>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {batch.locations?.slice(0, 15).map((l) => (
                <span
                  key={l.id}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-slate-800/80 text-slate-300 border border-slate-700"
                >
                  {l.city}
                </span>
              ))}
              {(batch.locations?.length || 0) > 15 && (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-cyan-950/40 text-cyan-400 border border-cyan-500/30">
                  +{(batch.locations?.length || 0) - 15} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Copy Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyKeywords(batch)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Copy clean keywords (1 per line) to paste directly into your calendar / keyword box"
            >
              {copiedKeyId === batch.id ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>1. Copy Keywords</span>
            </button>

            <button
              onClick={() => handleCopyLocations(batch)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Copy clean cities (1 per line) to paste directly into your scraper city box"
            >
              {copiedLocId === batch.id ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>2. Copy Cities</span>
            </button>
          </div>

          {/* State Transition Actions */}
          <div className="flex items-center gap-2 justify-end">
            {isReady && (
              <button
                onClick={() => startCollectionBatch(batch.id)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                title="Start batch and claim locations to prevent anyone else scraping them"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>3. Start Scraping</span>
              </button>
            )}

            {isInProgress && (
              <button
                onClick={() => setCompleteBatchTarget(batch)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                title="Log total leads collected from scraper output and mark cities as completed"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>4. Complete & Record Leads</span>
              </button>
            )}

            {isCompleted && (
              <button
                onClick={() => handleCreateNextFromBatch(batch)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-all"
                title="Automatically advance to the next batch with the next unworked cities"
              >
                <span>Create Next Batch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {(isReady || isInProgress) && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to cancel "${batch.name}"? Claimed locations will immediately return to the available pool.`
                    )
                  ) {
                    cancelCollectionBatch(batch.id);
                  }
                }}
                className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Cancel Batch"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
};
