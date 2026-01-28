import { useState, useEffect } from 'react';
import { Feedback, Department, FeedbackStatus, FEEDBACK_TYPE_CONFIG, DEPARTMENT_LABELS, URGENCY_LEVEL_CONFIG, UrgencyLevel } from '@/types/feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, CheckCircle, ChevronRight, User, UserX, AlertTriangle, Lightbulb, Heart, ArrowRightLeft, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { fetchEmployees, Employee } from '@/lib/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RedirectedPanelProps {
  feedback: Feedback[];
  department: Department;
  onSelectTicket: (id: string) => void;
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

export const RedirectedPanel = ({ feedback, department, onSelectTicket }: RedirectedPanelProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  useEffect(() => {
    const loadEmployees = async () => {
      const emps = await fetchEmployees();
      setEmployees(emps);
    };
    loadEmployees();
  }, []);

  // Only show feedback that was redirected TO this department (has redirected_from set)
  const redirectedFeedback = feedback.filter(f => 
    f.department === department && f.redirectedFrom !== null
  );

  const getEmployeeName = (id?: string) => {
    if (!id) return 'Не назначен';
    return employees.find(e => e.id === id)?.name || 'Не назначен';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2 flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6" />
          Переадресованные
        </h1>
        <p className="text-muted-foreground">
          Обращения, перенаправленные в ваш отдел ({redirectedFeedback.length})
        </p>
      </div>

      {redirectedFeedback.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Нет переадресованных обращений</p>
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Тип</TableHead>
                <TableHead>Сообщение</TableHead>
                <TableHead>Уровень</TableHead>
                <TableHead>Из отдела</TableHead>
                <TableHead>Ответственный</TableHead>
                <TableHead>Дедлайн</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {redirectedFeedback.map((ticket) => {
                const typeConfig = FEEDBACK_TYPE_CONFIG[ticket.type] || { color: '#888', bgColor: '#f0f0f0', label: ticket.type };
                const urgencyConfig = ticket.urgencyLevel ? URGENCY_LEVEL_CONFIG[ticket.urgencyLevel as UrgencyLevel] : URGENCY_LEVEL_CONFIG[1];
                const fromDept = ticket.redirectedFrom ? DEPARTMENT_LABELS[ticket.redirectedFrom as Department] : '—';
                
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
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {ticket.isAnonymous ? <UserX className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {ticket.isAnonymous ? 'Анонимно' : ticket.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <ArrowRightLeft className="w-3 h-3" />
                        {fromDept}
                      </Badge>
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