import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Building,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Plus,
  Send,
  Flag,
  Share2,
  ExternalLink,
  Tag,
  History,
  PhoneCall,
  Copy,
  Check,
  Save,
  Trash2
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { Lead, Priority, WhatsAppFollowUpStage, InterestedEmailFollowUpStage } from '../../types';
import { formatTo12Hour } from '../../lib/formatTime';

interface LeadDetailModalProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenScheduleMeeting?: (leadId: string) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  leadId,
  isOpen,
  onClose,
  onOpenScheduleMeeting,
}) => {
  const {
    leads,
    activities,
    reminders,
    campaigns,
    brands,
    accounts,
    updateLead,
    markInterested,
    markMeetingDone,
    setMeetingCount,
    togglePending,
    recordWhatsAppSent,
    recordCallDone,
    addNote,
    addReminder,
    completeReminder,
    deleteLead,
    lists,
  } = useLeads();
  const { allUsers, currentUser } = useAuth();

  const lead = leads.find((l) => l.id === leadId);

  // Editable Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [campaignId, setCampaignId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [email1Date, setEmail1Date] = useState('');
  const [email2Date, setEmail2Date] = useState('');
  const [email3Date, setEmail3Date] = useState('');
  const [whatsappFollowup, setWhatsappFollowup] = useState<string>('none');
  const [interestedEmailFollowup, setInterestedEmailFollowup] = useState<string>('none');
  const [notes, setNotes] = useState('');
  const [alternativePhone, setAlternativePhone] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [isCopiedAlt, setIsCopiedAlt] = useState(false);

  // Stage & Pending State
  const [pipelineStage, setPipelineStage] = useState<string>('outreach');
  const [isPendingYes, setIsPendingYes] = useState<boolean>(false);
  const [dateOfInterested, setDateOfInterested] = useState<string>('');

  // UI state
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'reminders'>('timeline');
  const [newNote, setNewNote] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('11:00');
  const [newReminderNote, setNewReminderNote] = useState('');
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Sync state when lead opens
  useEffect(() => {
    if (lead) {
      setFirstName(lead.first_name || '');
      setLastName(lead.last_name || '');
      setEmail(lead.email || '');
      setCompanyName(lead.company_name || '');
      setWhatsappNumber(lead.whatsapp_number || '');
      setCountry(lead.country || '');
      setCity(lead.city || '');
      setPriority(lead.priority || 'Medium');
      setCampaignId(lead.campaign_id || '');
      setBrandId(lead.brand_id || '');
      setAccountId(lead.account_id || '');
      setAssignedUserId(lead.assigned_user_id || currentUser?.id || 'usr-ruhit-owner');
      setEmail1Date(lead.email_1_date || lead.email_1 || '');
      setEmail2Date(lead.email_2_date || lead.email_2 || '');
      setEmail3Date(lead.email_3_date || lead.email_3 || '');
      setWhatsappFollowup(lead.whatsapp_followup_stage || 'none');
      setInterestedEmailFollowup(lead.interested_email_followup_stage || 'none');
      setNotes(lead.notes || '');
      setAlternativePhone(lead.alternative_phone || '');
      setSelectedListId((lead.list_ids && lead.list_ids[0]) || '');

      // Determine current stage
      if (lead.priority === 'DNC') {
        setPipelineStage('dnc');
      } else if (lead.meeting_count_type === 'YES') {
        setPipelineStage('count_yes');
      } else if (lead.meeting_count_type === 'NO') {
        setPipelineStage('count_no');
      } else if (lead.is_meeting_done) {
        setPipelineStage('done');
      } else if (lead.is_meeting_scheduled) {
        setPipelineStage('scheduled');
      } else if (lead.is_interested) {
        setPipelineStage('interested');
      } else {
        setPipelineStage('outreach');
      }

      setIsPendingYes(Boolean(lead.is_pending && lead.meeting_count_type !== 'NO'));
      setDateOfInterested(
        lead.interested_at
          ? lead.interested_at.slice(0, 10)
          : lead.is_interested && lead.created_at
          ? lead.created_at.slice(0, 10)
          : ''
      );
    }
  }, [lead, currentUser?.id]);

  if (!isOpen || !leadId || !lead) return null;

  const leadActivities = activities.filter((a) => a.lead_id === leadId);
  const leadReminders = reminders.filter((r) => r.lead_id === leadId);

  const handleDeleteLead = async () => {
    if (window.confirm(`Are you sure you want to permanently delete lead ${lead.email}?`)) {
      await deleteLead(lead.id);
      onClose();
    }
  };

  const handleCopyWhatsApp = () => {
    if (!whatsappNumber) return;
    navigator.clipboard.writeText(whatsappNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!whatsappNumber) return;
    const cleanNum = whatsappNumber.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNum}`, '_blank');
    recordWhatsAppSent(lead.id, `Opened WhatsApp link for ${whatsappNumber}`);
  };

  const handleRecordCall = () => {
    recordCallDone(lead.id, 'Logged completed call with lead');
  };

  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const selectedCampaign = campaigns.find((c) => c.id === campaignId);
    const selectedBrand = brands.find((b) => b.id === brandId);
    const selectedAccount = accounts.find((a) => a.id === accountId);
    const selectedUser = allUsers.find((u) => u.id === assignedUserId);

    // Calculate milestone flags based on selected pipelineStage
    let isInterested = lead.is_interested;
    let isMeetingScheduled = lead.is_meeting_scheduled;
    let isMeetingDone = lead.is_meeting_done;
    let meetingCountType = lead.meeting_count_type;

    const now = new Date().toISOString();

    if (pipelineStage === 'outreach' || pipelineStage === 'dnc') {
      isInterested = false;
      isMeetingScheduled = false;
      isMeetingDone = false;
      meetingCountType = null;
    } else if (pipelineStage === 'interested') {
      isInterested = true;
      isMeetingScheduled = false;
      isMeetingDone = false;
      meetingCountType = null;
    } else if (pipelineStage === 'scheduled') {
      isInterested = true;
      isMeetingScheduled = true;
      isMeetingDone = false;
      meetingCountType = null;
    } else if (pipelineStage === 'done') {
      isInterested = true;
      isMeetingScheduled = true;
      isMeetingDone = true;
      meetingCountType = null;
    } else if (pipelineStage === 'count_yes') {
      isInterested = true;
      isMeetingScheduled = true;
      isMeetingDone = true;
      meetingCountType = 'YES';
    } else if (pipelineStage === 'count_no') {
      isInterested = true;
      isMeetingScheduled = true;
      isMeetingDone = true;
      meetingCountType = 'NO';
    }

    // Rule: Count NO is NEVER pending
    const canBePending = pipelineStage !== 'count_no';
    const finalPending = canBePending && isPendingYes;

    const finalPriority = pipelineStage === 'dnc' ? 'DNC' : priority;
    const interestedIso = dateOfInterested.trim()
      ? new Date(`${dateOfInterested.trim()}T12:00:00`).toISOString()
      : (lead.interested_at || (lead.is_interested ? lead.created_at : now));

    const updates: Partial<Lead> = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
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
      assigned_user_id: assignedUserId || currentUser?.id || 'usr-ruhit-owner',
      assigned_user_name: selectedUser?.full_name,
      email_1: email1Date.trim(),
      email_1_date: email1Date.trim(),
      email_2: email2Date.trim(),
      email_2_date: email2Date.trim(),
      email_3: email3Date.trim(),
      email_3_date: email3Date.trim(),
      whatsapp_followup_stage: (whatsappFollowup === 'none' ? null : whatsappFollowup) as WhatsAppFollowUpStage,
      interested_email_followup_stage: (interestedEmailFollowup === 'none' ? null : interestedEmailFollowup) as InterestedEmailFollowUpStage,
      notes: notes.trim(),
      is_interested: isInterested,
      interested_at: isInterested ? interestedIso : null,
      is_meeting_scheduled: isMeetingScheduled,
      meeting_scheduled_at: isMeetingScheduled ? (lead.meeting_scheduled_at || now) : null,
      is_meeting_done: isMeetingDone,
      meeting_done_at: isMeetingDone ? (lead.meeting_done_at || now) : null,
      meeting_count_type: meetingCountType,
      meeting_count_at: meetingCountType ? (lead.meeting_count_at || now) : null,
      is_pending: finalPending,
      pending_at: finalPending ? (lead.pending_at || now) : null,
    };

    await updateLead(lead.id, updates, 'Updated lead information and stage');
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    await addNote(lead.id, newNote.trim());
    setNewNote('');
  };

  const handleAddReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderDate || !newReminderTime) return;
    await addReminder({
      lead_id: lead.id,
      lead_name: `${firstName} ${lastName}`.trim() || companyName,
      lead_company: companyName,
      reminder_type: 'Follow-up',
      reminder_date: newReminderDate,
      reminder_time: newReminderTime,
      note: newReminderNote,
      user_id: currentUser?.id || 'usr-ruhit-owner',
      is_completed: false,
    });
    setNewReminderDate('');
    setNewReminderNote('');
    setIsAddingReminder(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 border-b border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#182234] border border-[#00C2FF]/40 flex items-center justify-center text-[#00C2FF] font-bold text-base">
              {firstName ? firstName[0] : companyName ? companyName[0] : 'L'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Lead Details & Editor'}
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                    priority === 'High'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : priority === 'DNC'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-[#1E3A5F]/40 text-[#94A3B8]'
                  }`}
                >
                  {priority}
                </span>
                {isSavedNotice && (
                  <span className="text-[11px] font-semibold text-[#00E5A0] flex items-center gap-1 bg-[#00E5A0]/15 px-2 py-0.5 rounded border border-[#00E5A0]/30 animate-pulse">
                    <Check className="w-3 h-3" /> Saved!
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] flex items-center space-x-2 mt-0.5 font-mono">
                <span className="text-[#00C2FF]">{email}</span>
                {companyName && <span>? {companyName}</span>}
                {city && <span>? {city}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDeleteLead}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg border border-red-900/60 transition-all mr-1"
              title="Delete Lead"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSaveChanges}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#00C2FF] hover:bg-[#00C2FF]/80 text-black font-bold text-xs rounded-lg transition-all shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-[#7B7B7B] hover:text-white rounded hover:bg-[#1E3A5F]/40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Quick Bar */}
        <div className="px-5 py-2.5 bg-[#0E1522] border-b border-[#1E3A5F]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            {whatsappNumber && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleSendWhatsApp}
                  className="flex items-center space-x-1.5 px-3 py-1 bg-[#00E5A0]/15 hover:bg-[#00E5A0]/25 text-[#00E5A0] border border-[#00E5A0]/40 rounded-lg transition-all"
                  title="Open WhatsApp Chat"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp ({whatsappNumber})</span>
                </button>
                <button
                  onClick={handleCopyWhatsApp}
                  className="p-1 bg-[#111827] hover:bg-[#182234] border border-[#1E3A5F] text-[#94A3B8] hover:text-white rounded-lg transition-colors"
                  title="Copy WhatsApp Number"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-[#00E5A0]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {alternativePhone ? (
              <div className="flex items-center space-x-1">
                <a
                  href={`tel:${alternativePhone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center space-x-1.5 px-3 py-1 bg-[#00C2FF]/15 hover:bg-[#00C2FF]/25 text-[#00C2FF] border border-[#00C2FF]/40 rounded-lg transition-all font-mono text-xs font-semibold"
                  title="Call Alternative Direct Number"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Alt ({alternativePhone})</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(alternativePhone);
                    setIsCopiedAlt(true);
                    setTimeout(() => setIsCopiedAlt(false), 2000);
                  }}
                  className="p-1 bg-[#111827] hover:bg-[#182234] border border-[#1E3A5F] text-[#94A3B8] hover:text-white rounded-lg transition-colors"
                  title="Copy Alternative Number"
                >
                  {isCopiedAlt ? <Check className="w-3.5 h-3.5 text-[#00C2FF]" /> : <Copy className="w-3.5 h-3.5 text-[#00C2FF]" />}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('alt-phone-input') as HTMLInputElement | null;
                  if (input) {
                    input.focus();
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="flex items-center space-x-1 px-2.5 py-1 bg-[#111827] hover:bg-[#1E3A5F]/40 text-[#00C2FF] border border-dashed border-[#00C2FF]/50 rounded-lg transition-all text-xs"
                title="Add Alternative Phone Number for Calling"
              >
                <Plus className="w-3 h-3" />
                <span>+ Alt Calling Number</span>
              </button>
            )}

            {!whatsappNumber && !alternativePhone && (
              <span className="text-[#7B7B7B] italic text-[11px]">(No phone on file)</span>
            )}

            <button
              onClick={handleRecordCall}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#111827] hover:bg-[#182234] text-[#94A3B8] hover:text-white border border-[#1E3A5F] rounded-lg transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#00C2FF]" />
              <span>Log Call Done</span>
            </button>

            {onOpenScheduleMeeting && (
              <button
                onClick={() => onOpenScheduleMeeting(lead.id)}
                className="flex items-center space-x-1.5 px-3 py-1 bg-[#00C2FF]/15 hover:bg-[#00C2FF]/25 text-[#00C2FF] border border-[#00C2FF]/40 rounded-lg transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Meeting</span>
              </button>
            )}
          </div>

          {/* Pending Toggle: Rule: Count NO can NEVER be pending */}
          <div className="flex items-center space-x-2">
            <label className="text-[11px] text-[#94A3B8]">Pending Follow-up:</label>
            <button
              type="button"
              disabled={pipelineStage === 'count_no'}
              onClick={() => {
                if (pipelineStage !== 'count_no') {
                  setIsPendingYes(!isPendingYes);
                }
              }}
              className={`px-3 py-1 rounded-lg border font-medium transition-all text-xs ${
                pipelineStage === 'count_no'
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed'
                  : isPendingYes
                  ? 'bg-[#F97316]/20 border-[#F97316] text-[#F97316] shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                  : 'bg-[#111827] border-[#1E3A5F] text-[#7B7B7B] hover:text-white'
              }`}
              title={pipelineStage === 'count_no' ? 'Count NO leads can never be pending' : 'Toggle Pending YES'}
            >
              {pipelineStage === 'count_no' ? 'Pending: Blocked (Count NO)' : isPendingYes ? 'Pending "YES"' : 'Pending: NO'}
            </button>
          </div>
        </div>

        {/* Modal Main Content: 2 Columns */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
          {/* Left Column: Full Lead Information & Lifecycle Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary Pipeline Stage Control */}
            <div className="p-3.5 bg-[#111827] border border-[#00C2FF]/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-[#00C2FF] flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" />
                  <span>Pipeline Milestone & Stage</span>
                </h4>
                <span className="text-[11px] font-mono text-[#00E5A0]">
                  Cumulative Counting Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pipeline Stage Select */}
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Primary Stage:
                  </label>
                  <select
                    value={pipelineStage}
                    onChange={(e) => {
                      const newStage = e.target.value;
                      setPipelineStage(newStage);
                      if (newStage === 'count_no' || newStage === 'dnc') {
                        setIsPendingYes(false); // Count NO is NEVER pending
                      }
                    }}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs focus:border-[#00C2FF] focus:outline-none"
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
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    WhatsApp Follow Up:
                  </label>
                  <select
                    value={whatsappFollowup}
                    onChange={(e) => setWhatsappFollowup(e.target.value)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs focus:border-[#00C2FF] focus:outline-none"
                  >
                    <option value="none">None / -</option>
                    <option value="WA1 Sent">WA1 Sent</option>
                    <option value="WA2 Follow Up Sent">WA2 Follow Up Sent</option>
                    <option value="WA3 Follow Up Sent">WA3 Follow Up Sent</option>
                  </select>
                </div>

                {/* Interested Email Follow Up Stage */}
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Interested Email Follow Up:
                  </label>
                  <select
                    value={interestedEmailFollowup}
                    onChange={(e) => setInterestedEmailFollowup(e.target.value)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs focus:border-[#00C2FF] focus:outline-none"
                  >
                    <option value="none">None / -</option>
                    <option value="FW1 Sent">FW1 Sent</option>
                    <option value="FW2 Sent">FW2 Sent</option>
                    <option value="FW3 Sent">FW3 Sent</option>
                  </select>
                </div>

                {/* Scheduled Meeting Display if present */}
                {lead.meeting_date && (
                  <div>
                    <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                      Meeting Scheduled Time:
                    </label>
                    <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-[#00C2FF] font-mono">
                      {lead.meeting_date} at {formatTo12Hour(lead.meeting_time)}
                    </div>
                  </div>
                )}

                {/* Milestone Date of Interested */}
                {pipelineStage !== 'outreach' && pipelineStage !== 'dnc' && (
                  <div className="sm:col-span-2 pt-2 border-t border-[#1E3A5F]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-[11px] text-[#94A3B8] font-semibold block">
                        Date of Interested:
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Controls which month and date this lead counts towards in dashboard reports.
                      </span>
                    </div>
                    <input
                      type="date"
                      value={dateOfInterested}
                      onChange={(e) => setDateOfInterested(e.target.value)}
                      onClick={(e) => {
                        try {
                          (e.currentTarget as HTMLInputElement).showPicker?.();
                        } catch {}
                      }}
                      style={{ colorScheme: 'dark' }}
                      className="bg-[#0A0A0A] border border-[#1E3A5F] hover:border-[#00C2FF]/70 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none w-full sm:w-44 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Editable Prospect Information Card */}
            <div className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider text-[#94A3B8]">
                Prospect Contact & Lead Data (Editable)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email Address */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none font-mono"
                  />
                </div>

                {/* First Name */}
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                  />
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    WhatsApp Number
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+44..."
                      className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none font-mono"
                    />
                    {whatsappNumber && (
                      <button
                        type="button"
                        onClick={handleCopyWhatsApp}
                        className="p-1.5 bg-[#0A0A0A] border border-[#1E3A5F] rounded text-[#94A3B8] hover:text-white"
                        title="Copy Number"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-[#00E5A0]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Alternative Number (Calling) */}
                <div>
                  <label className="text-[11px] text-[#00C2FF] font-semibold block mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <PhoneCall className="w-3 h-3 text-[#00C2FF]" />
                      <span>Alternative Number (Calling)</span>
                    </span>
                    <span className="text-[10px] text-[#64748B]">Non-WhatsApp</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      id="alt-phone-input"
                      type="text"
                      value={alternativePhone}
                      onChange={(e) => setAlternativePhone(e.target.value)}
                      placeholder="+442079460123"
                      className="w-full bg-[#0A0A0A] border border-[#00C2FF]/50 focus:border-[#00C2FF] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                    />
                    {alternativePhone && (
                      <>
                        <a
                          href={`tel:${alternativePhone.replace(/[^0-9+]/g, '')}`}
                          className="p-1.5 bg-[#0A0A0A] border border-[#1E3A5F] hover:border-[#00C2FF] rounded text-[#00C2FF] hover:text-white transition-colors"
                          title="Call Alternative Direct Number"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(alternativePhone);
                            setIsCopiedAlt(true);
                            setTimeout(() => setIsCopiedAlt(false), 2000);
                          }}
                          className="p-1.5 bg-[#0A0A0A] border border-[#1E3A5F] rounded text-[#94A3B8] hover:text-white"
                          title="Copy Alternative Number"
                        >
                          {isCopiedAlt ? <Check className="w-3.5 h-3.5 text-[#00E5A0]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Target List / Segment */}
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Target List / Segment
                  </label>
                  <select
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs focus:border-[#00C2FF] focus:outline-none"
                  >
                    <option value="">No List Assigned</option>
                    {lists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs focus:border-[#00C2FF] focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="DNC">DNC (Do Not Contact)</option>
                  </select>
                </div>

                {/* Campaign */}
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Campaign
                  </label>
                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs focus:border-[#00C2FF] focus:outline-none"
                  >
                    <option value="">Select Campaign</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Approached */}
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Brand Approached
                  </label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs focus:border-[#00C2FF] focus:outline-none"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Outbound Account */}
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Outbound Account
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs focus:border-[#00C2FF] focus:outline-none"
                  >
                    <option value="">Select Account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.account_name} ({a.sender_name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned Sales Rep */}
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Assigned Rep
                  </label>
                  <select
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs focus:border-[#00C2FF] focus:outline-none"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Email Dispatch Dates (Actual Sending Dates) */}
            <div className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider text-[#94A3B8]">
                Email Dispatch Actual Dates
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Email 1 Sent Date:
                  </label>
                  <input
                    type="text"
                    value={email1Date}
                    onChange={(e) => setEmail1Date(e.target.value)}
                    placeholder="e.g. 06/09/26"
                    className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Email 2 Sent Date:
                  </label>
                  <input
                    type="text"
                    value={email2Date}
                    onChange={(e) => setEmail2Date(e.target.value)}
                    placeholder="e.g. 10/09/26"
                    className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#94A3B8] font-semibold block mb-1">
                    Email 3 Sent Date:
                  </label>
                  <input
                    type="text"
                    value={email3Date}
                    onChange={(e) => setEmail3Date(e.target.value)}
                    placeholder="e.g. 14/09/26"
                    className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Timeline, Notes, Reminders (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-[#1E3A5F] text-xs">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-2 px-3 font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
                  activeTab === 'timeline'
                    ? 'border-[#00C2FF] text-[#00C2FF]'
                    : 'border-transparent text-[#7B7B7B] hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`py-2 px-3 font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
                  activeTab === 'notes'
                    ? 'border-[#00C2FF] text-[#00C2FF]'
                    : 'border-transparent text-[#7B7B7B] hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Notes</span>
              </button>

              <button
                onClick={() => setActiveTab('reminders')}
                className={`py-2 px-3 font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
                  activeTab === 'reminders'
                    ? 'border-[#00C2FF] text-[#00C2FF]'
                    : 'border-transparent text-[#7B7B7B] hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Reminders</span>
              </button>
            </div>

            {/* Tab Body: Timeline */}
            {activeTab === 'timeline' && (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {leadActivities.length === 0 ? (
                  <p className="text-center text-[#7B7B7B] py-8">No activities recorded yet.</p>
                ) : (
                  leadActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-2.5 bg-[#111827] border border-[#1E3A5F]/60 rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{act.activity_type}</span>
                        <span className="text-[10px] text-[#7B7B7B] font-mono">
                          {formatTo12Hour(act.created_at)}
                        </span>
                      </div>
                      {act.description && (
                        <p className="text-[#94A3B8] text-[11px]">{act.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab Body: Notes */}
            {activeTab === 'notes' && (
              <div className="space-y-3">
                <form onSubmit={handleAddNoteSubmit} className="space-y-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new note about this prospect..."
                    rows={3}
                    className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg p-2.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-[#00C2FF] hover:bg-[#00C2FF]/80 text-black font-semibold text-xs rounded transition-all"
                    >
                      Add Note
                    </button>
                  </div>
                </form>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {notes && (
                    <div className="p-2.5 bg-[#111827] border border-[#1E3A5F]/60 rounded-lg">
                      <span className="text-[10px] text-[#00C2FF] font-semibold block mb-0.5">Initial Notes</span>
                      <p className="text-white text-xs">{notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Body: Reminders */}
            {activeTab === 'reminders' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-white">Lead Reminders</span>
                  <button
                    onClick={() => setIsAddingReminder(!isAddingReminder)}
                    className="text-[11px] text-[#00C2FF] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Reminder
                  </button>
                </div>

                {isAddingReminder && (
                  <form onSubmit={handleAddReminderSubmit} className="p-3 bg-[#111827] border border-[#1E3A5F] rounded-lg space-y-2">
                    <input
                      type="date"
                      value={newReminderDate}
                      onChange={(e) => setNewReminderDate(e.target.value)}
                      className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded px-2 py-1 text-xs"
                      required
                    />
                    <input
                      type="time"
                      value={newReminderTime}
                      onChange={(e) => setNewReminderTime(e.target.value)}
                      className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded px-2 py-1 text-xs"
                      required
                    />
                    <input
                      type="text"
                      value={newReminderNote}
                      onChange={(e) => setNewReminderNote(e.target.value)}
                      placeholder="Reminder note..."
                      className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded px-2 py-1 text-xs"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingReminder(false)}
                        className="px-2 py-0.5 text-xs text-[#7B7B7B]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-0.5 bg-[#00C2FF] text-black font-semibold text-xs rounded"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {leadReminders.length === 0 ? (
                    <p className="text-center text-[#7B7B7B] py-6">No reminders scheduled.</p>
                  ) : (
                    leadReminders.map((rem) => (
                      <div
                        key={rem.id}
                        className={`p-2.5 bg-[#111827] border rounded-lg flex items-center justify-between ${
                          rem.is_completed ? 'border-emerald-800/40 opacity-60' : 'border-[#1E3A5F]'
                        }`}
                      >
                        <div>
                          <p className={`font-semibold ${rem.is_completed ? 'line-through text-[#7B7B7B]' : 'text-white'}`}>
                            {rem.note || 'Follow-up'}
                          </p>
                          <span className="text-[10px] text-[#00C2FF] font-mono">
                            {rem.reminder_date} at {formatTo12Hour(rem.reminder_time)}
                          </span>
                        </div>
                        {!rem.is_completed && (
                          <button
                            onClick={() => completeReminder(rem.id)}
                            className="p-1 text-[#00E5A0] hover:bg-[#00E5A0]/20 rounded"
                            title="Mark Done"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#111827] border-t border-[#1E3A5F] flex items-center justify-between text-xs">
          <span className="text-[#7B7B7B] text-[11px]">
            Created on: {lead.created_at ? lead.created_at.split('T')[0] : 'N/A'}
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#182234] text-white border border-[#1E3A5F] rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              className="flex items-center space-x-1 px-4 py-1.5 bg-[#00C2FF] hover:bg-[#00C2FF]/80 text-black font-bold rounded-lg transition-all shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
