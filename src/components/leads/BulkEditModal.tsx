import React, { useState } from 'react';
import { X, Check, Edit3, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import {
  Priority,
  WhatsAppFollowUpStage,
  InterestedEmailFollowUpStage,
  Lead
} from '../../types';

interface BulkEditModalProps {
  isOpen: boolean;
  selectedLeadIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  selectedLeadIds,
  onClose,
  onSuccess,
}) => {
  const {
    campaigns,
    brands,
    accounts,
    lists,
    bulkUpdateLeads,
    addLeadsToList
  } = useLeads();
  const { allUsers } = useAuth();

  // Field activation checkboxes
  const [applyStage, setApplyStage] = useState(false);
  const [stageValue, setStageValue] = useState<string>('outreach');

  const [applyPriority, setApplyPriority] = useState(false);
  const [priorityValue, setPriorityValue] = useState<Priority>('Medium');

  const [applyRep, setApplyRep] = useState(false);
  const [repValue, setRepValue] = useState<string>('');

  const [applyAccount, setApplyAccount] = useState(false);
  const [accountValue, setAccountValue] = useState<string>('');

  const [applyCampaign, setApplyCampaign] = useState(false);
  const [campaignValue, setCampaignValue] = useState<string>('');

  const [applyBrand, setApplyBrand] = useState(false);
  const [brandValue, setBrandValue] = useState<string>('');

  const [applyWaFollowup, setApplyWaFollowup] = useState(false);
  const [waFollowupValue, setWaFollowupValue] = useState<string>('none');

  const [applyEmailFollowup, setApplyEmailFollowup] = useState(false);
  const [emailFollowupValue, setEmailFollowupValue] = useState<string>('none');

  const [applyEmail1Date, setApplyEmail1Date] = useState(false);
  const [email1DateValue, setEmail1DateValue] = useState('');

  const [applyEmail2Date, setApplyEmail2Date] = useState(false);
  const [email2DateValue, setEmail2DateValue] = useState('');

  const [applyEmail3Date, setApplyEmail3Date] = useState(false);
  const [email3DateValue, setEmail3DateValue] = useState('');

  const [applyList, setApplyList] = useState(false);
  const [listValue, setListValue] = useState<string>('');

  const [applyPending, setApplyPending] = useState(false);
  const [pendingValue, setPendingValue] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLeadIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const updates: Partial<Lead> = {};
      const now = new Date().toISOString();

      if (applyStage) {
        if (stageValue === 'outreach') {
          updates.is_interested = false;
          updates.is_meeting_scheduled = false;
          updates.is_meeting_done = false;
          updates.meeting_count_type = null;
        } else if (stageValue === 'interested') {
          updates.is_interested = true;
          updates.interested_at = now;
          updates.is_meeting_scheduled = false;
          updates.is_meeting_done = false;
          updates.meeting_count_type = null;
        } else if (stageValue === 'scheduled') {
          updates.is_interested = true;
          updates.is_meeting_scheduled = true;
          updates.meeting_scheduled_at = now;
          updates.is_meeting_done = false;
          updates.meeting_count_type = null;
        } else if (stageValue === 'done') {
          updates.is_interested = true;
          updates.is_meeting_scheduled = true;
          updates.is_meeting_done = true;
          updates.meeting_done_at = now;
          updates.meeting_count_type = null;
        } else if (stageValue === 'count_yes') {
          updates.is_interested = true;
          updates.is_meeting_scheduled = true;
          updates.is_meeting_done = true;
          updates.meeting_count_type = 'YES';
          updates.meeting_count_at = now;
        } else if (stageValue === 'count_no') {
          updates.is_interested = true;
          updates.is_meeting_scheduled = true;
          updates.is_meeting_done = true;
          updates.meeting_count_type = 'NO';
          updates.meeting_count_at = now;
          // Rule: Count NO is NEVER pending
          updates.is_pending = false;
          updates.pending_at = null;
        } else if (stageValue === 'dnc') {
          updates.priority = 'DNC';
          updates.is_pending = false;
          updates.pending_at = null;
        }
      }

      if (applyPriority) {
        updates.priority = priorityValue;
      }

      if (applyRep && repValue) {
        const user = allUsers.find((u) => u.id === repValue);
        updates.assigned_user_id = repValue;
        updates.assigned_user_name = user?.full_name;
      }

      if (applyAccount && accountValue) {
        const acc = accounts.find((a) => a.id === accountValue);
        updates.account_id = accountValue;
        updates.account_name = acc?.account_name;
      }

      if (applyCampaign && campaignValue) {
        const cmp = campaigns.find((c) => c.id === campaignValue);
        updates.campaign_id = campaignValue;
        updates.campaign_name = cmp?.name;
      }

      if (applyBrand && brandValue) {
        const br = brands.find((b) => b.id === brandValue);
        updates.brand_id = brandValue;
        updates.brand_name = br?.name;
      }

      if (applyWaFollowup) {
        updates.whatsapp_followup_stage = (waFollowupValue === 'none' ? null : waFollowupValue) as WhatsAppFollowUpStage;
      }

      if (applyEmailFollowup) {
        updates.interested_email_followup_stage = (emailFollowupValue === 'none' ? null : emailFollowupValue) as InterestedEmailFollowUpStage;
      }

      if (applyEmail1Date) {
        updates.email_1 = email1DateValue.trim() || undefined;
        updates.email_1_date = email1DateValue.trim() || null;
      }

      if (applyEmail2Date) {
        updates.email_2 = email2DateValue.trim() || undefined;
        updates.email_2_date = email2DateValue.trim() || null;
      }

      if (applyEmail3Date) {
        updates.email_3 = email3DateValue.trim() || undefined;
        updates.email_3_date = email3DateValue.trim() || null;
      }

      if (applyPending) {
        // Enforce rule: Count NO can never be pending
        if (stageValue !== 'count_no') {
          updates.is_pending = pendingValue;
          updates.pending_at = pendingValue ? now : null;
        }
      }

      // Execute bulk update
      if (Object.keys(updates).length > 0) {
        await bulkUpdateLeads(selectedLeadIds, updates, 'Bulk Edit Operation');
      }

      // Execute list assignment if selected
      if (applyList && listValue) {
        await addLeadsToList(listValue, selectedLeadIds);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Bulk edit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAnyChecked =
    applyStage ||
    applyPriority ||
    applyRep ||
    applyAccount ||
    applyCampaign ||
    applyBrand ||
    applyWaFollowup ||
    applyEmailFollowup ||
    applyEmail1Date ||
    applyEmail2Date ||
    applyEmail3Date ||
    applyList ||
    applyPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00C2FF]/15 border border-[#00C2FF]/30 flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Bulk Edit Leads</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#00C2FF]/15 text-[#00C2FF] font-bold border border-[#00C2FF]/30">
                  {selectedLeadIds.length} Selected
                </span>
              </h3>
              <p className="text-[11px] text-[#94A3B8]">
                Check the fields you wish to update across all selected leads.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#7B7B7B] hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleApply} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* 1. Primary Stage */}
            <div className={`p-3 rounded-lg border transition-all ${applyStage ? 'bg-[#111827] border-[#00C2FF]/50' : 'bg-[#0A0A0A] border-[#1E3A5F]/40 opacity-70'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-white flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyStage}
                    onChange={(e) => setApplyStage(e.target.checked)}
                    className="rounded border-[#1E3A5F] text-[#00C2FF] bg-[#111827] focus:ring-0"
                  />
                  <span>Primary Stage (Pipeline Milestone)</span>
                </label>
              </div>
              <select
                disabled={!applyStage}
                value={stageValue}
                onChange={(e) => setStageValue(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF] focus:outline-none disabled:opacity-40"
              >
                <option value="outreach">Initial Outreach</option>
                <option value="interested">Stage 1: Interested</option>
                <option value="scheduled">Stage 2: Meeting Scheduled</option>
                <option value="done">Stage 3: Meeting Done</option>
                <option value="count_yes">Stage 4: Meeting Count = YES</option>
                <option value="count_no">Stage 4b: Meeting Count = NO</option>
                <option value="dnc">DNC (Do Not Contact / Excluded)</option>
              </select>
            </div>

            {/* 2. Priority */}
            <div className={`p-3 rounded-lg border transition-all ${applyPriority ? 'bg-[#111827] border-[#00C2FF]/50' : 'bg-[#0A0A0A] border-[#1E3A5F]/40 opacity-70'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-white flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyPriority}
                    onChange={(e) => setApplyPriority(e.target.checked)}
                    className="rounded border-[#1E3A5F] text-[#00C2FF] bg-[#111827] focus:ring-0"
                  />
                  <span>Priority</span>
                </label>
              </div>
              <select
                disabled={!applyPriority}
                value={priorityValue}
                onChange={(e) => setPriorityValue(e.target.value as Priority)}
                className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF] focus:outline-none disabled:opacity-40"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="DNC">DNC</option>
              </select>
            </div>

            {/* 3. Assigned Rep */}
            <div className={`p-3 rounded-lg border transition-all ${applyRep ? 'bg-[#111827] border-[#00C2FF]/50' : 'bg-[#0A0A0A] border-[#1E3A5F]/40 opacity-70'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-white flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyRep}
                    onChange={(e) => setApplyRep(e.target.checked)}
                    className="rounded border-[#1E3A5F] text-[#00C2FF] bg-[#111827] focus:ring-0"
                  />
                  <span>Assigned Rep</span>
                </label>
              </div>
              <select
                disabled={!applyRep}
                value={repValue}
                onChange={(e) => setRepValue(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF] focus:outline-none disabled:opacity-40"
              >
                <option value="">-- Select Rep --</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                ))}
              </select>
            </div>

            {/* 4. Add to List */}
            <div className={`p-3 rounded-lg border transition-all ${applyList ? 'bg-[#111827] border-[#00C2FF]/50' : 'bg-[#0A0A0A] border-[#1E3A5F]/40 opacity-70'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-white flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyList}
                    onChange={(e) => setApplyList(e.target.checked)}
                    className="rounded border-[#1E3A5F] text-[#00C2FF] bg-[#111827] focus:ring-0"
                  />
                  <span>Add to List</span>
                </label>
              </div>
              <select
                disabled={!applyList}
                value={listValue}
                onChange={(e) => setListValue(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF] focus:outline-none disabled:opacity-40"
              >
                <option value="">-- Select List --</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* 5. Campaign */}
            <div className={`p-3 rounded-lg border transition-all ${applyCampaign ? 'bg-[#111827] border-[#00C2FF]/50' : 'bg-[#0A0A0A] border-[#1E3A5F]/40 opacity-70'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-white flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyCampaign}
                    onChange={(e) => setApplyCampaign(e.target.checked)}
                    className="rounded border-[#1E3A5F] text-[#00C2FF] bg-[#111827] focus:ring-0"
                  />
                  <span>Campaign</span>
                </label>
              </div>
              <select
                disabled={!applyCampaign}
                value={campaignValue}
                onChange={(e) => setCampaignValue(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF] focus:outline-none disabled:opacity-40"
              >
                <option value="">-- Select Campaign --</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* 6. Outbound Account */}
            <div className={`p-3 rounded-lg border transition-all ${applyAccount ? 'bg-[#111827] border-[#00C2FF]/50' : 'bg-[#0A0A0A] border-[#1E3A5F]/40 opacity-70'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-white flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyAccount}
                    onChange={(e) => setApplyAccount(e.target.checked)}
                    className="rounded border-[#1E3A5F] text-[#00C2FF] bg-[#111827] focus:ring-0"
                  />
                  <span>Outbound Account</span>
                </label>
              </div>
              <select
                disabled={!applyAccount}
                value={accountValue}
                onChange={(e) => setAccountValue(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF] focus:outline-none disabled:opacity-40"
              >
                <option value="">-- Select Account --</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.account_name} ({a.email_account})</option>
                ))}
              </select>
            </div>

            {/* 7. WhatsApp Follow Up */}
            <div className={`p-3 rounded-lg border transition-all ${applyWaFollowup ? 'bg-[#111827] border-[#00C2FF]/50' : 'bg-[#0A0A0A] border-[#1E3A5F]/40 opacity-70'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-white flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyWaFollowup}
                    onChange={(e) => setApplyWaFollowup(e.target.checked)}
                    className="rounded border-[#1E3A5F] text-[#00C2FF] bg-[#111827] focus:ring-0"
                  />
                  <span>WhatsApp Follow Up</span>
                </label>
              </div>
              <select
                disabled={!applyWaFollowup}
                value={waFollowupValue}
                onChange={(e) => setWaFollowupValue(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF] focus:outline-none disabled:opacity-40"
              >
                <option value="none">None / -</option>
                <option value="WA1 Sent">WA1 Sent</option>
                <option value="WA2 Follow Up Sent">WA2 Follow Up Sent</option>
                <option value="WA3 Follow Up Sent">WA3 Follow Up Sent</option>
              </select>
            </div>

            {/* 8. Interested Email Follow Up */}
            <div className={`p-3 rounded-lg border transition-all ${applyEmailFollowup ? 'bg-[#111827] border-[#00C2FF]/50' : 'bg-[#0A0A0A] border-[#1E3A5F]/40 opacity-70'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-white flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyEmailFollowup}
                    onChange={(e) => setApplyEmailFollowup(e.target.checked)}
                    className="rounded border-[#1E3A5F] text-[#00C2FF] bg-[#111827] focus:ring-0"
                  />
                  <span>Interested Email Follow Up</span>
                </label>
              </div>
              <select
                disabled={!applyEmailFollowup}
                value={emailFollowupValue}
                onChange={(e) => setEmailFollowupValue(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF] focus:outline-none disabled:opacity-40"
              >
                <option value="none">None / -</option>
                <option value="FW1 Sent">FW1 Sent</option>
                <option value="FW2 Sent">FW2 Sent</option>
                <option value="FW3 Sent">FW3 Sent</option>
              </select>
            </div>

            {/* 9. Email 1 Date */}
            <div className={`p-3 rounded-lg border transition-all ${applyEmail1Date ? 'bg-[#111827] border-[#00C2FF]/50' : 'bg-[#0A0A0A] border-[#1E3A5F]/40 opacity-70'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-white flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyEmail1Date}
                    onChange={(e) => setApplyEmail1Date(e.target.checked)}
                    className="rounded border-[#1E3A5F] text-[#00C2FF] bg-[#111827] focus:ring-0"
                  />
                  <span>Email 1 Dispatch Date</span>
                </label>
              </div>
              <input
                type="text"
                disabled={!applyEmail1Date}
                placeholder="DD/MM/YY"
                value={email1DateValue}
                onChange={(e) => setEmail1DateValue(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 font-mono focus:border-[#00C2FF] focus:outline-none disabled:opacity-40"
              />
            </div>

            {/* 10. Email 2 Date */}
            <div className={`p-3 rounded-lg border transition-all ${applyEmail2Date ? 'bg-[#111827] border-[#00C2FF]/50' : 'bg-[#0A0A0A] border-[#1E3A5F]/40 opacity-70'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-white flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyEmail2Date}
                    onChange={(e) => setApplyEmail2Date(e.target.checked)}
                    className="rounded border-[#1E3A5F] text-[#00C2FF] bg-[#111827] focus:ring-0"
                  />
                  <span>Email 2 Dispatch Date</span>
                </label>
              </div>
              <input
                type="text"
                disabled={!applyEmail2Date}
                placeholder="DD/MM/YY"
                value={email2DateValue}
                onChange={(e) => setEmail2DateValue(e.target.value)}
                className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 font-mono focus:border-[#00C2FF] focus:outline-none disabled:opacity-40"
              />
            </div>

            {/* 11. Pending "YES" */}
            <div className={`md:col-span-2 p-3 rounded-lg border transition-all ${applyPending ? 'bg-[#111827] border-[#00C2FF]/50' : 'bg-[#0A0A0A] border-[#1E3A5F]/40 opacity-70'}`}>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-white flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyPending}
                    onChange={(e) => setApplyPending(e.target.checked)}
                    className="rounded border-[#1E3A5F] text-[#00C2FF] bg-[#111827] focus:ring-0"
                  />
                  <span>Set Pending "YES" Status</span>
                </label>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={!applyPending}
                    onClick={() => setPendingValue(!pendingValue)}
                    className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${
                      !applyPending
                        ? 'opacity-40 cursor-not-allowed border-neutral-800 bg-neutral-900 text-neutral-500'
                        : pendingValue
                        ? 'bg-[#F97316]/20 border-[#F97316] text-[#F97316]'
                        : 'bg-[#111827] border-[#1E3A5F] text-[#7B7B7B]'
                    }`}
                  >
                    {pendingValue ? 'Pending "YES"' : 'Not Pending'}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-[#64748B] mt-1">
                Note: Leads marked as Meeting Count = NO are automatically excluded from pending status.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#1E3A5F] flex items-center justify-between">
            <span className="text-[11px] text-[#94A3B8]">
              {hasAnyChecked ? 'Ready to apply selected updates.' : 'Select at least one field to update.'}
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-[#7B7B7B] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!hasAnyChecked || isSubmitting}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#00C2FF] hover:bg-[#00C2FF]/80 text-black font-bold text-xs rounded-lg transition-all shadow-md disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Updating...' : `Apply Changes to ${selectedLeadIds.length} Leads`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
