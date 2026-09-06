import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  SendHorizontal,
  BarChart3,
  Clock,
  FileText,
  Settings,
  Sparkles,
  LogOut,
  Globe,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLeads } from '../../context/LeadContext';

export type NavTab =
  | 'dashboard'
  | 'leads'
  | 'meetings'
  | 'mailmerge'
  | 'email_copies'
  | 'reports'
  | 'reminders'
  | 'timezone'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenUserManagement?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onOpenUserManagement }) => {
  const { currentUser, role, permissions, logout } = useAuth();
  const { leads, reminders, cloudStatus } = useLeads();

  const pendingRemindersCount = reminders.filter((r) => !r.is_completed).length;

  const rawNavItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; permitted: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, permitted: true },
    { id: 'leads', label: 'All Leads', icon: <Users className="w-4 h-4" />, badge: leads.length, permitted: permissions.can_view_leads },
    { id: 'meetings', label: 'Meetings Kanban', icon: <CalendarCheck2 className="w-4 h-4" />, permitted: true },
    { id: 'mailmerge', label: 'Mail Merge', icon: <SendHorizontal className="w-4 h-4" />, permitted: true },
    { id: 'email_copies', label: 'Email Copies & Notes', icon: <FileText className="w-4 h-4" />, permitted: permissions.can_manage_email_copies },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" />, permitted: permissions.can_view_reports },
    { id: 'timezone', label: 'Time Converter', icon: <Globe className="w-4 h-4" />, permitted: true },
    { id: 'reminders', label: 'Reminders', icon: <Clock className="w-4 h-4" />, badge: pendingRemindersCount > 0 ? pendingRemindersCount : undefined, permitted: true },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, permitted: permissions.can_manage_settings },
  ];

  const navItems = rawNavItems.filter((item) => item.permitted);

  const displayName = currentUser?.full_name || currentUser?.username || 'Ruhit (Owner)';
  const displayRole = role === 'admin' ? 'Owner / Admin' : role.toUpperCase();

  return (
    <aside className="w-64 bg-[#0A0A0A] border-r border-[#1E3A5F]/60 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1E3A5F]/50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#111827] border border-[#00C2FF]/40 flex items-center justify-center relative shadow-[0_0_12px_rgba(0,194,255,0.2)]">
            <Sparkles className="w-5 h-5 text-[#00C2FF]" />
            <div className="w-2 h-2 rounded-full bg-[#00E5A0] absolute -top-0.5 -right-0.5 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1">
              RUHIT <span className="text-[#00C2FF]">LTS</span>
            </div>
            <div className="text-[10px] text-[#7B7B7B] uppercase tracking-wider font-mono">
              Lead Operations Portal
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#111827] text-[#00C2FF] border border-[#00C2FF]/30 shadow-[0_0_15px_rgba(0,194,255,0.12)]'
                  : 'text-[#94A3B8] hover:bg-[#111827]/70 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-[#00C2FF]' : 'text-[#7B7B7B]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                    isActive
                      ? 'bg-[#00C2FF]/20 text-[#00C2FF]'
                      : 'bg-[#1E3A5F]/40 text-[#94A3B8]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Cloud Sync Status Indicator */}
      <div className="px-4 py-2 bg-[#111827]/40 border-t border-[#1E3A5F]/30 mx-3 mb-2 rounded-md">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#7B7B7B]">Cloud Auto-Sync</span>
          <span
            className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
              cloudStatus === 'connected'
                ? 'bg-[#00E5A0]/15 text-[#00E5A0]'
                : cloudStatus === 'syncing'
                ? 'bg-[#00C2FF]/15 text-[#00C2FF] animate-pulse'
                : 'bg-[#F97316]/15 text-[#F97316]'
            }`}
          >
            {cloudStatus === 'connected' ? '● 15s Synced' : cloudStatus === 'syncing' ? '● Syncing...' : '● Offline Backup'}
          </span>
        </div>
      </div>

      {/* User Session Profile & Controls */}
      <div className="p-3 border-t border-[#1E3A5F]/50 bg-[#0E1522]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-black text-xs shrink-0"
              style={{ backgroundColor: currentUser?.avatar_color || '#00C2FF' }}
            >
              {displayName.charAt(0)}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">
                {displayName}
              </div>
              <div className="text-[10px] text-[#00C2FF] font-mono">
                {displayRole}
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign Out"
            className="text-[#7B7B7B] hover:text-red-400 p-1.5 rounded hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Management shortcut for Admin */}
        {role === 'admin' && onOpenUserManagement && (
          <button
            onClick={onOpenUserManagement}
            className="w-full mt-1 flex items-center justify-center space-x-1.5 py-1 px-2 bg-[#1E3A5F]/50 hover:bg-[#1E3A5F] text-[#00C2FF] border border-[#00C2FF]/30 rounded text-[10px] font-medium transition-all"
          >
            <UserCheck className="w-3 h-3" />
            <span>Manage Users & Powers</span>
          </button>
        )}
      </div>
    </aside>
  );
};
