import { useState } from 'react';
import { Feedback, Department, FeedbackStatus, FEEDBACK_TYPE_CONFIG } from '@/types/feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, CheckCircle, ChevronRight, User, UserX, RefreshCw, AlertTriangle, Lightbulb, Shield, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { syncStatusesFromGoogleSheets, syncStatusesFromBitrix, getSubStatusName } from '@/lib/integrations';
import { toast } from 'sonner';

interface TicketListProps {
  feedback: Feedback[];
  department: Department;
  onSelectTicket: (id: string) => void;
  onRefresh: () => void;
}

const statusConfig: Record<FeedbackStatus, { label: string; icon: React.ReactNode; color: string }> = {
  new: { label: 'Новая', icon: <Clock className="w-4 h-4" />, color: 'bg-warning/10 text-warning border-warning/20' },
  in_progress: { label: 'В работе', icon: <Loader2 className="w-4 h-4" />, color: 'bg-blue-600/10 text-blue-600 border-blue-600/20' },
  resolved: { label: 'Решена', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-success/10 text-success border-success/20' },
};

const typeIcons: Record<string, React.ReactNode> = {
  remark: <AlertTriangle className="w-5 h-5" />,
  suggestion: <Lightbulb className="w-5 h-5" />,
  safety: <Shield className="w-5 h-5" />,
  gratitude: <Heart className="w-5 h-5" />,
};

export const TicketList = ({ feedback, department, onSelectTicket, onRefresh }: TicketListProps) => {
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isSyncingBitrix, setIsSyncingBitrix] = useState(false);
  
  const departmentFeedback = feedback.filter(f => f.department === department);
  const filteredFeedback = statusFilter === 'all' ? departmentFeedback : departmentFeedback.filter(f => f.status === statusFilter);

  const handleSyncFromSheets = async () => {
    setIsSyncingSheets(true);
    const result = await syncStatusesFromGoogleSheets(department);
    if (result.success && result.updatedCount > 0) {
      toast.success(`Синхронизировано ${result.updatedCount} статусов`);
      onRefresh();
    } else {
      toast.info('Все статусы актуальны');
    }
    setIsSyncingSheets(false);
  };

  const handleSyncFromBitrix = async () => {
    setIsSyncingBitrix(true);
    const result = await syncStatusesFromBitrix(department);
    if (result.success && result.updatedCount > 0) {
      toast.success(`Синхронизировано ${result.updatedCount} статусов`);
      onRefresh();
    } else {
      toast.info('Все статусы актуальны');
    }
    setIsSyncingBitrix(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Обращения</h1>
          <p className="text-muted-foreground">Всего {filteredFeedback.length} обращений</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleSyncFromSheets} disabled={isSyncingSheets}>
            {isSyncingSheets ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Синхр. из таблицы
          </Button>
          <Button variant="outline" size="sm" onClick={handleSyncFromBitrix} disabled={isSyncingBitrix}>
            {isSyncingBitrix ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Синхр. из Bitrix
          </Button>
          {(['all', 'new', 'in_progress', 'resolved'] as const).map((status) => (
            <Button key={status} variant={statusFilter === status ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(status)}>
              {status === 'all' ? 'Все' : statusConfig[status].label}
            </Button>
          ))}
        </div>
      </div>

      {filteredFeedback.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <p className="text-muted-foreground">Нет обращений</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFeedback.map((ticket, i) => {
            const typeConfig = FEEDBACK_TYPE_CONFIG[ticket.type] || { color: '#888', bgColor: '#f0f0f0', label: ticket.type };
            return (
              <button
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className={cn('w-full card-elevated p-4 text-left transition-all duration-300 hover:border-primary/30')}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: typeConfig.bgColor, color: typeConfig.color }}>
                    {typeIcons[ticket.type] || <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate mb-1">{ticket.message.slice(0, 60)}...</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {ticket.isAnonymous ? <><UserX className="w-3.5 h-3.5" /> Анонимно</> : <><User className="w-3.5 h-3.5" /> {ticket.name}</>}
                      </span>
                      <span>•</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString('ru')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={statusConfig[ticket.status].color}>
                      {statusConfig[ticket.status].icon}
                      <span className="ml-1">{statusConfig[ticket.status].label}</span>
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
