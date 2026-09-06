import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  PhoneCall,
  X,
  RotateCcw
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { Lead } from '../../types';

interface AllLeadsTableProps {
  searchQuery: string;
  onSelectLead: (leadId: string) => void;
  onOpenScheduleMeeting: (leadId: string) => void;
}

interface ColumnFilters {
  email: string;
  firstName: string;
  city: string;
  companyName: string;
  campaign: string;
  email1: string;
  email2: string;
  email3: string;
  account: string;
  pipelineStage: string;
  dateAdded: string;
}

const INITIAL_FILTERS: ColumnFilters = {
  email: '',
  firstName: '',
  city: '',
  companyName: '',
  campaign: 'all',
  email1: 'all',
  email2: 'all',
  email3: 'all',
  account: 'all',
  pipelineStage: 'all',
  dateAdded: 'all',
};

export const AllLeadsTable: React.FC<AllLeadsTableProps> = ({
  searchQuery,
  onSelectLead,
  onOpenScheduleMeeting,
}) => {
  const {
    leads,
    campaigns,
    accounts,
    deleteLead,
    markInterested,
    togglePending,
    recordWhatsAppSent,
    recordCallDone,
  } = useLeads();
  const { allUsers } = useAuth();

  // In-Header Column Filter States
  const [colFilters, setColFilters] = useState<ColumnFilters>(INITIAL_FILTERS);
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);

  // Sorting State
  const [sortField, setSortField] = useState<keyof Lead>('created_at');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Bulk Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Ref for closing dropdown when clicking outside
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveFilterCol(null);
      }
    };
    if (activeFilterCol) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeFilterCol]);

  // Check if any column filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      colFilters.email.trim() !== '' ||
      colFilters.firstName.trim() !== '' ||
      colFilters.city.trim() !== '' ||
      colFilters.companyName.trim() !== '' ||
      colFilters.campaign !== 'all' ||
      colFilters.email1 !== 'all' ||
      colFilters.email2 !== 'all' ||
      colFilters.email3 !== 'all' ||
      colFilters.account !== 'all' ||
      colFilters.pipelineStage !== 'all' ||
      colFilters.dateAdded !== 'all'
    );
  }, [colFilters]);

  const resetAllFilters = () => {
    setColFilters(INITIAL_FILTERS);
    setCurrentPage(1);
    setActiveFilterCol(null);
  };

  const updateFilter = (key: keyof ColumnFilters, value: string) => {
    setColFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Filter logic
  const filteredLeads = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return leads.filter((lead) => {
      // Global Search from top bar
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
          lead.account_name?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 1. Email Address filter
      if (colFilters.email.trim()) {
        if (!lead.email.toLowerCase().includes(colFilters.email.toLowerCase())) {
          return false;
        }
      }

      // 2. First Name filter
      if (colFilters.firstName.trim()) {
        const nameMatch =
          lead.first_name?.toLowerCase().includes(colFilters.firstName.toLowerCase()) ||
          lead.last_name?.toLowerCase().includes(colFilters.firstName.toLowerCase());
        if (!nameMatch) return false;
      }

      // 3. City filter
      if (colFilters.city.trim()) {
        const cityMatch =
          lead.city?.toLowerCase().includes(colFilters.city.toLowerCase()) ||
          lead.country?.toLowerCase().includes(colFilters.city.toLowerCase());
        if (!cityMatch) return false;
      }

      // 4. Company Name filter
      if (colFilters.companyName.trim()) {
        if (!lead.company_name?.toLowerCase().includes(colFilters.companyName.toLowerCase())) {
          return false;
        }
      }

      // 5. Campaign filter
      if (colFilters.campaign !== 'all') {
        if (lead.campaign_id !== colFilters.campaign && lead.campaign_name !== colFilters.campaign) {
          return false;
        }
      }

      // 6. Email 1 filter
      if (colFilters.email1 !== 'all') {
        const status = lead.email_1 || 'Unsent';
        if (status.toLowerCase() !== colFilters.email1.toLowerCase()) return false;
      }

      // 7. Email 2 filter
      if (colFilters.email2 !== 'all') {
        const status = lead.email_2 || 'Unsent';
        if (status.toLowerCase() !== colFilters.email2.toLowerCase()) return false;
      }

      // 8. Email 3 filter
      if (colFilters.email3 !== 'all') {
        const status = lead.email_3 || 'Unsent';
        if (status.toLowerCase() !== colFilters.email3.toLowerCase()) return false;
      }

      // 9. Account Name filter
      if (colFilters.account !== 'all') {
        if (lead.account_id !== colFilters.account && lead.account_name !== colFilters.account) {
          return false;
        }
      }

      // 10. Pipeline Stage filter
      if (colFilters.pipelineStage !== 'all') {
        switch (colFilters.pipelineStage) {
          case 'interested':
            if (!lead.is_interested) return false;
            break;
          case 'scheduled':
            if (!lead.is_meeting_scheduled) return false;
            break;
          case 'done':
            if (!lead.is_meeting_done) return false;
            break;
          case 'count_yes':
            if (lead.meeting_count_type !== 'YES') return false;
            break;
          case 'count_no':
            if (lead.meeting_count_type !== 'NO') return false;
            break;
          case 'pending':
            if (!lead.is_pending) return false;
            break;
          case 'outreach':
            if (lead.is_interested || lead.is_meeting_scheduled || lead.is_meeting_done) return false;
            break;
        }
      }

      // 11. Date Added filter
      if (colFilters.dateAdded !== 'all' && lead.created_at) {
        const createdDate = new Date(lead.created_at);
        const leadDateStr = lead.created_at.split('T')[0];

        if (colFilters.dateAdded === 'today') {
          if (leadDateStr !== todayStr) return false;
        } else if (colFilters.dateAdded === 'last_7_days') {
          const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (colFilters.dateAdded === 'last_30_days') {
          const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        } else if (colFilters.dateAdded === 'this_month') {
          if (createdDate.getMonth() !== now.getMonth() || createdDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [leads, searchQuery, colFilters]);

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
      'City',
      'Country',
      'WhatsApp Number',
      'Campaign',
      'Account',
      'Email 1',
      'Email 2',
      'Email 3',
      'Interested',
      'Meeting Scheduled',
      'Meeting Done',
      'Meeting Count',
      'Pending',
      'Created At',
    ];
    const rows = sortedLeads.map((l) => [
      l.email,
      l.first_name || '',
      l.last_name || '',
      l.company_name || '',
      l.city || '',
      l.country || '',
      l.whatsapp_number || '',
      l.campaign_name || '',
      l.account_name || '',
      l.email_1 || 'Sent',
      l.email_2 || '-',
      l.email_3 || '-',
      l.is_interested ? 'YES' : 'NO',
      l.is_meeting_scheduled ? 'YES' : 'NO',
      l.is_meeting_done ? 'YES' : 'NO',
      l.meeting_count_type || '',
      l.is_pending ? 'YES' : 'NO',
      l.created_at ? l.created_at.split('T')[0] : '',
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

  // Helper to render funnel icon with active state
  const renderFunnelIcon = (colKey: string, isActive: boolean) => {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActiveFilterCol(activeFilterCol === colKey ? null : colKey);
        }}
        className={`p-1 rounded transition-colors relative ${
          isActive
            ? 'text-[#00C2FF] bg-[#00C2FF]/20 hover:bg-[#00C2FF]/30 shadow-[0_0_8px_rgba(0,194,255,0.4)]'
            : 'text-[#64748B] hover:text-[#00C2FF] hover:bg-[#1E3A5F]/40'
        }`}
        title={`Filter by ${colKey}`}
      >
        <Filter className={`w-3.5 h-3.5 ${isActive ? 'fill-[#00C2FF]/40 stroke-[2.2]' : 'stroke-[1.8]'}`} />
        {isActive && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#00C2FF] rounded-full ring-2 ring-[#0A0A0A]" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {/* Top Toolbar: Showing Results & Export CSV (Standalone filter box completely removed) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Lead Counter & Active Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-white font-medium">
            Total Leads:{' '}
            <span className="font-mono text-[#00C2FF] font-bold">
              {filteredLeads.length}
            </span>
            {filteredLeads.length !== leads.length && (
              <span className="text-[#64748B] text-[11px] ml-1">
                (filtered from {leads.length})
              </span>
            )}
          </span>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 ml-2">
              {colFilters.email && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>Email: {colFilters.email}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => updateFilter('email', '')} />
                </span>
              )}
              {colFilters.firstName && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>Name: {colFilters.firstName}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => updateFilter('firstName', '')} />
                </span>
              )}
              {colFilters.city && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>City: {colFilters.city}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => updateFilter('city', '')} />
                </span>
              )}
              {colFilters.companyName && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>Company: {colFilters.companyName}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => updateFilter('companyName', '')} />
                </span>
              )}
              {colFilters.campaign !== 'all' && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>Campaign: {campaigns.find(c => c.id === colFilters.campaign)?.name || colFilters.campaign}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => updateFilter('campaign', 'all')} />
                </span>
              )}
              {colFilters.email1 !== 'all' && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>Email 1: {colFilters.email1}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => updateFilter('email1', 'all')} />
                </span>
              )}
              {colFilters.email2 !== 'all' && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>Email 2: {colFilters.email2}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => updateFilter('email2', 'all')} />
                </span>
              )}
              {colFilters.email3 !== 'all' && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>Email 3: {colFilters.email3}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => updateFilter('email3', 'all')} />
                </span>
              )}
              {colFilters.pipelineStage !== 'all' && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00E5A0]/10 text-[#00E5A0] border border-[#00E5A0]/30 text-[11px]">
                  <span>Stage: {colFilters.pipelineStage}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => updateFilter('pipelineStage', 'all')} />
                </span>
              )}
              {colFilters.account !== 'all' && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>Account: {accounts.find(a => a.id === colFilters.account)?.account_name || colFilters.account}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => updateFilter('account', 'all')} />
                </span>
              )}
              {colFilters.dateAdded !== 'all' && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>Date: {colFilters.dateAdded}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => updateFilter('dateAdded', 'all')} />
                </span>
              )}
              <button
                onClick={resetAllFilters}
                className="inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] text-[#F97316] hover:text-white hover:bg-[#F97316]/20 rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Export CSV & Page size */}
        <div className="flex items-center space-x-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs focus:border-[#00C2FF]"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#182234] text-white border border-[#1E3A5F] rounded-lg transition-all text-xs shadow-sm hover:border-[#00C2FF]/60"
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

      {/* Main Table: Replicating screenshot 2 exactly */}
      <div className="bg-[#0A0A0A] border border-[#1E3A5F]/70 rounded-xl overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto min-h-[420px]">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#0A0A0A] text-[#00C2FF] border-b border-[#1E3A5F] select-none">
              <tr>
                {/* 1. Checkbox */}
                <th className="py-3 px-3 w-8 text-center border-r border-[#1E3A5F]/40 bg-[#0A0A0A]">
                  <input
                    type="checkbox"
                    checked={
                      paginatedLeads.length > 0 &&
                      paginatedLeads.every((l) => selectedLeadIds.includes(l.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#1E3A5F] text-[#00C2FF] bg-[#111827] focus:ring-0 focus:ring-offset-0"
                  />
                </th>

                {/* 2. EMAIL ADDRESS (Funnel) */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-2">
                    <div
                      className="flex items-center space-x-1 cursor-pointer hover:text-white"
                      onClick={() => handleSort('email')}
                    >
                      <span>EMAIL ADDRESS</span>
                      {sortField === 'email' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-[#00C2FF]" /> : <ArrowDown className="w-3 h-3 text-[#00C2FF]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                      )}
                    </div>
                    {renderFunnelIcon('email', Boolean(colFilters.email.trim()))}
                  </div>
                </th>

                {/* 3. FIRST NAME (Funnel) */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-2">
                    <div
                      className="flex items-center space-x-1 cursor-pointer hover:text-white"
                      onClick={() => handleSort('first_name')}
                    >
                      <span>FIRST NAME</span>
                      {sortField === 'first_name' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-[#00C2FF]" /> : <ArrowDown className="w-3 h-3 text-[#00C2FF]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                      )}
                    </div>
                    {renderFunnelIcon('firstName', Boolean(colFilters.firstName.trim()))}
                  </div>
                </th>

                {/* 4. CITY (Funnel) */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-2">
                    <div
                      className="flex items-center space-x-1 cursor-pointer hover:text-white"
                      onClick={() => handleSort('city')}
                    >
                      <span>CITY</span>
                      {sortField === 'city' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-[#00C2FF]" /> : <ArrowDown className="w-3 h-3 text-[#00C2FF]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                      )}
                    </div>
                    {renderFunnelIcon('city', Boolean(colFilters.city.trim()))}
                  </div>
                </th>

                {/* 5. COMPANY NAME (Funnel) */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-2">
                    <div
                      className="flex items-center space-x-1 cursor-pointer hover:text-white"
                      onClick={() => handleSort('company_name')}
                    >
                      <span>COMPANY NAME</span>
                      {sortField === 'company_name' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-[#00C2FF]" /> : <ArrowDown className="w-3 h-3 text-[#00C2FF]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                      )}
                    </div>
                    {renderFunnelIcon('companyName', Boolean(colFilters.companyName.trim()))}
                  </div>
                </th>

                {/* 6. CAMPAIGN (Funnel) */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-2">
                    <div
                      className="flex items-center space-x-1 cursor-pointer hover:text-white"
                      onClick={() => handleSort('campaign_name')}
                    >
                      <span>CAMPAIGN</span>
                      {sortField === 'campaign_name' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-[#00C2FF]" /> : <ArrowDown className="w-3 h-3 text-[#00C2FF]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                      )}
                    </div>
                    {renderFunnelIcon('campaign', colFilters.campaign !== 'all')}
                  </div>
                </th>

                {/* 7. EMAIL 1 (Funnel) */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-2">
                    <span>EMAIL 1</span>
                    {renderFunnelIcon('email1', colFilters.email1 !== 'all')}
                  </div>
                </th>

                {/* 8. EMAIL 2 (Funnel) */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-2">
                    <span>EMAIL 2</span>
                    {renderFunnelIcon('email2', colFilters.email2 !== 'all')}
                  </div>
                </th>

                {/* 9. EMAIL 3 (Funnel) */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-2">
                    <span>EMAIL 3</span>
                    {renderFunnelIcon('email3', colFilters.email3 !== 'all')}
                  </div>
                </th>

                {/* 10. ACCOUNT NAME (Funnel) */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-2">
                    <div
                      className="flex items-center space-x-1 cursor-pointer hover:text-white"
                      onClick={() => handleSort('account_name')}
                    >
                      <span>ACCOUNT NAME</span>
                      {sortField === 'account_name' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-[#00C2FF]" /> : <ArrowDown className="w-3 h-3 text-[#00C2FF]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                      )}
                    </div>
                    {renderFunnelIcon('account', colFilters.account !== 'all')}
                  </div>
                </th>

                {/* 11. PIPELINE STAGE (Funnel) */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-2">
                    <span>PIPELINE STAGE</span>
                    {renderFunnelIcon('pipelineStage', colFilters.pipelineStage !== 'all')}
                  </div>
                </th>

                {/* 12. DATE ADDED (Funnel) */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-2">
                    <div
                      className="flex items-center space-x-1 cursor-pointer hover:text-white"
                      onClick={() => handleSort('created_at')}
                    >
                      <span>DATE ADDED</span>
                      {sortField === 'created_at' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-[#00C2FF]" /> : <ArrowDown className="w-3 h-3 text-[#00C2FF]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                      )}
                    </div>
                    {renderFunnelIcon('dateAdded', colFilters.dateAdded !== 'all')}
                  </div>
                </th>

                {/* 13. ACTIONS */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#94A3B8] text-right">
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1E3A5F]/40 bg-[#0A0A0A]">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-16 text-[#7B7B7B]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Filter className="w-8 h-8 text-[#1E3A5F]" />
                      <p>No leads found matching your filters.</p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetAllFilters}
                          className="text-xs text-[#00C2FF] hover:underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead, idx) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  const email1Status = lead.email_1 || 'Sent';
                  const email2Status = lead.email_2 || (lead.is_interested ? 'Replied' : '-');
                  const email3Status = lead.email_3 || (lead.is_meeting_scheduled ? 'Opened' : '-');

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
                      <td className="py-2.5 px-3 text-center border-r border-[#1E3A5F]/30">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(lead.id)}
                          className="w-3.5 h-3.5 rounded border-[#1E3A5F] text-[#00C2FF] bg-[#111827] focus:ring-0 focus:ring-offset-0"
                        />
                      </td>

                      {/* Email Address */}
                      <td className="py-2.5 px-3 border-r border-[#1E3A5F]/30">
                        <span
                          onClick={() => onSelectLead(lead.id)}
                          className="font-mono text-[#00C2FF] font-medium hover:underline cursor-pointer hover:text-cyan-300"
                        >
                          {lead.email}
                        </span>
                      </td>

                      {/* First Name */}
                      <td className="py-2.5 px-3 font-medium text-white border-r border-[#1E3A5F]/30">
                        {lead.first_name || (
                          <span className="text-[#64748B]">-</span>
                        )}
                      </td>

                      {/* City */}
                      <td className="py-2.5 px-3 text-[#94A3B8] border-r border-[#1E3A5F]/30">
                        {lead.city || lead.country || (
                          <span className="text-[#64748B]">-</span>
                        )}
                      </td>

                      {/* Company Name */}
                      <td className="py-2.5 px-3 text-white font-medium border-r border-[#1E3A5F]/30">
                        {lead.company_name || (
                          <span className="text-[#64748B]">-</span>
                        )}
                      </td>

                      {/* Campaign */}
                      <td className="py-2.5 px-3 border-r border-[#1E3A5F]/30">
                        {lead.campaign_name ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1E3A5F]/40 text-[#00C2FF] border border-[#1E3A5F]/60">
                            {lead.campaign_name}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">-</span>
                        )}
                      </td>

                      {/* Email 1 */}
                      <td className="py-2.5 px-3 border-r border-[#1E3A5F]/30 text-center font-mono">
                        {email1Status === 'Sent' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950/60 text-blue-300 border border-blue-800/60">
                            Sent
                          </span>
                        ) : email1Status === 'Opened' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                            Opened
                          </span>
                        ) : (
                          <span className="text-[#64748B] text-[11px]">{email1Status}</span>
                        )}
                      </td>

                      {/* Email 2 */}
                      <td className="py-2.5 px-3 border-r border-[#1E3A5F]/30 text-center font-mono">
                        {email2Status === 'Sent' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950/60 text-blue-300 border border-blue-800/60">
                            Sent
                          </span>
                        ) : email2Status === 'Replied' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                            Replied
                          </span>
                        ) : (
                          <span className="text-[#64748B] text-[11px]">{email2Status}</span>
                        )}
                      </td>

                      {/* Email 3 */}
                      <td className="py-2.5 px-3 border-r border-[#1E3A5F]/30 text-center font-mono">
                        {email3Status === 'Sent' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950/60 text-blue-300 border border-blue-800/60">
                            Sent
                          </span>
                        ) : email3Status === 'Opened' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                            Opened
                          </span>
                        ) : (
                          <span className="text-[#64748B] text-[11px]">{email3Status}</span>
                        )}
                      </td>

                      {/* Account Name */}
                      <td className="py-2.5 px-3 text-[#94A3B8] font-mono text-xs border-r border-[#1E3A5F]/30">
                        {lead.account_name || (
                          <span className="text-[#64748B]">-</span>
                        )}
                      </td>

                      {/* Pipeline Stage */}
                      <td className="py-2.5 px-3 border-r border-[#1E3A5F]/30">
                        <div className="flex flex-wrap items-center gap-1">
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

                          {lead.meeting_count_type === 'YES' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#00E5A0] text-black">
                              COUNT YES
                            </span>
                          )}
                          {lead.meeting_count_type === 'NO' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F97316] text-black">
                              COUNT NO
                            </span>
                          )}
                          {lead.is_pending && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/40">
                              PENDING
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date Added */}
                      <td className="py-2.5 px-3 font-mono text-[#94A3B8] text-xs border-r border-[#1E3A5F]/30">
                        {lead.created_at ? lead.created_at.split('T')[0] : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* WhatsApp Action */}
                          {lead.whatsapp_number && (
                            <button
                              onClick={() => {
                                const cleanNum = lead.whatsapp_number!.replace(/[^0-9]/g, '');
                                window.open(`https://wa.me/${cleanNum}`, '_blank');
                                recordWhatsAppSent(lead.id);
                              }}
                              className="p-1 text-[#00E5A0] hover:bg-[#00E5A0]/20 rounded transition-colors"
                              title={`WhatsApp: ${lead.whatsapp_number}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Log Call */}
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
                            className="px-2 py-0.5 text-[11px] text-[#00C2FF] bg-[#111827] hover:bg-[#182234] border border-[#00C2FF]/30 rounded transition-colors"
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

        {/* Dynamic Column Filter Popover Overlay */}
        {activeFilterCol && (
          <div
            ref={popoverRef}
            className="absolute top-12 z-50 w-72 bg-[#111827] border border-[#00C2FF]/50 rounded-xl shadow-2xl p-3.5 text-xs text-white animate-in fade-in zoom-in-95"
            style={{
              left:
                activeFilterCol === 'email' ? '30px' :
                activeFilterCol === 'firstName' ? '180px' :
                activeFilterCol === 'city' ? '300px' :
                activeFilterCol === 'companyName' ? '420px' :
                activeFilterCol === 'campaign' ? '540px' :
                activeFilterCol === 'email1' ? '600px' :
                activeFilterCol === 'email2' ? '680px' :
                activeFilterCol === 'email3' ? '760px' :
                activeFilterCol === 'account' ? '820px' :
                activeFilterCol === 'pipelineStage' ? '920px' : '980px',
              maxWidth: 'calc(100vw - 340px)'
            }}
          >
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#1E3A5F]">
              <span className="font-semibold text-[#00C2FF] uppercase tracking-wider font-mono">
                Filter: {activeFilterCol}
              </span>
              <button
                onClick={() => setActiveFilterCol(null)}
                className="text-[#94A3B8] hover:text-white p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Email Address Filter */}
            {activeFilterCol === 'email' && (
              <div className="space-y-2">
                <label className="text-[#94A3B8] text-[11px]">Email contains:</label>
                <input
                  type="text"
                  value={colFilters.email}
                  onChange={(e) => updateFilter('email', e.target.value)}
                  placeholder="e.g. gmail.com or name"
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                  autoFocus
                />
              </div>
            )}

            {/* First Name Filter */}
            {activeFilterCol === 'firstName' && (
              <div className="space-y-2">
                <label className="text-[#94A3B8] text-[11px]">Name contains:</label>
                <input
                  type="text"
                  value={colFilters.firstName}
                  onChange={(e) => updateFilter('firstName', e.target.value)}
                  placeholder="e.g. Solomon, Paul"
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                  autoFocus
                />
              </div>
            )}

            {/* City Filter */}
            {activeFilterCol === 'city' && (
              <div className="space-y-2">
                <label className="text-[#94A3B8] text-[11px]">City / Country contains:</label>
                <input
                  type="text"
                  value={colFilters.city}
                  onChange={(e) => updateFilter('city', e.target.value)}
                  placeholder="e.g. London, Nairobi, UK"
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                  autoFocus
                />
              </div>
            )}

            {/* Company Name Filter */}
            {activeFilterCol === 'companyName' && (
              <div className="space-y-2">
                <label className="text-[#94A3B8] text-[11px]">Company name contains:</label>
                <input
                  type="text"
                  value={colFilters.companyName}
                  onChange={(e) => updateFilter('companyName', e.target.value)}
                  placeholder="e.g. Group, Ltd, Tech"
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                  autoFocus
                />
              </div>
            )}

            {/* Campaign Filter */}
            {activeFilterCol === 'campaign' && (
              <div className="space-y-2">
                <label className="text-[#94A3B8] text-[11px]">Select Campaign:</label>
                <select
                  value={colFilters.campaign}
                  onChange={(e) => updateFilter('campaign', e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                >
                  <option value="all">All Campaigns</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Email 1 Filter */}
            {activeFilterCol === 'email1' && (
              <div className="space-y-2">
                <label className="text-[#94A3B8] text-[11px]">Email 1 Status:</label>
                <select
                  value={colFilters.email1}
                  onChange={(e) => updateFilter('email1', e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="sent">Sent</option>
                  <option value="opened">Opened</option>
                  <option value="unsent">Unsent</option>
                </select>
              </div>
            )}

            {/* Email 2 Filter */}
            {activeFilterCol === 'email2' && (
              <div className="space-y-2">
                <label className="text-[#94A3B8] text-[11px]">Email 2 Status:</label>
                <select
                  value={colFilters.email2}
                  onChange={(e) => updateFilter('email2', e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="sent">Sent</option>
                  <option value="replied">Replied</option>
                  <option value="unsent">Unsent / -</option>
                </select>
              </div>
            )}

            {/* Email 3 Filter */}
            {activeFilterCol === 'email3' && (
              <div className="space-y-2">
                <label className="text-[#94A3B8] text-[11px]">Email 3 Status:</label>
                <select
                  value={colFilters.email3}
                  onChange={(e) => updateFilter('email3', e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="sent">Sent</option>
                  <option value="opened">Opened</option>
                  <option value="unsent">Unsent / -</option>
                </select>
              </div>
            )}

            {/* Account Filter */}
            {activeFilterCol === 'account' && (
              <div className="space-y-2">
                <label className="text-[#94A3B8] text-[11px]">Select Account:</label>
                <select
                  value={colFilters.account}
                  onChange={(e) => updateFilter('account', e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                >
                  <option value="all">All Accounts (16 Total)</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Pipeline Stage Filter */}
            {activeFilterCol === 'pipelineStage' && (
              <div className="space-y-2">
                <label className="text-[#94A3B8] text-[11px]">Select Pipeline Milestone:</label>
                <select
                  value={colFilters.pipelineStage}
                  onChange={(e) => updateFilter('pipelineStage', e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                >
                  <option value="all">All Pipeline Stages</option>
                  <option value="outreach">Initial Outreach</option>
                  <option value="interested">Stage 1: Interested</option>
                  <option value="scheduled">Stage 2: Meeting Scheduled</option>
                  <option value="done">Stage 3: Meeting Done</option>
                  <option value="count_yes">Stage 4: Meeting Count = YES</option>
                  <option value="count_no">Stage 4b: Meeting Count = NO</option>
                  <option value="pending">Pending = YES</option>
                </select>
              </div>
            )}

            {/* Date Added Filter */}
            {activeFilterCol === 'dateAdded' && (
              <div className="space-y-2">
                <label className="text-[#94A3B8] text-[11px]">Date Range:</label>
                <select
                  value={colFilters.dateAdded}
                  onChange={(e) => updateFilter('dateAdded', e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="this_month">This Month</option>
                </select>
              </div>
            )}

            {/* Popover Footer Buttons */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1E3A5F]/70">
              <button
                onClick={() => {
                  const key = activeFilterCol as keyof ColumnFilters;
                  if (key === 'campaign' || key === 'email1' || key === 'email2' || key === 'email3' || key === 'account' || key === 'pipelineStage' || key === 'dateAdded') {
                    updateFilter(key, 'all');
                  } else {
                    updateFilter(key, '');
                  }
                }}
                className="text-[11px] text-[#F97316] hover:text-white"
              >
                Reset Column
              </button>
              <button
                onClick={() => setActiveFilterCol(null)}
                className="px-3 py-1 bg-[#00C2FF] hover:bg-[#00C2FF]/80 text-black font-semibold text-xs rounded transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-3 bg-[#0A0A0A] border-t border-[#1E3A5F] flex items-center justify-between text-xs text-[#94A3B8]">
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
              className="p-1 rounded bg-[#111827] border border-[#1E3A5F] text-white disabled:opacity-40 hover:bg-[#182234]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-[#111827] border border-[#1E3A5F] text-white disabled:opacity-40 hover:bg-[#182234]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
