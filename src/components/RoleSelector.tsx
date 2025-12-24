import { UserRole } from '@/types/feedback';
import { User, Briefcase, Truck, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface RoleSelectorProps {
  selected: UserRole | null;
  onSelect: (role: UserRole) => void;
}

export const RoleSelector = ({ selected, onSelect }: RoleSelectorProps) => {
  const { t } = useI18n();

  const roles: { id: UserRole; labelKey: 'employee' | 'client' | 'contractor' | 'resident'; descKey: 'employeeDesc' | 'clientDesc' | 'contractorDesc' | 'residentDesc'; icon: React.ReactNode }[] = [
    { id: 'resident', labelKey: 'resident', descKey: 'residentDesc', icon: <Home className="w-6 h-6" /> },
    { id: 'client', labelKey: 'client', descKey: 'clientDesc', icon: <Briefcase className="w-6 h-6" /> },
    { id: 'employee', labelKey: 'employee', descKey: 'employeeDesc', icon: <User className="w-6 h-6" /> },
    { id: 'contractor', labelKey: 'contractor', descKey: 'contractorDesc', icon: <Truck className="w-6 h-6" /> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {roles.map((role) => (
        <button
          key={role.id}
          onClick={() => onSelect(role.id)}
          className={cn(
            'card-elevated p-6 text-left transition-all duration-300',
            'hover:border-primary/30',
            selected === role.id && 'border-primary ring-2 ring-primary/20 bg-primary/5'
          )}
        >
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors',
            selected === role.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            {role.icon}
          </div>
          <h3 className="font-semibold text-lg mb-1">{t(role.labelKey)}</h3>
          <p className="text-sm text-muted-foreground">{t(role.descKey)}</p>
        </button>
      ))}
    </div>
  );
};
