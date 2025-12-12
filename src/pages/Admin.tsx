import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Department, Feedback } from '@/types/feedback';
import { fetchAllFeedback } from '@/lib/database';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Dashboard } from '@/components/admin/Dashboard';
import { TicketList } from '@/components/admin/TicketList';
import { TicketDetail } from '@/components/admin/TicketDetail';
import { SettingsPanel } from '@/components/admin/SettingsPanel';
import { ReportsPanel } from '@/components/admin/ReportsPanel';
import { EmployeesPanel } from '@/components/admin/EmployeesPanel';
import { HistoryPanel } from '@/components/admin/HistoryPanel';
import { DepartmentSelector } from '@/components/admin/DepartmentSelector';
import { Footer } from '@/components/Footer';

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, department: userDepartment, loading, signOut } = useAuth();
  
  const [department, setDepartment] = useState<Department | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Redirect to auth if not logged in or not admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, loading, navigate]);

  // Auto-select department based on user's assigned department
  useEffect(() => {
    if (!loading && isAdmin && userDepartment && !department) {
      setDepartment(userDepartment);
    }
  }, [loading, isAdmin, userDepartment, department]);

  const loadFeedback = async () => {
    setIsLoadingData(true);
    const data = await fetchAllFeedback();
    setFeedback(data);
    setIsLoadingData(false);
  };

  useEffect(() => {
    if (department && isAdmin) {
      loadFeedback();
    }
  }, [department, isAdmin]);

  const refreshData = () => {
    loadFeedback();
  };

  const handleSelectDepartment = (dept: Department) => {
    setDepartment(dept);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const selectedTicket = feedback.find(f => f.id === selectedTicketId);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  // Show department selector if authenticated but no department selected (for users without assigned department)
  if (!department) {
    return <DepartmentSelector onSelect={handleSelectDepartment} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar
        currentDepartment={department}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedTicketId(null);
        }}
        onLogout={handleLogout}
        onChangeDepartment={() => setDepartment(null)}
      />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {activeTab === 'dashboard' && (
            <Dashboard feedback={feedback} department={department} />
          )}

          {activeTab === 'tickets' && !selectedTicketId && (
            <TicketList 
              feedback={feedback} 
              department={department}
              onSelectTicket={setSelectedTicketId}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'tickets' && selectedTicket && (
            <TicketDetail 
              ticket={selectedTicket}
              onBack={() => setSelectedTicketId(null)}
              onUpdate={refreshData}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPanel feedback={feedback} department={department} />
          )}

          {activeTab === 'employees' && (
            <EmployeesPanel department={department} />
          )}

          {activeTab === 'history' && (
            <HistoryPanel />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel />
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Admin;
