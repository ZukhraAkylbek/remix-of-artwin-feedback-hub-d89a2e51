import { useState } from 'react';
import { Feedback, Department, FEEDBACK_TYPE_CONFIG, DEPARTMENT_LABELS } from '@/types/feedback';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, FileText, Loader2 } from 'lucide-react';
import { getSettings } from '@/lib/storage';
import { toast } from 'sonner';

interface ReportsPanelProps {
  feedback: Feedback[];
  department: Department;
}

// SSL sees all feedback from all departments
const GLOBAL_VIEW_DEPARTMENTS: Department[] = ['ssl'];

export const ReportsPanel = ({ feedback, department }: ReportsPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string>('');

  // SSL sees all feedback, other departments see only their own
  const departmentFeedback = GLOBAL_VIEW_DEPARTMENTS.includes(department)
    ? feedback 
    : feedback.filter(f => f.department === department);

  const typeStats = Object.keys(FEEDBACK_TYPE_CONFIG).map(type => ({
    type,
    count: departmentFeedback.filter(f => f.type === type).length,
    config: FEEDBACK_TYPE_CONFIG[type as keyof typeof FEEDBACK_TYPE_CONFIG]
  }));

  const generateReport = async () => {
    setIsGenerating(true);

    const typeBreakdown = typeStats.map(t => `- ${t.config.label}: ${t.count}`).join('\n');

    const mockReport = `
📊 Стратегический отчёт по обращениям

Период: ${new Date().toLocaleDateString('ru')}
Отдел: ${DEPARTMENT_LABELS[department]}

📈 Статистика:
- Всего обращений: ${departmentFeedback.length}
${typeBreakdown}
- Новых: ${departmentFeedback.filter(f => f.status === 'new').length}
- В работе: ${departmentFeedback.filter(f => f.status === 'in_progress').length}
- Решённых: ${departmentFeedback.filter(f => f.status === 'resolved').length}

🔍 Ключевые выводы:
1. Необходимо обратить внимание на новые обращения
2. Рекомендуется улучшить коммуникацию с заявителями
3. Следует оптимизировать время обработки заявок

✅ Рекомендации:
- Внедрить систему приоритизации обращений
- Назначить ответственных за каждую категорию
- Проводить еженедельный разбор открытых заявок
    `;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setReport(mockReport);
    setIsGenerating(false);
  };

  const sendToTelegram = async () => {
    const settings = await getSettings();
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      toast.error('Настройте Telegram в разделе Настройки');
      return;
    }

    try {
      await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: report,
          parse_mode: 'HTML'
        })
      });
      toast.success('Отчёт отправлен в Telegram');
    } catch (error) {
      toast.error('Ошибка отправки');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Отчёты</h1>
        <p className="text-muted-foreground">Генерация стратегических отчётов</p>
      </div>

      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Стратегический отчёт</h3>
              <p className="text-sm text-muted-foreground">На основе {departmentFeedback.length} обращений</p>
            </div>
          </div>
          <Button onClick={generateReport} disabled={isGenerating || departmentFeedback.length === 0} className="gap-2">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? 'Генерация...' : 'Сгенерировать'}
          </Button>
        </div>

        {report && (
          <div className="space-y-4 animate-slide-up">
            <div className="p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">{report}</div>
            <Button variant="outline" onClick={sendToTelegram} className="gap-2">
              <Send className="w-4 h-4" />
              Отправить в Telegram
            </Button>
          </div>
        )}

        {!report && !isGenerating && (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Нажмите кнопку для генерации отчёта</p>
          </div>
        )}
      </div>
    </div>
  );
};
