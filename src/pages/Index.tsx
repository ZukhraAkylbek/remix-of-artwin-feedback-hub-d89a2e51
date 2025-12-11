import { useState } from 'react';
import { UserRole, FeedbackType } from '@/types/feedback';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';
import { RoleSelector } from '@/components/RoleSelector';
import { TypeSelector } from '@/components/TypeSelector';
import { FeedbackForm } from '@/components/FeedbackForm';
import { SuccessScreen } from '@/components/SuccessScreen';
import { ArrowLeft, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type Step = 'role' | 'type' | 'form' | 'success';

const Index = () => {
  const [step, setStep] = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('type');
  };

  const handleTypeSelect = (type: FeedbackType) => {
    setSelectedType(type);
    setStep('form');
  };

  const handleSuccess = () => {
    setStep('success');
  };

  const handleReset = () => {
    setStep('role');
    setSelectedRole(null);
    setSelectedType(null);
  };

  const goBack = () => {
    if (step === 'type') setStep('role');
    if (step === 'form') setStep('type');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <Link to="/admin">
            <Button variant="ghost" size="sm" className="gap-2">
              <Users className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">{step === 'role' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center space-y-3">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                <span className="text-foreground">Artwin</span>{' '}
                <span className="text-primary">Обратная связь</span>
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Мы ценим ваше мнение. Пожалуйста, выберите вашу роль, чтобы начать.
              </p>
            </div>

            <RoleSelector selected={selectedRole} onSelect={handleRoleSelect} />
          </div>
        )}

        

        {step === 'type' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
            <button 
              onClick={goBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>

            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-semibold">Тип обращения</h2>
              <p className="text-muted-foreground">Что вы хотите сообщить?</p>
            </div>

            <TypeSelector selected={selectedType} onSelect={handleTypeSelect} />
          </div>
        )}

        {step === 'form' && selectedRole && selectedType && (
          <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
            <button 
              onClick={goBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>

            <div className={cn(
              'text-center space-y-2 p-6 rounded-2xl',
              selectedType === 'complaint' ? 'bg-complaint-light' : 'bg-suggestion-light'
            )}>
              <h2 className={cn(
                'text-2xl md:text-3xl font-semibold',
                selectedType === 'complaint' ? 'text-complaint' : 'text-suggestion'
              )}>
                {selectedType === 'complaint' ? 'Жалоба' : 'Предложение'}
              </h2>
              <p className="text-muted-foreground">Заполните форму обращения</p>
            </div>

            <FeedbackForm 
              type={selectedType} 
              userRole={selectedRole} 
              onSuccess={handleSuccess} 
            />
          </div>
        )}

        {step === 'success' && selectedType && (
          <SuccessScreen type={selectedType} onReset={handleReset} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
