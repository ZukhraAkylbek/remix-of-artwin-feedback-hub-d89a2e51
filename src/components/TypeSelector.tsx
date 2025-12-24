import { FeedbackType, FEEDBACK_TYPE_CONFIG } from '@/types/feedback';
import { AlertTriangle, Lightbulb, Shield, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface TypeSelectorProps {
  selected: FeedbackType | null;
  onSelect: (type: FeedbackType) => void;
}

const typeIcons: Record<FeedbackType, React.ReactNode> = {
  remark: <AlertTriangle className="w-6 h-6" />,
  suggestion: <Lightbulb className="w-6 h-6" />,
  safety: <Shield className="w-6 h-6" />,
  gratitude: <Heart className="w-6 h-6" />,
};

const typeColors: Record<FeedbackType, { border: string; ring: string; bg: string; iconBg: string; iconSelected: string }> = {
  remark: {
    border: 'border-red-500/30',
    ring: 'ring-red-500/20',
    bg: 'bg-red-50 dark:bg-red-950/20',
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    iconSelected: 'bg-red-500 text-white',
  },
  suggestion: {
    border: 'border-blue-500/30',
    ring: 'ring-blue-500/20',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    iconSelected: 'bg-blue-500 text-white',
  },
  safety: {
    border: 'border-amber-500/30',
    ring: 'ring-amber-500/20',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    iconSelected: 'bg-amber-500 text-white',
  },
  gratitude: {
    border: 'border-green-500/30',
    ring: 'ring-green-500/20',
    bg: 'bg-green-50 dark:bg-green-950/20',
    iconBg: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    iconSelected: 'bg-green-500 text-white',
  },
};

export const TypeSelector = ({ selected, onSelect }: TypeSelectorProps) => {
  const { t } = useI18n();

  const types: { id: FeedbackType; labelKey: 'remark' | 'suggestion' | 'safety' | 'gratitude'; descKey: 'remarkDesc' | 'suggestionDesc' | 'safetyDesc' | 'gratitudeDesc' }[] = [
    { id: 'remark', labelKey: 'remark', descKey: 'remarkDesc' },
    { id: 'suggestion', labelKey: 'suggestion', descKey: 'suggestionDesc' },
    { id: 'safety', labelKey: 'safety', descKey: 'safetyDesc' },
    { id: 'gratitude', labelKey: 'gratitude', descKey: 'gratitudeDesc' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {types.map((type) => {
        const colors = typeColors[type.id];
        const isSelected = selected === type.id;

        return (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={cn(
              'card-elevated p-6 text-left transition-all duration-300',
              `hover:${colors.border}`,
              isSelected && `${colors.border} ring-2 ${colors.ring} ${colors.bg}`
            )}
          >
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors',
              isSelected ? colors.iconSelected : colors.iconBg
            )}>
              {typeIcons[type.id]}
            </div>
            <h3 className="font-semibold text-lg mb-1">{t(type.labelKey)}</h3>
            <p className="text-sm text-muted-foreground">{t(type.descKey)}</p>
          </button>
        );
      })}
    </div>
  );
};
