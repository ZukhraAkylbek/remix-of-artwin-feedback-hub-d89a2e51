import { useState } from 'react';
import { Feedback, FeedbackStatus, Comment } from '@/types/feedback';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  AlertCircle, 
  Lightbulb, 
  Sparkles, 
  Send,
  Clock,
  Loader2,
  CheckCircle,
  Zap,
  User,
  UserX,
  Mail,
  Paperclip,
  MessageSquare,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeWithAI, generateAutoResponse } from '@/lib/ai';
import { updateFeedbackStatus, deleteFeedbackById } from '@/lib/database';
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

export const TicketDetail = ({ ticket, onBack, onUpdate }: TicketDetailProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [autoResponse, setAutoResponse] = useState('');
  const [newComment, setNewComment] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(ticket.aiAnalysis);
  const [currentStatus, setCurrentStatus] = useState(ticket.status);

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
    const success = await updateFeedbackStatus(ticket.id, status);
    if (success) {
      setCurrentStatus(status);
      onUpdate();
      toast.success('Статус обновлён');
    } else {
      toast.error('Ошибка обновления статуса');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteFeedbackById(ticket.id);
    if (success) {
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
    
    const comment: Comment = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      author: 'Администратор',
      text: newComment,
    };
    
    // Note: Comments are local only for now
    setNewComment('');
    toast.success('Комментарий добавлен');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить обращение?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Обращение будет удалено из базы данных.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                ticket.type === 'complaint' ? 'bg-complaint-light' : 'bg-suggestion-light'
              )}>
                {ticket.type === 'complaint' 
                  ? <AlertCircle className="w-6 h-6 text-complaint" />
                  : <Lightbulb className="w-6 h-6 text-suggestion" />
                }
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={ticket.type === 'complaint' ? 'destructive' : 'default'}>
                    {ticket.type === 'complaint' ? 'Жалоба' : 'Предложение'}
                  </Badge>
                  {ticket.urgency === 'urgent' && (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      <Zap className="w-3 h-3 mr-1" />
                      Срочно
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(ticket.createdAt).toLocaleString('ru')}
                </p>
              </div>
            </div>

            <p className="text-lg leading-relaxed mb-6">{ticket.message}</p>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t border-border pt-4">
              <span className="flex items-center gap-1.5">
                {ticket.isAnonymous 
                  ? <><UserX className="w-4 h-4" /> Анонимно</>
                  : <><User className="w-4 h-4" /> {ticket.name}</>
                }
              </span>
              {ticket.contact && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {ticket.contact}
                </span>
              )}
              {ticket.attachmentName && (
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4" />
                  {ticket.attachmentName}
                </span>
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
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Краткое содержание</p>
                  <p className="text-sm">{aiAnalysis.summary}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Рекомендуемое действие</p>
                  <p className="text-sm">{aiAnalysis.recommendedAction}</p>
                </div>
              </div>
            </div>
          )}

          {autoResponse && (
            <div className="card-elevated p-6 animate-scale-in">
              <h3 className="font-semibold mb-3">Автоответ</h3>
              <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">{autoResponse}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => {
                navigator.clipboard.writeText(autoResponse);
                toast.success('Скопировано');
              }}>
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
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString('ru')}
                      </span>
                    </div>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Добавить комментарий..."
                className="min-h-[80px]"
              />
              <Button onClick={handleAddComment} size="icon" className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
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
                    currentStatus === status.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50 hover:bg-muted'
                  )}
                >
                  {status.icon}
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card-elevated p-6 space-y-3">
            <h3 className="font-semibold mb-2">Действия</h3>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Анализировать
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={handleGenerateResponse}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              Сгенерировать ответ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
