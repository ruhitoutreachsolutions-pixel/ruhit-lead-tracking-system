import React from 'react';
import { X, Bell, Calendar, Clock, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useLeads } from '../../context/LeadContext';
import { InAppNotification } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLead?: (leadId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectLead,
}) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useLeads();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0A0A0A] border-l border-[#1E3A5F] h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#1E3A5F] flex items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-2.5">
            <Bell className="w-5 h-5 text-[#00C2FF]" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Notifications & Reminders
              </h3>
              <p className="text-[11px] text-[#7B7B7B]">
                {notifications.filter((n) => !n.is_read).length} unread updates
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={() => markAllNotificationsRead()}
                className="text-[11px] text-[#00C2FF] hover:underline"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-[#7B7B7B] hover:text-white rounded hover:bg-[#1E3A5F]/40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-[#7B7B7B]">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#00C2FF]" />
              <p className="text-xs">No notifications right now.</p>
            </div>
          ) : (
            notifications.map((notif: InAppNotification) => {
              const isMissed = notif.type === 'meeting_missed';
              const isUpcoming = notif.type === 'meeting_upcoming';

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationRead(notif.id);
                    if (notif.lead_id && onSelectLead) {
                      onSelectLead(notif.lead_id);
                      onClose();
                    }
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    notif.is_read
                      ? 'bg-[#111827]/40 border-[#1E3A5F]/40 opacity-70'
                      : 'bg-[#111827] border-[#00C2FF]/30 shadow-[0_0_10px_rgba(0,194,255,0.05)]'
                  } hover:border-[#00C2FF]/60`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5">
                      <div className="mt-0.5">
                        {isMissed ? (
                          <AlertTriangle className="w-4 h-4 text-[#F97316]" />
                        ) : isUpcoming ? (
                          <Calendar className="w-4 h-4 text-[#00E5A0]" />
                        ) : (
                          <Clock className="w-4 h-4 text-[#00C2FF]" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-[#7B7B7B] font-mono mt-1 block">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ? {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-[#00C2FF] shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
