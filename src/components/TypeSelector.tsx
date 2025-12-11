import { FeedbackType } from '@/types/feedback';
import { AlertCircle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TypeSelectorProps {
  selected: FeedbackType | null;
  onSelect: (type: FeedbackType) => void;
}

export const TypeSelector = ({ selected, onSelect }: TypeSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        onClick={() => onSelect('complaint')}
        className={cn(
          'card-elevated p-6 text-left transition-all duration-300',
          'hover:border-complaint/30',
          selected === 'complaint' && 'border-complaint ring-2 ring-complaint/20 bg-complaint-light'
        )}
      >
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors',
          selected === 'complaint' ? 'bg-complaint text-complaint-foreground' : 'bg-complaint-light text-complaint'
        )}>
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Жалоба</h3>
        <p className="text-sm text-muted-foreground">Сообщить о проблеме или недовольстве</p>
      </button>

      <button
        onClick={() => onSelect('suggestion')}
        className={cn(
          'card-elevated p-6 text-left transition-all duration-300',
          'hover:border-suggestion/30',
          selected === 'suggestion' && 'border-suggestion ring-2 ring-suggestion/20 bg-suggestion-light'
        )}
      >
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors',
          selected === 'suggestion' ? 'bg-suggestion text-suggestion-foreground' : 'bg-suggestion-light text-suggestion'
        )}>
          <Lightbulb className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Предложение</h3>
        <p className="text-sm text-muted-foreground">Идея для улучшения работы компании</p>
      </button>
    </div>
  );
};
