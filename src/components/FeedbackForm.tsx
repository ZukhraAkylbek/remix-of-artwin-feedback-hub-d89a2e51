import { useState } from 'react';
import { FeedbackType, UserRole, Department, Feedback, RESIDENTIAL_OBJECTS, ResidentialObject, FEEDBACK_TYPE_CONFIG } from '@/types/feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addFeedbackToDb } from '@/lib/database';
import { sendToTelegram, syncToGoogleSheets, sendToBitrix } from '@/lib/integrations';
import { uploadAttachment } from '@/lib/fileUpload';
import { Paperclip, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

interface FeedbackFormProps {
  type: FeedbackType;
  userRole: UserRole;
  onSuccess: () => void;
}

const departmentOptions: { value: Department; labelKey: 'management' | 'reception' | 'sales' | 'hr' | 'marketing' | 'favorites_ssl' | 'construction_tech' | 'other' }[] = [
  { value: 'reception', labelKey: 'reception' },
  { value: 'construction_tech', labelKey: 'construction_tech' },
  { value: 'other', labelKey: 'other' },
  { value: 'hr', labelKey: 'hr' },
  { value: 'sales', labelKey: 'sales' },
  { value: 'marketing', labelKey: 'marketing' },
  { value: 'favorites_ssl', labelKey: 'favorites_ssl' },
];

export const FeedbackForm = ({ type, userRole, onSuccess }: FeedbackFormProps) => {
  const { t } = useI18n();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [department, setDepartment] = useState<Department>('reception');
  const [objectCode, setObjectCode] = useState<ResidentialObject | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast.error('Файл слишком большой (макс. 20MB)');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error(t('errorMessage'));
      return;
    }

    setIsSubmitting(true);

    let attachmentUrl: string | undefined;
    
    // Upload file if selected
    if (file) {
      const uploadResult = await uploadAttachment(file);
      if (uploadResult) {
        attachmentUrl = uploadResult;
      }
    }

    const feedback: Feedback = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      userRole,
      type,
      name: isAnonymous ? '' : name,
      isAnonymous,
      contact,
      message,
      department,
      objectCode: objectCode || undefined,
      status: 'new',
      attachmentUrl,
      attachmentName: file?.name,
      comments: [],
    };

    // Save to database
    const success = await addFeedbackToDb(feedback);
    
    if (success) {
      // Also sync to external services
      const [telegramResult, sheetsResult, bitrixResult] = await Promise.all([
        sendToTelegram(feedback),
        syncToGoogleSheets(feedback),
        sendToBitrix(feedback),
      ]);
      
      // Save bitrix task ID if created
      if (bitrixResult.success && bitrixResult.taskId) {
        const { updateBitrixTaskId } = await import('@/lib/database');
        await updateBitrixTaskId(feedback.id, bitrixResult.taskId);
      }
      
      toast.success(t('successSubmit'));
      onSuccess();
    } else {
      toast.error(t('errorSubmit'));
    }

    setIsSubmitting(false);
  };

  const typeConfig = FEEDBACK_TYPE_CONFIG[type];

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
            {t('anonymous')}
          </Label>
        </div>
      </div>

      {!isAnonymous && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
          <div className="space-y-2">
            <Label htmlFor="name">{t('yourName')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">{t('contactInfo')}</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t('emailOrPhone')}
              className="h-12"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="message">{t('message')}</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('describeMessage')}
          className="min-h-[150px] resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('object')}</Label>
          <Select value={objectCode} onValueChange={(value) => setObjectCode(value as ResidentialObject)}>
            <SelectTrigger className="h-12 bg-background">
              <SelectValue placeholder={t('selectObject')} />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              {RESIDENTIAL_OBJECTS.map((obj) => (
                <SelectItem key={obj.code} value={obj.code}>
                  {t(obj.nameKey as any)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('department')}</Label>
          <Select value={department} onValueChange={(value) => setDepartment(value as Department)}>
            <SelectTrigger className="h-12 bg-background">
              <SelectValue placeholder={t('selectDepartment')} />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              {departmentOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <label className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/50 transition-colors">
        <Paperclip className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm">
          {file?.name || t('attachFile')}
        </span>
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />
      </label>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        style={{ 
          backgroundColor: typeConfig.color,
          color: 'white'
        }}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('submitting')}
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            {t('submit')} {t(type).toLowerCase()}
          </>
        )}
      </Button>
    </form>
  );
};
