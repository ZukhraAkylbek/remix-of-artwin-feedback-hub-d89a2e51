import { useState } from 'react';
import { Feedback, Department, DEPARTMENT_LABELS, FEEDBACK_TYPE_CONFIG } from '@/types/feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CalendarCheck, 
  Clock, 
  Building2, 
  AlertTriangle,
  CheckCircle,
  User,
  Calendar as CalendarIcon,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MeetingsPanelProps {
  feedback: Feedback[];
  onSelectTicket: (id: string) => void;
}

export const MeetingsPanel = ({ feedback, onSelectTicket }: MeetingsPanelProps) => {
  // Filter tickets with urgency level 3 or 4 (urgencyScore >= 7)
  const meetingTickets = feedback.filter(f => {
    const urgencyScore = f.aiAnalysis?.urgencyScore || 5;
    return urgencyScore >= 7;
  });

  const urgentTickets = meetingTickets.filter(f => (f.aiAnalysis?.urgencyScore || 0) >= 9);
  const highPriorityTickets = meetingTickets.filter(f => {
    const score = f.aiAnalysis?.urgencyScore || 0;
    return score >= 7 && score < 9;
  });

  const getGoogleCalendarUrl = (ticket: Feedback) => {
    const title = encodeURIComponent(`Собрание: ${FEEDBACK_TYPE_CONFIG[ticket.type]?.label || ticket.type} - ${DEPARTMENT_LABELS[ticket.department as Department] || ticket.department}`);
    const details = encodeURIComponent(`Обращение: ${ticket.message}\n\nОтдел: ${DEPARTMENT_LABELS[ticket.department as Department] || ticket.department}\nСтатус решения: ${ticket.subStatus || 'Не указан'}`);
    const deadline = ticket.deadline ? new Date(ticket.deadline) : new Date();
    const dateStr = format(deadline, "yyyyMMdd'T'HHmmss");
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dateStr}/${dateStr}`;
  };

  const TicketCard = ({ ticket }: { ticket: Feedback }) => {
    const typeConfig = FEEDBACK_TYPE_CONFIG[ticket.type] || { color: '#888', bgColor: '#f0f0f0', label: ticket.type };
    const urgencyScore = ticket.aiAnalysis?.urgencyScore || 5;
    
    return (
      <div 
        className="card-elevated p-4 cursor-pointer hover:shadow-floating transition-all"
        onClick={() => onSelectTicket(ticket.id)}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge style={{ backgroundColor: typeConfig.color, color: 'white' }}>
              {typeConfig.label}
            </Badge>
            <Badge variant="outline" className="bg-muted">
              <Building2 className="w-3 h-3 mr-1" />
              {DEPARTMENT_LABELS[ticket.department as Department] || ticket.department}
            </Badge>
            {urgencyScore >= 9 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                Уровень 4
              </Badge>
            )}
            {urgencyScore >= 7 && urgencyScore < 9 && (
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 gap-1">
                <AlertTriangle className="w-3 h-3" />
                Уровень 3
              </Badge>
            )}
          </div>
        </div>

        <p className="text-sm line-clamp-2 mb-3">{ticket.message}</p>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {ticket.deadline && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Дедлайн: {format(new Date(ticket.deadline), 'dd MMM yyyy', { locale: ru })}
            </span>
          )}
          {ticket.subStatus && (
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Итог: {ticket.subStatus}
            </span>
          )}
          {!ticket.isAnonymous && ticket.name && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {ticket.name}
            </span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-border flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              window.open(getGoogleCalendarUrl(ticket), '_blank');
            }}
          >
            <CalendarIcon className="w-4 h-4" />
            Добавить в календарь
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2 flex items-center gap-3">
          <CalendarCheck className="w-7 h-7 text-primary" />
          Собрания
        </h1>
        <p className="text-muted-foreground">
          Обращения с уровнем срочности 3-4 для обсуждения на собрании
        </p>
      </div>

      {meetingTickets.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <CalendarCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Нет обращений для собрания</h3>
          <p className="text-muted-foreground">
            Обращения с высоким уровнем срочности появятся здесь автоматически
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {urgentTickets.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Уровень 4 — Критические ({urgentTickets.length})
              </h2>
              <div className="grid gap-4">
                {urgentTickets.map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </div>
          )}

          {highPriorityTickets.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-5 h-5" />
                Уровень 3 — Высокий приоритет ({highPriorityTickets.length})
              </h2>
              <div className="grid gap-4">
                {highPriorityTickets.map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card-elevated p-6">
        <h3 className="font-semibold mb-4">Статистика собраний</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold">{meetingTickets.length}</p>
            <p className="text-sm text-muted-foreground">Всего обращений</p>
          </div>
          <div className="p-4 rounded-lg bg-destructive/10 text-center">
            <p className="text-2xl font-bold text-destructive">{urgentTickets.length}</p>
            <p className="text-sm text-muted-foreground">Уровень 4</p>
          </div>
          <div className="p-4 rounded-lg bg-orange-500/10 text-center">
            <p className="text-2xl font-bold text-orange-600">{highPriorityTickets.length}</p>
            <p className="text-sm text-muted-foreground">Уровень 3</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/10 text-center">
            <p className="text-2xl font-bold text-primary">
              {meetingTickets.filter(t => t.deadline).length}
            </p>
            <p className="text-sm text-muted-foreground">С дедлайном</p>
          </div>
        </div>
      </div>
    </div>
  );
};
