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
  Calendar,
  ExternalLink,
  ShieldCheck,
  Send,
  RefreshCw
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { copyMailMergeToClipboard } from '../../lib/mailMerge';
import { Lead } from '../../types';

export const MailMergeDispatcher: React.FC = () => {
  const { leads, campaigns, accounts, updateLead, createMailMergeBatch } = useLeads();
  const { currentUser } = useAuth();

  // 1. Sequence & Campaign Selection
  const [selectedSequence, setSelectedSequence] = useState<'email1' | 'email2' | 'email3'>('email1');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');

  // 2. Batch Volume & Sender Setup
  const [batchSize, setBatchSize] = useState<number>(25);
  const [sendingAccount, setSendingAccount] = useState<string>(
    accounts[0]?.email_account || 'hello@crewlixukltd.com'
  );

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
  const [dispatchDateTag, setDispatchDateTag] = useState<string>(todayFormatted);

  // Status & Feedback
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [applyFeedback, setApplyFeedback] = useState<boolean>(false);

  // Eligible pool calculations
  const dncLeads = useMemo(() => leads.filter((l) => l.priority === 'DNC'), [leads]);

  const eligibleLeads = useMemo(() => {
    return leads.filter((l) => {
      // Rule: Exclude DNC
      if (l.priority === 'DNC') return false;

      // Filter by Campaign
      if (selectedCampaign !== 'all') {
        if (l.campaign_id !== selectedCampaign && l.campaign_name !== selectedCampaign) {
          return false;
        }
      }

      // Filter by sequence availability:
      // If Email 1: lead should not have email_1_date
      if (selectedSequence === 'email1') {
        return !l.email_1_date && (!l.email_1 || l.email_1 === '-' || l.email_1 === 'Unsent');
      }
      // If Email 2: lead had Email 1, but no Email 2 yet
      if (selectedSequence === 'email2') {
        const hasEmail1 = Boolean(l.email_1_date || (l.email_1 && l.email_1 !== '-'));
        const hasEmail2 = Boolean(l.email_2_date || (l.email_2 && l.email_2 !== '-'));
        return hasEmail1 && !hasEmail2;
      }
      // If Email 3: lead had Email 2, but no Email 3 yet
      if (selectedSequence === 'email3') {
        const hasEmail2 = Boolean(l.email_2_date || (l.email_2 && l.email_2 !== '-'));
        const hasEmail3 = Boolean(l.email_3_date || (l.email_3 && l.email_3 !== '-'));
        return hasEmail2 && !hasEmail3;
      }

      return true;
    });
  }, [leads, selectedSequence, selectedCampaign]);

  // Selected Batch Queue
  const batchQueue = useMemo(() => {
    return eligibleLeads.slice(0, batchSize);
  }, [eligibleLeads, batchSize]);

  // Sequence display names
  const sequenceInfo = {
    email1: { name: 'Email 1', sub: 'Initial Outreach', field: 'email_1_date' as const },
    email2: { name: 'Email 2', sub: 'Follow-up 1', field: 'email_2_date' as const },
    email3: { name: 'Email 3', sub: 'Follow-up 2', field: 'email_3_date' as const },
  }[selectedSequence];

  // Action 1: Copy 4 columns to clipboard
  const handleCopy4Columns = async () => {
    if (batchQueue.length === 0) return;
    const success = await copyMailMergeToClipboard(batchQueue, true);
    if (success) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    }
  };

  // Action 2: Auto-Apply Sent Status
  const handleAutoApplySent = async () => {
    if (batchQueue.length === 0) return;

    for (const lead of batchQueue) {
      const updates: Partial<Lead> = {};
      if (selectedSequence === 'email1') {
        updates.email_1 = dispatchDateTag;
        updates.email_1_date = dispatchDateTag;
      } else if (selectedSequence === 'email2') {
        updates.email_2 = dispatchDateTag;
        updates.email_2_date = dispatchDateTag;
      } else if (selectedSequence === 'email3') {
        updates.email_3 = dispatchDateTag;
        updates.email_3_date = dispatchDateTag;
      }
      await updateLead(lead.id, updates, `Dispatched ${sequenceInfo.name} on ${dispatchDateTag}`);
    }

    await createMailMergeBatch({
      campaignId: selectedCampaign !== 'all' ? selectedCampaign : undefined,
      senderName: sendingAccount,
      leadIds: batchQueue.map((l) => l.id),
    });

    setApplyFeedback(true);
    setTimeout(() => setApplyFeedback(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Header (Exact match to Screenshot 3) */}
      <div className="p-4 bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5 max-w-3xl">
          {/* Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[10px] font-mono font-bold tracking-wider uppercase">
            <span>MAIL MERGE FAST DISPATCHER</span>
            <span>?</span>
            <span>Workspace: Ruhit Outreach Solutions</span>
          </div>

          <h2 className="text-lg font-extrabold text-white tracking-tight">
            Google Mail Merge Batch Dispatcher
          </h2>

          <p className="text-xs text-[#94A3B8] leading-relaxed">
            1) Select sequence & campaign ? 2) Target by Sending Account & Sent Date for follow-ups ? 3) Click "Copy 4 Columns for Mail Merge" and paste into row 2 of Google Sheets ? 4) Click "Auto-Apply Sent Status".
          </p>

          <button
            type="button"
            className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#00E5A0]/10 hover:bg-[#00E5A0]/20 text-[#00E5A0] border border-[#00E5A0]/40 rounded-lg text-xs font-semibold transition-all mt-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Re-Tag Yesterday's Sent Follow-ups from Google Sheet</span>
          </button>
        </div>

        {/* Top Right Stat Metrics Box */}
        <div className="bg-[#111827] border border-[#1E3A5F] rounded-xl p-3 flex items-center divide-x divide-[#1E3A5F]/70 text-center shrink-0">
          <div className="px-4">
            <span className="text-[10px] uppercase font-mono font-bold text-[#94A3B8] block">
              ELIGIBLE POOL
            </span>
            <span className="text-xl font-extrabold font-mono text-[#00E5A0] block mt-0.5">
              {eligibleLeads.length}
            </span>
          </div>
          <div className="px-4">
            <span className="text-[10px] uppercase font-mono font-bold text-[#94A3B8] block">
              DNC EXCLUDED
            </span>
            <span className="text-xl font-extrabold font-mono text-[#F97316] block mt-0.5">
              {dncLeads.length}
            </span>
          </div>
          <div className="px-4">
            <span className="text-[10px] uppercase font-mono font-bold text-[#94A3B8] block">
              BATCH SELECTED
            </span>
            <span className="text-xl font-extrabold font-mono text-[#00C2FF] block mt-0.5">
              {batchQueue.length}
            </span>
          </div>
        </div>
      </div>

      {/* Red DNC Warning Alert Bar (Screenshot 3) */}
      <div className="p-3 bg-red-950/30 border border-red-800/60 rounded-xl flex items-center justify-between text-xs text-red-300">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            <strong>DNC Protection Active:</strong> {dncLeads.length} contact(s) labeled as DNC / Not Interested / Unsubscribed are automatically excluded from this {sequenceInfo.name} ({sequenceInfo.sub}) batch.
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900/50 text-red-200 border border-red-700/60 shrink-0">
          {dncLeads.length} Avoided
        </span>
      </div>

      {/* Main Two-Column Workflow Grid (Screenshot 3 & 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Sequence & Batch Setup (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: Select Sequence & Campaign */}
          <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00C2FF] flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00C2FF]" />
              <span>1. SELECT SEQUENCE & CAMPAIGN</span>
            </h3>

            {/* Sequence 3 Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedSequence('email1')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  selectedSequence === 'email1'
                    ? 'bg-[#111827] border-[#00C2FF] shadow-[0_0_12px_rgba(0,194,255,0.3)]'
                    : 'bg-[#111827]/40 border-[#1E3A5F] hover:border-[#1E3A5F]/80'
                }`}
              >
                <span className="font-bold text-white block text-xs">Email 1</span>
                <span className="text-[10px] text-[#94A3B8] block">Initial Outreach</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSequence('email2')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  selectedSequence === 'email2'
                    ? 'bg-[#111827] border-[#00C2FF] shadow-[0_0_12px_rgba(0,194,255,0.3)]'
                    : 'bg-[#111827]/40 border-[#1E3A5F] hover:border-[#1E3A5F]/80'
                }`}
              >
                <span className="font-bold text-white block text-xs">Email 2</span>
                <span className="text-[10px] text-[#94A3B8] block">Follow-up 1</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSequence('email3')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  selectedSequence === 'email3'
                    ? 'bg-[#111827] border-[#00C2FF] shadow-[0_0_12px_rgba(0,194,255,0.3)]'
                    : 'bg-[#111827]/40 border-[#1E3A5F] hover:border-[#1E3A5F]/80'
                }`}
              >
                <span className="font-bold text-white block text-xs">Email 3</span>
                <span className="text-[10px] text-[#94A3B8] block">Follow-up 2</span>
              </button>
            </div>

            {/* Filter by Campaign Pool */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[11px] text-[#94A3B8]">
                <span>Filter by Campaign Pool:</span>
                <span className="font-mono text-[#00C2FF]">{eligibleLeads.length} leads in stage</span>
              </div>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs focus:border-[#00C2FF] focus:outline-none"
              >
                <option value="all">All Campaigns Combined ({leads.length} leads total)</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card 2: Batch Volume & Sender Setup */}
          <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl p-4 shadow-xl space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00E5A0] flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00E5A0]" />
              <span>2. BATCH VOLUME & SENDER SETUP</span>
            </h3>

            {/* Batch Size Presets */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] text-[#94A3B8]">
                <span>Batch Size (Number of leads to dispatch):</span>
                <button
                  type="button"
                  onClick={() => setBatchSize(eligibleLeads.length)}
                  className="text-[#00C2FF] hover:underline"
                >
                  All eligible ({eligibleLeads.length})
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setBatchSize(size)}
                    className={`py-2 rounded-lg font-mono font-bold text-xs border transition-all ${
                      batchSize === size
                        ? 'bg-[#00E5A0] text-black border-[#00E5A0] shadow-[0_0_12px_rgba(0,229,160,0.4)]'
                        : 'bg-[#111827] text-white border-[#1E3A5F] hover:border-[#00C2FF]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Custom Number Input */}
              <input
                type="number"
                min={1}
                max={eligibleLeads.length || 1}
                value={batchSize}
                onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-xs font-mono focus:border-[#00C2FF] focus:outline-none mt-1"
              />
            </div>

            {/* Sending Email Account */}
            <div className="space-y-1">
              <label className="text-[11px] text-[#94A3B8] flex items-center space-x-1">
                <span>✉️ Sending Email Account:</span>
              </label>
              <select
                value={sendingAccount}
                onChange={(e) => setSendingAccount(e.target.value)}
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs font-mono focus:border-[#00C2FF] focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.email_account}>
                    {a.email_account} ({a.account_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Today's Dispatch Date Tag */}
            <div className="space-y-1">
              <label className="text-[11px] text-[#94A3B8] flex items-center space-x-1">
                <span>📅 Today's Dispatch Date Tag:</span>
              </label>
              <input
                type="text"
                value={dispatchDateTag}
                onChange={(e) => setDispatchDateTag(e.target.value)}
                placeholder="DD/MM/YY"
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-xs font-mono focus:border-[#00C2FF] focus:outline-none"
              />
            </div>
          </div>

          {/* Action Box (Cyan Border container matching Screenshot 4) */}
          <div className="bg-[#0A0A0A] border-2 border-[#00C2FF]/80 rounded-xl p-4 shadow-2xl space-y-2.5">
            {/* Button 1: Copy 4 Columns */}
            <button
              onClick={handleCopy4Columns}
              disabled={batchQueue.length === 0}
              className="w-full py-2.5 px-4 bg-[#0084B4] hover:bg-[#009bd4] text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg disabled:opacity-40"
            >
              {copyFeedback ? (
                <>
                  <Check className="w-4 h-4 text-[#00E5A0]" />
                  <span>Copied 4 Columns for Mail Merge ({batchQueue.length})!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>1. Copy 4 Columns for Mail Merge ({batchQueue.length})</span>
                </>
              )}
            </button>

            {/* Button 2: Auto-Apply Sent Status */}
            <button
              onClick={handleAutoApplySent}
              disabled={batchQueue.length === 0}
              className="w-full py-2.5 px-4 bg-[#059669] hover:bg-[#10b981] text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg disabled:opacity-40"
            >
              {applyFeedback ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Applied "Email Sent - {dispatchDateTag}"!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>2. Auto-Apply "Email Sent - {dispatchDateTag}"</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-[#7B7B7B] text-center italic">
              Copies TSV formatted data ready for instant ctrl + v into Google Sheets.
            </p>
          </div>
        </div>

        {/* Right Column: Batch Queue Preview Table (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-3.5 bg-[#111827] border-b border-[#1E3A5F] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs text-white uppercase tracking-wider">
                BATCH QUEUE PREVIEW
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00C2FF]/15 text-[#00C2FF] font-bold">
                {batchQueue.length} Selected
              </span>
            </div>
            <span className="text-[11px] text-[#94A3B8] font-mono">
              Sequence: <strong className="text-[#00C2FF]">{sequenceInfo.name} ({sequenceInfo.sub})</strong>
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[420px]">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#0A0A0A] text-[#00C2FF] border-b border-[#1E3A5F]/80 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">EMAIL ADDRESS</th>
                  <th className="py-2.5 px-3">FIRST NAME</th>
                  <th className="py-2.5 px-3">COMPANY</th>
                  <th className="py-2.5 px-3 text-[#00C2FF]">SENDER MAILBOX</th>
                  <th className="py-2.5 px-3">DATE ADDED</th>
                  <th className="py-2.5 px-3">CAMPAIGN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3A5F]/40 bg-[#0A0A0A]">
                {batchQueue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-[#7B7B7B]">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Filter className="w-8 h-8 text-[#1E3A5F]" />
                        <p className="font-medium text-xs">
                          No eligible leads match the current filters.
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          All leads may already be sent or marked as DNC.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  batchQueue.map((lead, idx) => (
                    <tr
                      key={lead.id}
                      className={idx % 2 === 0 ? 'bg-[#0A0A0A]' : 'bg-[#0E1522]'}
                    >
                      <td className="py-2 px-3 font-mono text-[#00C2FF]">{lead.email}</td>
                      <td className="py-2 px-3 text-white">{lead.first_name || '—'}</td>
                      <td className="py-2 px-3 text-[#94A3B8]">{lead.company_name || '—'}</td>
                      <td className="py-2 px-3 text-xs text-[#00C2FF] font-mono">{sendingAccount}</td>
                      <td className="py-2 px-3 text-xs text-[#94A3B8] font-mono">
                        {lead.created_at ? lead.created_at.split('T')[0] : '—'}
                      </td>
                      <td className="py-2 px-3 text-xs">
                        {lead.campaign_name ? (
                          <span className="px-1.5 py-0.5 rounded bg-[#1E3A5F]/40 text-[#94A3B8] text-[10px]">
                            {lead.campaign_name}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
