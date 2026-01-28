import { useState, useEffect } from 'react';
import { Feedback, Department, FeedbackStatus, FEEDBACK_TYPE_CONFIG, URGENCY_LEVEL_CONFIG, UrgencyLevel, DEPARTMENT_LABELS } from '@/types/feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, CheckCircle, ChevronRight, User, UserX, RefreshCw, AlertTriangle, Lightbulb, Heart, ArrowRightLeft, CalendarClock, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { syncStatusesFromGoogleSheets, syncStatusesFromBitrix } from '@/lib/integrations';
import { fetchEmployees, Employee } from '@/lib/database';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  remark: <AlertTriangle className="w-4 h-4" />,
  suggestion: <Lightbulb className="w-4 h-4" />,
  gratitude: <Heart className="w-4 h-4" />,
};

// Only rukovodstvo sees all feedback from all departments
const GLOBAL_VIEW_DEPARTMENTS: Department[] = ['rukovodstvo'];

export const TicketList = ({ feedback, department, onSelectTicket, onRefresh }: TicketListProps) => {
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<UrgencyLevel | 'all'>('all');
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isSyncingBitrix, setIsSyncingBitrix] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  useEffect(() => {
    const loadEmployees = async () => {
      const emps = await fetchEmployees();
      setEmployees(emps);
    };
    loadEmployees();
  }, []);
  
  // SSL sees all feedback, other departments see only their own
  const departmentFeedback = GLOBAL_VIEW_DEPARTMENTS.includes(department)
    ? feedback 
    : feedback.filter(f => f.department === department);
  
  let filteredFeedback = statusFilter === 'all' ? departmentFeedback : departmentFeedback.filter(f => f.status === statusFilter);
  filteredFeedback = levelFilter === 'all' ? filteredFeedback : filteredFeedback.filter(f => (f.urgencyLevel || 1) === levelFilter);

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

  const getEmployeeName = (id?: string) => {
    if (!id) return '—';
    return employees.find(e => e.id === id)?.name || '—';
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
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-muted-foreground mr-2">Статус:</span>
        {(['all', 'new', 'in_progress', 'resolved'] as const).map((status) => (
          <Button key={status} variant={statusFilter === status ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(status)}>
            {status === 'all' ? 'Все' : statusConfig[status].label}
          </Button>
        ))}
        
        <span className="text-sm text-muted-foreground ml-4 mr-2">Уровень:</span>
        {(['all', 1, 2, 3, 4] as const).map((level) => (
          <Button 
            key={level} 
            variant={levelFilter === level ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setLevelFilter(level)}
            style={level !== 'all' && levelFilter === level ? { backgroundColor: URGENCY_LEVEL_CONFIG[level as UrgencyLevel].color } : {}}
          >
            {level === 'all' ? 'Все' : level}
          </Button>
        ))}
      </div>

      {filteredFeedback.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <p className="text-muted-foreground">Нет обращений</p>
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Тип</TableHead>
                <TableHead>Сообщение</TableHead>
                <TableHead>Уровень</TableHead>
                <TableHead>Ответственный</TableHead>
                <TableHead>Дедлайн</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Подстатус</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedback.map((ticket) => {
                const typeConfig = FEEDBACK_TYPE_CONFIG[ticket.type] || { color: '#888', bgColor: '#f0f0f0', label: ticket.type };
                const urgencyConfig = ticket.urgencyLevel ? URGENCY_LEVEL_CONFIG[ticket.urgencyLevel as UrgencyLevel] : URGENCY_LEVEL_CONFIG[1];
                const isRedirected = ticket.redirectedFrom !== null && ticket.redirectedFrom !== undefined;
                
                return (
                  <TableRow 
                    key={ticket.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectTicket(ticket.id)}
                  >
                    <TableCell>
                      <div 
                        className="w-8 h-8 rounded flex items-center justify-center" 
                        style={{ backgroundColor: typeConfig.bgColor, color: typeConfig.color }}
                      >
                        {typeIcons[ticket.type] || <AlertTriangle className="w-4 h-4" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate font-medium">{ticket.message.slice(0, 50)}...</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {ticket.isAnonymous ? <UserX className="w-3 h-3" /> : <User className="w-3 h-3" />}
                            {ticket.isAnonymous ? 'Анонимно' : ticket.name}
                          </span>
                          {isRedirected && (
                            <Badge variant="secondary" className="text-xs gap-1 h-5">
                              <ArrowRightLeft className="w-3 h-3" />
                              из {DEPARTMENT_LABELS[ticket.redirectedFrom as Department]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant="outline" 
                          style={{ 
                            backgroundColor: urgencyConfig.bgColor, 
                            color: urgencyConfig.color,
                            borderColor: urgencyConfig.color 
                          }}
                        >
                          {urgencyConfig.label}
                        </Badge>
                        {ticket.isBlocker && (
                          <Flag className="w-4 h-4 text-destructive fill-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{getEmployeeName(ticket.assignedTo)}</span>
                    </TableCell>
                    <TableCell>
                      {ticket.deadline ? (
                        <span className={cn(
                          "text-sm flex items-center gap-1",
                          new Date() > new Date(ticket.deadline) && "text-destructive"
                        )}>
                          <CalendarClock className="w-3.5 h-3.5" />
                          {format(new Date(ticket.deadline), 'dd.MM.yyyy', { locale: ru })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusConfig[ticket.status].color}>
                        {statusConfig[ticket.status].icon}
                        <span className="ml-1">{statusConfig[ticket.status].label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.subStatus ? (
                        <Badge variant="secondary" className="text-xs">
                          {ticket.subStatus}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
