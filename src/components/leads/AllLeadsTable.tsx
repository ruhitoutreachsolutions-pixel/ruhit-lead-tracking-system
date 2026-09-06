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
  RotateCcw,
  Copy,
  Check,
  Plus,
  Upload,
  Edit3,
  List as ListIcon,
  UserPlus,
  FolderPlus
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { Lead, LeadList } from '../../types';
import { formatTo12Hour, formatDateFormatted } from '../../lib/formatTime';
import { BulkEditModal } from './BulkEditModal';
import { LeadImportModal } from './LeadImportModal';

interface AllLeadsTableProps {
  searchQuery: string;
  onSelectLead: (leadId: string) => void;
  onOpenScheduleMeeting: (leadId: string) => void;
  onOpenAddLead?: () => void;
  onOpenBulkUpload?: () => void;
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
  whatsappFollowup: string;
  interestedFollowup: string;
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
  whatsappFollowup: 'all',
  interestedFollowup: 'all',
  account: 'all',
  pipelineStage: 'all',
  dateAdded: 'all',
};

export const AllLeadsTable: React.FC<AllLeadsTableProps> = ({
  searchQuery,
  onSelectLead,
  onOpenScheduleMeeting,
  onOpenAddLead,
  onOpenBulkUpload,
}) => {
  const {
    leads,
    campaigns,
    accounts,
    lists,
    addList,
    deleteList,
    addLeadsToList,
    deleteLead,
    bulkDeleteLeads,
    markInterested,
    togglePending,
    recordWhatsAppSent,
    recordCallDone,
  } = useLeads();
  const { allUsers, permissions, role } = useAuth();

  // List-wise Tab Filter State
  const [activeListTab, setActiveListTab] = useState<string>('all');
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  // Bulk Edit Modal State
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  // Local Bulk Upload Modal State (in case external trigger not supplied)
  const [isLocalImportOpen, setIsLocalImportOpen] = useState(false);

  // In-Header Column Filter States
  const [colFilters, setColFilters] = useState<ColumnFilters>(INITIAL_FILTERS);
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);

  // Sorting State
  const [sortField, setSortField] = useState<keyof Lead>('created_at');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);


  // Bulk Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Copied WhatsApp / Alt phone state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAltId, setCopiedAltId] = useState<string | null>(null);

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

  const handleCopyWhatsApp = (id: string, num: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAltPhone = (id: string, num: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(num);
    setCopiedAltId(id);
    setTimeout(() => setCopiedAltId(null), 2000);
  };

  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

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
      colFilters.whatsappFollowup !== 'all' ||
      colFilters.interestedFollowup !== 'all' ||
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
      // 0. List Tab Filter
      if (activeListTab !== 'all') {
        if (!lead.list_ids?.includes(activeListTab)) {
          return false;
        }
      }

      // Global Search from top bar
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          lead.email.toLowerCase().includes(q) ||
          lead.first_name?.toLowerCase().includes(q) ||
          lead.last_name?.toLowerCase().includes(q) ||
          lead.company_name?.toLowerCase().includes(q) ||
          lead.whatsapp_number?.toLowerCase().includes(q) ||
          lead.alternative_phone?.toLowerCase().includes(q) ||
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

      // 6. Email 1 date filter
      if (colFilters.email1 !== 'all') {
        const d = lead.email_1_date || (lead.email_1 && !['Sent', 'Opened', 'Replied', '-'].includes(lead.email_1) ? lead.email_1 : '');
        if (colFilters.email1 === 'sent' && !d) return false;
        if (colFilters.email1 === 'unsent' && d) return false;
      }

      // 7. Email 2 date filter
      if (colFilters.email2 !== 'all') {
        const d = lead.email_2_date || (lead.email_2 && !['Sent', 'Opened', 'Replied', '-'].includes(lead.email_2) ? lead.email_2 : '');
        if (colFilters.email2 === 'sent' && !d) return false;
        if (colFilters.email2 === 'unsent' && d) return false;
      }

      // 8. Email 3 date filter
      if (colFilters.email3 !== 'all') {
        const d = lead.email_3_date || (lead.email_3 && !['Sent', 'Opened', 'Replied', '-'].includes(lead.email_3) ? lead.email_3 : '');
        if (colFilters.email3 === 'sent' && !d) return false;
        if (colFilters.email3 === 'unsent' && d) return false;
      }

      // 9. WhatsApp Follow Up Filter
      if (colFilters.whatsappFollowup !== 'all') {
        if (lead.whatsapp_followup_stage !== colFilters.whatsappFollowup) {
          return false;
        }
      }

      // 10. Interested Email Follow Up Filter
      if (colFilters.interestedFollowup !== 'all') {
        if (lead.interested_email_followup_stage !== colFilters.interestedFollowup) {
          return false;
        }
      }

      // 11. Account filter
      if (colFilters.account !== 'all') {
        if (lead.account_id !== colFilters.account && lead.account_name !== colFilters.account) {
          return false;
        }
      }

      // 12. Pipeline Stage filter (Includes DNC)
      if (colFilters.pipelineStage !== 'all') {
        if (colFilters.pipelineStage === 'dnc') {
          if (lead.priority !== 'DNC') return false;
        } else if (colFilters.pipelineStage === 'pending') {
          if (!lead.is_pending || lead.meeting_count_type === 'NO') return false;
        } else if (colFilters.pipelineStage === 'outreach') {
          if (lead.is_interested || lead.is_meeting_scheduled || lead.is_meeting_done || lead.meeting_count_type || lead.priority === 'DNC') return false;
        } else if (colFilters.pipelineStage === 'interested') {
          if (!lead.is_interested || lead.priority === 'DNC') return false;
        } else if (colFilters.pipelineStage === 'scheduled') {
          if (!lead.is_meeting_scheduled) return false;
        } else if (colFilters.pipelineStage === 'done') {
          if (!lead.is_meeting_done) return false;
        } else if (colFilters.pipelineStage === 'count_yes') {
          if (lead.meeting_count_type !== 'YES') return false;
        } else if (colFilters.pipelineStage === 'count_no') {
          if (lead.meeting_count_type !== 'NO') return false;
        }
      }

      // 13. Date Added Filter
      if (colFilters.dateAdded !== 'all') {
        const leadDate = lead.created_at ? lead.created_at.split('T')[0] : '';
        if (colFilters.dateAdded === 'today' && leadDate !== todayStr) return false;
        if (colFilters.dateAdded === 'week') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (new Date(lead.created_at) < sevenDaysAgo) return false;
        }
        if (colFilters.dateAdded === 'month') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (new Date(lead.created_at) < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [leads, activeListTab, searchQuery, colFilters]);

  // Sort logic
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredLeads, sortField, sortAsc]);

  // Paginated leads
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedLeads.length / pageSize) || 1;

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(paginatedLeads.map((l) => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateNewList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const newList = await addList(newListName.trim(), newListDesc.trim());
    setActiveListTab(newList.id);
    setNewListName('');
    setNewListDesc('');
    setIsNewListModalOpen(false);
  };

  // Export filtered leads to CSV
  const handleExportCSV = () => {
    const headers = [
      'Email',
      'First Name',
      'Last Name',
      'Company Name',
      'City',
      'Country',
      'WhatsApp Number',
      'Alternative Number',
      'Campaign',
      'Email 1 Date',
      'Email 2 Date',
      'Email 3 Date',
      'WhatsApp Follow Up',
      'Interested Email Follow Up',
      'Account',
      'Pipeline Stage',
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
      l.alternative_phone || '',
      l.campaign_name || '',
      l.email_1_date || (l.email_1 && !['Sent', 'Opened', 'Replied', '-'].includes(l.email_1) ? l.email_1 : ''),
      l.email_2_date || (l.email_2 && !['Sent', 'Opened', 'Replied', '-'].includes(l.email_2) ? l.email_2 : ''),
      l.email_3_date || (l.email_3 && !['Sent', 'Opened', 'Replied', '-'].includes(l.email_3) ? l.email_3 : ''),
      l.whatsapp_followup_stage || '',
      l.interested_email_followup_stage || '',
      l.account_name || '',
      l.priority === 'DNC' ? 'DNC' : l.is_meeting_done ? 'Meeting Done' : l.is_meeting_scheduled ? 'Meeting Scheduled' : l.is_interested ? 'Interested' : 'Outreach',
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
      {/* 1. LIST-WISE NAVIGATION TABS & ACTION TOOLBAR */}
      <div className="flex items-center justify-between gap-3 border-b border-[#1E3A5F]/60 pb-2.5">
        {/* Scrollable list tabs container (flex-1 min-w-0 ensures no wrapping of right action buttons) */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-1 flex-1 min-w-0 pr-2">
          {/* All Leads Tab */}
          <button
            onClick={() => {
              setActiveListTab('all');
              setCurrentPage(1);
            }}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeListTab === 'all'
                ? 'bg-[#00C2FF] text-black shadow-md font-bold'
                : 'bg-[#111827] text-[#94A3B8] hover:text-white border border-[#1E3A5F]'
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>All Leads</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeListTab === 'all'
                  ? 'bg-black/20 text-black'
                  : 'bg-[#1E3A5F]/60 text-[#00C2FF]'
              }`}
            >
              {leads.length}
            </span>
          </button>

          {/* Custom Lists Tabs */}
          {lists.map((list) => {
            const listCount = leads.filter((l) => l.list_ids?.includes(list.id)).length;
            const isActive = activeListTab === list.id;
            return (
              <div key={list.id} className="flex items-center group shrink-0 whitespace-nowrap">
                <button
                  onClick={() => {
                    setActiveListTab(list.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#00E5A0] text-black shadow-md font-bold'
                      : 'bg-[#111827] text-[#94A3B8] hover:text-white border border-[#1E3A5F]'
                  }`}
                >
                  <span className="truncate max-w-[160px]">{list.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-black/20 text-black' : 'bg-[#1E3A5F]/60 text-[#00E5A0]'
                    }`}
                  >
                    {listCount}
                  </span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete list "${list.name}"? Leads in this list will remain in the database.`)) {
                      deleteList(list.id);
                      if (activeListTab === list.id) setActiveListTab('all');
                    }
                  }}
                  className="p-1 ml-0.5 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete List"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* + New List Button */}
          <button
            onClick={() => setIsNewListModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#1E3A5F]/60 text-[#00C2FF] border border-[#00C2FF]/40 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ New List</span>
          </button>
        </div>

        {/* Right Toolbar Action Buttons (Single instance of each button, no duplicates) */}
        <div className="flex items-center space-x-2 shrink-0">
          {permissions.can_export_leads && (
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#1E3A5F]/60 text-[#00C2FF] border border-[#00C2FF]/40 rounded-lg text-xs font-semibold transition-all shadow-sm shrink-0 whitespace-nowrap"
              title="Export leads to CSV file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {permissions.can_bulk_import && (
            <button
              onClick={() => {
                if (onOpenBulkUpload) onOpenBulkUpload();
                else setIsLocalImportOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#182234] text-white border border-[#1E3A5F] rounded-lg transition-all text-xs shadow-sm hover:border-[#00C2FF]/60 shrink-0 whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 text-[#00C2FF]" />
              <span>Bulk Upload</span>
            </button>
          )}

          {permissions.can_create_edit_leads && onOpenAddLead && (
            <button
              onClick={onOpenAddLead}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#00E5A0] hover:bg-[#00E5A0]/90 text-black font-semibold text-xs rounded-lg transition-all shadow-sm shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Single Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SECONDARY CONTROLS & FILTER PILLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Lead Counter & Active Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-white font-medium">
            Showing Leads:{' '}
            <span className="font-mono text-[#00C2FF] font-bold">
              {filteredLeads.length}
            </span>
            {filteredLeads.length !== leads.length && (
              <span className="text-[#64748B] text-[11px] ml-1">
                (of {leads.length} total)
              </span>
            )}
          </span>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 ml-2">
              {colFilters.email && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>Email: {colFilters.email}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('email', '')} />
                </span>
              )}
              {colFilters.firstName && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>Name: {colFilters.firstName}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('firstName', '')} />
                </span>
              )}
              {colFilters.city && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>City: {colFilters.city}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('city', '')} />
                </span>
              )}
              {colFilters.companyName && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>Company: {colFilters.companyName}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('companyName', '')} />
                </span>
              )}
              {colFilters.pipelineStage !== 'all' && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00E5A0]/10 text-[#00E5A0] border border-[#00E5A0]/30 text-[11px]">
                  <span>Stage: {colFilters.pipelineStage}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('pipelineStage', 'all')} />
                </span>
              )}
              {colFilters.campaign !== 'all' && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/30 text-[11px]">
                  <span>Campaign Filtered</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('campaign', 'all')} />
                </span>
              )}
              {colFilters.whatsappFollowup !== 'all' && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00E5A0]/10 text-[#00E5A0] border border-[#00E5A0]/30 text-[11px]">
                  <span>WA: {colFilters.whatsappFollowup}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('whatsappFollowup', 'all')} />
                </span>
              )}
              {colFilters.interestedFollowup !== 'all' && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 text-[11px]">
                  <span>FW: {colFilters.interestedFollowup}</span>
                  <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('interestedFollowup', 'all')} />
                </span>
              )}

              <button
                onClick={resetAllFilters}
                className="inline-flex items-center space-x-1 text-[#64748B] hover:text-[#00C2FF] text-[11px] underline ml-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Page size */}
        <div className="flex items-center space-x-2">
          <label className="text-[#94A3B8] text-[11px]">Page size:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1 text-xs focus:border-[#00C2FF]"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* 3. BULK ACTION BAR (when selected) */}
      {selectedLeadIds.length > 0 && (
        <div className="p-2.5 bg-[#182234] border border-[#00C2FF]/40 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs text-white animate-in slide-in-from-top-1 shadow-xl">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-[#00C2FF]">
              {selectedLeadIds.length} leads selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Edit Button */}
            <button
              onClick={() => setIsBulkEditOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#00C2FF] hover:bg-[#00C2FF]/80 text-black font-bold rounded shadow-sm transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Bulk Edit ({selectedLeadIds.length})</span>
            </button>

            {/* Add to List dropdown */}
            <select
              onChange={async (e) => {
                if (e.target.value) {
                  await addLeadsToList(e.target.value, selectedLeadIds);
                  setSelectedLeadIds([]);
                }
              }}
              defaultValue=""
              className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded px-2.5 py-1 text-xs focus:border-[#00C2FF]"
            >
              <option value="" disabled>Add to List...</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>

            <button
              onClick={() => {
                selectedLeadIds.forEach((id) => togglePending(id, true));
                setSelectedLeadIds([]);
              }}
              className="px-2.5 py-1 bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/40 rounded hover:bg-[#F97316]/30 font-medium"
            >
              Set Pending "YES"
            </button>

            <button
              onClick={() => {
                selectedLeadIds.forEach((id) => markInterested(id));
                setSelectedLeadIds([]);
              }}
              className="px-2.5 py-1 bg-[#00E5A0]/20 text-[#00E5A0] border border-[#00E5A0]/40 rounded hover:bg-[#00E5A0]/30 font-medium"
            >
              Mark Interested
            </button>

            {/* Delete Selected Leads */}
            <button
              onClick={async () => {
                if (window.confirm(`Are you sure you want to permanently delete ${selectedLeadIds.length} selected leads? This action cannot be undone.`)) {
                  await bulkDeleteLeads(selectedLeadIds);
                  setSelectedLeadIds([]);
                }
              }}
              className="flex items-center space-x-1 px-2.5 py-1 bg-red-950/40 text-red-400 border border-red-800/60 rounded hover:bg-red-900/60 font-medium transition-colors"
              title="Delete Selected Leads"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            <button
              onClick={() => setSelectedLeadIds([])}
              className="p-1 text-[#7B7B7B] hover:text-white"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN TABLE */}
      <div className="bg-[#0A0A0A] border border-[#1E3A5F]/70 rounded-xl overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto min-h-[440px]">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#0A0A0A] text-[#00C2FF] border-b border-[#1E3A5F] select-none">
              <tr>
                {/* Checkbox */}
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

                {/* EMAIL ADDRESS */}
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
                    {renderFunnelIcon('email', Boolean(colFilters.email))}
                  </div>
                </th>

                {/* FIRST NAME */}
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
                    {renderFunnelIcon('firstName', Boolean(colFilters.firstName))}
                  </div>
                </th>

                {/* CITY / COUNTRY */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-2">
                    <div
                      className="flex items-center space-x-1 cursor-pointer hover:text-white"
                      onClick={() => handleSort('city')}
                    >
                      <span>CITY / LOCATION</span>
                      {sortField === 'city' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-[#00C2FF]" /> : <ArrowDown className="w-3 h-3 text-[#00C2FF]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                      )}
                    </div>
                    {renderFunnelIcon('city', Boolean(colFilters.city))}
                  </div>
                </th>

                {/* COMPANY NAME */}
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
                    {renderFunnelIcon('companyName', Boolean(colFilters.companyName))}
                  </div>
                </th>

                {/* CONTACT: WHATSAPP / ALT NUMBER */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <span>PHONE / WHATSAPP / ALT</span>
                </th>

                {/* CAMPAIGN */}
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

                {/* EMAIL 1 */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40 text-center">
                  <div className="flex items-center justify-center space-x-1.5">
                    <span>EMAIL 1</span>
                    {renderFunnelIcon('email1', colFilters.email1 !== 'all')}
                  </div>
                </th>

                {/* EMAIL 2 */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40 text-center">
                  <div className="flex items-center justify-center space-x-1.5">
                    <span>EMAIL 2</span>
                    {renderFunnelIcon('email2', colFilters.email2 !== 'all')}
                  </div>
                </th>

                {/* EMAIL 3 */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40 text-center">
                  <div className="flex items-center justify-center space-x-1.5">
                    <span>EMAIL 3</span>
                    {renderFunnelIcon('email3', colFilters.email3 !== 'all')}
                  </div>
                </th>

                {/* WHATSAPP FOLLOW UP */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-1.5">
                    <span>WHATSAPP FOLLOW UP</span>
                    {renderFunnelIcon('whatsappFollowup', colFilters.whatsappFollowup !== 'all')}
                  </div>
                </th>

                {/* INTERESTED EMAIL FOLLOW UP */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-1.5">
                    <span>INTERESTED EMAIL FOLLOW UP</span>
                    {renderFunnelIcon('interestedFollowup', colFilters.interestedFollowup !== 'all')}
                  </div>
                </th>

                {/* ACCOUNT NAME */}
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

                {/* PIPELINE STAGE */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#00C2FF] border-r border-[#1E3A5F]/40">
                  <div className="flex items-center justify-between space-x-2">
                    <span>PIPELINE STAGE</span>
                    {renderFunnelIcon('pipelineStage', colFilters.pipelineStage !== 'all')}
                  </div>
                </th>

                {/* DATE ADDED */}
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

                {/* ACTIONS */}
                <th className="py-3 px-3 font-semibold font-mono tracking-wider text-[#94A3B8] text-right">
                  ACTIONS
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1E3A5F]/40 bg-[#0A0A0A]">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={16} className="text-center py-20 text-[#7B7B7B]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Filter className="w-8 h-8 text-[#1E3A5F]" />
                      <p>No leads found matching your criteria.</p>
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
                  // Actual dates or fallback to empty dash (NO hardcoded placeholder)
                  const email1Display = lead.email_1_date || (lead.email_1 && !['Sent', 'Opened', 'Replied', '-'].includes(lead.email_1) ? lead.email_1 : '');
                  const email2Display = lead.email_2_date || (lead.email_2 && !['Sent', 'Opened', 'Replied', '-'].includes(lead.email_2) ? lead.email_2 : '');
                  const email3Display = lead.email_3_date || (lead.email_3 && !['Sent', 'Opened', 'Replied', '-'].includes(lead.email_3) ? lead.email_3 : '');

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
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>

                      {/* City / Country */}
                      <td className="py-2.5 px-3 text-[#94A3B8] border-r border-[#1E3A5F]/30">
                        {lead.city || lead.country || (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>

                      {/* Company Name */}
                      <td className="py-2.5 px-3 text-white font-medium border-r border-[#1E3A5F]/30">
                        {lead.company_name || (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>

                      {/* WhatsApp / Alt Calling Number */}
                      <td className="py-2.5 px-3 border-r border-[#1E3A5F]/30">
                        <div className="flex flex-col space-y-1">
                          {lead.whatsapp_number && (
                            <div className="flex items-center space-x-1.5">
                              <a
                                href={`https://wa.me/${lead.whatsapp_number.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#00E5A0] hover:underline font-mono text-[11px] flex items-center space-x-1 font-semibold"
                                title="Open WhatsApp Chat"
                              >
                                <Phone className="w-3 h-3 shrink-0" />
                                <span>{lead.whatsapp_number}</span>
                              </a>
                              <button
                                onClick={(e) => handleCopyWhatsApp(lead.id, lead.whatsapp_number!, e)}
                                className="p-0.5 hover:bg-[#182234] rounded text-[#64748B] hover:text-white transition-colors"
                                title="Copy WhatsApp Number"
                              >
                                {copiedId === lead.id ? (
                                  <span className="text-[10px] text-[#00E5A0] font-sans font-bold flex items-center gap-0.5">
                                    <Check className="w-3 h-3" />
                                  </span>
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}

                          {lead.alternative_phone && (
                            <div className="flex items-center space-x-1.5">
                              <a
                                href={`tel:${lead.alternative_phone.replace(/[^0-9+]/g, '')}`}
                                className="text-[#00C2FF] hover:underline font-mono text-[11px] flex items-center space-x-1"
                                title="Call Alternative Direct Number"
                              >
                                <PhoneCall className="w-3 h-3 shrink-0" />
                                <span>Alt: {lead.alternative_phone}</span>
                              </a>
                              <button
                                onClick={(e) => handleCopyAltPhone(lead.id, lead.alternative_phone!, e)}
                                className="p-0.5 hover:bg-[#182234] rounded text-[#64748B] hover:text-white transition-colors"
                                title="Copy Alternative Number"
                              >
                                {copiedAltId === lead.id ? (
                                  <span className="text-[10px] text-[#00C2FF] font-sans font-bold flex items-center gap-0.5">
                                    <Check className="w-3 h-3" />
                                  </span>
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}

                          {!lead.alternative_phone && lead.whatsapp_number && (
                            <button
                              onClick={() => onSelectLead(lead.id)}
                              className="text-[10px] text-[#64748B] hover:text-[#00C2FF] flex items-center gap-0.5 text-left transition-colors pt-0.5"
                              title="Click to add alternative phone for direct calling"
                            >
                              <Plus className="w-2.5 h-2.5 text-[#00C2FF]" />
                              <span>Alt Phone</span>
                            </button>
                          )}

                          {!lead.whatsapp_number && !lead.alternative_phone && (
                            <button
                              onClick={() => onSelectLead(lead.id)}
                              className="text-[#64748B] hover:text-[#00C2FF] text-[11px] flex items-center space-x-1"
                              title="Click to add phone or WhatsApp"
                            >
                              <span>—</span>
                              <span className="text-[10px] text-[#00C2FF]">+ Add</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Campaign */}
                      <td className="py-2.5 px-3 border-r border-[#1E3A5F]/30">
                        {lead.campaign_name ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1E3A5F]/40 text-[#00C2FF] border border-[#1E3A5F]/60">
                            {lead.campaign_name}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>

                      {/* EMAIL 1 (Actual Date) */}
                      <td className="py-2.5 px-3 border-r border-[#1E3A5F]/30 text-center font-mono text-[11px]">
                        {email1Display ? (
                          <span className="px-2 py-0.5 rounded bg-[#111827] border border-[#1E3A5F] text-[#00C2FF] font-bold">
                            {email1Display}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>

                      {/* EMAIL 2 (Actual Date) */}
                      <td className="py-2.5 px-3 border-r border-[#1E3A5F]/30 text-center font-mono text-[11px]">
                        {email2Display ? (
                          <span className="px-2 py-0.5 rounded bg-[#111827] border border-[#1E3A5F] text-[#00C2FF] font-bold">
                            {email2Display}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>

                      {/* EMAIL 3 (Actual Date) */}
                      <td className="py-2.5 px-3 border-r border-[#1E3A5F]/30 text-center font-mono text-[11px]">
                        {email3Display ? (
                          <span className="px-2 py-0.5 rounded bg-[#111827] border border-[#1E3A5F] text-[#00C2FF] font-bold">
                            {email3Display}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>

                      {/* WHATSAPP FOLLOW UP */}
                      <td className="py-2.5 px-3 border-r border-[#1E3A5F]/30">
                        {lead.whatsapp_followup_stage ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#00E5A0]/15 text-[#00E5A0] border border-[#00E5A0]/40">
                            {lead.whatsapp_followup_stage}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>

                      {/* INTERESTED EMAIL FOLLOW UP */}
                      <td className="py-2.5 px-3 border-r border-[#1E3A5F]/30">
                        {lead.interested_email_followup_stage ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#00C2FF]/15 text-[#00C2FF] border border-[#00C2FF]/40">
                            {lead.interested_email_followup_stage}
                          </span>
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>

                      {/* ACCOUNT NAME */}
                      <td className="py-2.5 px-3 text-[#94A3B8] font-mono text-xs border-r border-[#1E3A5F]/30">
                        {lead.account_name || (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>

                      {/* PIPELINE STAGE & PENDING */}
                      <td className="py-2.5 px-3 border-r border-[#1E3A5F]/30">
                        <div className="flex flex-col space-y-1 items-start">
                          {lead.priority === 'DNC' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
                              DNC (Do Not Contact)
                            </span>
                          ) : lead.meeting_count_type === 'YES' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#00E5A0]/20 text-[#00E5A0] border border-[#00E5A0]/40">
                              Meeting Count = YES
                            </span>
                          ) : lead.meeting_count_type === 'NO' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                              Meeting Count = NO
                            </span>
                          ) : lead.is_meeting_done ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#00C2FF]/20 text-[#00C2FF] border border-[#00C2FF]/40">
                              Meeting Done
                            </span>
                          ) : lead.is_meeting_scheduled ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatTo12Hour(lead.meeting_time)}</span>
                            </span>
                          ) : lead.is_interested ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Interested
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1E3A5F]/30 text-[#94A3B8]">
                              Outreach
                            </span>
                          )}

                          {/* Explicit Pending "YES" badge */}
                          {lead.is_pending && lead.meeting_count_type !== 'NO' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/40 text-[9px] font-mono font-bold tracking-tight">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Pending "YES"</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* DATE ADDED */}
                      <td className="py-2.5 px-3 text-[#94A3B8] font-mono text-xs border-r border-[#1E3A5F]/30">
                        {lead.created_at ? formatDateFormatted(lead.created_at) : '—'}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onSelectLead(lead.id)}
                            className="px-2.5 py-1 bg-[#111827] hover:bg-[#182234] text-[#00C2FF] border border-[#00C2FF]/30 hover:border-[#00C2FF] rounded text-[11px] font-medium transition-all shadow-sm"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to permanently delete lead "${lead.email}" (${lead.first_name} ${lead.last_name})?`)) {
                                deleteLead(lead.id);
                              }
                            }}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors"
                            title="Delete Lead"
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

        {/* In-Header Dropdown Popover Filter Menu */}
        {activeFilterCol && (
          <div
            ref={popoverRef}
            className="absolute z-50 top-12 left-10 bg-[#111827] border border-[#00C2FF]/50 rounded-xl shadow-2xl p-4 w-72 text-xs animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#1E3A5F]/60 mb-3">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider text-[#00C2FF]">
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
                  <option value="all">All</option>
                  <option value="sent">Has Sent Date</option>
                  <option value="unsent">Unsent / Empty</option>
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
                  <option value="all">All</option>
                  <option value="sent">Has Sent Date</option>
                  <option value="unsent">Unsent / Empty</option>
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
                  <option value="all">All</option>
                  <option value="sent">Has Sent Date</option>
                  <option value="unsent">Unsent / Empty</option>
                </select>
              </div>
            )}

            {/* WhatsApp Follow Up Filter */}
            {activeFilterCol === 'whatsappFollowup' && (
              <div className="space-y-2">
                <label className="text-[#94A3B8] text-[11px]">WhatsApp Follow Up:</label>
                <select
                  value={colFilters.whatsappFollowup}
                  onChange={(e) => updateFilter('whatsappFollowup', e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="WA1 Sent">WA1 Sent</option>
                  <option value="WA2 Follow Up Sent">WA2 Follow Up Sent</option>
                  <option value="WA3 Follow Up Sent">WA3 Follow Up Sent</option>
                </select>
              </div>
            )}

            {/* Interested Email Follow Up Filter */}
            {activeFilterCol === 'interestedFollowup' && (
              <div className="space-y-2">
                <label className="text-[#94A3B8] text-[11px]">Interested Email Follow Up:</label>
                <select
                  value={colFilters.interestedFollowup}
                  onChange={(e) => updateFilter('interestedFollowup', e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="FW1 Sent">FW1 Sent</option>
                  <option value="FW2 Sent">FW2 Sent</option>
                  <option value="FW3 Sent">FW3 Sent</option>
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

            {/* Pipeline Stage Filter (Includes DNC) */}
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
                  <option value="pending">Pending "YES"</option>
                  <option value="dnc">DNC (Do Not Contact / Excluded)</option>
                </select>
              </div>
            )}

            {/* Date Added Filter */}
            {activeFilterCol === 'dateAdded' && (
              <div className="space-y-2">
                <label className="text-[#94A3B8] text-[11px]">Added Timeframe:</label>
                <select
                  value={colFilters.dateAdded}
                  onChange={(e) => updateFilter('dateAdded', e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C2FF] focus:outline-none"
                >
                  <option value="all">Anytime</option>
                  <option value="today">Added Today</option>
                  <option value="week">Added in Last 7 Days</option>
                  <option value="month">Added in Last 30 Days</option>
                </select>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1E3A5F]/60 text-[11px]">
              <button
                onClick={() => {
                  if (activeFilterCol === 'email') updateFilter('email', '');
                  if (activeFilterCol === 'firstName') updateFilter('firstName', '');
                  if (activeFilterCol === 'city') updateFilter('city', '');
                  if (activeFilterCol === 'companyName') updateFilter('companyName', '');
                  if (activeFilterCol === 'campaign') updateFilter('campaign', 'all');
                  if (activeFilterCol === 'email1') updateFilter('email1', 'all');
                  if (activeFilterCol === 'email2') updateFilter('email2', 'all');
                  if (activeFilterCol === 'email3') updateFilter('email3', 'all');
                  if (activeFilterCol === 'whatsappFollowup') updateFilter('whatsappFollowup', 'all');
                  if (activeFilterCol === 'interestedFollowup') updateFilter('interestedFollowup', 'all');
                  if (activeFilterCol === 'account') updateFilter('account', 'all');
                  if (activeFilterCol === 'pipelineStage') updateFilter('pipelineStage', 'all');
                  if (activeFilterCol === 'dateAdded') updateFilter('dateAdded', 'all');
                }}
                className="text-[#7B7B7B] hover:text-[#00C2FF]"
              >
                Clear this filter
              </button>
              <button
                onClick={() => setActiveFilterCol(null)}
                className="px-2.5 py-1 bg-[#00C2FF] text-black font-semibold rounded"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-3 bg-[#0A0A0A] border-t border-[#1E3A5F] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-4">
            <span className="text-[#94A3B8]">
              Showing <strong className="text-white">{sortedLeads.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-white">
                {Math.min(currentPage * pageSize, sortedLeads.length)}
              </strong>{' '}
              of <strong className="text-white">{sortedLeads.length}</strong> leads
            </span>

            <div className="flex items-center space-x-1.5">
              <span className="text-[#7B7B7B] text-[11px]">Page Size:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#111827] text-white border border-[#1E3A5F] rounded px-2 py-0.5 text-xs focus:outline-none focus:border-[#00C2FF]"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-[#111827] border border-[#1E3A5F] text-[#94A3B8] hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-white font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-[#111827] border border-[#1E3A5F] text-[#94A3B8] hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. MODALS */}
      {/* Create New List Modal */}
      {isNewListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-4 h-4 text-[#00C2FF]" />
                <h3 className="text-sm font-bold text-white">Create New Lead List</h3>
              </div>
              <button
                onClick={() => setIsNewListModalOpen(false)}
                className="text-[#7B7B7B] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewList} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-white block mb-1">
                  List Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UK Tech Founders, September Followups"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg p-2.5 text-white focus:border-[#00C2FF] focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Targeting notes or campaign context..."
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg p-2 text-white focus:border-[#00C2FF] focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#1E3A5F]">
                <button
                  type="button"
                  onClick={() => setIsNewListModalOpen(false)}
                  className="px-3 py-1.5 text-[#7B7B7B] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim()}
                  className="px-4 py-1.5 bg-[#00C2FF] text-black font-bold rounded-lg hover:bg-[#00C2FF]/90 transition-all disabled:opacity-40"
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isBulkEditOpen}
        selectedLeadIds={selectedLeadIds}
        onClose={() => setIsBulkEditOpen(false)}
        onSuccess={() => setSelectedLeadIds([])}
      />

      {/* Local Bulk Upload Modal (if triggered from within All Leads) */}
      <LeadImportModal
        isOpen={isLocalImportOpen}
        onClose={() => setIsLocalImportOpen(false)}
        defaultListId={activeListTab !== 'all' ? activeListTab : undefined}
      />
    </div>
  );
};
