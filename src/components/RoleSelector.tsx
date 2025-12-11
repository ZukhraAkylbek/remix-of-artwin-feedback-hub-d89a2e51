import { UserRole } from '@/types/feedback';
import { Users, Briefcase, HardHat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleSelectorProps {
  selected: UserRole | null;
  onSelect: (role: UserRole) => void;
}

const roles: { id: UserRole; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'employee', label: 'Сотрудник', icon: <Users className="w-6 h-6" />, description: 'Работник компании Artwin' },
  { id: 'client', label: 'Клиент', icon: <Briefcase className="w-6 h-6" />, description: 'Заказчик услуг' },
  { id: 'contractor', label: 'Подрядчик', icon: <HardHat className="w-6 h-6" />, description: 'Партнер или поставщик' },
];

export const RoleSelector = ({ selected, onSelect }: RoleSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {roles.map((role) => (
        <button
          key={role.id}
          onClick={() => onSelect(role.id)}
          className={cn(
            'card-elevated p-6 text-left transition-all duration-300',
            'hover:border-primary/30 hover:shadow-floating',
            selected === role.id && 'border-primary ring-2 ring-primary/20 bg-primary/5'
          )}
        >
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors',
            selected === role.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            {role.icon}
          </div>
          <h3 className="font-semibold text-lg mb-1">{role.label}</h3>
          <p className="text-sm text-muted-foreground">{role.description}</p>
        </button>
      ))}
    </div>
  );
};
