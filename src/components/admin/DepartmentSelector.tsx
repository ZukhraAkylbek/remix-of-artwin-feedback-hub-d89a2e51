import { Department } from '@/types/feedback';
import { Logo } from '@/components/Logo';
import { Users, Building2, Wallet, Truck, Monitor, Package, PenTool, Megaphone, Crown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DepartmentSelectorProps {
  onSelect: (department: Department) => void;
  onLogout: () => void;
}

const departments: { id: Department; label: string; icon: React.ReactNode }[] = [
  { id: 'management', label: 'Руководство', icon: <Crown className="w-6 h-6" /> },
  { id: 'sales', label: 'Продажи', icon: <Wallet className="w-6 h-6" /> },
  { id: 'it', label: 'IT', icon: <Monitor className="w-6 h-6" /> },
  { id: 'logistics', label: 'Логистика', icon: <Truck className="w-6 h-6" /> },
  { id: 'accounting', label: 'Бухгалтерия', icon: <Building2 className="w-6 h-6" /> },
  { id: 'warehouse', label: 'Склад', icon: <Package className="w-6 h-6" /> },
  { id: 'hr', label: 'HR', icon: <Users className="w-6 h-6" /> },
  { id: 'marketing', label: 'Маркетинг', icon: <Megaphone className="w-6 h-6" /> },
  { id: 'design', label: 'Дизайн', icon: <PenTool className="w-6 h-6" /> },
];

export const DepartmentSelector = ({ onSelect, onLogout }: DepartmentSelectorProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8 animate-slide-up">
        <div className="text-center space-y-2">
          <Logo className="justify-center mb-6" />
          <h1 className="text-2xl font-semibold">Выберите департамент</h1>
          <p className="text-muted-foreground">Вы увидите обращения вашего отдела</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => onSelect(dept.id)}
              className={cn(
                'card-elevated p-6 text-center transition-all duration-300',
                'hover:border-primary/30 hover:shadow-floating'
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                {dept.icon}
              </div>
              <span className="font-medium">{dept.label}</span>
            </button>
          ))}
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={onLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Выйти из аккаунта
          </Button>
        </div>
      </div>
    </div>
  );
};
