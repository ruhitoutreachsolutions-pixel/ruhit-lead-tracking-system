import React, { useState, useMemo } from 'react';
import {
  FileText,
  Mail,
  ListTodo,
  Plus,
  Search,
  Filter,
  Copy,
  Check,
  Edit2,
  Trash2,
  Pin,
  Calendar,
  Building2,
  MailCheck,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowRight,
  Send,
  AlertCircle,
  Tag,
  CheckSquare,
  Square,
  Clock
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { EmailCopy, ImportantNote, TaskItem } from '../../types';

export const EmailCopiesAndOpsView: React.FC = () => {
  const {
    brands,
    accounts,
    campaigns,
    emailCopies,
    addEmailCopy,
    updateEmailCopy,
    deleteEmailCopy,
    importantNotes,
    addImportantNote,
    updateImportantNote,
    deleteImportantNote,
    todoTasks,
    addTodoTask,
    toggleTodoTask,
    updateTodoTask,
    deleteTodoTask,
  } = useLeads();
  const { currentUser } = useAuth();

  // Navigation Tab
  const [activeTab, setActiveTab] = useState<'copies' | 'notes_tasks'>('copies');

  // -------------------------------------------------------------
  // EMAIL COPIES STATE & LOGIC
  // -------------------------------------------------------------
  const [copySearch, setCopySearch] = useState('');
  const [filterBrandId, setFilterBrandId] = useState('');
  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterSequence, setFilterSequence] = useState('');

  // Add / Edit Copy Modal
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [editingCopyId, setEditingCopyId] = useState<string | null>(null);

  const [copyTitle, setCopyTitle] = useState('');
  const [copyBrandId, setCopyBrandId] = useState('');
  const [copyAccountId, setCopyAccountId] = useState('');
  const [copyCampaignId, setCopyCampaignId] = useState('');
  const [copySequenceStep, setCopySequenceStep] = useState('Sequence 1 (Email 1 - Initial Pitch)');
  const [subjectLine1, setSubjectLine1] = useState('');
  const [subjectLine2, setSubjectLine2] = useState('');
  const [extraSubjects, setExtraSubjects] = useState<string[]>([]);
  const [bodyText, setBodyText] = useState('');
  const [copyNotes, setCopyNotes] = useState('');
  const [copyStatus, setCopyStatus] = useState<'active' | 'draft' | 'archived'>('active');

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openAddCopyModal = () => {
    setEditingCopyId(null);
    setCopyTitle('');
    setCopyBrandId(brands[0]?.id || '');
    setCopyAccountId(accounts[0]?.id || '');
    setCopyCampaignId('');
    setCopySequenceStep('Sequence 1 (Email 1 - Initial Pitch)');
    setSubjectLine1('');
    setSubjectLine2('');
    setExtraSubjects([]);
    setBodyText('');
    setCopyNotes('');
    setCopyStatus('active');
    setIsCopyModalOpen(true);
  };

  const openEditCopyModal = (copy: EmailCopy) => {
    setEditingCopyId(copy.id);
    setCopyTitle(copy.title);
    setCopyBrandId(copy.brand_id || '');
    setCopyAccountId(copy.account_id || '');
    setCopyCampaignId(copy.campaign_id || '');
    setCopySequenceStep(copy.sequence_step);
    setSubjectLine1(copy.subject_line_1);
    setSubjectLine2(copy.subject_line_2);
    setExtraSubjects(copy.subject_lines_extra || []);
    setBodyText(copy.body_text);
    setCopyNotes(copy.notes || '');
    setCopyStatus(copy.status);
    setIsCopyModalOpen(true);
  };

  const handleSaveCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyTitle.trim() || !subjectLine1.trim() || !bodyText.trim()) return;

    const brand = brands.find((b) => b.id === copyBrandId);
    const account = accounts.find((a) => a.id === copyAccountId);
    const campaign = campaigns.find((c) => c.id === copyCampaignId);

    const payload = {
      title: copyTitle.trim(),
      brand_id: copyBrandId || undefined,
      brand_name: brand?.name,
      account_id: copyAccountId || undefined,
      account_name: account?.account_name,
      campaign_id: copyCampaignId || undefined,
      campaign_name: campaign?.name,
      sequence_step: copySequenceStep,
      subject_line_1: subjectLine1.trim(),
      subject_line_2: subjectLine2.trim(),
      subject_lines_extra: extraSubjects.filter((s) => s.trim().length > 0),
      body_text: bodyText.trim(),
      notes: copyNotes.trim(),
      status: copyStatus,
    };

    if (editingCopyId) {
      await updateEmailCopy(editingCopyId, payload);
    } else {
      await addEmailCopy(payload);
    }

    setIsCopyModalOpen(false);
  };

  const handleDeleteCopy = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete email copy "${title}"?`)) {
      await deleteEmailCopy(id);
    }
  };

  const filteredCopies = useMemo(() => {
    return emailCopies.filter((copy) => {
      if (filterBrandId && copy.brand_id !== filterBrandId) return false;
      if (filterAccountId && copy.account_id !== filterAccountId) return false;
      if (filterSequence && copy.sequence_step !== filterSequence) return false;
      if (copySearch.trim()) {
        const q = copySearch.toLowerCase();
        const matchTitle = copy.title.toLowerCase().includes(q);
        const matchS1 = copy.subject_line_1.toLowerCase().includes(q);
        const matchS2 = copy.subject_line_2.toLowerCase().includes(q);
        const matchBody = copy.body_text.toLowerCase().includes(q);
        const matchBrand = copy.brand_name?.toLowerCase().includes(q);
        const matchAccount = copy.account_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchS1 && !matchS2 && !matchBody && !matchBrand && !matchAccount) {
          return false;
        }
      }
      return true;
    });
  }, [emailCopies, filterBrandId, filterAccountId, filterSequence, copySearch]);

  // -------------------------------------------------------------
  // IMPORTANT NOTES STATE & LOGIC
  // -------------------------------------------------------------
  const [noteSearch, setNoteSearch] = useState('');
  const [selectedNoteCategory, setSelectedNoteCategory] = useState<string>('All');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [noteTitle, setNoteTitle] = useState('');
  const [noteCategory, setNoteCategory] = useState('Outreach SOP');
  const [noteContent, setNoteContent] = useState('');
  const [noteIsPinned, setNoteIsPinned] = useState(false);
  const [noteColor, setNoteColor] = useState('#00C2FF');

  const openAddNoteModal = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteCategory('Outreach SOP');
    setNoteContent('');
    setNoteIsPinned(false);
    setNoteColor('#00C2FF');
    setIsNoteModalOpen(true);
  };

  const openEditNoteModal = (note: ImportantNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteCategory(note.category);
    setNoteContent(note.content);
    setNoteIsPinned(note.is_pinned);
    setNoteColor(note.color || '#00C2FF');
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    if (editingNoteId) {
      await updateImportantNote(editingNoteId, {
        title: noteTitle.trim(),
        category: noteCategory,
        content: noteContent.trim(),
        is_pinned: noteIsPinned,
        color: noteColor,
      });
    } else {
      await addImportantNote({
        title: noteTitle.trim(),
        category: noteCategory,
        content: noteContent.trim(),
        is_pinned: noteIsPinned,
        color: noteColor,
      });
    }
    setIsNoteModalOpen(false);
  };

  const handleDeleteNote = async (id: string, title: string) => {
    if (window.confirm(`Delete note "${title}"?`)) {
      await deleteImportantNote(id);
    }
  };

  const filteredNotes = useMemo(() => {
    return importantNotes
      .filter((n) => {
        if (selectedNoteCategory !== 'All' && n.category !== selectedNoteCategory) return false;
        if (noteSearch.trim()) {
          const q = noteSearch.toLowerCase();
          return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [importantNotes, selectedNoteCategory, noteSearch]);

  // -------------------------------------------------------------
  // TO-DO LIST STATE & LOGIC
  // -------------------------------------------------------------
  const [taskFilter, setTaskFilter] = useState<'All' | 'Pending' | 'Completed'>('Pending');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [quickTaskCategory, setQuickTaskCategory] = useState('Outreach');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    await addTodoTask({
      title: quickTaskTitle.trim(),
      priority: quickTaskPriority,
      category: quickTaskCategory,
      is_completed: false,
      assigned_to: currentUser?.full_name || 'Ruhit (Owner)',
    });
    setQuickTaskTitle('');
  };

  const filteredTasks = useMemo(() => {
    return todoTasks.filter((t) => {
      if (taskFilter === 'Pending') return !t.is_completed;
      if (taskFilter === 'Completed') return t.is_completed;
      return true;
    });
  }, [todoTasks, taskFilter]);

  const pendingCount = todoTasks.filter((t) => !t.is_completed).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E3A5F]/60 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#00C2FF]" />
            <span>Email Copy Hub & Operations Center</span>
          </h2>
          <p className="text-xs text-[#7B7B7B] mt-0.5">
            Manage multi-subject email copies across all brands and accounts, SOP guides, and live tasks.
          </p>
        </div>

        {/* Top Two Tabs */}
        <div className="flex items-center space-x-2 bg-[#111827] p-1 rounded-xl border border-[#1E3A5F] overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('copies')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'copies'
                ? 'bg-[#00C2FF] text-black shadow-md font-bold'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Copy Management ({emailCopies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes_tasks')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'notes_tasks'
                ? 'bg-[#00C2FF] text-black shadow-md font-bold'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Important Notes & To Do List</span>
            {pendingCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'notes_tasks' ? 'bg-black text-[#00C2FF]' : 'bg-[#F97316] text-white'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: EMAIL COPY MANAGEMENT */}
      {activeTab === 'copies' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#7B7B7B] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search copies or subjects..."
                  value={copySearch}
                  onChange={(e) => setCopySearch(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-[#7B7B7B] focus:border-[#00C2FF] focus:outline-none text-xs"
                />
              </div>

              {/* Brand Filter */}
              <select
                value={filterBrandId}
                onChange={(e) => setFilterBrandId(e.target.value)}
                className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs focus:border-[#00C2FF] focus:outline-none"
              >
                <option value="">All Brands ({brands.length})</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              {/* Account Filter */}
              <select
                value={filterAccountId}
                onChange={(e) => setFilterAccountId(e.target.value)}
                className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs focus:border-[#00C2FF] focus:outline-none"
              >
                <option value="">All Accounts ({accounts.length})</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_name} ({a.sender_name})
                  </option>
                ))}
              </select>

              {/* Sequence Filter */}
              <select
                value={filterSequence}
                onChange={(e) => setFilterSequence(e.target.value)}
                className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 text-xs focus:border-[#00C2FF] focus:outline-none"
              >
                <option value="">All Sequences</option>
                <option value="Sequence 1 (Email 1 - Initial Pitch)">Sequence 1 (Email 1)</option>
                <option value="Sequence 2 (Email 2 - Follow Up)">Sequence 2 (Email 2)</option>
                <option value="Sequence 3 (Email 3 - Final Break-up)">Sequence 3 (Email 3)</option>
              </select>
            </div>

            {/* Create Copy Button */}
            <button
              onClick={openAddCopyModal}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#00E5A0] hover:bg-[#00E5A0]/90 text-black font-semibold rounded-lg transition-all text-xs shrink-0 shadow-lg shadow-[#00E5A0]/10"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Email Copy</span>
            </button>
          </div>

          {/* Email Copies Grid */}
          {filteredCopies.length === 0 ? (
            <div className="p-12 text-center bg-[#111827] border border-[#1E3A5F] rounded-xl text-[#7B7B7B]">
              <Mail className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#00C2FF]" />
              <p className="text-sm font-semibold text-white">No email copies match your filters</p>
              <p className="text-xs mt-1">Click "+ Add Email Copy" to register a new sequence copy.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCopies.map((copy) => {
                const isSeq1 = copy.sequence_step.includes('Sequence 1') || copy.sequence_step.includes('Email 1');
                const isSeq2 = copy.sequence_step.includes('Sequence 2') || copy.sequence_step.includes('Email 2');
                const badgeColor = isSeq1 ? '#00C2FF' : isSeq2 ? '#00E5A0' : '#F97316';

                return (
                  <div
                    key={copy.id}
                    className="p-5 bg-[#111827] border border-[#1E3A5F] rounded-xl flex flex-col justify-between space-y-4 hover:border-[#00C2FF]/50 transition-all shadow-md group"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {/* Sequence Badge */}
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider"
                              style={{
                                backgroundColor: `${badgeColor}20`,
                                color: badgeColor,
                                border: `1px solid ${badgeColor}40`,
                              }}
                            >
                              {copy.sequence_step}
                            </span>

                            {/* Brand Badge */}
                            {copy.brand_name && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#0A0A0A] border border-[#1E3A5F] text-[#94A3B8] flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-[#00C2FF]" />
                                <span>{copy.brand_name}</span>
                              </span>
                            )}

                            {/* Account Badge */}
                            {copy.account_name && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#0A0A0A] border border-[#1E3A5F] text-[#94A3B8] flex items-center gap-1">
                                <MailCheck className="w-3 h-3 text-[#00E5A0]" />
                                <span>{copy.account_name}</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-white group-hover:text-[#00C2FF] transition-colors">
                            {copy.title}
                          </h3>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => openEditCopyModal(copy)}
                            className="p-1 text-[#94A3B8] hover:text-[#00C2FF] hover:bg-[#182234] rounded transition-colors"
                            title="Edit Copy"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCopy(copy.id, copy.title)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors"
                            title="Delete Copy"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* MULTIPLE SUBJECT LINES SECTION */}
                      <div className="space-y-2 mt-3 pt-3 border-t border-[#1E3A5F]/40">
                        <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider flex items-center justify-between">
                          <span>Subject Lines (2 Variants)</span>
                          <span className="text-[#00C2FF] font-mono">1-Click Copy</span>
                        </div>

                        {/* Subject Line 1 (Variant A) */}
                        <div className="p-2.5 bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#00C2FF]/15 text-[#00C2FF] shrink-0">
                              SUBJ A
                            </span>
                            <span className="text-xs text-white font-mono truncate select-all">
                              {copy.subject_line_1}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyText(copy.subject_line_1, `s1-${copy.id}`)}
                            className="p-1 hover:bg-[#182234] rounded text-[#64748B] hover:text-white shrink-0 transition-colors"
                            title="Copy Subject Line A"
                          >
                            {copiedKey === `s1-${copy.id}` ? (
                              <Check className="w-3.5 h-3.5 text-[#00E5A0]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Subject Line 2 (Variant B) */}
                        <div className="p-2.5 bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#00E5A0]/15 text-[#00E5A0] shrink-0">
                              SUBJ B
                            </span>
                            <span className="text-xs text-white font-mono truncate select-all">
                              {copy.subject_line_2}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyText(copy.subject_line_2, `s2-${copy.id}`)}
                            className="p-1 hover:bg-[#182234] rounded text-[#64748B] hover:text-white shrink-0 transition-colors"
                            title="Copy Subject Line B"
                          >
                            {copiedKey === `s2-${copy.id}` ? (
                              <Check className="w-3.5 h-3.5 text-[#00E5A0]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Extra subjects if any */}
                        {copy.subject_lines_extra && copy.subject_lines_extra.map((s, idx) => (
                          <div key={idx} className="p-2.5 bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#F97316]/15 text-[#F97316] shrink-0">
                                SUBJ C
                              </span>
                              <span className="text-xs text-white font-mono truncate select-all">
                                {s}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopyText(s, `se-${copy.id}-${idx}`)}
                              className="p-1 hover:bg-[#182234] rounded text-[#64748B] hover:text-white shrink-0 transition-colors"
                              title="Copy Extra Subject Line"
                            >
                              {copiedKey === `se-${copy.id}-${idx}` ? (
                                <Check className="w-3.5 h-3.5 text-[#00E5A0]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* EMAIL BODY PREVIEW */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1 text-[10px] text-[#64748B] uppercase font-bold tracking-wider">
                          <span>Email Body Content</span>
                          <button
                            onClick={() => handleCopyText(copy.body_text, `body-${copy.id}`)}
                            className="text-[#00C2FF] hover:underline flex items-center gap-1 font-sans capitalize font-semibold"
                          >
                            {copiedKey === `body-${copy.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-[#00E5A0]" />
                                <span className="text-[#00E5A0]">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Full Body</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg text-xs text-[#94A3B8] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed select-all">
                          {copy.body_text}
                        </div>
                      </div>

                      {/* Internal Copy Notes */}
                      {copy.notes && (
                        <div className="mt-2.5 text-[11px] text-[#7B7B7B] italic bg-[#182234]/30 px-2.5 py-1.5 rounded border-l-2 border-[#00C2FF]">
                          Note: {copy.notes}
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-[#1E3A5F]/40 flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>Sequence Step: <strong className="text-white">{copy.sequence_step.split(' ')[0]}</strong></span>
                      <button
                        onClick={() => handleCopyText(`Subject A: ${copy.subject_line_1}\nSubject B: ${copy.subject_line_2}\n\n${copy.body_text}`, `all-${copy.id}`)}
                        className="text-[#00C2FF] hover:underline flex items-center gap-1"
                      >
                        {copiedKey === `all-${copy.id}` ? '✓ Copied Package' : 'Copy Full Copy Pack'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IMPORTANT NOTES AND TO DO LIST */}
      {activeTab === 'notes_tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: IMPORTANT NOTES (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Pin className="w-4 h-4 text-[#00C2FF]" />
                  <span>Important Operational Notes & SOPs</span>
                </h3>
                <p className="text-xs text-[#7B7B7B]">
                  Deliverability rules, objection handling scripts, and brand guidelines.
                </p>
              </div>
              <button
                onClick={openAddNoteModal}
                className="flex items-center space-x-1 px-3 py-1.5 bg-[#00C2FF] text-black font-semibold rounded-lg hover:bg-[#00C2FF]/90 text-xs shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Note</span>
              </button>
            </div>

            {/* Note Filters */}
            <div className="flex items-center space-x-2 flex-wrap gap-y-2 text-xs">
              {['All', 'Deliverability', 'Outreach SOP', 'Operations', 'General'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedNoteCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    selectedNoteCategory === cat
                      ? 'bg-[#1E3A5F] text-[#00C2FF] border border-[#00C2FF]/40'
                      : 'bg-[#111827] text-[#94A3B8] hover:text-white border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl space-y-2.5 relative hover:border-[#00C2FF]/50 transition-all shadow-md group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {note.is_pinned && (
                        <span className="p-1 rounded bg-[#00C2FF]/15 text-[#00C2FF]" title="Pinned to Top">
                          <Pin className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <h4 className="font-bold text-white text-sm">{note.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0A0A0A] border border-[#1E3A5F] text-[#00E5A0]">
                        {note.category}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleCopyText(note.content, `note-${note.id}`)}
                        className="p-1 hover:bg-[#182234] rounded text-[#64748B] hover:text-white transition-colors"
                        title="Copy Note Content"
                      >
                        {copiedKey === `note-${note.id}` ? (
                          <Check className="w-3.5 h-3.5 text-[#00E5A0]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditNoteModal(note)}
                        className="p-1 hover:bg-[#182234] rounded text-[#64748B] hover:text-[#00C2FF] transition-colors"
                        title="Edit Note"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id, note.title)}
                        className="p-1 hover:bg-red-950/40 rounded text-red-400 hover:text-red-300 transition-colors"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-[#94A3B8] whitespace-pre-wrap leading-relaxed font-sans bg-[#0A0A0A] p-3 rounded-lg border border-[#1E3A5F]/60">
                    {note.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: TO DO LIST (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#00E5A0]" />
                  <span>Operations To-Do List</span>
                </h3>
                <p className="text-xs text-[#7B7B7B]">
                  Daily execution checklist for team & accounts.
                </p>
              </div>

              {/* Task Filter Tabs */}
              <div className="flex items-center space-x-1 bg-[#111827] p-1 rounded-lg border border-[#1E3A5F] text-[11px]">
                {(['Pending', 'Completed', 'All'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTaskFilter(tf)}
                    className={`px-2 py-0.5 rounded font-medium transition-all ${
                      taskFilter === tf
                        ? 'bg-[#00E5A0] text-black font-semibold'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Add Task Form */}
            <form
              onSubmit={handleCreateTask}
              className="p-3 bg-[#111827] border border-[#00C2FF]/40 rounded-xl space-y-2 text-xs"
            >
              <div className="font-semibold text-white text-xs">Quick Add Task</div>
              <input
                type="text"
                placeholder="What needs to be done? (Press Enter)..."
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-white focus:border-[#00C2FF] focus:outline-none"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <select
                    value={quickTaskPriority}
                    onChange={(e) => setQuickTaskPriority(e.target.value as any)}
                    className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded px-2 py-1 text-[11px] focus:outline-none"
                  >
                    <option value="High">Priority: High 🔥</option>
                    <option value="Medium">Priority: Medium ⚡</option>
                    <option value="Low">Priority: Low ❄️</option>
                  </select>

                  <select
                    value={quickTaskCategory}
                    onChange={(e) => setQuickTaskCategory(e.target.value)}
                    className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded px-2 py-1 text-[11px] focus:outline-none"
                  >
                    <option value="Outreach">Outreach</option>
                    <option value="Deliverability">Deliverability</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Account Setup">Account Setup</option>
                    <option value="Lead Gen">Lead Gen</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-3 py-1 bg-[#00E5A0] text-black font-semibold rounded hover:bg-[#00E5A0]/90 text-xs"
                >
                  Add Task
                </button>
              </div>
            </form>

            {/* Tasks List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center bg-[#111827] border border-[#1E3A5F] rounded-xl text-[#7B7B7B] text-xs">
                  <CheckSquare className="w-8 h-8 mx-auto mb-1 opacity-20 text-[#00E5A0]" />
                  <span>No tasks found under {taskFilter}.</span>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const prioColor =
                    task.priority === 'High'
                      ? 'text-red-400 border-red-500/30 bg-red-950/20'
                      : task.priority === 'Medium'
                      ? 'text-amber-400 border-amber-500/30 bg-amber-950/20'
                      : 'text-blue-400 border-blue-500/30 bg-blue-950/20';

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs ${
                        task.is_completed
                          ? 'bg-[#0A0A0A] border-[#1E3A5F]/40 opacity-60'
                          : 'bg-[#111827] border-[#1E3A5F] hover:border-[#00C2FF]/40 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleTodoTask(task.id)}
                          className="mt-0.5 text-[#00C2FF] hover:text-[#00E5A0] transition-colors shrink-0"
                        >
                          {task.is_completed ? (
                            <CheckSquare className="w-4 h-4 text-[#00E5A0]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#64748B]" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div
                            className={`font-medium ${
                              task.is_completed ? 'line-through text-[#64748B]' : 'text-white'
                            }`}
                          >
                            {task.title}
                          </div>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`px-1.5 py-0.2 rounded border text-[10px] font-mono ${prioColor}`}>
                              {task.priority}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-[#0A0A0A] border border-[#1E3A5F] text-[10px] text-[#94A3B8]">
                              {task.category}
                            </span>
                            {task.due_date && (
                              <span className="text-[10px] text-[#7B7B7B] font-mono flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Due {task.due_date}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTodoTask(task.id)}
                        className="p-1 hover:bg-red-950/40 rounded text-[#64748B] hover:text-red-400 transition-colors shrink-0"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EMAIL COPY */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[#111827] border border-[#00C2FF]/50 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
            <div className="p-4 border-b border-[#1E3A5F] flex items-center justify-between bg-[#0E1522]">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-[#00C2FF]" />
                <h3 className="font-bold text-white text-sm">
                  {editingCopyId ? 'Edit Email Copy' : 'Create New Email Copy Sequence'}
                </h3>
              </div>
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="p-1 hover:bg-[#1E3A5F] rounded text-[#94A3B8] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCopy} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
                  Copy Title / Pitch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Skills & Compliance Pitch"
                  value={copyTitle}
                  onChange={(e) => setCopyTitle(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-3 py-2 text-white focus:border-[#00C2FF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
                    Brand Name *
                  </label>
                  <select
                    value={copyBrandId}
                    onChange={(e) => setCopyBrandId(e.target.value)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF] focus:outline-none"
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
                  <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
                    Email Account *
                  </label>
                  <select
                    value={copyAccountId}
                    onChange={(e) => setCopyAccountId(e.target.value)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF] focus:outline-none"
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
                  <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
                    Sequence Step *
                  </label>
                  <select
                    value={copySequenceStep}
                    onChange={(e) => setCopySequenceStep(e.target.value)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF] focus:outline-none"
                  >
                    <option value="Sequence 1 (Email 1 - Initial Pitch)">Sequence 1 (Email 1 - Initial Pitch)</option>
                    <option value="Sequence 2 (Email 2 - Follow Up)">Sequence 2 (Email 2 - Follow Up)</option>
                    <option value="Sequence 3 (Email 3 - Value Add)">Sequence 3 (Email 3 - Value Add)</option>
                    <option value="Sequence 4 (Email 4 - Final Break-up)">Sequence 4 (Email 4 - Final Break-up)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-[#0A0A0A] border border-[#00C2FF]/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00C2FF]" />
                    <span>Multiple Subject Lines (A/B Testing)</span>
                  </span>
                  <span className="text-[10px] text-[#00E5A0] font-mono font-semibold">2 Lines Required</span>
                </div>

                <div>
                  <label className="text-[11px] text-[#00C2FF] font-semibold block mb-1">
                    Subject Line A (Primary) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quick question regarding {{company_name}}'s staff training"
                    value={subjectLine1}
                    onChange={(e) => setSubjectLine1(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-white focus:border-[#00C2FF] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#00E5A0] font-semibold block mb-1">
                    Subject Line B (Secondary / A/B Variant) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mandatory compliance & upskilling for {{company_name}} team"
                    value={subjectLine2}
                    onChange={(e) => setSubjectLine2(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-white focus:border-[#00C2FF] focus:outline-none font-mono"
                  />
                </div>

                {extraSubjects.map((extra, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Subject Line ${idx + 3} (Optional)`}
                      value={extra}
                      onChange={(e) => {
                        const updated = [...extraSubjects];
                        updated[idx] = e.target.value;
                        setExtraSubjects(updated);
                      }}
                      className="flex-1 bg-[#111827] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-white focus:border-[#00C2FF] focus:outline-none font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setExtraSubjects(extraSubjects.filter((_, i) => i !== idx))}
                      className="p-1.5 text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setExtraSubjects([...extraSubjects, ''])}
                  className="text-[11px] text-[#00C2FF] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Extra Subject Line Variant</span>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-[#94A3B8]">
                    Email Body Content *
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#64748B]">Insert:</span>
                    {['{{first_name}}', '{{company_name}}', '{{sender_name}}'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setBodyText((prev) => prev + ' ' + tag)}
                        className="px-1.5 py-0.5 rounded bg-[#0A0A0A] border border-[#1E3A5F] text-[10px] text-[#00C2FF] hover:border-[#00C2FF]"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder="Type or paste the email copy here..."
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg p-3 text-white focus:border-[#00C2FF] focus:outline-none font-mono leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
                  Copy Strategy & Delivery Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wait 3 days after sequence 1. Best for Healthcare and Care Home targets."
                  value={copyNotes}
                  onChange={(e) => setCopyNotes(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-white focus:border-[#00C2FF] focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1E3A5F]">
                <button
                  type="button"
                  onClick={() => setIsCopyModalOpen(false)}
                  className="px-4 py-2 text-[#94A3B8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00E5A0] text-black font-semibold rounded-lg hover:bg-[#00E5A0]/90 shadow-md"
                >
                  {editingCopyId ? 'Update Copy' : 'Save Email Copy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT IMPORTANT NOTE */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[#111827] border border-[#00C2FF]/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-xs">
            <div className="p-4 border-b border-[#1E3A5F] flex items-center justify-between bg-[#0E1522]">
              <div className="flex items-center space-x-2">
                <Pin className="w-4 h-4 text-[#00C2FF]" />
                <h3 className="font-bold text-white text-sm">
                  {editingNoteId ? 'Edit Operational Note' : 'Create Important Note / SOP'}
                </h3>
              </div>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1 hover:bg-[#1E3A5F] rounded text-[#94A3B8] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
                  Note Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cold Email Deliverability SOP"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg px-3 py-1.5 text-white focus:border-[#00C2FF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
                    Category
                  </label>
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                    className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:border-[#00C2FF] focus:outline-none"
                  >
                    <option value="Deliverability">Deliverability</option>
                    <option value="Outreach SOP">Outreach SOP</option>
                    <option value="Operations">Operations</option>
                    <option value="Objection Handling">Objection Handling</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noteIsPinned}
                      onChange={(e) => setNoteIsPinned(e.target.checked)}
                      className="w-4 h-4 rounded border-[#1E3A5F] text-[#00C2FF] bg-[#0A0A0A]"
                    />
                    <span className="text-white font-medium">Pin to Top</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#94A3B8] block mb-1">
                  Note Content *
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Write guidelines, scripts, checklist, or instructions..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg p-3 text-white focus:border-[#00C2FF] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1E3A5F]">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 text-[#94A3B8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00C2FF] text-black font-semibold rounded-lg hover:bg-[#00C2FF]/90 shadow-md"
                >
                  {editingNoteId ? 'Update Note' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
