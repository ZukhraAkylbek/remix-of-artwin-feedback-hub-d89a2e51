import { useState, useEffect } from 'react';
import { AdminActionLog, fetchAdminLogs } from '@/lib/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  History, 
  RefreshCw,
  FileEdit,
  Trash2,
  UserPlus,
  Eye,
  Settings,
  MessageSquare
} from 'lucide-react';

const actionTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  create: { label: 'Создание', icon: <UserPlus className="w-4 h-4" />, color: 'bg-success/10 text-success' },
  update: { label: 'Изменение', icon: <FileEdit className="w-4 h-4" />, color: 'bg-blue-500/10 text-blue-500' },
  delete: { label: 'Удаление', icon: <Trash2 className="w-4 h-4" />, color: 'bg-destructive/10 text-destructive' },
  status_change: { label: 'Смена статуса', icon: <RefreshCw className="w-4 h-4" />, color: 'bg-warning/10 text-warning' },
  assign_employee: { label: 'Назначение', icon: <UserPlus className="w-4 h-4" />, color: 'bg-primary/10 text-primary' },
  view: { label: 'Просмотр', icon: <Eye className="w-4 h-4" />, color: 'bg-muted text-muted-foreground' },
  settings_update: { label: 'Настройки', icon: <Settings className="w-4 h-4" />, color: 'bg-purple-500/10 text-purple-500' },
};

const entityTypeLabels: Record<string, string> = {
  feedback: 'Обращение',
  employee: 'Сотрудник',
  settings: 'Настройки',
  sub_status: 'Статус решения',
};

export const HistoryPanel = () => {
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    setIsLoading(true);
    const data = await fetchAdminLogs(100);
    setLogs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionConfig = (actionType: string) => {
    return actionTypeConfig[actionType] || { 
      label: actionType, 
      icon: <MessageSquare className="w-4 h-4" />, 
      color: 'bg-muted text-muted-foreground' 
    };
  };

  const formatDetails = (log: AdminActionLog) => {
    if (log.description) return log.description;

    const parts: string[] = [];

    if (log.actionType === 'status_change' && log.newValue?.status) {
      const statusLabels: Record<string, string> = {
        new: 'Новая',
        in_progress: 'В работе',
        resolved: 'Решена'
      };
      parts.push(`→ ${statusLabels[log.newValue.status] || log.newValue.status}`);
    }

    if (log.actionType === 'assign_employee' && log.newValue?.employeeName) {
      parts.push(`→ ${log.newValue.employeeName}`);
    }

    if (log.newValue?.name && log.actionType !== 'assign_employee') {
      parts.push(log.newValue.name);
    }

    return parts.join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">История действий</h1>
          <p className="text-muted-foreground">Журнал всех действий администраторов</p>
        </div>
        <Button variant="outline" onClick={loadLogs} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="ml-2">Обновить</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="card-elevated p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">История пуста</p>
        </div>
      ) : (
        <div className="card-elevated divide-y divide-border">
          {logs.map((log, index) => {
            const config = getActionConfig(log.actionType);
            const details = formatDetails(log);

            return (
              <div 
                key={log.id} 
                className="p-4 hover:bg-muted/30 transition-colors animate-slide-up"
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                      <Badge variant="outline">
                        {entityTypeLabels[log.entityType] || log.entityType}
                      </Badge>
                    </div>
                    {details && (
                      <p className="text-sm text-foreground">{details}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(log.createdAt)}
                      {log.entityId && (
                        <span className="ml-2 font-mono text-[10px]">
                          ID: {log.entityId.slice(0, 8)}...
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
