import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Cloud,
  Bell,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showDesktopNotification
} from '../../lib/notifications';

interface HeaderProps {
  onOpenAddLead: () => void;
  onOpenImportLeads: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectLead?: (leadId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddLead,
  onOpenImportLeads,
  searchQuery,
  onSearchChange,
  onSelectLead,
}) => {
  const { leads, cloudStatus, refreshDataFromCloud, notifications, lastSyncTime } = useLeads();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
    const updateTime = () => {
      const now = new Date();
      // Display current local time formatted in Asia/Dhaka
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' (Asia/Dhaka)'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      showDesktopNotification('Desktop Notifications Active', {
        body: 'You will now receive alerts for scheduled meetings and follow-up reminders.',
      });
    }
  };

  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="h-16 bg-[#0A0A0A] border-b border-[#1E3A5F]/60 px-6 flex items-center justify-between shrink-0 select-none">
      {/* Search Input Bar (Matching screenshot 4) */}
      <div className="flex items-center flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-[#7B7B7B] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search leads, company, city, campaign, account..."
          className="w-full bg-[#111827] text-xs text-white placeholder-[#7B7B7B] pl-10 pr-4 py-2 rounded-lg border border-[#1E3A5F]/60 focus:outline-none focus:border-[#00C2FF] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="text-[11px] text-[#7B7B7B] hover:text-white absolute right-3 top-1/2 -translate-y-1/2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center space-x-3 ml-4">
        {/* Timezone Clock Display */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-[#111827] rounded-md border border-[#1E3A5F]/40 text-[11px] font-mono text-[#94A3B8]">
          <Clock className="w-3.5 h-3.5 text-[#00C2FF]" />
          <span>{currentTime}</span>
        </div>

        {/* Sync to Cloud Button (Replicating exact UI from screenshot 4) */}
        <button
          onClick={() => refreshDataFromCloud()}
          title={lastSyncTime ? `Last synced at ${lastSyncTime.toLocaleTimeString()}` : 'Sync with Supabase'}
          className="flex items-center space-x-2 px-3 py-1.5 bg-[#111827] hover:bg-[#1E3A5F]/40 text-xs font-mono rounded-lg border border-[#00C2FF]/30 text-[#00C2FF] transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cloudStatus === 'syncing' ? 'animate-spin' : ''}`} />
          <span className="font-sans font-medium">Sync to Cloud</span>
          <span className="px-1.5 py-0.2 bg-[#00C2FF]/20 text-[#00C2FF] text-[10px] font-semibold rounded">
            {leads.length}
          </span>
        </button>

        {/* Add Single Lead Button (Green CTA button matching screenshot 4) */}
        <button
          onClick={onOpenAddLead}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#00E5A0] hover:bg-[#00E5A0]/90 text-black font-semibold text-xs rounded-lg transition-all shadow-[0_0_12px_rgba(0,229,160,0.3)]"
        >
          <Plus className="w-4 h-4 text-black stroke-[3]" />
          <span>+ Add Single Lead</span>
        </button>

        {/* Import Leads Button (Matching screenshot 4) */}
        <button
          onClick={onOpenImportLeads}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#182234] text-xs text-[#00C2FF] font-medium rounded-lg border border-[#00C2FF]/40 transition-all"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Import Leads</span>
        </button>

        {/* Notification Bell with Badge */}
        <button
          onClick={() => setIsNotifOpen(true)}
          className="relative p-2 text-[#94A3B8] hover:text-white bg-[#111827] rounded-lg border border-[#1E3A5F]/60 transition-colors"
          title="Notification Center"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifs > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F97316] text-black text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
              {unreadNotifs}
            </span>
          )}
        </button>

        {/* Desktop notification permission CTA if not granted */}
        {notifPermission !== 'granted' && (
          <button
            onClick={handleEnableNotifications}
            className="hidden xl:flex items-center space-x-1 px-2 py-1 text-[11px] bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/30 rounded hover:bg-[#F97316]/20 transition-all"
            title="Click to enable desktop notifications"
          >
            <Smartphone className="w-3 h-3" />
            <span>Enable Desktop Alerts</span>
          </button>
        )}
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onSelectLead={onSelectLead}
      />
    </header>
  );
};
