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
  FileText
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { Lead } from '../../types';

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
  isValid: boolean;
  errors: string[];
  isDuplicateInPasted: boolean;
  isDuplicateInDB: boolean;
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

    const rows: ParsedRow[] = [];
    const seenPastedEmails = new Set<string>();

    let startIndex = 0;
    // Check if first line is a header
    const firstLineLower = lines[0].toLowerCase();
    if (
      firstLineLower.includes('email') &&
      (firstLineLower.includes('name') || firstLineLower.includes('first') || firstLineLower.includes('company'))
    ) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Delimited by tab (Google sheets paste) or comma
      const cols = line.includes('\t')
        ? line.split('\t').map((c) => c.trim().replace(/^"|"$/g, ''))
        : line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));

      const email = cols[0] || '';
      const firstName = cols[1] || '';
      const lastName = cols[2] || '';
      const company = cols[3] || '';
      const whatsapp = cols[4] || '';
      const altPhone = cols[5] || '';
      const city = cols[6] || '';
      const country = cols[7] || '';

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

      const toImport: Partial<Lead>[] = validRows.map((r) => ({
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
        priority: 'Medium',
      }));

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
      <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Bulk Upload Leads</h3>
              <p className="text-xs text-[#7B7B7B]">
                Upload CSV / Excel TSV or copy-paste rows directly from Google Sheets
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {importResult ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#00E5A0]/20 border border-[#00E5A0] flex items-center justify-center mx-auto text-[#00E5A0]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Import Complete!</h4>
              <p className="text-[#94A3B8] max-w-md mx-auto text-xs">
                Successfully imported <span className="text-[#00E5A0] font-bold">{importResult.imported}</span> leads into the central database.
                {importResult.duplicates > 0 && (
                  <span className="block text-[#F97316] mt-1">
                    {importResult.duplicates} duplicate records were safely skipped.
                  </span>
                )}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#00C2FF] text-black font-semibold rounded-lg hover:bg-[#00C2FF]/90 transition-all"
              >
                Done
              </button>
            </div>
          ) : step === 'input' ? (
            <>
              {/* File Upload Zone */}
              <div className="p-4 border-2 border-dashed border-[#1E3A5F] hover:border-[#00C2FF]/60 rounded-xl bg-[#111827]/40 text-center space-y-2 transition-all">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <Upload className="w-6 h-6 text-[#00C2FF]" />
                  <p className="font-semibold text-white text-xs">
                    Upload CSV or TSV File
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    Drag & drop or browse from your computer
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-[#1E3A5F]/60 hover:bg-[#1E3A5F] text-[#00C2FF] border border-[#00C2FF]/30 rounded text-xs font-medium"
                >
                  Choose File (.csv, .tsv)
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#1E3A5F]/60"></div>
                <span className="flex-shrink mx-4 text-[11px] text-[#64748B] uppercase font-mono">OR PASTE DIRECTLY</span>
                <div className="flex-grow border-t border-[#1E3A5F]/60"></div>
              </div>

              <div className="p-3 bg-[#111827] border border-[#1E3A5F]/60 rounded-lg text-xs text-[#94A3B8] space-y-1">
                <span className="font-semibold text-white">Supported Columns (Tab or Comma separated):</span>
                <p className="font-mono text-[11px] text-[#00C2FF]">
                  Email [TAB] First Name [TAB] Last Name [TAB] Company [TAB] WhatsApp [TAB] Alt Number [TAB] City [TAB] Country
                </p>
                <p className="text-[11px] text-[#7B7B7B]">
                  Simply copy rows from Google Sheets, press Ctrl+V below, and preview.
                </p>
              </div>

              <div>
                <label className="block text-[#94A3B8] font-medium mb-1">
                  Paste Raw Spreadsheet Rows:
                </label>
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`john@example.com\tJohn\tSmith\tABC Ltd\t+447123456789\t+442079460123\nmary@example.com\tMary\tJones\tXYZ Corp`}
                  className="w-full bg-[#111827] text-white font-mono text-xs border border-[#1E3A5F] rounded-lg p-3 focus:outline-none focus:border-[#00C2FF]"
                />
              </div>

              {/* Assignment Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                <div>
                  <label className="block text-[#94A3B8] font-medium mb-1">Target List</label>
                  <select
                    value={targetListId}
                    onChange={(e) => setTargetListId(e.target.value)}
                    className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00C2FF]"
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
                    className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00C2FF]"
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
                    className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00C2FF]"
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
                    className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00C2FF]"
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
                    className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00C2FF]"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : (
            /* Step: Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#111827] p-3 rounded-lg border border-[#1E3A5F]/60">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-[#00E5A0]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span><strong>{validCount}</strong> valid rows ready</span>
                  </div>
                  {errorCount > 0 && (
                    <div className="flex items-center space-x-1 text-[#F97316]">
                      <AlertTriangle className="w-4 h-4" />
                      <span><strong>{errorCount}</strong> skipped / duplicate</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setStep('input')}
                  className="text-xs text-[#00C2FF] hover:underline"
                >
                  Edit Input Data
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-[#1E3A5F] rounded-lg overflow-hidden max-h-[350px] overflow-y-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#111827] text-[#00C2FF] sticky top-0 border-b border-[#1E3A5F]">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Company</th>
                      <th className="p-2.5">WhatsApp</th>
                      <th className="p-2.5">Alt Number</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E3A5F]/40 bg-[#0A0A0A]">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-[#111827]' : 'bg-red-950/20 text-[#7B7B7B]'}>
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
                        <td className="p-2.5 text-[#00E5A0] font-mono">{row.whatsapp_number || '—'}</td>
                        <td className="p-2.5 text-[#00C2FF] font-mono">{row.alternative_phone || '—'}</td>
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
                className="flex items-center space-x-1 px-5 py-2 bg-[#00C2FF] text-black font-semibold rounded-lg hover:bg-[#00C2FF]/90 transition-all disabled:opacity-40"
              >
                <span>Parse & Preview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleExecuteImport}
                disabled={validCount === 0 || isImporting}
                className="flex items-center space-x-1.5 px-6 py-2 bg-[#00E5A0] text-black font-semibold rounded-lg hover:bg-[#00E5A0]/90 transition-all disabled:opacity-40"
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
