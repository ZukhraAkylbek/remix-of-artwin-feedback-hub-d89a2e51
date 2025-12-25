import { useState } from 'react';
import { Department, DEPARTMENT_LABELS } from '@/types/feedback';
import { Logo } from '@/components/Logo';
import { 
  Users, Wallet, Megaphone, LogOut, Heart, HardHat, Shield, 
  Loader2, Scale, Banknote, Package, AlertTriangle, Building2, Lightbulb, Crown 
} from 'lucide-react';
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
  { id: 'rukovodstvo', label: DEPARTMENT_LABELS.rukovodstvo, icon: <Crown className="w-6 h-6" /> },
  { id: 'ssl', label: DEPARTMENT_LABELS.ssl, icon: <Heart className="w-6 h-6" /> },
  { id: 'zamgd_kom', label: DEPARTMENT_LABELS.zamgd_kom, icon: <Megaphone className="w-6 h-6" /> },
  { id: 'service_aho', label: DEPARTMENT_LABELS.service_aho, icon: <Building2 className="w-6 h-6" /> },
  { id: 'otitb_hse', label: DEPARTMENT_LABELS.otitb_hse, icon: <AlertTriangle className="w-6 h-6" /> },
  { id: 'omto', label: DEPARTMENT_LABELS.omto, icon: <Package className="w-6 h-6" /> },
  { id: 'hr', label: DEPARTMENT_LABELS.hr, icon: <Users className="w-6 h-6" /> },
  { id: 'zamgd_tech', label: DEPARTMENT_LABELS.zamgd_tech, icon: <HardHat className="w-6 h-6" /> },
  { id: 'otd_razv', label: DEPARTMENT_LABELS.otd_razv, icon: <Lightbulb className="w-6 h-6" /> },
  { id: 'legal', label: DEPARTMENT_LABELS.legal, icon: <Scale className="w-6 h-6" /> },
  { id: 'finance', label: DEPARTMENT_LABELS.finance, icon: <Banknote className="w-6 h-6" /> },
  { id: 'security', label: DEPARTMENT_LABELS.security, icon: <Shield className="w-6 h-6" /> },
];

// Department credentials mapping
const departmentCredentials: Record<Department, { email: string }> = {
  rukovodstvo: { email: 'management@artwin.kg' },
  ssl: { email: 'clients@artwin.kg' },
  zamgd_kom: { email: 'sales@artwin.kg' },
  service_aho: { email: 'reception@artwin.kg' },
  otitb_hse: { email: 'hse@artwin.kg' },
  omto: { email: 'omto@artwin.kg' },
  hr: { email: 'hr@artwin.kg' },
  zamgd_tech: { email: 'tech@artwin.kg' },
  otd_razv: { email: 'razv@artwin.kg' },
  legal: { email: 'legal@artwin.kg' },
  finance: { email: 'finance@artwin.kg' },
  security: { email: 'security@artwin.kg' },
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
        toast.error('Этот логин не имеет доступа к выбранному отделу');
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
      <div className="w-full max-w-2xl space-y-8 animate-slide-up">
        <div className="text-center space-y-2">
          <Logo className="justify-center mb-6" />
          <h1 className="text-2xl font-semibold">Выберите отдел</h1>
          <p className="text-muted-foreground">Вы увидите обращения вашего отдела</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => handleDepartmentClick(dept.id)}
              className={cn(
                'card-elevated p-4 text-center transition-all duration-300',
                'hover:border-primary/30 hover:shadow-floating'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-2">
                {dept.icon}
              </div>
              <span className="font-medium text-sm">{dept.label}</span>
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
