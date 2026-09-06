import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ChevronRight,
  ArrowRight,
  Upload,
  FileText,
  Download,
  Calendar,
  Layers,
  Phone,
  Mail,
  Check
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { Lead, Priority, WhatsAppFollowUpStage, InterestedEmailFollowUpStage } from '../../types';

interface LeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultListId?: string;
}

interface ParsedRow {
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  whatsapp_number: string;
  alternative_phone: string;
  city: string;
  country: string;
  primary_stage: string;
  whatsapp_followup: string;
  interested_email_followup: string;
  email_1_date: string;
  email_2_date: string;
  email_3_date: string;
  meeting_date: string;
  meeting_time: string;
  date_added: string;
  isValid: boolean;
  errors: string[];
  isDuplicateInPasted: boolean;
  isDuplicateInDB: boolean;
}

function parseDelimitedLine(line: string, isTab: boolean): string[] {
  if (isTab) {
    return line.split('\t').map((c) => c.trim().replace(/^"|"$/g, ''));
  }
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim().replace(/^"|"$/g, ''));
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim().replace(/^"|"$/g, ''));
  return result;
}

function resolveMilestonesFromStage(stageRaw?: string) {
  const stage = (stageRaw || '').trim().toLowerCase();
  let is_interested = false;
  let is_meeting_scheduled = false;
  let is_meeting_done = false;
  let meeting_count_type: 'YES' | 'NO' | null = null;
  let is_pending = false;
  let priority: Priority = 'Medium';

  if (stage.includes('dnc')) {
    priority = 'DNC';
  } else if (stage.includes('pending') && stage.includes('yes')) {
    is_interested = true;
    is_meeting_scheduled = true;
    is_meeting_done = true;
    meeting_count_type = 'YES';
    is_pending = true;
  } else if (stage.includes('yes') || stage === 'meeting count = yes' || stage === 'count yes') {
    is_interested = true;
    is_meeting_scheduled = true;
    is_meeting_done = true;
    meeting_count_type = 'YES';
  } else if (stage.includes('no') || stage === 'meeting count = no' || stage === 'count no') {
    is_interested = true;
    is_meeting_scheduled = true;
    is_meeting_done = true;
    meeting_count_type = 'NO';
  } else if (stage.includes('done') || stage === 'meeting done') {
    is_interested = true;
    is_meeting_scheduled = true;
    is_meeting_done = true;
  } else if (stage.includes('scheduled') || stage === 'meeting scheduled') {
    is_interested = true;
    is_meeting_scheduled = true;
  } else if (stage.includes('interested')) {
    is_interested = true;
  }

  return { is_interested, is_meeting_scheduled, is_meeting_done, meeting_count_type, is_pending, priority };
}

function normalizeWhatsAppFollowUp(val?: string): WhatsAppFollowUpStage {
  if (!val) return null;
  const s = val.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s.includes('wa3')) return 'WA3 Follow Up Sent';
  if (s.includes('wa2')) return 'WA2 Follow Up Sent';
  if (s.includes('wa1')) return 'WA1 Sent';
  return null;
}

function normalizeEmailFollowUp(val?: string): InterestedEmailFollowUpStage {
  if (!val) return null;
  const s = val.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s.includes('fw3')) return 'FW3 Sent';
  if (s.includes('fw2')) return 'FW2 Sent';
  if (s.includes('fw1')) return 'FW1 Sent';
  return null;
}

function parseDateIso(dateStr?: string): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }
  return null;
}

export const LeadImportModal: React.FC<LeadImportModalProps> = ({
  isOpen,
  onClose,
  defaultListId
}) => {
  const { bulkImportLeads, leads, campaigns, brands, accounts, lists } = useLeads();
  const { allUsers, currentUser } = useAuth();

  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [campaignId, setCampaignId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [targetListId, setTargetListId] = useState(defaultListId || '');
  const [assignedUserId, setAssignedUserId] = useState(currentUser.id);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const existingDbEmails = new Set(leads.map((l) => l.email.toLowerCase().trim()));

  const handleDownloadSampleCSV = () => {
    const csvContent = [
      'Email,First Name,Last Name,Company Name,WhatsApp Number,Alternative Number,City,Country,Primary Stage,WhatsApp Follow Up,Interested Email Follow Up,Email 1 Date,Email 2 Date,Email 3 Date,Meeting Date,Meeting Time,Date Added',
      'john.smith@techflow.io,John,Smith,TechFlow Inc,+1 555-234-5678,+1 555-987-6543,New York,United States,Meeting Count = YES,WA2 Follow Up Sent,FW1 Sent,2026-08-12,2026-08-16,2026-08-20,2026-08-25,10:30 AM,2026-08-10',
      'sarah.jenkins@lumina.co,Sarah,Jenkins,Lumina Design,+44 7700 900123,+44 20 7946 0192,London,United Kingdom,Meeting Scheduled,WA1 Sent,,2026-09-01,2026-09-04,,2026-09-12,02:00 PM,2026-09-01',
      'alex.rivas@vertexauto.com,Alex,Rivas,Vertex Auto,+1 415-555-7890,,San Francisco,United States,Interested,,,2026-09-02,,,2026-09-02',
      'david.choi@apexbiotech.com,David,Choi,Apex Bio,,+1 617-555-3456,Boston,United States,Meeting Count = NO,WA3 Follow Up Sent,FW2 Sent,2026-08-05,2026-08-09,2026-08-14,2026-08-22,04:15 PM,2026-08-01',
      'elena.rostova@nordicscale.se,Elena,Rostova,NordicScale,+46 70 123 4567,,Stockholm,Sweden,Outreach,,,2026-08-28,,,2026-08-28',
      'marcus.vance@solarsolutions.org,Marcus,Vance,Solar Solutions,+1 312-555-0199,,Chicago,United States,Pending YES,WA1 Sent,,2026-09-03,,,2026-09-03'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ruhit_leads_bulk_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        processRawText(content);
      }
    };
    reader.readAsText(file);
  };

  const processRawText = (text: string) => {
    if (!text.trim()) return;

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const isTab = lines[0].includes('\t');
    const firstLineCols = parseDelimitedLine(lines[0], isTab).map((c) => c.toLowerCase().trim());
    
    // Check if line 0 is a header row
    const hasHeader = firstLineCols.some((col) => 
      col.includes('email') || col.includes('name') || col.includes('company') || col.includes('stage')
    );

    // Build header index map if header row exists
    let colIndices = {
      email: 0,
      first_name: 1,
      last_name: 2,
      company_name: 3,
      whatsapp_number: 4,
      alternative_phone: 5,
      city: 6,
      country: 7,
      primary_stage: 8,
      whatsapp_followup: 9,
      interested_email_followup: 10,
      email_1_date: 11,
      email_2_date: 12,
      email_3_date: 13,
      meeting_date: 14,
      meeting_time: 15,
      date_added: 16
    };

    let startIndex = 0;
    if (hasHeader) {
      startIndex = 1;
      firstLineCols.forEach((col, idx) => {
        if (col === 'email' || col === 'e-mail' || col === 'work email') colIndices.email = idx;
        else if (col.includes('first')) colIndices.first_name = idx;
        else if (col.includes('last')) colIndices.last_name = idx;
        else if (col.includes('company') || col.includes('org')) colIndices.company_name = idx;
        else if (col.includes('whatsapp') || col === 'wa' || col === 'wa number') colIndices.whatsapp_number = idx;
        else if (col.includes('alt') || col.includes('second') || col.includes('other phone')) colIndices.alternative_phone = idx;
        else if (col === 'city') colIndices.city = idx;
        else if (col === 'country') colIndices.country = idx;
        else if (col.includes('primary stage') || col === 'stage' || col === 'status') colIndices.primary_stage = idx;
        else if (col.includes('whatsapp follow') || col.includes('wa follow')) colIndices.whatsapp_followup = idx;
        else if (col.includes('interested email') || col.includes('email follow')) colIndices.interested_email_followup = idx;
        else if (col.includes('email 1') || col.includes('email1')) colIndices.email_1_date = idx;
        else if (col.includes('email 2') || col.includes('email2')) colIndices.email_2_date = idx;
        else if (col.includes('email 3') || col.includes('email3')) colIndices.email_3_date = idx;
        else if (col.includes('meeting date') || col === 'mtg date') colIndices.meeting_date = idx;
        else if (col.includes('meeting time') || col === 'mtg time') colIndices.meeting_time = idx;
        else if (col.includes('date added') || col.includes('created') || col === 'date') colIndices.date_added = idx;
      });
    }

    const rows: ParsedRow[] = [];
    const seenPastedEmails = new Set<string>();

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const cols = parseDelimitedLine(line, isTab);

      const email = cols[colIndices.email] || '';
      const firstName = cols[colIndices.first_name] || '';
      const lastName = cols[colIndices.last_name] || '';
      const company = cols[colIndices.company_name] || '';
      const whatsapp = cols[colIndices.whatsapp_number] || '';
      const altPhone = cols[colIndices.alternative_phone] || '';
      const city = cols[colIndices.city] || '';
      const country = cols[colIndices.country] || '';
      const primaryStage = cols[colIndices.primary_stage] || '';
      const waFollowup = cols[colIndices.whatsapp_followup] || '';
      const emailFollowup = cols[colIndices.interested_email_followup] || '';
      const email1Date = cols[colIndices.email_1_date] || '';
      const email2Date = cols[colIndices.email_2_date] || '';
      const email3Date = cols[colIndices.email_3_date] || '';
      const meetingDate = cols[colIndices.meeting_date] || '';
      const meetingTime = cols[colIndices.meeting_time] || '';
      const dateAdded = cols[colIndices.date_added] || '';

      const errors: string[] = [];
      const cleanEmail = email.toLowerCase().trim();

      if (!cleanEmail) {
        errors.push('Missing email address');
      } else if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        errors.push('Invalid email format');
      }

      const isDuplicateInPasted = seenPastedEmails.has(cleanEmail);
      if (cleanEmail) seenPastedEmails.add(cleanEmail);

      const isDuplicateInDB = existingDbEmails.has(cleanEmail);

      rows.push({
        email: cleanEmail,
        first_name: firstName,
        last_name: lastName,
        company_name: company,
        whatsapp_number: whatsapp,
        alternative_phone: altPhone,
        city,
        country,
        primary_stage: primaryStage,
        whatsapp_followup: waFollowup,
        interested_email_followup: emailFollowup,
        email_1_date: email1Date,
        email_2_date: email2Date,
        email_3_date: email3Date,
        meeting_date: meetingDate,
        meeting_time: meetingTime,
        date_added: dateAdded,
        isValid: errors.length === 0 && !isDuplicateInPasted && !isDuplicateInDB,
        errors,
        isDuplicateInPasted,
        isDuplicateInDB,
      });
    }

    setParsedRows(rows);
    setStep('preview');
  };

  const handleParse = () => {
    processRawText(rawText);
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    try {
      const selectedCampaign = campaigns.find((c) => c.id === campaignId);
      const selectedBrand = brands.find((b) => b.id === brandId);
      const selectedAccount = accounts.find((a) => a.id === accountId);
      const selectedUser = allUsers.find((u) => u.id === assignedUserId);

      const toImport: Partial<Lead>[] = validRows.map((r) => {
        const stageMilestones = resolveMilestonesFromStage(r.primary_stage);
        const waFollowup = normalizeWhatsAppFollowUp(r.whatsapp_followup);
        const emailFollowup = normalizeEmailFollowUp(r.interested_email_followup);
        
        // Preserve historical creation date if provided so it doesn't artificially count for current month
        const historicalIso = parseDateIso(r.date_added);
        const createdAt = historicalIso || new Date().toISOString();

        return {
          email: r.email,
          first_name: r.first_name,
          last_name: r.last_name,
          company_name: r.company_name,
          whatsapp_number: r.whatsapp_number,
          alternative_phone: r.alternative_phone,
          city: r.city,
          country: r.country,
          list_ids: targetListId ? [targetListId] : [],
          campaign_id: campaignId || undefined,
          campaign_name: selectedCampaign?.name,
          brand_id: brandId || undefined,
          brand_name: selectedBrand?.name,
          account_id: accountId || undefined,
          account_name: selectedAccount?.account_name,
          assigned_user_id: assignedUserId,
          assigned_user_name: selectedUser?.full_name,
          priority: stageMilestones.priority,
          is_interested: stageMilestones.is_interested,
          interested_at: stageMilestones.is_interested ? createdAt : null,
          is_meeting_scheduled: stageMilestones.is_meeting_scheduled,
          meeting_scheduled_at: stageMilestones.is_meeting_scheduled ? createdAt : null,
          is_meeting_done: stageMilestones.is_meeting_done,
          meeting_done_at: stageMilestones.is_meeting_done ? createdAt : null,
          meeting_count_type: stageMilestones.meeting_count_type,
          meeting_count_at: stageMilestones.meeting_count_type ? createdAt : null,
          is_pending: stageMilestones.is_pending,
          pending_at: stageMilestones.is_pending ? createdAt : null,
          whatsapp_followup_stage: waFollowup,
          interested_email_followup_stage: emailFollowup,
          email_1_date: r.email_1_date || null,
          email_2_date: r.email_2_date || null,
          email_3_date: r.email_3_date || null,
          meeting_date: r.meeting_date || null,
          meeting_time: r.meeting_time || null,
          created_at: createdAt,
          updated_at: createdAt,
          source: 'Bulk Import',
        };
      });

      const res = await bulkImportLeads(toImport);
      setImportResult(res);
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const errorCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Bulk Upload Leads</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-[#1E3A5F]/40 text-[#00C2FF] border border-[#00C2FF]/30">
                  Stages & Follow-ups Supported
                </span>
              </h3>
              <p className="text-xs text-[#7B7B7B]">
                Upload CSV / TSV or copy-paste rows directly. Previous month dates are safely preserved outside the running month.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadSampleCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1E3A5F]/60 hover:bg-[#1E3A5F] text-[#00C2FF] border border-[#00C2FF]/40 rounded-lg text-xs font-semibold transition-all shadow-sm"
              title="Download pre-formatted sample CSV with stages, follow-up statuses, and dates"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#7B7B7B] hover:text-white rounded-lg hover:bg-[#1E3A5F]/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {importResult ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#00E5A0]/20 border border-[#00E5A0] flex items-center justify-center mx-auto text-[#00E5A0]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Import Complete!</h4>
              <p className="text-[#94A3B8] max-w-md mx-auto text-xs leading-relaxed">
                Successfully imported <span className="text-[#00E5A0] font-bold">{importResult.imported}</span> leads into the central database with their stages, follow-up statuses, and dates.
                {importResult.duplicates > 0 && (
                  <span className="block text-[#F97316] mt-1">
                    {importResult.duplicates} duplicate records were safely skipped.
                  </span>
                )}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#00C2FF] text-black font-semibold rounded-lg hover:bg-[#00C2FF]/90 transition-all shadow-lg"
              >
                Done
              </button>
            </div>
          ) : step === 'input' ? (
            <>
              {/* Sample Template & Help Banner */}
              <div className="p-3.5 bg-gradient-to-r from-[#111827] via-[#0B1E33] to-[#111827] border border-[#00C2FF]/30 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-white text-xs">Need the exact CSV layout?</h5>
                    <p className="text-[11px] text-[#94A3B8]">
                      Download our pre-filled template with examples of <strong>Primary Stages</strong> (Meeting Count = YES/NO, Scheduled, etc.), <strong>WhatsApp</strong> (WA1, WA2, WA3), <strong>Email Follow-ups</strong> (FW1, FW2, FW3), and <strong>Historical Dates</strong>.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 bg-[#00C2FF] hover:bg-[#00C2FF]/90 text-black font-bold rounded-lg text-xs transition-all shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* File Upload Zone */}
              <div className="p-5 border-2 border-dashed border-[#1E3A5F] hover:border-[#00C2FF]/60 rounded-xl bg-[#111827]/30 text-center space-y-2 transition-all">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <Upload className="w-7 h-7 text-[#00C2FF]" />
                  <p className="font-semibold text-white text-xs">
                    Upload CSV or TSV File
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    Drag & drop or browse from your computer (auto-detects headers)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-1.5 bg-[#1E3A5F]/60 hover:bg-[#1E3A5F] text-[#00C2FF] border border-[#00C2FF]/30 rounded-lg text-xs font-semibold transition-all"
                >
                  Choose File (.csv, .tsv)
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#1E3A5F]/60"></div>
                <span className="flex-shrink mx-4 text-[11px] text-[#64748B] uppercase font-mono tracking-wider">OR PASTE DIRECTLY FROM GOOGLE SHEETS</span>
                <div className="flex-grow border-t border-[#1E3A5F]/60"></div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[#94A3B8] font-medium text-xs">
                    Paste Spreadsheet Rows (with or without headers):
                  </label>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    Tab or Comma separated
                  </span>
                </div>
                <textarea
                  rows={7}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`john@example.com\tJohn\tSmith\tABC Ltd\t+1 555-1234\t+1 555-5678\tNew York\tUnited States\tMeeting Count = YES\tWA2 Follow Up Sent\tFW1 Sent\t2026-08-12\t2026-08-15\t\t2026-08-20\t10:30 AM\t2026-08-10`}
                  className="w-full bg-[#111827] text-white font-mono text-xs border border-[#1E3A5F] rounded-lg p-3 focus:outline-none focus:border-[#00C2FF] placeholder-[#4B5563]"
                />
              </div>

              {/* Assignment Selectors */}
              <div className="bg-[#111827]/70 p-3.5 rounded-xl border border-[#1E3A5F]/60">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2.5">
                  Default Assignments for Imported Rows
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[#94A3B8] font-medium mb-1">Target List</label>
                    <select
                      value={targetListId}
                      onChange={(e) => setTargetListId(e.target.value)}
                      className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00C2FF]"
                    >
                      <option value="">-- No List --</option>
                      {lists.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#94A3B8] font-medium mb-1">Campaign</label>
                    <select
                      value={campaignId}
                      onChange={(e) => setCampaignId(e.target.value)}
                      className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00C2FF]"
                    >
                      <option value="">-- None --</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#94A3B8] font-medium mb-1">Brand</label>
                    <select
                      value={brandId}
                      onChange={(e) => setBrandId(e.target.value)}
                      className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00C2FF]"
                    >
                      <option value="">-- None --</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#94A3B8] font-medium mb-1">Outbound Account</label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00C2FF]"
                    >
                      <option value="">-- None --</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.account_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#94A3B8] font-medium mb-1">Assign Rep</label>
                    <select
                      value={assignedUserId}
                      onChange={(e) => setAssignedUserId(e.target.value)}
                      className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00C2FF]"
                    >
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Step: Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#111827] p-3 rounded-lg border border-[#1E3A5F]/60">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1.5 text-[#00E5A0] font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{validCount} valid rows ready to import</span>
                  </div>
                  {errorCount > 0 && (
                    <div className="flex items-center space-x-1.5 text-[#F97316] font-semibold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{errorCount} skipped / duplicate</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setStep('input')}
                  className="text-xs text-[#00C2FF] hover:underline font-semibold"
                >
                  ← Edit Input Data
                </button>
              </div>

              {/* Preview Table with Stages and Follow-up Status */}
              <div className="border border-[#1E3A5F] rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#111827] text-[#00C2FF] sticky top-0 border-b border-[#1E3A5F]">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Company</th>
                      <th className="p-2.5">Primary Stage</th>
                      <th className="p-2.5">WhatsApp Follow Up</th>
                      <th className="p-2.5">Email Follow Up</th>
                      <th className="p-2.5">WhatsApp / Alt Phone</th>
                      <th className="p-2.5">Meeting Schedule</th>
                      <th className="p-2.5">Date Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E3A5F]/40 bg-[#0A0A0A]">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-[#111827]/70' : 'bg-red-950/20 text-[#7B7B7B]'}>
                        <td className="p-2.5">
                          {row.isValid ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#00E5A0]/20 text-[#00E5A0] border border-[#00E5A0]/30 font-semibold">
                              Ready
                            </span>
                          ) : row.isDuplicateInDB ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30">
                              Duplicate DB
                            </span>
                          ) : row.isDuplicateInPasted ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30">
                              Duplicate Pasted
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-red-950 text-red-400 border border-red-800">
                              {row.errors.join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-white">{row.email}</td>
                        <td className="p-2.5 text-white">{row.first_name} {row.last_name}</td>
                        <td className="p-2.5 text-white">{row.company_name}</td>
                        <td className="p-2.5">
                          {row.primary_stage ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#1E3A5F]/60 text-[#00C2FF] border border-[#00C2FF]/30 font-medium">
                              {row.primary_stage}
                            </span>
                          ) : (
                            <span className="text-[#64748B]">Outreach</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {row.whatsapp_followup ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#00E5A0]/10 text-[#00E5A0] border border-[#00E5A0]/30 font-medium">
                              {row.whatsapp_followup}
                            </span>
                          ) : (
                            <span className="text-[#64748B]">—</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {row.interested_email_followup ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/30 font-medium">
                              {row.interested_email_followup}
                            </span>
                          ) : (
                            <span className="text-[#64748B]">—</span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-[11px]">
                          <div className="text-[#00E5A0]">{row.whatsapp_number || '—'}</div>
                          {row.alternative_phone && <div className="text-[#00C2FF] text-[10px]">{row.alternative_phone}</div>}
                        </td>
                        <td className="p-2.5 text-[11px] text-[#94A3B8]">
                          {row.meeting_date ? `${row.meeting_date} ${row.meeting_time || ''}` : '—'}
                        </td>
                        <td className="p-2.5 text-[11px] text-[#94A3B8] font-mono">
                          {row.date_added || 'Now (Current Month)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!importResult && (
          <div className="p-4 border-t border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#7B7B7B] hover:text-white transition-colors"
            >
              Cancel
            </button>

            {step === 'input' ? (
              <button
                onClick={handleParse}
                disabled={!rawText.trim()}
                className="flex items-center space-x-1.5 px-5 py-2 bg-[#00C2FF] text-black font-semibold rounded-lg hover:bg-[#00C2FF]/90 transition-all disabled:opacity-40"
              >
                <span>Parse & Preview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleExecuteImport}
                disabled={validCount === 0 || isImporting}
                className="flex items-center space-x-1.5 px-6 py-2 bg-[#00E5A0] text-black font-bold rounded-lg hover:bg-[#00E5A0]/90 transition-all disabled:opacity-40 shadow-lg"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isImporting ? 'Importing...' : `Import ${validCount} Leads`}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
