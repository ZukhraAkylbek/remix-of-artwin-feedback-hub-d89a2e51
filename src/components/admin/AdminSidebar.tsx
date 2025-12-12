import { Department } from '@/types/feedback';
import { Logo } from '@/components/Logo';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  FileText, 
  LogOut,
  Users,
  Building2,
  Wallet,
  Truck,
  Monitor,
  Package,
  PenTool,
  Megaphone,
  Crown,
  ArrowLeftRight,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  currentDepartment: Department;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onChangeDepartment: () => void;
}

const departmentIcons: Record<Department, React.ReactNode> = {
  management: <Crown className="w-5 h-5" />,
  sales: <Wallet className="w-5 h-5" />,
  it: <Monitor className="w-5 h-5" />,
  logistics: <Truck className="w-5 h-5" />,
  accounting: <Building2 className="w-5 h-5" />,
  warehouse: <Package className="w-5 h-5" />,
  hr: <Users className="w-5 h-5" />,
  marketing: <Megaphone className="w-5 h-5" />,
  design: <PenTool className="w-5 h-5" />,
};

const departmentLabels: Record<Department, string> = {
  management: 'Руководство',
  sales: 'Продажи',
  it: 'IT',
  logistics: 'Логистика',
  accounting: 'Бухгалтерия',
  warehouse: 'Склад',
  hr: 'HR',
  marketing: 'Маркетинг',
  design: 'Дизайн',
};

const menuItems = [
  { id: 'dashboard', label: 'Дашборд', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'tickets', label: 'Обращения', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'employees', label: 'Сотрудники', icon: <Users className="w-5 h-5" /> },
  { id: 'reports', label: 'Отчёты', icon: <FileText className="w-5 h-5" /> },
  { id: 'history', label: 'История', icon: <History className="w-5 h-5" /> },
  { id: 'settings', label: 'Настройки', icon: <Settings className="w-5 h-5" /> },
];

export const AdminSidebar = ({ 
  currentDepartment, 
  activeTab, 
  onTabChange, 
  onLogout,
  onChangeDepartment
}: AdminSidebarProps) => {
  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-sidebar-border">
        <Logo />
      </div>

      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
          {departmentIcons[currentDepartment]}
          <div>
            <p className="text-sm font-medium">{departmentLabels[currentDepartment]}</p>
            <p className="text-xs text-sidebar-foreground/60">Администратор</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
              activeTab === item.id
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        <button
          onClick={onChangeDepartment}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <ArrowLeftRight className="w-5 h-5" />
          Сменить департамент
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Выйти из аккаунта
        </button>
      </div>
    </aside>
  );
};
