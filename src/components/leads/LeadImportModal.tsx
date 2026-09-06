import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import { Lead } from '../../types';

interface LeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  isValid: boolean;
  errors: string[];
  isDuplicateInPasted: boolean;
  isDuplicateInDB: boolean;
}

export const LeadImportModal: React.FC<LeadImportModalProps> = ({ isOpen, onClose }) => {
  const { bulkImportLeads, leads, campaigns, brands, accounts } = useLeads();
  const { allUsers, currentUser } = useAuth();

  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [campaignId, setCampaignId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [assignedUserId, setAssignedUserId] = useState(currentUser.id);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number } | null>(null);

  if (!isOpen) return null;

  const existingDbEmails = new Set(leads.map((l) => l.email.toLowerCase().trim()));

  const handleParse = () => {
    if (!rawText.trim()) return;

    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const rows: ParsedRow[] = [];
    const seenPastedEmails = new Set<string>();

    let startIndex = 0;
    // Check if first line is a header
    const firstLineLower = lines[0].toLowerCase();
    if (
      firstLineLower.includes('email') &&
      (firstLineLower.includes('name') || firstLineLower.includes('first'))
    ) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Delimited by tab (Google sheets paste) or comma
      const cols = line.includes('\t')
        ? line.split('\t').map((c) => c.trim())
        : line.split(',').map((c) => c.trim());

      const email = cols[0] || '';
      const firstName = cols[1] || '';
      const lastName = cols[2] || '';
      const company = cols[3] || '';

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
        isValid: errors.length === 0 && !isDuplicateInPasted && !isDuplicateInDB,
        errors,
        isDuplicateInPasted,
        isDuplicateInDB,
      });
    }

    setParsedRows(rows);
    setStep('preview');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Google Sheets Bulk Lead Import</h3>
              <p className="text-xs text-[#7B7B7B]">
                Copy rows from your spreadsheet and paste directly below
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
              <div className="p-3 bg-[#111827] border border-[#1E3A5F]/60 rounded-lg text-xs text-[#94A3B8] space-y-1">
                <span className="font-semibold text-white">Required Format (4 columns):</span>
                <p className="font-mono text-[11px] text-[#00C2FF]">
                  Email [TAB] First Name [TAB] Last Name [TAB] Company Name
                </p>
                <p className="text-[11px] text-[#7B7B7B]">
                  Simply select your cells in Google Sheets, press Ctrl+C, and paste into the box below.
                </p>
              </div>

              <div>
                <label className="block text-[#94A3B8] font-medium mb-1">
                  Paste Raw Spreadsheet Rows:
                </label>
                <textarea
                  rows={9}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`john@example.com\tJohn\tSmith\tABC Ltd\nmary@example.com\tMary\tJones\tXYZ Corp`}
                  className="w-full bg-[#111827] text-white font-mono text-xs border border-[#1E3A5F] rounded-lg p-3 focus:outline-none focus:border-[#00C2FF]"
                />
              </div>

              {/* Assignment Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
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
                  <label className="block text-[#94A3B8] font-medium mb-1">Account</label>
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
            /* Preview Step */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#111827] border border-[#1E3A5F] rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1.5 text-[#00E5A0]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">{validCount} Ready to Import</span>
                  </div>
                  {errorCount > 0 && (
                    <div className="flex items-center space-x-1.5 text-[#F97316]">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-semibold">{errorCount} Issues Detected</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setStep('input')}
                  className="text-xs text-[#00C2FF] hover:underline"
                >
                  ? Edit Pasted Data
                </button>
              </div>

              {/* Data Table Preview */}
              <div className="border border-[#1E3A5F] rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111827] text-[#94A3B8] border-b border-[#1E3A5F] sticky top-0">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Status</th>
                      <th className="py-2 px-3 font-semibold">Email</th>
                      <th className="py-2 px-3 font-semibold">First Name</th>
                      <th className="py-2 px-3 font-semibold">Last Name</th>
                      <th className="py-2 px-3 font-semibold">Company</th>
                      <th className="py-2 px-3 font-semibold">Validation Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E3A5F]/40 bg-[#0A0A0A]">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={row.isValid ? 'hover:bg-[#111827]/40' : 'bg-red-950/20'}
                      >
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00E5A0]/15 text-[#00E5A0]">
                              VALID
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F97316]/15 text-[#F97316]">
                              SKIP
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-white font-mono">{row.email || '?'}</td>
                        <td className="py-2 px-3 text-[#94A3B8]">{row.first_name || '?'}</td>
                        <td className="py-2 px-3 text-[#94A3B8]">{row.last_name || '?'}</td>
                        <td className="py-2 px-3 text-[#94A3B8]">{row.company_name || '?'}</td>
                        <td className="py-2 px-3 text-[11px]">
                          {row.isDuplicateInDB && (
                            <span className="text-[#F97316]">Already exists in database</span>
                          )}
                          {row.isDuplicateInPasted && (
                            <span className="text-[#F97316]">Duplicate in pasted rows</span>
                          )}
                          {row.errors.map((err, i) => (
                            <span key={i} className="text-red-400 block">{err}</span>
                          ))}
                          {row.isValid && <span className="text-[#00E5A0]">Ready</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {!importResult && (
          <div className="p-4 border-t border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#7B7B7B] hover:text-white rounded-lg hover:bg-[#0A0A0A]"
            >
              Cancel
            </button>

            {step === 'input' ? (
              <button
                type="button"
                disabled={!rawText.trim()}
                onClick={handleParse}
                className="flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold text-black bg-[#00C2FF] hover:bg-[#00C2FF]/90 rounded-lg transition-all shadow-[0_0_12px_rgba(0,194,255,0.3)] disabled:opacity-50"
              >
                <span>Review & Validate Data</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={validCount === 0 || isImporting}
                onClick={handleExecuteImport}
                className="flex items-center space-x-1.5 px-6 py-2 text-xs font-semibold text-black bg-[#00E5A0] hover:bg-[#00E5A0]/90 rounded-lg transition-all shadow-[0_0_12px_rgba(0,229,160,0.3)] disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4 text-black" />
                <span>{isImporting ? 'Importing...' : `Import ${validCount} Leads`}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
