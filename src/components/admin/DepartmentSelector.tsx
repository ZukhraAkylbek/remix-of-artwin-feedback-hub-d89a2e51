import { useState } from 'react';
import { Department } from '@/types/feedback';
import { Logo } from '@/components/Logo';
import { Users, Wallet, Megaphone, Briefcase, LogOut, Heart, HardHat, MoreHorizontal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DepartmentSelectorProps {
  onSelect: (department: Department) => void;
  onLogout: () => void;
}

const departments: { id: Department; label: string; icon: React.ReactNode }[] = [
  { id: 'management', label: 'Руководство', icon: <Briefcase className="w-6 h-6" /> },
  { id: 'reception', label: 'Reception', icon: <Users className="w-6 h-6" /> },
  { id: 'sales', label: 'Отдел продаж', icon: <Wallet className="w-6 h-6" /> },
  { id: 'hr', label: 'HR (сотрудники, условия труда)', icon: <Users className="w-6 h-6" /> },
  { id: 'marketing', label: 'Маркетинг', icon: <Megaphone className="w-6 h-6" /> },
  { id: 'favorites_ssl', label: 'ССЛ (Клиенты/Любимчики)', icon: <Heart className="w-6 h-6" /> },
  { id: 'construction_tech', label: 'Строительство (ТехОтдел)', icon: <HardHat className="w-6 h-6" /> },
  { id: 'other', label: 'Безопасность и экология (ОТиТБ)', icon: <MoreHorizontal className="w-6 h-6" /> },
];

// Department credentials mapping
const departmentCredentials: Record<Department, { email: string }> = {
  management: { email: 'management@artwin.kg' },
  reception: { email: 'reception@artwin.kg' },
  sales: { email: 'sales@artwin.kg' },
  hr: { email: 'hr@artwin.kg' },
  marketing: { email: 'marketing@artwin.kg' },
  favorites_ssl: { email: 'clients@artwin.kg' },
  construction_tech: { email: 'tech@artwin.kg' },
  other: { email: 'safety@artwin.kg' },
};

export const DepartmentSelector = ({ onSelect, onLogout }: DepartmentSelectorProps) => {
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDepartmentClick = (dept: Department) => {
    setSelectedDept(dept);
    setEmail('');
    setPassword('');
    setIsModalOpen(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDept || !email || !password) {
      toast.error('Введите email и пароль');
      return;
    }

    setIsLoading(true);

    try {
      // Check if the email matches the department's expected email BEFORE attempting login
      const expectedEmail = departmentCredentials[selectedDept].email;
      if (email.toLowerCase() !== expectedEmail.toLowerCase()) {
        toast.error('Этот логин не имеет доступа к выбранному департаменту');
        setIsLoading(false);
        return;
      }

      // Try to sign in with provided credentials (this will replace the current session)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Неверный логин или пароль');
        setIsLoading(false);
        return;
      }

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError || !roleData) {
        toast.error('У вас нет прав администратора');
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // Success - proceed to department
      setIsModalOpen(false);
      toast.success('Вход выполнен успешно');
      onSelect(selectedDept);

    } catch (err) {
      toast.error('Ошибка входа');
    }

    setIsLoading(false);
  };

  const selectedDeptInfo = selectedDept ? departments.find(d => d.id === selectedDept) : null;

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
              onClick={() => handleDepartmentClick(dept.id)}
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedDeptInfo && (
                <>
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    {selectedDeptInfo.icon}
                  </div>
                  {selectedDeptInfo.label}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@artwin.kg"
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                autoComplete="current-password"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Вход...
                  </>
                ) : (
                  'Войти'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};