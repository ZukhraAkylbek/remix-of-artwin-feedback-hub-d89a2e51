import { Feedback, Department, FeedbackStatus, FEEDBACK_TYPE_CONFIG, DEPARTMENT_LABELS } from '@/types/feedback';
import { 
  MessageSquare, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardProps {
  feedback: Feedback[];
  department: Department;
}

// Only Rukovodstvo sees all feedback from all departments
const GLOBAL_VIEW_DEPARTMENTS: Department[] = ['rukovodstvo'];

// Departments to show in breakdown (excluding rukovodstvo itself)
const BREAKDOWN_DEPARTMENTS: Department[] = [
  'ssl', 'zamgd_kom', 'marketing', 'service_aho', 'otitb_hse', 'omto',
  'hr', 'zamgd_tech', 'otd_razv', 'legal', 'finance', 'security'
];

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

  // Compute per-department breakdown for rukovodstvo
  const departmentBreakdown = GLOBAL_VIEW_DEPARTMENTS.includes(department)
    ? BREAKDOWN_DEPARTMENTS.map(dept => {
        const deptFeedback = feedback.filter(f => f.department === dept);
        return {
          department: dept,
          label: DEPARTMENT_LABELS[dept],
          total: deptFeedback.length,
          remarks: deptFeedback.filter(f => f.type === 'remark').length,
          suggestions: deptFeedback.filter(f => f.type === 'suggestion').length,
          gratitudes: deptFeedback.filter(f => f.type === 'gratitude').length,
          new: deptFeedback.filter(f => f.status === 'new').length,
          inProgress: deptFeedback.filter(f => f.status === 'in_progress').length,
          resolved: deptFeedback.filter(f => f.status === 'resolved').length,
        };
      }).filter(d => d.total > 0)
    : [];

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

      {/* Per-department breakdown for rukovodstvo */}
      {GLOBAL_VIEW_DEPARTMENTS.includes(department) && departmentBreakdown.length > 0 && (
        <div className="card-elevated p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Статистика по отделам</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium">Отдел</th>
                  <th className="text-center py-3 px-2 font-medium">Всего</th>
                  <th className="text-center py-3 px-2 font-medium text-red-500">Замечания</th>
                  <th className="text-center py-3 px-2 font-medium text-blue-500">Предложения</th>
                  <th className="text-center py-3 px-2 font-medium text-green-500">Благодарности</th>
                  <th className="text-center py-3 px-2 font-medium text-amber-500">Новые</th>
                  <th className="text-center py-3 px-2 font-medium text-blue-600">В работе</th>
                  <th className="text-center py-3 px-2 font-medium text-emerald-600">Решены</th>
                </tr>
              </thead>
              <tbody>
                {departmentBreakdown.map((dept) => (
                  <tr key={dept.department} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-2 font-medium">{dept.label}</td>
                    <td className="text-center py-3 px-2">{dept.total}</td>
                    <td className="text-center py-3 px-2 text-red-500">{dept.remarks}</td>
                    <td className="text-center py-3 px-2 text-blue-500">{dept.suggestions}</td>
                    <td className="text-center py-3 px-2 text-green-500">{dept.gratitudes}</td>
                    <td className="text-center py-3 px-2 text-amber-500">{dept.new}</td>
                    <td className="text-center py-3 px-2 text-blue-600">{dept.inProgress}</td>
                    <td className="text-center py-3 px-2 text-emerald-600">{dept.resolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
