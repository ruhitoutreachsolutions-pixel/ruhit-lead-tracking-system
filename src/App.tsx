import React, { useState } from 'react';
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
        />

        {/* Viewport Body */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
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

export function App() {
  return (
    <AuthProvider>
      <LeadProvider>
        <AppContent />
      </LeadProvider>
    </AuthProvider>
  );
}

export default App;
