import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  UserCheck,
  Check,
  Download,
  Trash2,
  Eye,
  SlidersHorizontal,
  PhoneCall
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { Lead, Priority } from '../../types';

interface AllLeadsTableProps {
  searchQuery: string;
  onSelectLead: (leadId: string) => void;
  onOpenScheduleMeeting: (leadId: string) => void;
}

export const AllLeadsTable: React.FC<AllLeadsTableProps> = ({
  searchQuery,
  onSelectLead,
  onOpenScheduleMeeting,
}) => {
  const {
    leads,
    campaigns,
    brands,
    accounts,
    deleteLead,
    markInterested,
    markMeetingDone,
    setMeetingCount,
    togglePending,
    recordWhatsAppSent,
    recordCallDone,
  } = useLeads();
  const { allUsers } = useAuth();

  // Filters State
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedMilestone, setSelectedMilestone] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedPending, setSelectedPending] = useState<string>('all');

  // Sorting State
  const [sortField, setSortField] = useState<keyof Lead>('created_at');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Bulk Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Filter logic
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Global Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          lead.email.toLowerCase().includes(q) ||
          lead.first_name?.toLowerCase().includes(q) ||
          lead.last_name?.toLowerCase().includes(q) ||
          lead.company_name?.toLowerCase().includes(q) ||
          lead.whatsapp_number?.toLowerCase().includes(q) ||
          lead.city?.toLowerCase().includes(q) ||
          lead.country?.toLowerCase().includes(q) ||
          lead.campaign_name?.toLowerCase().includes(q) ||
          lead.brand_name?.toLowerCase().includes(q) ||
          lead.account_name?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Campaign filter
      if (selectedCampaign !== 'all' && lead.campaign_id !== selectedCampaign) return false;
      // Brand filter
      if (selectedBrand !== 'all' && lead.brand_id !== selectedBrand) return false;
      // Account filter
      if (selectedAccount !== 'all' && lead.account_id !== selectedAccount) return false;
      // Priority filter
      if (selectedPriority !== 'all' && lead.priority !== selectedPriority) return false;
      // Rep filter
      if (selectedUser !== 'all' && lead.assigned_user_id !== selectedUser) return false;

      // Pending filter
      if (selectedPending === 'yes' && !lead.is_pending) return false;
      if (selectedPending === 'no' && lead.is_pending) return false;

      // Milestone filter
      if (selectedMilestone === 'interested' && !lead.is_interested) return false;
      if (selectedMilestone === 'scheduled' && !lead.is_meeting_scheduled) return false;
      if (selectedMilestone === 'done' && !lead.is_meeting_done) return false;
      if (selectedMilestone === 'count_yes' && lead.meeting_count_type !== 'YES') return false;
      if (selectedMilestone === 'count_no' && lead.meeting_count_type !== 'NO') return false;

      return true;
    });
  }, [
    leads,
    searchQuery,
    selectedCampaign,
    selectedBrand,
    selectedAccount,
    selectedPriority,
    selectedUser,
    selectedPending,
    selectedMilestone,
  ]);

  // Sort logic
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      const valA = a[sortField] ?? '';
      const valB = b[sortField] ?? '';
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredLeads, sortField, sortAsc]);

  // Paginated Leads
  const totalPages = Math.ceil(sortedLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, currentPage, pageSize]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(paginatedLeads.map((l) => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Email',
      'First Name',
      'Last Name',
      'Company Name',
      'WhatsApp Number',
      'Priority',
      'Campaign',
      'Brand',
      'Account',
      'Interested',
      'Meeting Scheduled',
      'Meeting Done',
      'Meeting Count',
      'Pending',
    ];
    const rows = sortedLeads.map((l) => [
      l.email,
      l.first_name || '',
      l.last_name || '',
      l.company_name || '',
      l.whatsapp_number || '',
      l.priority,
      l.campaign_name || '',
      l.brand_name || '',
      l.account_name || '',
      l.is_interested ? 'YES' : 'NO',
      l.is_meeting_scheduled ? 'YES' : 'NO',
      l.is_meeting_done ? 'YES' : 'NO',
      l.meeting_count_type || '',
      l.is_pending ? 'YES' : 'NO',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ruhit_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Filters Ribbon */}
      <div className="p-3.5 bg-[#111827] border border-[#1E3A5F]/60 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 text-[#00C2FF] font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Campaign Filter */}
          <select
            value={selectedCampaign}
            onChange={(e) => { setSelectedCampaign(e.target.value); setCurrentPage(1); }}
            className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF]"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => { setSelectedBrand(e.target.value); setCurrentPage(1); }}
            className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF]"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Account Filter */}
          <select
            value={selectedAccount}
            onChange={(e) => { setSelectedAccount(e.target.value); setCurrentPage(1); }}
            className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF]"
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.account_name}</option>
            ))}
          </select>

          {/* Milestone Filter */}
          <select
            value={selectedMilestone}
            onChange={(e) => { setSelectedMilestone(e.target.value); setCurrentPage(1); }}
            className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF]"
          >
            <option value="all">All Lifecycle Stages</option>
            <option value="interested">Stage 1: Interested</option>
            <option value="scheduled">Stage 2: Meeting Sched</option>
            <option value="done">Stage 3: Meeting Done</option>
            <option value="count_yes">Stage 4: Meeting Count YES</option>
            <option value="count_no">Meeting Count NO</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => { setSelectedPriority(e.target.value); setCurrentPage(1); }}
            className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF]"
          >
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="DNC">DNC</option>
          </select>

          {/* Pending Filter */}
          <select
            value={selectedPending}
            onChange={(e) => { setSelectedPending(e.target.value); setCurrentPage(1); }}
            className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF]"
          >
            <option value="all">All Pending Status</option>
            <option value="yes">Pending = YES</option>
            <option value="no">Pending = NO</option>
          </select>

          {/* Rep Filter */}
          <select
            value={selectedUser}
            onChange={(e) => { setSelectedUser(e.target.value); setCurrentPage(1); }}
            className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF]"
          >
            <option value="all">All Reps</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        </div>

        {/* Export & Reset */}
        <div className="flex items-center space-x-2">
          {(selectedCampaign !== 'all' ||
            selectedBrand !== 'all' ||
            selectedAccount !== 'all' ||
            selectedMilestone !== 'all' ||
            selectedPriority !== 'all' ||
            selectedPending !== 'all' ||
            selectedUser !== 'all') && (
            <button
              onClick={() => {
                setSelectedCampaign('all');
                setSelectedBrand('all');
                setSelectedAccount('all');
                setSelectedMilestone('all');
                setSelectedPriority('all');
                setSelectedPending('all');
                setSelectedUser('all');
              }}
              className="text-[11px] text-[#7B7B7B] hover:text-white px-2 py-1 rounded"
            >
              Reset Filters
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1 px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#182234] text-white border border-[#1E3A5F] rounded-lg transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#00C2FF]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (when selected) */}
      {selectedLeadIds.length > 0 && (
        <div className="p-2.5 bg-[#182234] border border-[#00C2FF]/40 rounded-lg flex items-center justify-between text-xs text-white animate-in slide-in-from-top-1">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-[#00C2FF]">
              {selectedLeadIds.length} leads selected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                selectedLeadIds.forEach((id) => togglePending(id, true));
                setSelectedLeadIds([]);
              }}
              className="px-2.5 py-1 bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/40 rounded hover:bg-[#F97316]/30"
            >
              Set Pending YES
            </button>
            <button
              onClick={() => {
                selectedLeadIds.forEach((id) => markInterested(id));
                setSelectedLeadIds([]);
              }}
              className="px-2.5 py-1 bg-[#00E5A0]/20 text-[#00E5A0] border border-[#00E5A0]/40 rounded hover:bg-[#00E5A0]/30"
            >
              Mark Interested
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete ${selectedLeadIds.length} selected leads?`)) {
                  selectedLeadIds.forEach((id) => deleteLead(id));
                  setSelectedLeadIds([]);
                }
              }}
              className="p-1 text-red-400 hover:bg-red-950/40 rounded"
              title="Delete Selected"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Professional Data Table (Replicating Dark UI screenshot 4 & Google Sheet screenshot 1) */}
      <div className="bg-[#0A0A0A] border border-[#1E3A5F]/70 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#111827] text-[#94A3B8] border-b border-[#1E3A5F]">
              <tr>
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedLeads.length > 0 &&
                      paginatedLeads.every((l) => selectedLeadIds.includes(l.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#1E3A5F] text-[#00C2FF] bg-[#0A0A0A]"
                  />
                </th>
                <th className="py-3 px-3 font-semibold text-[#00C2FF] cursor-pointer" onClick={() => handleSort('email')}>
                  <div className="flex items-center space-x-1">
                    <span>EMAIL ADDRESS</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 font-semibold cursor-pointer" onClick={() => handleSort('first_name')}>
                  <div className="flex items-center space-x-1">
                    <span>NAME</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 font-semibold cursor-pointer" onClick={() => handleSort('company_name')}>
                  <div className="flex items-center space-x-1">
                    <span>COMPANY</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 font-semibold">WHATSAPP</th>
                <th className="py-3 px-3 font-semibold">CAMPAIGN</th>
                <th className="py-3 px-3 font-semibold">ACCOUNT</th>
                <th className="py-3 px-3 font-semibold text-center">LIFECYCLE STATUS</th>
                <th className="py-3 px-3 font-semibold text-center">MEETING COUNT</th>
                <th className="py-3 px-3 font-semibold text-center">PENDING</th>
                <th className="py-3 px-3 font-semibold">ASSIGNED REP</th>
                <th className="py-3 px-3 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A5F]/40 bg-[#0A0A0A]">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-16 text-[#7B7B7B]">
                    No leads found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead, idx) => {
                  const isSelected = selectedLeadIds.includes(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-[#182234]/60'
                          : idx % 2 === 0
                          ? 'bg-[#0A0A0A]'
                          : 'bg-[#0E1522]'
                      } hover:bg-[#111827]`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(lead.id)}
                          className="w-3.5 h-3.5 rounded border-[#1E3A5F] text-[#00C2FF] bg-[#0A0A0A]"
                        />
                      </td>

                      {/* Email Address */}
                      <td className="py-2.5 px-3">
                        <span
                          onClick={() => onSelectLead(lead.id)}
                          className="font-mono text-[#00C2FF] font-medium hover:underline cursor-pointer"
                        >
                          {lead.email}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-3 font-medium text-white">
                        {lead.first_name || lead.last_name
                          ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                          : '?'}
                      </td>

                      {/* Company Name */}
                      <td className="py-2.5 px-3 text-[#94A3B8]">
                        {lead.company_name || '?'}
                      </td>

                      {/* WhatsApp */}
                      <td className="py-2.5 px-3 font-mono text-xs">
                        {lead.whatsapp_number ? (
                          <button
                            onClick={() => {
                              const cleanNum = lead.whatsapp_number!.replace(/[^0-9]/g, '');
                              window.open(`https://wa.me/${cleanNum}`, '_blank');
                              recordWhatsAppSent(lead.id);
                            }}
                            className="text-[#00E5A0] hover:underline flex items-center space-x-1"
                            title="Open WhatsApp chat"
                          >
                            <Phone className="w-3 h-3 text-[#00E5A0]" />
                            <span>{lead.whatsapp_number}</span>
                          </button>
                        ) : (
                          <span className="text-[#7B7B7B]">?</span>
                        )}
                      </td>

                      {/* Campaign */}
                      <td className="py-2.5 px-3">
                        {lead.campaign_name ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1E3A5F]/40 text-[#94A3B8] border border-[#1E3A5F]/60">
                            {lead.campaign_name}
                          </span>
                        ) : (
                          <span className="text-[#7B7B7B]">?</span>
                        )}
                      </td>

                      {/* Account */}
                      <td className="py-2.5 px-3 text-[#94A3B8]">
                        {lead.account_name || '?'}
                      </td>

                      {/* Lifecycle Badges */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center space-x-1">
                          {lead.is_meeting_done ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#00E5A0]/15 text-[#00E5A0] border border-[#00E5A0]/40">
                              Meeting Done
                            </span>
                          ) : lead.is_meeting_scheduled ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/40">
                              Meeting Sched
                            </span>
                          ) : lead.is_interested ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                              Interested
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#7B7B7B] bg-[#111827]">
                              Outreach
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Meeting Count */}
                      <td className="py-2.5 px-3 text-center font-mono">
                        {lead.meeting_count_type === 'YES' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00E5A0] text-black">
                            COUNT YES
                          </span>
                        ) : lead.meeting_count_type === 'NO' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F97316] text-black">
                            COUNT NO
                          </span>
                        ) : (
                          <span className="text-[#7B7B7B] text-[11px]">?</span>
                        )}
                      </td>

                      {/* Pending YES / NO */}
                      <td className="py-2.5 px-3 text-center">
                        {lead.is_pending ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/40">
                            PENDING
                          </span>
                        ) : (
                          <span className="text-[#7B7B7B]">?</span>
                        )}
                      </td>

                      {/* Assigned Rep */}
                      <td className="py-2.5 px-3 text-[#94A3B8]">
                        {lead.assigned_user_name || 'Unassigned'}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Log Call Quick Action */}
                          <button
                            onClick={() => recordCallDone(lead.id)}
                            title="Log Call Done"
                            className="p-1 text-[#7B7B7B] hover:text-[#00C2FF] rounded hover:bg-[#182234]"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>

                          {/* Details Button */}
                          <button
                            onClick={() => onSelectLead(lead.id)}
                            className="px-2.5 py-1 text-[11px] text-[#00C2FF] bg-[#111827] hover:bg-[#182234] border border-[#00C2FF]/30 rounded transition-colors"
                          >
                            Details
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

        {/* Pagination Bar */}
        <div className="p-3 bg-[#111827] border-t border-[#1E3A5F] flex items-center justify-between text-xs text-[#94A3B8]">
          <div className="flex items-center space-x-2">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, sortedLeads.length)} of {sortedLeads.length} leads
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-[#0A0A0A] border border-[#1E3A5F] text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-[#0A0A0A] border border-[#1E3A5F] text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
