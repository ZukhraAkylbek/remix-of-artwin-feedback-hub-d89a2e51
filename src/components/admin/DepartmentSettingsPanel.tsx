import { useState, useEffect } from 'react';
import { Department, DepartmentSettings } from '@/types/feedback';
import { getAllDepartmentSettings, saveDepartmentSettings, getDepartmentName } from '@/lib/departmentSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  FileSpreadsheet, 
  MessageCircle,
  Loader2,
  CheckCircle2,
  Webhook
} from 'lucide-react';
import { toast } from 'sonner';

export const DepartmentSettingsPanel = () => {
  const [settings, setSettings] = useState<DepartmentSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingDept, setSavingDept] = useState<string | null>(null);
  const [activeDept, setActiveDept] = useState<Department>('management');

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getAllDepartmentSettings();
      setSettings(data);
      setIsLoading(false);
    };
    loadSettings();
  }, []);

  const handleSave = async (dept: Department) => {
    const deptSettings = settings.find(s => s.department === dept);
    if (!deptSettings) return;

    setSavingDept(dept);
    const success = await saveDepartmentSettings(deptSettings);
    if (success) {
      toast.success(`Настройки ${getDepartmentName(dept)} сохранены`);
    } else {
      toast.error('Ошибка сохранения');
    }
    setSavingDept(null);
  };

  const updateSettings = (dept: Department, updates: Partial<DepartmentSettings>) => {
    setSettings(prev => prev.map(s => 
      s.department === dept ? { ...s, ...updates } : s
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const departments: Department[] = ['management', 'sales', 'hr', 'marketing', 'favorites_ssl', 'construction_tech', 'other'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Настройки по департаментам</h2>
        <p className="text-muted-foreground text-sm">
          У каждого департамента свои уникальные Google Sheets и Telegram настройки
        </p>
      </div>

      <Tabs value={activeDept} onValueChange={(v) => setActiveDept(v as Department)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {departments.map(dept => {
            const deptSettings = settings.find(s => s.department === dept);
            const hasConfig = deptSettings?.googleSheetsId || deptSettings?.telegramBotToken || deptSettings?.bitrixWebhookUrl;
            return (
              <TabsTrigger 
                key={dept} 
                value={dept}
                className="relative data-[state=active]:bg-background"
              >
                {getDepartmentName(dept)}
                {hasConfig && (
                  <CheckCircle2 className="w-3 h-3 text-success ml-1" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {departments.map(dept => {
          const deptSettings = settings.find(s => s.department === dept);
          if (!deptSettings) return null;

          return (
            <TabsContent key={dept} value={dept} className="mt-6 space-y-6">
              {/* Google Sheets */}
              <div className="card-elevated p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Google Sheets — {getDepartmentName(dept)}</h3>
                    <p className="text-sm text-muted-foreground">Синхронизация данных</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>ID таблицы или ссылка</Label>
                    <Input
                      value={deptSettings.googleSheetsId || ''}
                      onChange={(e) => updateSettings(dept, { googleSheetsId: e.target.value })}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Service Account Email</Label>
                    <Input
                      value={deptSettings.googleServiceAccountEmail || ''}
                      onChange={(e) => updateSettings(dept, { googleServiceAccountEmail: e.target.value })}
                      placeholder="service@project.iam.gserviceaccount.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Private Key</Label>
                    <Input
                      type="password"
                      value={deptSettings.googlePrivateKey || ''}
                      onChange={(e) => updateSettings(dept, { googlePrivateKey: e.target.value })}
                      placeholder="-----BEGIN PRIVATE KEY-----..."
                    />
                  </div>
                </div>
              </div>

              {/* Telegram */}
              <div className="card-elevated p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Telegram Bot — {getDepartmentName(dept)}</h3>
                    <p className="text-sm text-muted-foreground">Уведомления о новых обращениях</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bot Token</Label>
                    <Input
                      type="password"
                      value={deptSettings.telegramBotToken || ''}
                      onChange={(e) => updateSettings(dept, { telegramBotToken: e.target.value })}
                      placeholder="123456:ABC-DEF1234..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chat ID</Label>
                    <Input
                      value={deptSettings.telegramChatId || ''}
                      onChange={(e) => updateSettings(dept, { telegramChatId: e.target.value })}
                      placeholder="-1001234567890"
                    />
                  </div>
                </div>
              </div>

              {/* Bitrix24 */}
              <div className="card-elevated p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Webhook className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Bitrix24 — {getDepartmentName(dept)}</h3>
                    <p className="text-sm text-muted-foreground">Вебхук для создания лидов/задач</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      value={deptSettings.bitrixWebhookUrl || ''}
                      onChange={(e) => updateSettings(dept, { bitrixWebhookUrl: e.target.value })}
                      placeholder="https://your-domain.bitrix24.ru/rest/1/abc123..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Входящий вебхук из Битрикс24 (Приложения → Вебхуки → Добавить вебхук)
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => handleSave(dept)} 
                size="lg" 
                className="gap-2"
                disabled={savingDept === dept}
              >
                {savingDept === dept ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Сохранить настройки {getDepartmentName(dept)}
              </Button>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};
