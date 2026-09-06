import React, { useState, useMemo } from 'react';
import {
  SendHorizontal,
  Copy,
  Check,
  Filter,
  History,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Layers,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { copyMailMergeToClipboard, generateMailMergeTSV } from '../../lib/mailMerge';
import { Lead } from '../../types';

export const MailMergeDispatcher: React.FC = () => {
  const { leads, campaigns, brands, accounts, batches, createMailMergeBatch } = useLeads();
  const { currentUser } = useAuth();

  // Selection Filters
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [excludePreviouslyBatched, setExcludePreviouslyBatched] = useState<boolean>(true);
  const [excludeDNC, setExcludeDNC] = useState<boolean>(true);

  // Selected Leads
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [customQuantity, setCustomQuantity] = useState<number>(100);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dispatcher' | 'history'>('dispatcher');

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (excludeDNC && lead.priority === 'DNC') return false;
      if (excludePreviouslyBatched && lead.mail_merge_prepared) return false;
      if (selectedCampaign !== 'all' && lead.campaign_id !== selectedCampaign) return false;
      if (selectedBrand !== 'all' && lead.brand_id !== selectedBrand) return false;
      if (selectedAccount !== 'all' && lead.account_id !== selectedAccount) return false;
      return true;
    });
  }, [leads, selectedCampaign, selectedBrand, selectedAccount, excludePreviouslyBatched, excludeDNC]);

  // Quick preset selection
  const handleSelectPreset = (count: number) => {
    const slice = filteredLeads.slice(0, count).map((l) => l.id);
    setSelectedLeadIds(slice);
  };

  const handleSelectAll = () => {
    setSelectedLeadIds(filteredLeads.map((l) => l.id));
  };

  const handleClearSelection = () => {
    setSelectedLeadIds([]);
  };

  const handleToggleLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // The actual selected Lead objects
  const selectedLeadObjects = useMemo(() => {
    const set = new Set(selectedLeadIds);
    return leads.filter((l) => set.has(l.id));
  }, [leads, selectedLeadIds]);

  // Copy & Register Batch
  const handleCopyForGoogleMailMerge = async () => {
    if (selectedLeadObjects.length === 0) return;

    // 1. Copy to clipboard in exact 4-column TSV
    const success = await copyMailMergeToClipboard(selectedLeadObjects, true);

    if (success) {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 4000);

      // 2. Register Batch in history & Supabase
      await createMailMergeBatch({
        campaignId: selectedCampaign !== 'all' ? selectedCampaign : undefined,
        brandId: selectedBrand !== 'all' ? selectedBrand : undefined,
        accountId: selectedAccount !== 'all' ? selectedAccount : undefined,
        senderName: accounts.find((a) => a.id === selectedAccount)?.sender_name,
        leadIds: selectedLeadIds,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <SendHorizontal className="w-5 h-5 text-[#00C2FF]" />
            <span>Google Mail Merge Batch Dispatcher</span>
          </h2>
          <p className="text-xs text-[#7B7B7B] mt-0.5">
            Filter targeted leads, slice batches, and copy directly into Google Sheets formatted for cold outreach.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-2 bg-[#111827] p-1 rounded-lg border border-[#1E3A5F]">
          <button
            onClick={() => setActiveTab('dispatcher')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'dispatcher'
                ? 'bg-[#00C2FF] text-black shadow-[0_0_10px_rgba(0,194,255,0.2)]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Batch Generator
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-[#00C2FF] text-black shadow-[0_0_10px_rgba(0,194,255,0.2)]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Past Batches ({batches.length})
          </button>
        </div>
      </div>

      {activeTab === 'dispatcher' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Filter and Selection Presets */}
          <div className="lg:col-span-1 space-y-4">
            {/* Filter Configuration */}
            <div className="p-5 bg-[#111827] border border-[#1E3A5F] rounded-xl space-y-4 text-xs">
              <h3 className="font-bold text-white uppercase tracking-wider text-[11px] text-[#00C2FF] flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>1. Outreach Targeting</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[#94A3B8] font-medium mb-1">Campaign</label>
                  <select
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg p-2 focus:border-[#00C2FF]"
                  >
                    <option value="all">All Active Campaigns</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#94A3B8] font-medium mb-1">Brand Approached</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg p-2 focus:border-[#00C2FF]"
                  >
                    <option value="all">All Brands</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#94A3B8] font-medium mb-1">Sender Account</label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg p-2 focus:border-[#00C2FF]"
                  >
                    <option value="all">All Accounts</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.account_name} ({a.sender_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#1E3A5F]/40">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="ex-batch"
                      checked={excludePreviouslyBatched}
                      onChange={(e) => setExcludePreviouslyBatched(e.target.checked)}
                      className="w-4 h-4 rounded border-[#1E3A5F] text-[#00C2FF] bg-[#0A0A0A]"
                    />
                    <label htmlFor="ex-batch" className="text-white cursor-pointer">
                      Exclude previously batched leads (prevents duplicate sends)
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="ex-dnc"
                      checked={excludeDNC}
                      onChange={(e) => setExcludeDNC(e.target.checked)}
                      className="w-4 h-4 rounded border-[#1E3A5F] text-[#00C2FF] bg-[#0A0A0A]"
                    />
                    <label htmlFor="ex-dnc" className="text-white cursor-pointer">
                      Exclude DNC (Do Not Contact) leads
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Slicing Presets */}
            <div className="p-5 bg-[#111827] border border-[#1E3A5F] rounded-xl space-y-4 text-xs">
              <h3 className="font-bold text-white uppercase tracking-wider text-[11px] text-[#00E5A0] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>2. Batch Quantity Slicer</span>
              </h3>

              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>Eligible Available:</span>
                <span className="font-mono text-white font-bold text-sm">
                  {filteredLeads.length} leads
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPreset(100)}
                  className="py-2 bg-[#0A0A0A] hover:bg-[#182234] border border-[#1E3A5F] hover:border-[#00C2FF] rounded-lg font-mono font-semibold text-white transition-all"
                >
                  Select 100
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(250)}
                  className="py-2 bg-[#0A0A0A] hover:bg-[#182234] border border-[#1E3A5F] hover:border-[#00C2FF] rounded-lg font-mono font-semibold text-white transition-all"
                >
                  Select 250
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(500)}
                  className="py-2 bg-[#0A0A0A] hover:bg-[#182234] border border-[#1E3A5F] hover:border-[#00C2FF] rounded-lg font-mono font-semibold text-white transition-all"
                >
                  Select 500
                </button>
              </div>

              {/* Custom Quantity */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="number"
                  min={1}
                  max={filteredLeads.length || 1}
                  value={customQuantity}
                  onChange={(e) => setCustomQuantity(Number(e.target.value))}
                  className="w-24 bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg p-2 text-white font-mono text-xs focus:border-[#00C2FF]"
                />
                <button
                  type="button"
                  onClick={() => handleSelectPreset(customQuantity)}
                  className="flex-1 py-2 bg-[#0A0A0A] hover:bg-[#182234] border border-[#1E3A5F] rounded-lg font-medium text-white transition-all"
                >
                  Apply Custom
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1E3A5F]/40 text-[11px]">
                <button
                  onClick={handleSelectAll}
                  className="text-[#00C2FF] hover:underline"
                >
                  Select All ({filteredLeads.length})
                </button>
                <button
                  onClick={handleClearSelection}
                  className="text-[#7B7B7B] hover:text-white"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Selected Leads Table & Clipboard Action */}
          <div className="lg:col-span-2 space-y-4">
            {/* Action Bar */}
            <div className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-[#94A3B8]">Batch Ready:</span>
                <div className="text-xl font-bold font-mono text-white">
                  <span className="text-[#00E5A0]">{selectedLeadIds.length}</span> leads selected
                </div>
              </div>

              <button
                type="button"
                disabled={selectedLeadIds.length === 0}
                onClick={handleCopyForGoogleMailMerge}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xl disabled:opacity-40 ${
                  copiedSuccess
                    ? 'bg-[#00E5A0] text-black shadow-[0_0_20px_rgba(0,229,160,0.5)]'
                    : 'bg-[#00C2FF] hover:bg-[#00C2FF]/90 text-black shadow-[0_0_20px_rgba(0,194,255,0.4)]'
                }`}
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-black stroke-[3]" />
                    <span>{selectedLeadIds.length} Leads Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-black stroke-[2.5]" />
                    <span>Copy for Google Mail Merge</span>
                  </>
                )}
              </button>
            </div>

            {/* 4 Required Columns Format Banner */}
            <div className="p-3 bg-[#0A0A0A] border border-[#1E3A5F]/60 rounded-lg flex items-center justify-between text-xs text-[#94A3B8]">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-[#00C2FF]" />
                <span>
                  <strong>Required Google Sheets Output:</strong> Exactly 4 tab-separated columns (Email, First Name, Last Name, Company Name).
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#00E5A0]">Spreadsheet-Ready TSV</span>
            </div>

            {/* Data Table */}
            <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#111827] text-[#94A3B8] border-b border-[#1E3A5F] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3 font-semibold text-[#00C2FF]">EMAIL</th>
                    <th className="py-2.5 px-3 font-semibold">FIRST NAME</th>
                    <th className="py-2.5 px-3 font-semibold">LAST NAME</th>
                    <th className="py-2.5 px-3 font-semibold">COMPANY NAME</th>
                    <th className="py-2.5 px-3 font-semibold">BRAND</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/40 bg-[#0A0A0A]">
                  {selectedLeadObjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-[#7B7B7B]">
                        No leads currently selected for batch. Click a preset (e.g. Select 100) or choose leads below.
                      </td>
                    </tr>
                  ) : (
                    selectedLeadObjects.map((lead, idx) => (
                      <tr key={lead.id} className="hover:bg-[#111827]">
                        <td className="py-2 px-3 text-center text-[#7B7B7B] font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono text-[#00C2FF] font-medium">{lead.email}</td>
                        <td className="py-2 px-3 text-white">{lead.first_name || '?'}</td>
                        <td className="py-2 px-3 text-white">{lead.last_name || '?'}</td>
                        <td className="py-2 px-3 text-[#94A3B8]">{lead.company_name || '?'}</td>
                        <td className="py-2 px-3 text-[#7B7B7B] text-[11px]">{lead.brand_name || '?'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* History View */
        <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl overflow-hidden shadow-xl text-xs">
          <div className="p-4 bg-[#111827] border-b border-[#1E3A5F] flex items-center justify-between">
            <h3 className="font-bold text-white">Recorded Mail Merge Batches</h3>
            <span className="text-[#7B7B7B] text-xs">Every batch generated is permanently audited</span>
          </div>

          <div className="divide-y divide-[#1E3A5F]/40">
            {batches.length === 0 ? (
              <div className="text-center py-16 text-[#7B7B7B]">No past batches recorded yet.</div>
            ) : (
              batches.map((b) => (
                <div key={b.id} className="p-4 hover:bg-[#111827] flex items-center justify-between transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-[#00C2FF]">{b.batch_number}</span>
                      <span className="text-white font-semibold">? {b.campaign_name || 'Campaign'}</span>
                      {b.brand_name && (
                        <span className="text-[#94A3B8]">({b.brand_name})</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#7B7B7B]">
                      Account: {b.account_name || 'Outbound'} ? Sender: {b.sender_name || 'Team'} ? Generated by {b.created_by_name || 'User'} on {new Date(b.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="px-2.5 py-1 bg-[#00E5A0]/15 text-[#00E5A0] border border-[#00E5A0]/30 rounded-full font-mono font-bold">
                      {b.lead_count} Leads
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
