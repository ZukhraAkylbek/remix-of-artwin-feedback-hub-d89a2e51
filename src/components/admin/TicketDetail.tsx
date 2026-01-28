import { useState, useEffect } from 'react';
import { Feedback, FeedbackStatus, Department, FEEDBACK_TYPE_CONFIG, FeedbackType, RESIDENTIAL_OBJECTS, URGENCY_LEVEL_CONFIG, UrgencyLevel, DEPARTMENT_LABELS } from '@/types/feedback';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Sparkles, 
  Clock,
  Loader2,
  CheckCircle,
  User,
  UserX,
  Mail,
  Paperclip,
  Trash2,
  Plus,
  AlertTriangle,
  Lightbulb,
  Heart,
  ExternalLink,
  Building,
  CalendarClock,
  X,
  ArrowRightLeft,
  Upload,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeWithAI, generateAutoResponse } from '@/lib/ai';
import { updateFeedbackStatus, deleteFeedbackById, fetchSubStatuses, addSubStatus, SubStatusItem, fetchEmployees, updateAssignedEmployee, logAdminAction, Employee, updateFeedbackDeadline, getAppSetting, updateFeedbackUrgencyLevel, redirectFeedback, updateFeedbackFinalPhoto, updateFeedbackTaskStatus } from '@/lib/database';
import { supabase } from '@/integrations/supabase/client';
import { updateStatusInGoogleSheets, updateDeadlineInGoogleSheets, updateUrgencyInGoogleSheets, updateAssignedInGoogleSheets, deleteFromGoogleSheets } from '@/lib/integrations';
import { ALL_DEPARTMENTS } from '@/lib/departmentSettings';
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

// Types for dynamic statuses
interface TaskStatus {
  id: string;
  name: string;
  department: string;
  isFinal: boolean;
  position: number;
}

interface TaskSubstatus {
  id: string;
  statusId: string;
  name: string;
  position: number;
}

interface TicketDetailProps {
  ticket: Feedback;
  onBack: () => void;
  onUpdate: () => void;
  currentDepartment?: string;
}

const typeIcons: Record<FeedbackType, React.ReactNode> = {
  remark: <AlertTriangle className="w-6 h-6" />,
  suggestion: <Lightbulb className="w-6 h-6" />,
  gratitude: <Heart className="w-6 h-6" />,
};

export const TicketDetail = ({ ticket, onBack, onUpdate, currentDepartment }: TicketDetailProps) => {
  // Use current admin department for statuses, fallback to ticket department
  const statusDepartment = currentDepartment || ticket.department;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [autoResponse, setAutoResponse] = useState('');
  
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
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>(ticket.urgencyLevel || 1);
  const [showRedirectDialog, setShowRedirectDialog] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<string>('');
  
  // Final photo state
  const [finalPhotoUrl, setFinalPhotoUrl] = useState<string | null>(ticket.finalPhotoUrl || null);
  const [isUploadingFinalPhoto, setIsUploadingFinalPhoto] = useState(false);

  // Dynamic task statuses from database
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [taskSubstatuses, setTaskSubstatuses] = useState<TaskSubstatus[]>([]);
  const [selectedTaskStatusId, setSelectedTaskStatusId] = useState<string | null>(ticket.taskStatusId || null);
  const [selectedTaskSubstatusId, setSelectedTaskSubstatusId] = useState<string | null>(ticket.taskSubstatusId || null);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);

  const typeConfig = FEEDBACK_TYPE_CONFIG[ticket.type] || { color: '#888', bgColor: '#f0f0f0', label: ticket.type };
  const objectInfo = ticket.objectCode ? RESIDENTIAL_OBJECTS.find(o => o.code === ticket.objectCode) : null;

  // Get current selected task status
  const currentTaskStatus = taskStatuses.find(s => s.id === selectedTaskStatusId);
  const isFinalStatus = currentTaskStatus?.isFinal === true;
  
  // Get filtered substatuses for the selected status
  const filteredSubstatuses = taskSubstatuses.filter(sub => sub.statusId === selectedTaskStatusId);

  useEffect(() => {
    loadSubStatuses();
    loadEmployees();
    loadDeadlineSetting();
    loadTaskStatuses();
  }, [statusDepartment]);

  // Subscribe to realtime changes for task_statuses and task_substatuses
  useEffect(() => {
    const channel = supabase
      .channel('task-statuses-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_statuses' },
        () => loadTaskStatuses()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_substatuses' },
        () => loadTaskStatuses()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusDepartment]);

  const loadDeadlineSetting = async () => {
    const enabled = await getAppSetting('deadline_enabled');
    setDeadlineEnabled(enabled === true);
  };

  const loadSubStatuses = async () => {
    const statuses = await fetchSubStatuses(ticket.department);
    setSubStatuses(statuses);
  };

  const loadTaskStatuses = async () => {
    setIsLoadingStatuses(true);
    try {
      // Fetch statuses for the current admin department
      const { data: statusesData, error: statusesError } = await supabase
        .from('task_statuses')
        .select('*')
        .eq('department', statusDepartment)
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (statusesError) {
        console.error('Error loading task statuses:', statusesError);
        return;
      }

      const mappedStatuses: TaskStatus[] = (statusesData || []).map(row => ({
        id: row.id,
        name: row.name,
        department: row.department,
        isFinal: row.is_final,
        position: row.position
      }));
      setTaskStatuses(mappedStatuses);

      // Fetch all substatuses for these statuses
      if (statusesData && statusesData.length > 0) {
        const statusIds = statusesData.map(s => s.id);
        const { data: substatusesData, error: substatusesError } = await supabase
          .from('task_substatuses')
          .select('*')
          .in('status_id', statusIds)
          .eq('is_active', true)
          .order('position', { ascending: true });

        if (substatusesError) {
          console.error('Error loading task substatuses:', substatusesError);
          return;
        }

        const mappedSubstatuses: TaskSubstatus[] = (substatusesData || []).map(row => ({
          id: row.id,
          statusId: row.status_id,
          name: row.name,
          position: row.position
        }));
        setTaskSubstatuses(mappedSubstatuses);
      } else {
        setTaskSubstatuses([]);
      }
    } catch (error) {
      console.error('Error in loadTaskStatuses:', error);
    } finally {
      setIsLoadingStatuses(false);
    }
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

  // Handle dynamic task status change
  const handleTaskStatusChange = async (statusId: string) => {
    const success = await updateFeedbackTaskStatus(ticket.id, statusId, null);
    if (success) {
      const statusName = taskStatuses.find(s => s.id === statusId)?.name || '';
      await logAdminAction('task_status_change', 'feedback', ticket.id, 
        { taskStatusId: selectedTaskStatusId }, 
        { taskStatusId: statusId, statusName }
      );
      setSelectedTaskStatusId(statusId);
      setSelectedTaskSubstatusId(null); // Reset substatus when status changes
      onUpdate();
      toast.success('Статус задачи обновлён');
    } else {
      toast.error('Ошибка обновления статуса');
    }
  };

  // Handle dynamic task substatus change
  const handleTaskSubstatusChange = async (substatusId: string) => {
    const success = await updateFeedbackTaskStatus(ticket.id, selectedTaskStatusId, substatusId);
    if (success) {
      const substatusName = taskSubstatuses.find(s => s.id === substatusId)?.name || '';
      await logAdminAction('task_substatus_change', 'feedback', ticket.id, 
        { taskSubstatusId: selectedTaskSubstatusId }, 
        { taskSubstatusId: substatusId, substatusName }
      );
      setSelectedTaskSubstatusId(substatusId);
      onUpdate();
      toast.success('Подстатус обновлён');
    } else {
      toast.error('Ошибка обновления подстатуса');
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
      // Sync to Google Sheets
      await updateAssignedInGoogleSheets(ticket.id, emp?.name || null, ticket.department as Department);
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
      // Sync to Google Sheets
      const formattedDeadline = date ? format(date, 'dd.MM.yyyy', { locale: ru }) : '';
      await updateDeadlineInGoogleSheets(ticket.id, formattedDeadline, ticket.department as Department);
    } else {
      toast.error('Ошибка сохранения дедлайна');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteFeedbackById(ticket.id);
    if (success) {
      await logAdminAction('delete', 'feedback', ticket.id);
      // Delete from Google Sheets
      await deleteFromGoogleSheets(ticket.id, ticket.department as Department);
      toast.success('Обращение удалено');
      onBack();
      onUpdate();
    } else {
      toast.error('Ошибка при удалении');
    }
    setIsDeleting(false);
  };


  const handleUrgencyChange = async (level: string) => {
    const newLevel = parseInt(level) as UrgencyLevel;
    const success = await updateFeedbackUrgencyLevel(ticket.id, newLevel);
    if (success) {
      await logAdminAction('urgency_change', 'feedback', ticket.id, { urgencyLevel: urgencyLevel }, { urgencyLevel: newLevel });
      setUrgencyLevel(newLevel);
      toast.success('Уровень обновлён');
      onUpdate();
      // Sync to Google Sheets
      await updateUrgencyInGoogleSheets(ticket.id, newLevel, ticket.department as Department);
    } else {
      toast.error('Ошибка обновления уровня');
    }
  };

  const handleRedirect = async () => {
    if (!redirectTarget || redirectTarget === ticket.department) return;
    setIsRedirecting(true);
    const success = await redirectFeedback(ticket.id, redirectTarget, ticket.department);
    if (success) {
      await logAdminAction('redirect', 'feedback', ticket.id, 
        { department: ticket.department }, 
        { department: redirectTarget, redirectedFrom: ticket.department }
      );
      toast.success(`Обращение переадресовано в ${DEPARTMENT_LABELS[redirectTarget as Department]}`);
      setShowRedirectDialog(false);
      onUpdate();
      onBack();
    } else {
      toast.error('Ошибка переадресации');
    }
    setIsRedirecting(false);
  };

  // Handle final photo upload
  const handleFinalPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, загрузите изображение');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5MB');
      return;
    }

    setIsUploadingFinalPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${ticket.id}_final_${Date.now()}.${fileExt}`;
      const filePath = `final-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('feedback-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error('Ошибка загрузки файла');
        return;
      }

      const { data } = supabase.storage
        .from('feedback-attachments')
        .getPublicUrl(filePath);

      const success = await updateFeedbackFinalPhoto(ticket.id, data.publicUrl);
      if (success) {
        setFinalPhotoUrl(data.publicUrl);
        await logAdminAction('upload_final_photo', 'feedback', ticket.id, null, { finalPhotoUrl: data.publicUrl });
        toast.success('Финальное фото загружено');
        onUpdate();
      }
    } catch (error) {
      console.error('Error uploading final photo:', error);
      toast.error('Ошибка загрузки файла');
    } finally {
      setIsUploadingFinalPhoto(false);
    }
  };

  const handleRemoveFinalPhoto = async () => {
    const success = await updateFeedbackFinalPhoto(ticket.id, null);
    if (success) {
      setFinalPhotoUrl(null);
      await logAdminAction('remove_final_photo', 'feedback', ticket.id, { finalPhotoUrl }, null);
      toast.success('Финальное фото удалено');
      onUpdate();
    }
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

        </div>

        <div className="space-y-6">
          {/* Dynamic Task Status from database */}
          <div className="card-elevated p-6">
            <h3 className="font-semibold mb-4">Статус задачи</h3>
            {isLoadingStatuses ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : taskStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Нет настроенных статусов для этого отдела. 
                Добавьте их в "Настройки статусов".
              </p>
            ) : (
              <div className="space-y-3">
                <Select 
                  value={selectedTaskStatusId || ''} 
                  onValueChange={handleTaskStatusChange}
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {taskStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        <span className="flex items-center gap-2">
                          {status.isFinal && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {status.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Show substatus selector if a status is selected and has substatuses */}
                {selectedTaskStatusId && filteredSubstatuses.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-2">Подстатус</h4>
                    <Select 
                      value={selectedTaskSubstatusId || ''} 
                      onValueChange={handleTaskSubstatusChange}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Выберите подстатус" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border z-50">
                        {filteredSubstatuses.map((substatus) => (
                          <SelectItem key={substatus.id} value={substatus.id}>
                            {substatus.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Final Photo Upload - only show when status is final */}
          {isFinalStatus && (
            <div className="card-elevated p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Финальное фото
              </h3>
              {finalPhotoUrl ? (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img 
                      src={finalPhotoUrl} 
                      alt="Финальное фото" 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => window.open(finalPhotoUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Открыть
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleRemoveFinalPhoto}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="block">
                  <div className={cn(
                    "border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors",
                    isUploadingFinalPhoto && "opacity-50 pointer-events-none"
                  )}>
                    {isUploadingFinalPhoto ? (
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Нажмите для загрузки фото
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Максимум 5MB
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFinalPhotoUpload}
                    disabled={isUploadingFinalPhoto}
                  />
                </label>
              )}
            </div>
          )}

          <div className="card-elevated p-6">
            <h3 className="font-semibold mb-4">Уровень</h3>
            <Select value={String(urgencyLevel)} onValueChange={handleUrgencyChange}>
              <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {([1, 2, 3, 4] as UrgencyLevel[]).map((level) => (
                  <SelectItem key={level} value={String(level)}>
                    <span style={{ color: URGENCY_LEVEL_CONFIG[level].color }}>
                      {URGENCY_LEVEL_CONFIG[level].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {urgencyLevel >= 3 && (
              <p className="text-xs text-muted-foreground mt-2">Попадает в список руководства</p>
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

          <div className="card-elevated p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Переадресация
            </h3>
            {ticket.redirectedFrom && (
              <p className="text-sm text-muted-foreground mb-3">
                Переадресовано из: {DEPARTMENT_LABELS[ticket.redirectedFrom as Department]}
              </p>
            )}
            <Dialog open={showRedirectDialog} onOpenChange={setShowRedirectDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  Передать в отдел
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background">
                <DialogHeader>
                  <DialogTitle>Переадресовать обращение</DialogTitle>
                  <DialogDescription>Выберите отдел для перенаправления</DialogDescription>
                </DialogHeader>
                <Select value={redirectTarget} onValueChange={setRedirectTarget}>
                  <SelectTrigger className="w-full bg-background"><SelectValue placeholder="Выберите отдел" /></SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {ALL_DEPARTMENTS.filter(d => d !== ticket.department).map((dept) => (
                      <SelectItem key={dept} value={dept}>{DEPARTMENT_LABELS[dept]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DialogFooter>
                  <Button onClick={handleRedirect} disabled={isRedirecting || !redirectTarget}>
                    {isRedirecting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Переадресовать
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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

          {/* Final Photo - only show when status is resolved */}
          {currentStatus === 'resolved' && (
            <div className="card-elevated p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Финальное фото
              </h3>
              
              {finalPhotoUrl ? (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img 
                      src={finalPhotoUrl} 
                      alt="Финальное фото" 
                      className="w-full h-48 object-cover"
                    />
                    <a 
                      href={finalPhotoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full gap-2 text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                        Удалить фото
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-background">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить финальное фото?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Это действие нельзя отменить.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveFinalPhoto}>
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Загрузите фото выполненной работы
                    </p>
                    <label>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFinalPhotoUpload}
                        disabled={isUploadingFinalPhoto}
                      />
                      <Button 
                        variant="outline" 
                        className="gap-2" 
                        disabled={isUploadingFinalPhoto}
                        asChild
                      >
                        <span>
                          {isUploadingFinalPhoto ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {isUploadingFinalPhoto ? 'Загрузка...' : 'Выбрать файл'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
