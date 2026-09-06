import React, { useState } from 'react';
import {
  Settings,
  MailCheck,
  Building2,
  Flag,
  Cloud,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  AlertCircle,
  Clock,
  Database
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { useAuth } from '../../context/AuthContext';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection
} from '../../lib/supabase';
import { Account, Brand, Campaign } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    accounts,
    brands,
    campaigns,
    leads,
    meetings,
    activities,
    addAccount,
    updateAccount,
    deleteAccount,
    addBrand,
    updateBrand,
    deleteBrand,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    refreshDataFromCloud,
    cloudStatus
  } = useLeads();
  const { currentUser } = useAuth();

  const [activeSection, setActiveSection] = useState<'accounts' | 'brands' | 'campaigns' | 'cloud' | 'export'>('accounts');

  // Supabase Config State
  const initialConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(initialConfig.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialConfig.anonKey);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // New Account Modal state
  const [newAccountName, setNewAccountName] = useState('');
  const [newEmailAccount, setNewEmailAccount] = useState('');
  const [newSenderName, setNewSenderName] = useState('');
  const [newBrandId, setNewBrandId] = useState('');
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  // New Brand Modal state
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandWebsite, setNewBrandWebsite] = useState('');
  const [newBrandDesc, setNewBrandDesc] = useState('');
  const [isAddingBrand, setIsAddingBrand] = useState(false);

  // New Campaign Modal state
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignBrandId, setNewCampaignBrandId] = useState('');
  const [newCampaignAccountId, setNewCampaignAccountId] = useState('');
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);

  const handleTestAndSaveCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) return;

    setIsTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
      await refreshDataFromCloud();
    }
  };

  const handleClearCloud = () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    setTestResult(null);
    refreshDataFromCloud();
  };

  const handleSaveNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName || !newEmailAccount) return;
    const brand = brands.find((b) => b.id === newBrandId);
    await addAccount({
      account_name: newAccountName.trim(),
      email_account: newEmailAccount.trim(),
      sender_name: newSenderName.trim() || 'Sender',
      brand_id: newBrandId || undefined,
      brand_name: brand?.name,
      status: 'active',
    });
    setNewAccountName('');
    setNewEmailAccount('');
    setNewSenderName('');
    setIsAddingAccount(false);
  };

  const handleSaveNewBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName) return;
    await addBrand({
      name: newBrandName.trim(),
      website: newBrandWebsite.trim(),
      description: newBrandDesc.trim(),
      status: 'active',
    });
    setNewBrandName('');
    setNewBrandWebsite('');
    setNewBrandDesc('');
    setIsAddingBrand(false);
  };

  const handleSaveNewCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName) return;
    await addCampaign({
      name: newCampaignName.trim(),
      brand_id: newCampaignBrandId || undefined,
      account_id: newCampaignAccountId || undefined,
      status: 'Active',
    });
    setNewCampaignName('');
    setIsAddingCampaign(false);
  };

  // Edit Account state
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editAccName, setEditAccName] = useState('');
  const [editAccEmail, setEditAccEmail] = useState('');
  const [editAccSender, setEditAccSender] = useState('');
  const [editAccBrandId, setEditAccBrandId] = useState('');
  const [editAccStatus, setEditAccStatus] = useState<'active' | 'inactive'>('active');

  const openEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setEditAccName(acc.account_name);
    setEditAccEmail(acc.email_account);
    setEditAccSender(acc.sender_name);
    setEditAccBrandId(acc.brand_id || '');
    setEditAccStatus(acc.status);
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !editAccName.trim() || !editAccEmail.trim()) return;
    const brand = brands.find((b) => b.id === editAccBrandId);
    await updateAccount(editingAccount.id, {
      account_name: editAccName.trim(),
      email_account: editAccEmail.trim(),
      sender_name: editAccSender.trim(),
      brand_id: editAccBrandId || undefined,
      brand_name: brand?.name,
      status: editAccStatus,
    });
    setEditingAccount(null);
  };

  // Edit Brand state
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandWebsite, setEditBrandWebsite] = useState('');
  const [editBrandDesc, setEditBrandDesc] = useState('');
  const [editBrandStatus, setEditBrandStatus] = useState<'active' | 'inactive'>('active');

  const openEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setEditBrandName(brand.name);
    setEditBrandWebsite(brand.website || '');
    setEditBrandDesc(brand.description || '');
    setEditBrandStatus(brand.status);
  };

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editBrandName.trim()) return;
    await updateBrand(editingBrand.id, {
      name: editBrandName.trim(),
      website: editBrandWebsite.trim() || undefined,
      description: editBrandDesc.trim() || undefined,
      status: editBrandStatus,
    });
    setEditingBrand(null);
  };

  // Edit Campaign state
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editCampName, setEditCampName] = useState('');
  const [editCampBrandId, setEditCampBrandId] = useState('');
  const [editCampAccountId, setEditCampAccountId] = useState('');
  const [editCampStatus, setEditCampStatus] = useState<'Active' | 'Paused' | 'Completed' | 'Archived'>('Active');
  const [editCampNotes, setEditCampNotes] = useState('');

  const openEditCampaign = (camp: Campaign) => {
    setEditingCampaign(camp);
    setEditCampName(camp.name);
    setEditCampBrandId(camp.brand_id || '');
    setEditCampAccountId(camp.account_id || '');
    setEditCampStatus(camp.status);
    setEditCampNotes(camp.notes || '');
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign || !editCampName.trim()) return;
    await updateCampaign(editingCampaign.id, {
      name: editCampName.trim(),
      brand_id: editCampBrandId || undefined,
      account_id: editCampAccountId || undefined,
      status: editCampStatus,
      notes: editCampNotes.trim() || undefined,
    });
    setEditingCampaign(null);
  };

  const handleExportTable = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((h) => {
              const val = row[h];
              return typeof val === 'object' ? `"${JSON.stringify(val).replace(/"/g, '""')}"` : `"${val ?? ''}"`;
            })
            .join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#00C2FF]" />
          <span>Operations & System Settings</span>
        </h2>
        <p className="text-xs text-[#7B7B7B] mt-0.5">
          Configure sender accounts, brands, campaigns, and cloud Supabase backend connectivity.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#1E3A5F] pb-2 text-xs">
        <button
          onClick={() => setActiveSection('accounts')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-semibold transition-all ${
            activeSection === 'accounts'
              ? 'bg-[#111827] text-[#00C2FF] border border-[#00C2FF]/30'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <MailCheck className="w-4 h-4" />
          <span>Outbound Accounts ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('brands')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-semibold transition-all ${
            activeSection === 'brands'
              ? 'bg-[#111827] text-[#00C2FF] border border-[#00C2FF]/30'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Brands ({brands.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('campaigns')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-semibold transition-all ${
            activeSection === 'campaigns'
              ? 'bg-[#111827] text-[#00C2FF] border border-[#00C2FF]/30'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Campaigns ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('cloud')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-semibold transition-all ${
            activeSection === 'cloud'
              ? 'bg-[#111827] text-[#00C2FF] border border-[#00C2FF]/30'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Supabase Cloud Integration</span>
        </button>

        <button
          onClick={() => setActiveSection('export')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg font-semibold transition-all ${
            activeSection === 'export'
              ? 'bg-[#111827] text-[#00C2FF] border border-[#00C2FF]/30'
              : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Data Backup & Export</span>
        </button>
      </div>

      {/* SECTION 1: ACCOUNTS (Requirement 22 - All 16 accounts supported) */}
      {activeSection === 'accounts' && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Designated Outbound Accounts</h3>
              <p className="text-[#7B7B7B]">
                All 16 operational sender accounts from Requirement 22 pre-seeded and fully editable.
              </p>
            </div>
            <button
              onClick={() => setIsAddingAccount(!isAddingAccount)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-[#00E5A0] text-black font-semibold rounded-lg hover:bg-[#00E5A0]/90"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Account</span>
            </button>
          </div>

          {/* Add Account Inline Form */}
          {isAddingAccount && (
            <form
              onSubmit={handleSaveNewAccount}
              className="p-4 bg-[#111827] border border-[#00C2FF]/40 rounded-xl space-y-3 animate-in fade-in duration-150"
            >
              <div className="font-bold text-white">Create New Outbound Account</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Account Name (e.g. Farzan TX)"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
                <input
                  type="email"
                  required
                  placeholder="Email Account (e.g. farzan@...)"
                  value={newEmailAccount}
                  onChange={(e) => setNewEmailAccount(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
                <input
                  type="text"
                  required
                  placeholder="Sender Name (e.g. Farzan Hussain)"
                  value={newSenderName}
                  onChange={(e) => setNewSenderName(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
                <select
                  value={newBrandId}
                  onChange={(e) => setNewBrandId(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                >
                  <option value="">-- Associate Brand --</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAccount(false)}
                  className="px-3 py-1.5 text-[#7B7B7B] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00E5A0] text-black font-semibold rounded hover:bg-[#00E5A0]/90"
                >
                  Save Account
                </button>
              </div>
            </form>
          )}

          {/* Edit Account Inline Form */}
          {editingAccount && (
            <form
              onSubmit={handleUpdateAccount}
              className="p-4 bg-[#111827] border border-[#00C2FF] rounded-xl space-y-3 animate-in fade-in duration-150 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm flex items-center gap-1.5 text-[#00C2FF]">
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Outbound Account: {editingAccount.account_name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="text-[#7B7B7B] hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Account Name"
                  value={editAccName}
                  onChange={(e) => setEditAccName(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
                <input
                  type="email"
                  required
                  placeholder="Email Account"
                  value={editAccEmail}
                  onChange={(e) => setEditAccEmail(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
                <input
                  type="text"
                  required
                  placeholder="Sender Name"
                  value={editAccSender}
                  onChange={(e) => setEditAccSender(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
                <select
                  value={editAccBrandId}
                  onChange={(e) => setEditAccBrandId(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                >
                  <option value="">-- Associate Brand --</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <select
                  value={editAccStatus}
                  onChange={(e) => setEditAccStatus(e.target.value as 'active' | 'inactive')}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                >
                  <option value="active">Status: Active</option>
                  <option value="inactive">Status: Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-3 py-1.5 text-[#7B7B7B] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#00C2FF] text-black font-semibold rounded hover:bg-[#00C2FF]/90 shadow-md"
                >
                  Update Account
                </button>
              </div>
            </form>
          )}

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl flex flex-col justify-between space-y-2 hover:border-[#00C2FF]/50 transition-all shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white font-mono text-sm text-[#00C2FF]">
                      {acc.account_name}
                    </h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                        acc.status === 'active'
                          ? 'bg-[#00E5A0]/15 text-[#00E5A0]'
                          : 'bg-[#F97316]/15 text-[#F97316]'
                      }`}
                    >
                      {acc.status}
                    </span>
                  </div>
                  <p className="font-mono text-[#94A3B8] text-[11px] mt-1 truncate">
                    {acc.email_account}
                  </p>
                  <p className="text-white font-medium text-xs mt-1">
                    Sender: <span className="text-[#00E5A0]">{acc.sender_name}</span>
                  </p>
                  {acc.brand_name && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-[#0A0A0A] border border-[#1E3A5F] rounded text-[10px] text-[#7B7B7B]">
                      Brand: {acc.brand_name}
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-[#1E3A5F]/40 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() =>
                      updateAccount(acc.id, {
                        status: acc.status === 'active' ? 'inactive' : 'active',
                      })
                    }
                    className="text-[#7B7B7B] hover:text-[#00C2FF]"
                  >
                    {acc.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => openEditAccount(acc)}
                      className="text-[#94A3B8] hover:text-[#00C2FF] flex items-center space-x-1 p-1 hover:bg-[#182234] rounded transition-colors"
                      title="Edit Account"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete outbound account "${acc.account_name}" (${acc.email_account})?`)) {
                          deleteAccount(acc.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 flex items-center space-x-1 p-1 hover:bg-red-950/40 rounded transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: BRANDS */}
      {activeSection === 'brands' && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Managed Brands</h3>
            <button
              onClick={() => setIsAddingBrand(!isAddingBrand)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-[#00E5A0] text-black font-semibold rounded-lg hover:bg-[#00E5A0]/90"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Brand</span>
            </button>
          </div>

          {isAddingBrand && (
            <form onSubmit={handleSaveNewBrand} className="p-4 bg-[#111827] border border-[#00C2FF]/40 rounded-xl space-y-3">
              <div className="font-bold text-white">Create New Brand</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Brand Name (e.g. Skill Up)"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
                <input
                  type="url"
                  placeholder="Website (https://...)"
                  value={newBrandWebsite}
                  onChange={(e) => setNewBrandWebsite(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newBrandDesc}
                  onChange={(e) => setNewBrandDesc(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddingBrand(false)} className="px-3 py-1.5 text-[#7B7B7B]">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#00E5A0] text-black font-semibold rounded">Save Brand</button>
              </div>
            </form>
          )}

          {/* Edit Brand Inline Form */}
          {editingBrand && (
            <form onSubmit={handleUpdateBrand} className="p-4 bg-[#111827] border border-[#00C2FF] rounded-xl space-y-3 animate-in fade-in duration-150 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm flex items-center gap-1.5 text-[#00C2FF]">
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Brand: {editingBrand.name}</span>
                </span>
                <button type="button" onClick={() => setEditingBrand(null)} className="text-[#7B7B7B] hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Brand Name"
                  value={editBrandName}
                  onChange={(e) => setEditBrandName(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
                <input
                  type="url"
                  placeholder="Website (https://...)"
                  value={editBrandWebsite}
                  onChange={(e) => setEditBrandWebsite(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={editBrandDesc}
                  onChange={(e) => setEditBrandDesc(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
                <select
                  value={editBrandStatus}
                  onChange={(e) => setEditBrandStatus(e.target.value as 'active' | 'inactive')}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                >
                  <option value="active">Status: Active</option>
                  <option value="inactive">Status: Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setEditingBrand(null)} className="px-3 py-1.5 text-[#7B7B7B] hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#00C2FF] text-black font-semibold rounded hover:bg-[#00C2FF]/90 shadow-md">Update Brand</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {brands.map((b) => (
              <div key={b.id} className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl flex flex-col justify-between space-y-2 hover:border-[#00C2FF]/50 transition-all shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{b.name}</h4>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => openEditBrand(b)}
                        className="text-[#94A3B8] hover:text-[#00C2FF] p-1 hover:bg-[#182234] rounded transition-colors"
                        title="Edit Brand"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete brand "${b.name}"?`)) {
                            deleteBrand(b.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-red-950/40 rounded transition-colors"
                        title="Delete Brand"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {b.website && <p className="text-[#00C2FF] font-mono text-[11px] truncate">{b.website}</p>}
                  {b.description && <p className="text-[#94A3B8] text-[11px]">{b.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: CAMPAIGNS */}
      {activeSection === 'campaigns' && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Campaigns</h3>
            <button
              onClick={() => setIsAddingCampaign(!isAddingCampaign)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-[#00E5A0] text-black font-semibold rounded-lg hover:bg-[#00E5A0]/90"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Campaign</span>
            </button>
          </div>

          {isAddingCampaign && (
            <form onSubmit={handleSaveNewCampaign} className="p-4 bg-[#111827] border border-[#00C2FF]/40 rounded-xl space-y-3">
              <div className="font-bold text-white">Create New Campaign</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Campaign Name (e.g. UNI Campaign Q4)"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
                <select
                  value={newCampaignBrandId}
                  onChange={(e) => setNewCampaignBrandId(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                >
                  <option value="">-- Associate Brand --</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select
                  value={newCampaignAccountId}
                  onChange={(e) => setNewCampaignAccountId(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                >
                  <option value="">-- Associate Account --</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.account_name}</option>)}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddingCampaign(false)} className="px-3 py-1.5 text-[#7B7B7B]">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#00E5A0] text-black font-semibold rounded">Save Campaign</button>
              </div>
            </form>
          )}

          {/* Edit Campaign Inline Form */}
          {editingCampaign && (
            <form onSubmit={handleUpdateCampaign} className="p-4 bg-[#111827] border border-[#00C2FF] rounded-xl space-y-3 animate-in fade-in duration-150 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm flex items-center gap-1.5 text-[#00C2FF]">
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Campaign: {editingCampaign.name}</span>
                </span>
                <button type="button" onClick={() => setEditingCampaign(null)} className="text-[#7B7B7B] hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Campaign Name"
                  value={editCampName}
                  onChange={(e) => setEditCampName(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
                <select
                  value={editCampBrandId}
                  onChange={(e) => setEditCampBrandId(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                >
                  <option value="">-- Associate Brand --</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select
                  value={editCampAccountId}
                  onChange={(e) => setEditCampAccountId(e.target.value)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                >
                  <option value="">-- Associate Account --</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.account_name}</option>)}
                </select>
                <select
                  value={editCampStatus}
                  onChange={(e) => setEditCampStatus(e.target.value as any)}
                  className="bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                >
                  <option value="Active">Status: Active</option>
                  <option value="Paused">Status: Paused</option>
                  <option value="Completed">Status: Completed</option>
                  <option value="Archived">Status: Archived</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Campaign notes or instructions..."
                  value={editCampNotes}
                  onChange={(e) => setEditCampNotes(e.target.value)}
                  className="w-full bg-[#0A0A0A] text-white border border-[#1E3A5F] rounded p-2 focus:border-[#00C2FF]"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setEditingCampaign(null)} className="px-3 py-1.5 text-[#7B7B7B] hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-[#00C2FF] text-black font-semibold rounded hover:bg-[#00C2FF]/90 shadow-md">Update Campaign</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {campaigns.map((c) => (
              <div key={c.id} className="p-4 bg-[#111827] border border-[#1E3A5F] rounded-xl space-y-1 hover:border-[#00C2FF]/50 transition-all shadow-md">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white text-sm">{c.name}</h4>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00E5A0]/15 text-[#00E5A0]">
                      {c.status}
                    </span>
                    <button
                      onClick={() => openEditCampaign(c)}
                      className="text-[#94A3B8] hover:text-[#00C2FF] p-1 hover:bg-[#182234] rounded transition-colors"
                      title="Edit Campaign"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete campaign "${c.name}"?`)) {
                          deleteCampaign(c.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 p-1 hover:bg-red-950/40 rounded transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {c.notes && <p className="text-[#94A3B8] text-[11px]">{c.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: SUPABASE CLOUD INTEGRATION */}
      {activeSection === 'cloud' && (
        <div className="p-6 bg-[#111827] border border-[#1E3A5F] rounded-xl space-y-6 text-xs max-w-3xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cloud className="w-5 h-5 text-[#00C2FF]" />
              <span>Supabase Cloud PostgreSQL Configuration</span>
            </h3>
            <p className="text-xs text-[#7B7B7B] mt-1">
              Connect your free or production Supabase project. Enter your Project URL and public Anon Key below.
            </p>
          </div>

          <form onSubmit={handleTestAndSaveCloud} className="space-y-4">
            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">
                Project URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                required
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className="w-full bg-[#0A0A0A] text-white font-mono text-xs border border-[#1E3A5F] rounded-lg p-2.5 focus:border-[#00C2FF]"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-medium mb-1">
                Public Anon Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                required
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-[#0A0A0A] text-white font-mono text-xs border border-[#1E3A5F] rounded-lg p-2.5 focus:border-[#00C2FF]"
              />
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
                  testResult.success
                    ? 'bg-[#00E5A0]/10 border-[#00E5A0]/40 text-[#00E5A0]'
                    : 'bg-red-950/40 border-red-800/60 text-red-300'
                }`}
              >
                {testResult.success ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleClearCloud}
                className="text-[#7B7B7B] hover:text-red-400"
              >
                Reset to Local/Demo Mode
              </button>

              <button
                type="submit"
                disabled={isTesting}
                className="px-5 py-2 bg-[#00C2FF] text-black font-semibold rounded-lg hover:bg-[#00C2FF]/90 transition-all shadow-[0_0_12px_rgba(0,194,255,0.3)] disabled:opacity-50"
              >
                {isTesting ? 'Testing Connection...' : 'Test Connection & Save'}
              </button>
            </div>
          </form>

          {/* Database Migrations SQL Help */}
          <div className="p-4 bg-[#0A0A0A] border border-[#1E3A5F] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Database Migration SQL Script</span>
              <span className="text-[10px] text-[#00C2FF] font-mono">
                supabase/migrations/001_initial_schema.sql
              </span>
            </div>
            <p className="text-[11px] text-[#7B7B7B]">
              Run the migration script in your Supabase SQL Editor to create all normalized tables, indexes, RLS policies, and pre-seed the 16 outbound accounts.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 5: DATA EXPORT & BACKUP (Requirement 69) */}
      {activeSection === 'export' && (
        <div className="p-6 bg-[#111827] border border-[#1E3A5F] rounded-xl space-y-4 text-xs max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-[#00E5A0]" />
              <span>Data Safety & Backup Exporter</span>
            </h3>
            <p className="text-[#7B7B7B] mt-1">
              Download complete CSV snapshots of your database for offline backup or analytical review.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-white">All Leads Repository</div>
                <div className="text-[#7B7B7B] text-[11px]">{leads.length} records</div>
              </div>
              <button
                onClick={() => handleExportTable(leads, 'ruhit_leads_master')}
                className="px-3 py-1.5 bg-[#00C2FF] text-black font-semibold rounded hover:bg-[#00C2FF]/90"
              >
                Download CSV
              </button>
            </div>

            <div className="p-3 bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Meetings & Outcomes</div>
                <div className="text-[#7B7B7B] text-[11px]">{meetings.length} records</div>
              </div>
              <button
                onClick={() => handleExportTable(meetings, 'ruhit_meetings')}
                className="px-3 py-1.5 bg-[#00C2FF] text-black font-semibold rounded hover:bg-[#00C2FF]/90"
              >
                Download CSV
              </button>
            </div>

            <div className="p-3 bg-[#0A0A0A] border border-[#1E3A5F] rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Activity Timeline Log</div>
                <div className="text-[#7B7B7B] text-[11px]">{activities.length} entries</div>
              </div>
              <button
                onClick={() => handleExportTable(activities, 'ruhit_activities')}
                className="px-3 py-1.5 bg-[#00C2FF] text-black font-semibold rounded hover:bg-[#00C2FF]/90"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
