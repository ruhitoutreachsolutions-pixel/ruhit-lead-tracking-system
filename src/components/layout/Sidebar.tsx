import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  SendHorizontal,
  BarChart3,
  Clock,
  Flag,
  Building2,
  MailCheck,
  Settings,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLeads } from '../../context/LeadContext';

export type NavTab =
  | 'dashboard'
  | 'leads'
  | 'meetings'
  | 'mailmerge'
  | 'reports'
  | 'reminders'
  | 'campaigns'
  | 'brands'
  | 'accounts'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { currentUser, role, signOut, allUsers, switchUser } = useAuth();
  const { leads, reminders, cloudStatus } = useLeads();

  const pendingRemindersCount = reminders.filter((r) => !r.is_completed).length;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'leads', label: 'All Leads', icon: <Users className="w-4 h-4" />, badge: leads.length },
    { id: 'meetings', label: 'Meetings Kanban', icon: <CalendarCheck2 className="w-4 h-4" /> },
    { id: 'mailmerge', label: 'Mail Merge', icon: <SendHorizontal className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'reminders', label: 'Reminders', icon: <Clock className="w-4 h-4" />, badge: pendingRemindersCount > 0 ? pendingRemindersCount : undefined },
    { id: 'campaigns', label: 'Campaigns', icon: <Flag className="w-4 h-4" /> },
    { id: 'brands', label: 'Brands', icon: <Building2 className="w-4 h-4" /> },
    { id: 'accounts', label: 'Accounts', icon: <MailCheck className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

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
          <span className="text-[#7B7B7B]">Cloud Backend</span>
          <span
            className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
              cloudStatus === 'connected'
                ? 'bg-[#00E5A0]/15 text-[#00E5A0]'
                : cloudStatus === 'syncing'
                ? 'bg-[#00C2FF]/15 text-[#00C2FF] animate-pulse'
                : 'bg-[#F97316]/15 text-[#F97316]'
            }`}
          >
            {cloudStatus === 'connected' ? '? Connected' : cloudStatus === 'syncing' ? '? Syncing' : '? Demo / Local'}
          </span>
        </div>
      </div>

      {/* User Session Profile & Switcher */}
      <div className="p-3 border-t border-[#1E3A5F]/50 bg-[#0E1522]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-black text-xs shrink-0"
              style={{ backgroundColor: currentUser.avatar_color || '#00C2FF' }}
            >
              {currentUser.full_name[0]}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser.full_name}
              </div>
              <div className="text-[10px] text-[#00C2FF] font-mono capitalize">
                {role}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            title="Sign Out"
            className="text-[#7B7B7B] hover:text-red-400 p-1 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-1.5 pt-1.5 border-t border-[#1E3A5F]/40 flex items-center justify-between text-[10px] text-[#7B7B7B]">
          <span>Active Rep:</span>
          <select
            value={currentUser.id}
            onChange={(e) => switchUser(e.target.value)}
            className="bg-[#111827] text-white border border-[#1E3A5F] rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-[#00C2FF]"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
};
