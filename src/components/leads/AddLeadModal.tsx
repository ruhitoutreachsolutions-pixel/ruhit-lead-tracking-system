import React, { useState } from 'react';
import { X, UserPlus, Check, Sparkles, Flag, Calendar, Phone, Copy } from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { Priority, WhatsAppFollowUpStage, InterestedEmailFollowUpStage } from '../../types';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose }) => {
  const { addLead, brands, accounts, campaigns, lists } = useLeads();
  const { allUsers, currentUser } = useAuth();

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [alternativePhone, setAlternativePhone] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [city, setCity] = useState('');
  const [priority, setPriority] = useState<Priority>('High');
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id || '');
  const [brandId, setBrandId] = useState(brands[0]?.id || '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [assignedUserId, setAssignedUserId] = useState(currentUser?.id || 'usr-ruhit-owner');
  const [notes, setNotes] = useState('');

  // Pipeline Stage & Follow-Up Stages
  const [pipelineStage, setPipelineStage] = useState<string>('outreach');
  const [isPendingYes, setIsPendingYes] = useState<boolean>(false);
  const [whatsappFollowup, setWhatsappFollowup] = useState<string>('none');
  const [interestedEmailFollowup, setInterestedEmailFollowup] = useState<string>('none');

  // Dispatch dates
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
  const [email1Date, setEmail1Date] = useState(todayFormatted);
  const [email2Date, setEmail2Date] = useState('');
  const [email3Date, setEmail3Date] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const selectedCampaign = campaigns.find((c) => c.id === campaignId);
      const selectedBrand = brands.find((b) => b.id === brandId);
      const selectedAccount = accounts.find((a) => a.id === accountId);
      const selectedUser = allUsers.find((u) => u.id === assignedUserId);

      const now = new Date().toISOString();
      const isInterested = pipelineStage !== 'outreach' && pipelineStage !== 'dnc';
      const isScheduled = ['scheduled', 'done', 'count_yes', 'count_no'].includes(pipelineStage);
      const isDone = ['done', 'count_yes', 'count_no'].includes(pipelineStage);
      const meetingCount = pipelineStage === 'count_yes' ? 'YES' : pipelineStage === 'count_no' ? 'NO' : null;
      
      // Rule: Count NO is NEVER pending
      const canBePending = pipelineStage !== 'count_no' && pipelineStage !== 'dnc';
      const finalPending = canBePending && isPendingYes;
      const finalPriority = pipelineStage === 'dnc' ? 'DNC' : priority;

      await addLead({
        email: email.trim().toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company_name: companyName.trim(),
        whatsapp_number: whatsappNumber.trim(),
        alternative_phone: alternativePhone.trim(),
        list_ids: selectedListId ? [selectedListId] : [],
        country: country.trim(),
        city: city.trim(),
        priority: finalPriority,
        campaign_id: campaignId || undefined,
        campaign_name: selectedCampaign?.name,
        brand_id: brandId || undefined,
        brand_name: selectedBrand?.name,
        account_id: accountId || undefined,
        account_name: selectedAccount?.account_name,
        assigned_user_id: assignedUserId,
        assigned_user_name: selectedUser?.full_name,
        notes: notes.trim(),
        source: 'Manual Entry',
        email_1: email1Date.trim(),
        email_1_date: email1Date.trim(),
        email_2: email2Date.trim(),
        email_2_date: email2Date.trim(),
        email_3: email3Date.trim(),
        email_3_date: email3Date.trim(),
        whatsapp_followup_stage: (whatsappFollowup === 'none' ? null : whatsappFollowup) as WhatsAppFollowUpStage,
        interested_email_followup_stage: (interestedEmailFollowup === 'none' ? null : interestedEmailFollowup) as InterestedEmailFollowUpStage,
        is_interested: isInterested,
        interested_at: isInterested ? now : null,
        is_meeting_scheduled: isScheduled,
        meeting_scheduled_at: isScheduled ? now : null,
        is_meeting_done: isDone,
        meeting_done_at: isDone ? now : null,
        meeting_count_type: meetingCount,
        meeting_count_at: meetingCount ? now : null,
        is_pending: finalPending,
        pending_at: finalPending ? now : null,
        tags: [],
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00E5A0]/10 border border-[#00E5A0]/30 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-[#00E5A0]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Add Single Lead</h3>
              <p className="text-[11px] text-[#94A3B8]">
                Create a prospect with full contact data and pipeline stage
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Contact Details Grid (Matching Screenshot 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Email Address */}
            <div>
              <label className="text-[11px] font-semibold text-[#00C2FF] block mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prospect@company.com"
                className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00C2FF] focus:outline-none font-mono"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Enterprise Ltd"
                className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
              />
            </div>

            {/* First Name */}
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
              />
            </div>

            {/* WhatsApp Number */}
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+447123456789"
                className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00C2FF] focus:outline-none font-mono"
              />
            </div>

            {/* Alternative Number (Calling) */}
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1 flex items-center justify-between">
                <span>Alternative Number (Calling)</span>
                <span className="text-[10px] text-[#64748B]">Non-WhatsApp</span>
              </label>
              <input
                type="text"
                value={alternativePhone}
                onChange={(e) => setAlternativePhone(e.target.value)}
                placeholder="+442079460123"
                className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00C2FF] focus:outline-none font-mono"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="DNC">DNC (Do Not Contact)</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="United Kingdom"
                className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
              />
            </div>

            {/* City */}
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="London"
                className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
              />
            </div>

            {/* Campaign */}
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                Campaign
              </label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
              >
                <option value="">None / Select</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Approached */}
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                Brand Approached
              </label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
              >
                <option value="">None / Select</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Outbound Account */}
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                Outbound Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
              >
                <option value="">None / Select</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_name} ({a.sender_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned Rep */}
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                Assigned Rep
              </label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Target List */}
            <div>
              <label className="text-[11px] font-semibold text-white block mb-1">
                Assign to List
              </label>
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
              >
                <option value="">-- No List / Default --</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stage & Milestone Section (Added per user feedback!) */}
          <div className="p-3.5 bg-[#111827] border border-[#00C2FF]/30 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-[#00C2FF] flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" />
              <span>Initial Lifecycle Stage & Follow-Up Setup</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Primary Pipeline Stage */}
              <div>
                <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
                  Pipeline Stage:
                </label>
                <select
                  value={pipelineStage}
                  onChange={(e) => {
                    const s = e.target.value;
                    setPipelineStage(s);
                    if (s === 'count_no' || s === 'dnc') setIsPendingYes(false);
                  }}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
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

              {/* WhatsApp Follow Up Stage */}
              <div>
                <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
                  WhatsApp Follow Up:
                </label>
                <select
                  value={whatsappFollowup}
                  onChange={(e) => setWhatsappFollowup(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                >
                  <option value="none">None / -</option>
                  <option value="WA1 Sent">WA1 Sent</option>
                  <option value="WA2 Follow Up Sent">WA2 Follow Up Sent</option>
                  <option value="WA3 Follow Up Sent">WA3 Follow Up Sent</option>
                </select>
              </div>

              {/* Interested Email Follow Up Stage */}
              <div>
                <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
                  Interested Email Follow Up:
                </label>
                <select
                  value={interestedEmailFollowup}
                  onChange={(e) => setInterestedEmailFollowup(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                >
                  <option value="none">None / -</option>
                  <option value="FW1 Sent">FW1 Sent</option>
                  <option value="FW2 Sent">FW2 Sent</option>
                  <option value="FW3 Sent">FW3 Sent</option>
                </select>
              </div>
            </div>

            {/* Pending Option (Count NO blocked) */}
            <div className="pt-2 flex items-center justify-between border-t border-[#1E3A5F]/40">
              <span className="text-[11px] text-[#94A3B8]">
                Mark as Pending Follow-up:
              </span>
              <button
                type="button"
                disabled={pipelineStage === 'count_no'}
                onClick={() => {
                  if (pipelineStage !== 'count_no') setIsPendingYes(!isPendingYes);
                }}
                className={`px-3 py-1 rounded-lg border font-medium text-xs transition-all ${
                  pipelineStage === 'count_no'
                    ? 'bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed'
                    : isPendingYes
                    ? 'bg-[#F97316]/20 border-[#F97316] text-[#F97316]'
                    : 'bg-[#0A0A0A] border-[#1E3A5F] text-[#7B7B7B]'
                }`}
              >
                {pipelineStage === 'count_no' ? 'Blocked (Count NO)' : isPendingYes ? 'Pending "YES"' : 'Pending: NO'}
              </button>
            </div>
          </div>

          {/* Email Actual Dispatch Dates */}
          <div className="p-3 bg-[#111827] border border-[#1E3A5F] rounded-xl space-y-2">
            <h4 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
              Email Dispatch Actual Dates
            </h4>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] text-[#7B7B7B] block mb-1">Email 1 Sent Date:</label>
                <input
                  type="text"
                  value={email1Date}
                  onChange={(e) => setEmail1Date(e.target.value)}
                  placeholder="DD/MM/YY"
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded px-2.5 py-1 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#7B7B7B] block mb-1">Email 2 Sent Date:</label>
                <input
                  type="text"
                  value={email2Date}
                  onChange={(e) => setEmail2Date(e.target.value)}
                  placeholder="DD/MM/YY"
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded px-2.5 py-1 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#7B7B7B] block mb-1">Email 3 Sent Date:</label>
                <input
                  type="text"
                  value={email3Date}
                  onChange={(e) => setEmail3Date(e.target.value)}
                  placeholder="DD/MM/YY"
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded px-2.5 py-1 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold text-white block mb-1">
              Internal Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key notes, context, or meeting background..."
              rows={2}
              className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg p-2.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-[#1E3A5F]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#1E3A5F] text-[#94A3B8] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-[#00E5A0] hover:bg-[#00E5A0]/80 text-black font-semibold text-xs transition-colors flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Add Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
