import React, { useState } from 'react';
import { X, UserPlus, Check, Sparkles } from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { Priority } from '../../types';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose }) => {
  const { addLead, brands, accounts, campaigns } = useLeads();
  const { allUsers, currentUser } = useAuth();

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [campaignId, setCampaignId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [assignedUserId, setAssignedUserId] = useState(currentUser.id);
  const [notes, setNotes] = useState('');
  const [isInterested, setIsInterested] = useState(false);
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

      await addLead({
        email: email.trim().toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company_name: companyName.trim(),
        whatsapp_number: whatsappNumber.trim(),
        country: country.trim(),
        city: city.trim(),
        priority,
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
        is_interested: isInterested,
        interested_at: isInterested ? new Date().toISOString() : null,
        is_meeting_scheduled: false,
        is_meeting_done: false,
        meeting_count_type: null,
        is_pending: false,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00E5A0]/10 border border-[#00E5A0]/30 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-[#00E5A0]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Single Lead</h3>
              <p className="text-xs text-[#7B7B7B]">Create an individual prospect in the central database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#7B7B7B] hover:text-white rounded hover:bg-[#1E3A5F]/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">
                Email Address <span className="text-[#00C2FF]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prospect@company.com"
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Enterprise Ltd"
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">WhatsApp Number</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+447123456789"
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="DNC">DNC (Do Not Contact)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="United Kingdom"
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="London"
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Campaign</label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
              >
                <option value="">-- None / General --</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Brand Approached</label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
              >
                <option value="">-- Select Brand --</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Outbound Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
              >
                <option value="">-- Select Account --</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_name} ({a.sender_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">Assigned Rep</label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#94A3B8] font-medium mb-1">Notes / Qualification History</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Initial remarks, context, or correspondence..."
              className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="initial-interested"
              checked={isInterested}
              onChange={(e) => setIsInterested(e.target.checked)}
              className="w-4 h-4 rounded border-[#1E3A5F] text-[#00C2FF] focus:ring-0 bg-[#111827]"
            />
            <label htmlFor="initial-interested" className="text-white text-xs font-medium cursor-pointer">
              Mark lead as <span className="text-[#00E5A0] font-semibold">Interested</span> immediately (Milestone 1)
            </label>
          </div>

          {/* Footer CTA */}
          <div className="pt-4 border-t border-[#1E3A5F] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#7B7B7B] hover:text-white rounded-lg hover:bg-[#111827]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-black bg-[#00E5A0] hover:bg-[#00E5A0]/90 rounded-lg transition-all shadow-[0_0_12px_rgba(0,229,160,0.3)] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
