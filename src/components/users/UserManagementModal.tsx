import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Users,
  Shield,
  Key,
  Trash2,
  Edit2,
  Check,
  Lock,
  Cloud,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, UserRole, UserPermissions } from '../../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_NEW_PERMISSIONS: UserPermissions = {
  can_view_leads: true,
  can_create_edit_leads: true,
  can_delete_leads: false,
  can_bulk_import: true,
  can_export_leads: false,
  can_view_reports: false,
  can_manage_settings: false,
  can_manage_email_copies: false,
  can_manage_lead_collections: true,
};

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { allUsers, currentUser, createUser, updateUser, deleteUser, syncUsersWithCloud } = useAuth();

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('team_member');
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_NEW_PERMISSIONS);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setUsername('');
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('team_member');
    setPermissions({ ...DEFAULT_NEW_PERMISSIONS });
    setErrorMsg(null);
    setMode('create');
  };

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setUsername(user.username || '');
    setFullName(user.full_name || '');
    setEmail(user.email || '');
    setPassword(user.password || '');
    setRole(user.role);
    setPermissions(user.permissions || { ...DEFAULT_NEW_PERMISSIONS });
    setErrorMsg(null);
    setMode('edit');
  };

  const togglePermission = (key: keyof UserPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim()) {
      setErrorMsg('Username is required.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const res = await createUser({
          username,
          full_name: fullName.trim() || username,
          email: email.trim() || `${username.toLowerCase()}@ros.com`,
          password,
          role,
          avatar_color: role === 'admin' ? '#00C2FF' : role === 'manager' ? '#8B5CF6' : '#00E5A0',
          permissions,
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create user.');
          setIsSubmitting(false);
          return;
        }
      } else if (mode === 'edit' && selectedUser) {
        const res = await updateUser(selectedUser.id, {
          username,
          full_name: fullName,
          email: email,
          password,
          role,
          permissions,
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to update user.');
          setIsSubmitting(false);
          return;
        }
      }

      setMode('list');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, uName: string) => {
    if (!confirm(`Are you sure you want to delete user "${uName}"?`)) return;
    const res = await deleteUser(userId);
    if (!res.success) {
      alert(res.error || 'Failed to delete user.');
    }
  };

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    await syncUsersWithCloud();
    setIsSyncing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#1E3A5F] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center text-[#00C2FF]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>User Management & Access Control</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-[#1E3A5F]/40 text-[#00C2FF] border border-[#00C2FF]/30">
                  Cloud Synced
                </span>
              </h3>
              <p className="text-xs text-[#7B7B7B]">
                Manage team credentials and configure granular usage powers
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSyncCloud}
              disabled={isSyncing}
              className="p-1.5 text-[#7B7B7B] hover:text-[#00C2FF] rounded-lg hover:bg-[#1E3A5F]/40 transition-colors"
              title="Sync users with cloud"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#00C2FF]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#7B7B7B] hover:text-white rounded-lg hover:bg-[#1E3A5F]/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl flex items-center space-x-2 text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'list' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#94A3B8]">
                  Active Portal Accounts: <strong className="text-white">{allUsers.length}</strong>
                </p>
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#00C2FF] hover:bg-[#00C2FF]/90 text-black font-bold rounded-xl text-xs transition-all shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create New User</span>
                </button>
              </div>

              {/* Users Table */}
              <div className="border border-[#1E3A5F] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111827] text-[#00C2FF] border-b border-[#1E3A5F]">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Username & Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Usage Powers / Permissions</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E3A5F]/40 bg-[#0A0A0A]">
                    {allUsers.map((u) => {
                      const isMaster = u.username?.toLowerCase() === 'ruhit111' || u.id === 'usr-ruhit-owner';
                      const p = u.permissions || DEFAULT_NEW_PERMISSIONS;

                      return (
                        <tr key={u.id} className="hover:bg-[#111827]/40 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center space-x-2.5">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] text-black shadow-sm"
                                style={{ backgroundColor: u.avatar_color || '#00C2FF' }}
                              >
                                {u.full_name?.charAt(0) || u.username?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="font-semibold text-white flex items-center gap-1.5">
                                  <span>{u.full_name || u.username}</span>
                                  {isMaster && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#00C2FF]/20 text-[#00C2FF] border border-[#00C2FF]/40 font-bold uppercase">
                                      Owner
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-[#64748B]">ID: {u.id}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-mono text-white text-[11px]">{u.username}</div>
                            <div className="text-[#64748B] text-[10px]">{u.email}</div>
                          </td>

                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                u.role === 'admin'
                                  ? 'bg-[#00C2FF]/10 text-[#00C2FF] border-[#00C2FF]/30'
                                  : u.role === 'manager'
                                  ? 'bg-[#A855F7]/10 text-[#A855F7] border-[#A855F7]/30'
                                  : 'bg-[#00E5A0]/10 text-[#00E5A0] border-[#00E5A0]/30'
                              }`}
                            >
                              {u.role.toUpperCase()}
                            </span>
                          </td>

                          <td className="p-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {p.can_view_leads && <span className="px-1.5 py-0.5 rounded bg-[#1E3A5F]/40 text-[#94A3B8] text-[9px]">Leads</span>}
                              {p.can_create_edit_leads && <span className="px-1.5 py-0.5 rounded bg-[#1E3A5F]/40 text-[#94A3B8] text-[9px]">Edit</span>}
                              {p.can_bulk_import && <span className="px-1.5 py-0.5 rounded bg-[#00E5A0]/10 text-[#00E5A0] text-[9px]">Bulk Upload</span>}
                              {p.can_export_leads && <span className="px-1.5 py-0.5 rounded bg-[#00C2FF]/10 text-[#00C2FF] text-[9px]">Export</span>}
                              {p.can_view_reports && <span className="px-1.5 py-0.5 rounded bg-[#A855F7]/10 text-[#A855F7] text-[9px]">Reports</span>}
                              {p.can_manage_email_copies && <span className="px-1.5 py-0.5 rounded bg-[#F97316]/10 text-[#F97316] text-[9px]">Copies</span>}
                              {p.can_manage_settings && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px]">Settings</span>}
                              {p.can_delete_leads && <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 text-[9px]">Delete</span>}
                            </div>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => handleOpenEdit(u)}
                                className="p-1 text-[#94A3B8] hover:text-[#00C2FF] rounded hover:bg-[#1E3A5F]/50 transition-colors"
                                title="Edit credentials & permissions"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!isMaster && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  className="p-1 text-[#94A3B8] hover:text-red-400 rounded hover:bg-red-950/40 transition-colors"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Create or Edit Form */
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E3A5F]">
                <h4 className="font-bold text-white text-sm">
                  {mode === 'create' ? 'Create New Portal User' : `Edit User: ${selectedUser?.username}`}
                </h4>
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="text-xs text-[#00C2FF] hover:underline"
                >
                  &larr; Back to Users List
                </button>
              </div>

              {/* Credentials Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">
                    Username <span className="text-[#00C2FF]">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. nayeem101"
                    required
                    className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
                  />
                </div>

                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Nayeemur Rahman"
                    className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
                  />
                </div>

                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. nayeem@ros.com"
                    className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
                  />
                </div>

                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">
                    Password <span className="text-[#00C2FF]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="w-full bg-[#111827] text-white font-mono border border-[#1E3A5F] rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-[#00C2FF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[#94A3B8] font-semibold mb-1">
                    User Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#00C2FF]"
                  >
                    <option value="team_member">Team Member (Standard rep)</option>
                    <option value="manager">Manager (Can manage campaigns & leads)</option>
                    <option value="admin">Administrator (Full administrative access)</option>
                  </select>
                </div>
              </div>

              {/* Granular Usage Powers / Permissions */}
              <div className="bg-[#111827]/70 p-4 rounded-xl border border-[#1E3A5F]">
                <h5 className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#00C2FF]" />
                  <span>Configure Usage Powers & Portal Permissions</span>
                </h5>
                <p className="text-[11px] text-[#7B7B7B] mb-3">
                  Control precisely what this user can view, edit, upload, or export.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'can_view_leads', label: 'View Leads & Directory', desc: 'Can browse the central All Leads table' },
                    { key: 'can_create_edit_leads', label: 'Add & Edit Leads', desc: 'Can manually create or modify lead details' },
                    { key: 'can_bulk_import', label: 'Bulk Upload Leads', desc: 'Can upload CSV/TSV spreadsheets' },
                    { key: 'can_export_leads', label: 'Export Leads to CSV', desc: 'Can download lead datasets to their computer' },
                    { key: 'can_delete_leads', label: 'Delete Leads', desc: 'Can permanently delete lead records' },
                    { key: 'can_view_reports', label: 'View Reports & Analytics', desc: 'Can view monthly conversion reports and KPIs' },
                    { key: 'can_manage_email_copies', label: 'Manage Email Copies & Tasks', desc: 'Can edit email sequences and todo lists' },
                    { key: 'can_manage_lead_collections', label: 'Lead List Collection', desc: 'Can manage keyword sets, locations, and batch collection' },
                    { key: 'can_manage_settings', label: 'Manage Settings & Integrations', desc: 'Can modify brands, accounts, and campaigns' },
                  ].map((item) => {
                    const k = item.key as keyof UserPermissions;
                    const isChecked = permissions[k];

                    return (
                      <div
                        key={item.key}
                        onClick={() => togglePermission(k)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start space-x-2.5 ${
                          isChecked
                            ? 'bg-[#00C2FF]/10 border-[#00C2FF]/40 text-white'
                            : 'bg-[#0A0A0A] border-[#1E3A5F]/60 text-[#64748B] hover:border-[#1E3A5F]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-[#00C2FF] border-[#00C2FF] text-black'
                              : 'border-[#64748B] bg-transparent'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex-1">
                          <div className={`font-semibold text-xs ${isChecked ? 'text-white' : 'text-[#94A3B8]'}`}>
                            {item.label}
                          </div>
                          <div className="text-[10px] text-[#64748B] leading-tight">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="px-4 py-2 text-[#7B7B7B] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#00C2FF] hover:bg-[#00C2FF]/90 text-black font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
