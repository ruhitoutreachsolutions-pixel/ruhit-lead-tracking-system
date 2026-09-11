import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LeadProvider, useLeads } from './context/LeadContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { AllLeadsTable } from './components/leads/AllLeadsTable';
import { MeetingsKanban } from './components/meetings/MeetingsKanban';
import { MailMergeDispatcher } from './components/mailmerge/MailMergeDispatcher';
import { ReportsView } from './components/reports/ReportsView';
import { RemindersView } from './components/reminders/RemindersView';
import { TimeZoneConverterView } from './components/timezone/TimeZoneConverterView';
import { SettingsView } from './components/settings/SettingsView';
import { EmailCopiesAndOpsView } from './components/emailcopies/EmailCopiesAndOpsView';
import { LeadCollectionDashboardView } from './components/leadcollection/LeadCollectionDashboardView';
import { AddLeadModal } from './components/leads/AddLeadModal';
import { LeadImportModal } from './components/leads/LeadImportModal';
import { LeadDetailModal } from './components/leads/LeadDetailModal';
import { ScheduleMeetingModal } from './components/meetings/ScheduleMeetingModal';
import { LoginView } from './components/auth/LoginView';
import { UserManagementModal } from './components/users/UserManagementModal';

const AppContent: React.FC = () => {
  const { isAuthenticated, permissions, role } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [scheduleMeetingLeadId, setScheduleMeetingLeadId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Automatically open native picker when clicking anywhere on date or time inputs (must run before any conditional returns)
  useEffect(() => {
    const handlePickerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'INPUT') {
        const input = target as HTMLInputElement;
        if (input.type === 'date' || input.type === 'time' || input.type === 'datetime-local') {
          try {
            input.showPicker?.();
          } catch {}
        }
      }
    };

    document.addEventListener('click', handlePickerClick);
    return () => {
      document.removeEventListener('click', handlePickerClick);
    };
  }, []);

  // If unauthenticated, show the Login View directly
  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleOpenScheduleMeeting = (leadId: string) => {
    setSelectedLeadId(null);
    setScheduleMeetingLeadId(leadId);
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white overflow-hidden selection:bg-[#00C2FF] selection:text-black">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setSearchQuery('');
        }}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Header */}
        <Header
          onOpenAddLead={() => setIsAddLeadOpen(true)}
          onOpenImportLeads={() => setIsImportOpen(true)}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectLead={(id) => setSelectedLeadId(id)}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* Viewport Body - Expands fully across wide monitors and mobile screens */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <div className="w-full min-w-0 space-y-6">
            {currentTab === 'dashboard' && <DashboardView />}

            {currentTab === 'leads' && (
              <AllLeadsTable
                searchQuery={searchQuery}
                onSelectLead={(id) => setSelectedLeadId(id)}
                onOpenScheduleMeeting={handleOpenScheduleMeeting}
                onOpenAddLead={() => setIsAddLeadOpen(true)}
                onOpenBulkUpload={() => setIsImportOpen(true)}
              />
            )}

            {currentTab === 'meetings' && (
              <MeetingsKanban
                onSelectLead={(id) => setSelectedLeadId(id)}
              />
            )}

            {currentTab === 'mailmerge' && <MailMergeDispatcher />}

            {currentTab === 'reports' && permissions.can_view_reports && <ReportsView />}

            {currentTab === 'reminders' && (
              <RemindersView
                onSelectLead={(id) => setSelectedLeadId(id)}
              />
            )}

            {currentTab === 'timezone' && <TimeZoneConverterView />}

            {currentTab === 'email_copies' && permissions.can_manage_email_copies && (
              <EmailCopiesAndOpsView />
            )}

            {currentTab === 'lead_collection' && (permissions.can_manage_lead_collections ?? true) && (
              <LeadCollectionDashboardView />
            )}

            {currentTab === 'settings' && permissions.can_manage_settings && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Modals & Overlays */}
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
      />

      <LeadImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
      />

      <LeadDetailModal
        leadId={selectedLeadId}
        isOpen={Boolean(selectedLeadId)}
        onClose={() => setSelectedLeadId(null)}
        onOpenScheduleMeeting={handleOpenScheduleMeeting}
      />

      <ScheduleMeetingModal
        leadId={scheduleMeetingLeadId}
        isOpen={Boolean(scheduleMeetingLeadId)}
        onClose={() => setScheduleMeetingLeadId(null)}
      />
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught CRM application error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090E] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/40">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-gray-400 max-w-md mb-6 text-sm">
            {this.state.error?.message || 'An unexpected application error occurred.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl bg-[#00C2FF] hover:bg-[#00A3D9] text-black font-semibold text-sm transition-all"
            >
              Reload System
            </button>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-medium text-sm transition-all"
            >
              Clear Cache &amp; Re-login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LeadProvider>
          <AppContent />
        </LeadProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
