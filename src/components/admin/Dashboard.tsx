import { Feedback, Department, FeedbackStatus, FEEDBACK_TYPE_CONFIG } from '@/types/feedback';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardProps {
  feedback: Feedback[];
  department: Department;
}

// SSL and Rukovodstvo see all feedback from all departments
const GLOBAL_VIEW_DEPARTMENTS: Department[] = ['ssl', 'rukovodstvo'];

export const Dashboard = ({ feedback, department }: DashboardProps) => {
  // SSL sees all feedback, other departments see only their own
  const departmentFeedback = GLOBAL_VIEW_DEPARTMENTS.includes(department)
    ? feedback 
    : feedback.filter(f => f.department === department);
  
  const stats = {
    total: departmentFeedback.length,
    new: departmentFeedback.filter(f => f.status === 'new').length,
    inProgress: departmentFeedback.filter(f => f.status === 'in_progress').length,
    resolved: departmentFeedback.filter(f => f.status === 'resolved').length,
  };

  const typeStats = Object.keys(FEEDBACK_TYPE_CONFIG).map(type => ({
    type,
    count: departmentFeedback.filter(f => f.type === type).length,
    config: FEEDBACK_TYPE_CONFIG[type as keyof typeof FEEDBACK_TYPE_CONFIG]
  }));

  const statCards = [
    { label: 'Всего обращений', value: stats.total, icon: <MessageSquare className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Новые', value: stats.new, icon: <Clock className="w-5 h-5" />, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'В работе', value: stats.inProgress, icon: <TrendingUp className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    { label: 'Решены', value: stats.resolved, icon: <CheckCircle className="w-5 h-5" />, color: 'text-success', bg: 'bg-success/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Дашборд</h1>
        <p className="text-muted-foreground">Обзор обращений вашего отдела</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={card.label} className="card-elevated p-6 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between mb-4">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', card.bg)}>
                <span className={card.color}>{card.icon}</span>
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-elevated p-6">
          <h3 className="font-semibold mb-4">По типу обращения</h3>
          <div className="space-y-4">
            {typeStats.map(({ type, count, config }) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config?.color || '#888' }} />
                  <span>{config?.label || type}</span>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-semibold mb-4">Последние обращения</h3>
          {departmentFeedback.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Нет обращений</p>
          ) : (
            <div className="space-y-3">
              {departmentFeedback.slice(0, 5).map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: FEEDBACK_TYPE_CONFIG[f.type]?.color || '#888' }} />
                  <p className="text-sm flex-1 truncate">{f.message}</p>
                  <span className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleDateString('ru')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
