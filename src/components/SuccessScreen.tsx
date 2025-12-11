import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackType, FEEDBACK_TYPE_CONFIG } from '@/types/feedback';
import { useI18n } from '@/lib/i18n';

interface SuccessScreenProps {
  type: FeedbackType;
  onReset: () => void;
}

export const SuccessScreen = ({ type, onReset }: SuccessScreenProps) => {
  const { t } = useI18n();
  const typeConfig = FEEDBACK_TYPE_CONFIG[type];

  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-scale-in">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div 
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
          style={{ backgroundColor: typeConfig.bgColor }}
        >
          <CheckCircle 
            className="w-10 h-10"
            style={{ color: typeConfig.color }}
          />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">{t('successTitle')}</h2>
          <p className="text-muted-foreground">{t('successDesc')}</p>
        </div>

        <Button
          variant="outline"
          onClick={onReset}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('newFeedback')}
        </Button>
      </div>
    </div>
  );
};
