import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackType } from '@/types/feedback';
import { cn } from '@/lib/utils';

interface SuccessScreenProps {
  type: FeedbackType;
  onReset: () => void;
}

export const SuccessScreen = ({ type, onReset }: SuccessScreenProps) => {
  const isComplaint = type === 'complaint';

  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-scale-in">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className={cn(
          'w-20 h-20 rounded-full mx-auto flex items-center justify-center',
          isComplaint ? 'bg-complaint-light' : 'bg-suggestion-light'
        )}>
          <CheckCircle className={cn(
            'w-10 h-10',
            isComplaint ? 'text-complaint' : 'text-suggestion'
          )} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Обращение отправлено!</h2>
          <p className="text-muted-foreground">
            {isComplaint 
              ? 'Ваша жалоба зарегистрирована и будет рассмотрена в ближайшее время.'
              : 'Спасибо за ваше предложение! Мы обязательно его рассмотрим.'}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={onReset}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Отправить ещё одно обращение
        </Button>
      </div>
    </div>
  );
};
