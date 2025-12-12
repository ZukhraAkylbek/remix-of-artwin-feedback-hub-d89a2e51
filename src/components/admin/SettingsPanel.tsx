import { useState, useEffect } from 'react';
import { clearAllFeedback, getFeedbackCount, getAppSetting, setAppSetting } from '@/lib/database';
import { exportToCSV } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Database,
  Cloud,
  HardDrive,
  Trash2,
  Loader2,
  CalendarClock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DepartmentSettingsPanel } from './DepartmentSettingsPanel';

export const SettingsPanel = () => {
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deadlineEnabled, setDeadlineEnabled] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const count = await getFeedbackCount();
      setFeedbackCount(count);
      
      const deadlineSetting = await getAppSetting('deadline_enabled');
      setDeadlineEnabled(deadlineSetting === true);
      
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleDeadlineToggle = async (enabled: boolean) => {
    setDeadlineEnabled(enabled);
    const success = await setAppSetting('deadline_enabled', enabled);
    if (success) {
      toast.success(enabled ? 'Дедлайны включены' : 'Дедлайны отключены');
    } else {
      setDeadlineEnabled(!enabled);
      toast.error('Ошибка сохранения настройки');
    }
  };

  const handleExportCSV = async () => {
    const csv = await exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `artwin_feedback_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Бэкап успешно скачан');
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    const success = await clearAllFeedback();
    if (success) {
      setFeedbackCount(0);
      toast.success('Все обращения удалены');
    } else {
      toast.error('Ошибка при очистке данных');
    }
    setIsClearing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Настройки</h1>
        <p className="text-muted-foreground">Управление интеграциями и данными</p>
      </div>

      <div className="card-elevated p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Хранилище данных</h3>
            <p className="text-sm text-muted-foreground">
              {feedbackCount} обращений в базе данных
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 mb-4">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center bg-primary/20'
          )}>
            <Cloud className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">Облачное хранилище</p>
            <p className="text-sm text-muted-foreground">
              Данные хранятся в облачной базе данных
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Скачать бэкап (CSV)
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2" disabled={feedbackCount === 0}>
                <Trash2 className="w-4 h-4" />
                Очистить все данные
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить все обращения?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Все {feedbackCount} обращений будут удалены из базы данных.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} disabled={isClearing}>
                  {isClearing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Удалить всё
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="card-elevated p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Дедлайны</h3>
            <p className="text-sm text-muted-foreground">
              Установка сроков выполнения для заявок
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <CalendarClock className="w-5 h-5 text-muted-foreground" />
            <div>
              <Label htmlFor="deadline-toggle" className="font-medium cursor-pointer">
                Включить дедлайны
              </Label>
              <p className="text-sm text-muted-foreground">
                Позволяет устанавливать сроки выполнения для каждой заявки
              </p>
            </div>
          </div>
          <Switch
            id="deadline-toggle"
            checked={deadlineEnabled}
            onCheckedChange={handleDeadlineToggle}
          />
        </div>
      </div>

      <DepartmentSettingsPanel />
    </div>
  );
};
