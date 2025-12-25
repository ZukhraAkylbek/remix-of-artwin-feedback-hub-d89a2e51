import { useState, useEffect } from 'react';
import { Feedback, FeedbackStatus, Comment, Department, FEEDBACK_TYPE_CONFIG, FeedbackType, RESIDENTIAL_OBJECTS } from '@/types/feedback';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Sparkles, 
  Send,
  Clock,
  Loader2,
  CheckCircle,
  User,
  UserX,
  Mail,
  Paperclip,
  MessageSquare,
  Trash2,
  Plus,
  AlertTriangle,
  Lightbulb,
  Shield,
  Heart,
  ExternalLink,
  Building,
  CalendarClock,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeWithAI, generateAutoResponse } from '@/lib/ai';
import { updateFeedbackStatus, deleteFeedbackById, fetchSubStatuses, addSubStatus, SubStatusItem, fetchEmployees, updateAssignedEmployee, logAdminAction, Employee, updateFeedbackDeadline, getAppSetting } from '@/lib/database';
import { updateStatusInGoogleSheets } from '@/lib/integrations';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TicketDetailProps {
  ticket: Feedback;
  onBack: () => void;
  onUpdate: () => void;
}

const statusOptions: { id: FeedbackStatus; label: string; icon: React.ReactNode }[] = [
  { id: 'new', label: 'Новая', icon: <Clock className="w-4 h-4" /> },
  { id: 'in_progress', label: 'В работе', icon: <Loader2 className="w-4 h-4" /> },
  { id: 'resolved', label: 'Решена', icon: <CheckCircle className="w-4 h-4" /> },
];

const typeIcons: Record<FeedbackType, React.ReactNode> = {
  remark: <AlertTriangle className="w-6 h-6" />,
  suggestion: <Lightbulb className="w-6 h-6" />,
  gratitude: <Heart className="w-6 h-6" />,
};

export const TicketDetail = ({ ticket, onBack, onUpdate }: TicketDetailProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [autoResponse, setAutoResponse] = useState('');
  const [newComment, setNewComment] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(ticket.aiAnalysis);
  const [currentStatus, setCurrentStatus] = useState(ticket.status);
  const [currentSubStatus, setCurrentSubStatus] = useState<string | null>(ticket.subStatus || null);
  const [subStatuses, setSubStatuses] = useState<SubStatusItem[]>([]);
  const [newSubStatusName, setNewSubStatusName] = useState('');
  const [isAddingSubStatus, setIsAddingSubStatus] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignedEmployee, setAssignedEmployee] = useState<string | undefined>(ticket.assignedTo);
  const [deadline, setDeadline] = useState<Date | undefined>(ticket.deadline ? new Date(ticket.deadline) : undefined);
  const [deadlineEnabled, setDeadlineEnabled] = useState(false);
  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false);

  const typeConfig = FEEDBACK_TYPE_CONFIG[ticket.type] || { color: '#888', bgColor: '#f0f0f0', label: ticket.type };
  const objectInfo = ticket.objectCode ? RESIDENTIAL_OBJECTS.find(o => o.code === ticket.objectCode) : null;

  useEffect(() => {
    loadSubStatuses();
    loadEmployees();
    loadDeadlineSetting();
  }, [ticket.department]);

  const loadDeadlineSetting = async () => {
    const enabled = await getAppSetting('deadline_enabled');
    setDeadlineEnabled(enabled === true);
  };

  const loadSubStatuses = async () => {
    const statuses = await fetchSubStatuses(ticket.department);
    setSubStatuses(statuses);
  };

  const loadEmployees = async () => {
    const emps = await fetchEmployees(ticket.department);
    setEmployees(emps);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const analysis = await analyzeWithAI(ticket.message);
    if (analysis) {
      setAiAnalysis(analysis);
      toast.success('Анализ завершён');
    }
    setIsAnalyzing(false);
  };

  const handleGenerateResponse = async () => {
    setIsGenerating(true);
    const response = await generateAutoResponse(ticket.message, ticket.type);
    if (response) {
      setAutoResponse(response);
    }
    setIsGenerating(false);
  };

  const handleStatusChange = async (status: FeedbackStatus) => {
    const newSubStatus = status === 'in_progress' ? currentSubStatus : null;
    const success = await updateFeedbackStatus(ticket.id, status, newSubStatus);
    if (success) {
      await logAdminAction('status_change', 'feedback', ticket.id, { status: currentStatus }, { status });
      setCurrentStatus(status);
      if (status !== 'in_progress') setCurrentSubStatus(null);
      onUpdate();
      toast.success('Статус обновлён');
      await updateStatusInGoogleSheets(ticket.id, status, ticket.department as Department, newSubStatus);
    } else {
      toast.error('Ошибка обновления статуса');
    }
  };

  const handleSubStatusChange = async (subStatusId: string) => {
    const selectedSubStatus = subStatuses.find(s => s.id === subStatusId);
    if (!selectedSubStatus) return;

    const success = await updateFeedbackStatus(ticket.id, 'in_progress', selectedSubStatus.name);
    if (success) {
      setCurrentStatus('in_progress');
      setCurrentSubStatus(selectedSubStatus.name);
      onUpdate();
      toast.success('Статус решения обновлён');
      await updateStatusInGoogleSheets(ticket.id, 'in_progress', ticket.department as Department, selectedSubStatus.name);
    }
  };

  const handleAddSubStatus = async () => {
    if (!newSubStatusName.trim()) return;
    setIsAddingSubStatus(true);
    const newStatus = await addSubStatus(newSubStatusName.trim(), ticket.department);
    if (newStatus) {
      setSubStatuses([...subStatuses, newStatus]);
      setNewSubStatusName('');
      setShowAddDialog(false);
      toast.success('Статус решения добавлен');
    }
    setIsAddingSubStatus(false);
  };

  const handleAssignEmployee = async (employeeId: string) => {
    const actualId = employeeId === '_none' ? null : employeeId;
    const success = await updateAssignedEmployee(ticket.id, actualId);
    if (success) {
      const emp = employees.find(e => e.id === employeeId);
      await logAdminAction('assign_employee', 'feedback', ticket.id, null, { employeeId: actualId, employeeName: emp?.name });
      setAssignedEmployee(actualId || undefined);
      toast.success('Ответственный назначен');
      onUpdate();
    }
  };

  const handleDeadlineChange = async (date: Date | undefined) => {
    setDeadline(date);
    setIsDeadlineOpen(false);
    const deadlineStr = date ? date.toISOString() : null;
    const success = await updateFeedbackDeadline(ticket.id, deadlineStr);
    if (success) {
      await logAdminAction('set_deadline', 'feedback', ticket.id, { deadline: ticket.deadline }, { deadline: deadlineStr });
      toast.success(date ? 'Дедлайн установлен' : 'Дедлайн снят');
      onUpdate();
    } else {
      toast.error('Ошибка сохранения дедлайна');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteFeedbackById(ticket.id);
    if (success) {
      await logAdminAction('delete', 'feedback', ticket.id);
      toast.success('Обращение удалено');
      onBack();
      onUpdate();
    } else {
      toast.error('Ошибка при удалении');
    }
    setIsDeleting(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setNewComment('');
    toast.success('Комментарий добавлен');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Назад к списку
        </button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Удалить
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-background">
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить обращение?</AlertDialogTitle>
              <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-elevated p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: typeConfig.bgColor, color: typeConfig.color }}>
                {typeIcons[ticket.type]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge style={{ backgroundColor: typeConfig.color, color: 'white' }}>{typeConfig.label}</Badge>
                  {ticket.bitrixTaskId && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500">Bitrix #{ticket.bitrixTaskId}</Badge>
                  )}
                  {currentSubStatus && (
                    <Badge variant="outline" className="bg-primary/10 text-primary">{currentSubStatus}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{new Date(ticket.createdAt).toLocaleString('ru')}</p>
              </div>
            </div>

            <p className="text-lg leading-relaxed mb-6">{ticket.message}</p>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t border-border pt-4">
              <span className="flex items-center gap-1.5">
                {ticket.isAnonymous ? <><UserX className="w-4 h-4" /> Анонимно</> : <><User className="w-4 h-4" /> {ticket.name}</>}
              </span>
              {ticket.contact && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{ticket.contact}</span>}
              {objectInfo && <span className="flex items-center gap-1.5"><Building className="w-4 h-4" />{objectInfo.nameKey}</span>}
              {ticket.attachmentUrl && (
                <a href={ticket.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                  <Paperclip className="w-4 h-4" />
                  {ticket.attachmentName || 'Файл'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {aiAnalysis && (
            <div className="card-elevated p-6 animate-scale-in">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Анализ</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Тональность</p>
                  <p className="font-medium capitalize">{aiAnalysis.sentiment}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Срочность</p>
                  <p className="font-medium">{aiAnalysis.urgencyScore}/10</p>
                </div>
              </div>
              <div className="space-y-3">
                <div><p className="text-xs text-muted-foreground mb-1">Краткое содержание</p><p className="text-sm">{aiAnalysis.summary}</p></div>
                <div><p className="text-xs text-muted-foreground mb-1">Рекомендуемое действие</p><p className="text-sm">{aiAnalysis.recommendedAction}</p></div>
              </div>
            </div>
          )}

          {autoResponse && (
            <div className="card-elevated p-6 animate-scale-in">
              <h3 className="font-semibold mb-3">Автоответ</h3>
              <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">{autoResponse}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { navigator.clipboard.writeText(autoResponse); toast.success('Скопировано'); }}>
                Скопировать
              </Button>
            </div>
          )}

          <div className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5" />
              <h3 className="font-semibold">Комментарии</h3>
            </div>
            
            {ticket.comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {ticket.comments.map((comment) => (
                  <div key={comment.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{comment.author}</span>
                      <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString('ru')}</span>
                    </div>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Добавить комментарий..." className="min-h-[80px]" />
              <Button onClick={handleAddComment} size="icon" className="shrink-0"><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-elevated p-6">
            <h3 className="font-semibold mb-4">Статус</h3>
            <div className="space-y-2">
              {statusOptions.map((status) => (
                <button
                  key={status.id}
                  onClick={() => handleStatusChange(status.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-sm transition-colors',
                    currentStatus === status.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted'
                  )}
                >
                  {status.icon}
                  {status.label}
                </button>
              ))}
            </div>

            {currentStatus === 'in_progress' && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Статус решения</h4>
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Plus className="w-4 h-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className="bg-background">
                      <DialogHeader>
                        <DialogTitle>Добавить статус решения</DialogTitle>
                        <DialogDescription>Введите название нового статуса</DialogDescription>
                      </DialogHeader>
                      <Input value={newSubStatusName} onChange={(e) => setNewSubStatusName(e.target.value)} placeholder="Название статуса..." onKeyDown={(e) => e.key === 'Enter' && handleAddSubStatus()} />
                      <DialogFooter>
                        <Button onClick={handleAddSubStatus} disabled={isAddingSubStatus || !newSubStatusName.trim()}>
                          {isAddingSubStatus && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                          Добавить
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {subStatuses.length > 0 && (
                  <Select value={subStatuses.find(s => s.name === currentSubStatus)?.id || ''} onValueChange={handleSubStatusChange}>
                    <SelectTrigger className="w-full bg-background"><SelectValue placeholder="Выберите статус решения" /></SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {subStatuses.map((option) => (
                        <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          <div className="card-elevated p-6">
            <h3 className="font-semibold mb-4">Ответственный</h3>
            <Select value={assignedEmployee || '_none'} onValueChange={handleAssignEmployee}>
              <SelectTrigger className="w-full bg-background"><SelectValue placeholder="Выберите сотрудника" /></SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="_none">Не назначен</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}{emp.position ? ` (${emp.position})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {deadlineEnabled && (
            <div className="card-elevated p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CalendarClock className="w-5 h-5" />
                Дедлайн
              </h3>
              <Popover open={isDeadlineOpen} onOpenChange={setIsDeadlineOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground",
                      deadline && new Date() > deadline && "border-destructive text-destructive"
                    )}
                  >
                    <CalendarClock className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, 'PPP', { locale: ru }) : <span>Установить дедлайн</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={handleDeadlineChange}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {deadline && (
                <div className="mt-3 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => {
                      const title = encodeURIComponent(`Дедлайн: ${FEEDBACK_TYPE_CONFIG[ticket.type]?.label || ticket.type}`);
                      const details = encodeURIComponent(`Обращение: ${ticket.message}\n\nСтатус решения: ${ticket.subStatus || 'Не указан'}`);
                      const dateStr = format(deadline, "yyyyMMdd'T'HHmmss");
                      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dateStr}/${dateStr}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Добавить в мой календарь
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeadlineChange(undefined)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Снять дедлайн
                  </Button>
                </div>
              )}
              {deadline && new Date() > deadline && (
                <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Дедлайн просрочен
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
