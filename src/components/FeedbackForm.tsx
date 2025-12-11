import { useState } from 'react';
import { FeedbackType, UserRole, Urgency, Department, Feedback } from '@/types/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addFeedbackToDb } from '@/lib/database';
import { sendToTelegram, syncToGoogleSheets } from '@/lib/integrations';
import { Paperclip, Zap, Clock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FeedbackFormProps {
  type: FeedbackType;
  userRole: UserRole;
  onSuccess: () => void;
}

const departmentOptions: { value: Department; label: string }[] = [
  { value: 'management', label: 'Руководство' },
  { value: 'sales', label: 'Продажи' },
  { value: 'it', label: 'IT' },
  { value: 'logistics', label: 'Логистика' },
  { value: 'accounting', label: 'Бухгалтерия' },
  { value: 'warehouse', label: 'Склад' },
  { value: 'hr', label: 'HR' },
  { value: 'marketing', label: 'Маркетинг' },
  { value: 'design', label: 'Дизайн' },
];

export const FeedbackForm = ({ type, userRole, onSuccess }: FeedbackFormProps) => {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('normal');
  const [department, setDepartment] = useState<Department>('management');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Пожалуйста, введите сообщение');
      return;
    }

    setIsSubmitting(true);

    const feedback: Feedback = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      userRole,
      type,
      name: isAnonymous ? '' : name,
      isAnonymous,
      contact,
      message,
      urgency,
      department,
      status: 'new',
      attachmentName: fileName || undefined,
      comments: [],
    };

    // Save to database
    const success = await addFeedbackToDb(feedback);
    
    if (success) {
      // Also sync to external services
      await Promise.all([
        sendToTelegram(feedback),
        syncToGoogleSheets(feedback),
      ]);
      
      toast.success('Ваше обращение успешно отправлено!');
      onSuccess();
    } else {
      toast.error('Ошибка при отправке. Попробуйте снова.');
    }

    setIsSubmitting(false);
  };

  const isComplaint = type === 'complaint';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-3">
          <Switch
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
            id="anonymous"
          />
          <Label htmlFor="anonymous" className="cursor-pointer">
            Анонимное обращение
          </Label>
        </div>
      </div>

      {!isAnonymous && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
          <div className="space-y-2">
            <Label htmlFor="name">Ваше имя</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Иванов"
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Контакт для связи</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email или телефон"
              className="h-12"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="message">Сообщение</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isComplaint ? 'Опишите вашу проблему...' : 'Опишите вашу идею...'}
          className="min-h-[150px] resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label>Департамент</Label>
        <Select value={department} onValueChange={(value) => setDepartment(value as Department)}>
          <SelectTrigger className="h-12 bg-background">
            <SelectValue placeholder="Выберите департамент" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border z-50">
            {departmentOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background">
          <span className="text-sm text-muted-foreground">Срочность:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUrgency('normal')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                urgency === 'normal' 
                  ? 'bg-muted text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Clock className="w-4 h-4" />
              Обычно
            </button>
            <button
              type="button"
              onClick={() => setUrgency('urgent')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                urgency === 'urgent' 
                  ? 'bg-warning text-warning-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Zap className="w-4 h-4" />
              Срочно
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/50 transition-colors">
          <Paperclip className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">
            {fileName || 'Прикрепить файл'}
          </span>
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      <Button
        type="submit"
        variant={isComplaint ? 'complaint' : 'suggestion'}
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Отправка...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Отправить {isComplaint ? 'жалобу' : 'предложение'}
          </>
        )}
      </Button>
    </form>
  );
};
