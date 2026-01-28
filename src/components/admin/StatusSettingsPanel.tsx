import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown,
  ChevronRight,
  GripVertical,
  Loader2,
  Save,
  X,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TaskStatus {
  id: string;
  department: string;
  name: string;
  is_final: boolean;
  position: number;
  is_active: boolean;
  created_at: string;
}

interface TaskSubstatus {
  id: string;
  status_id: string;
  name: string;
  position: number;
  is_active: boolean;
  created_at: string;
}

interface StatusSettingsPanelProps {
  department: string;
}

export const StatusSettingsPanel = ({ department }: StatusSettingsPanelProps) => {
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [substatuses, setSubstatuses] = useState<TaskSubstatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedStatuses, setExpandedStatuses] = useState<Set<string>>(new Set());
  
  // New status form
  const [newStatusName, setNewStatusName] = useState('');
  const [isAddingStatus, setIsAddingStatus] = useState(false);
  
  // Edit status
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusName, setEditingStatusName] = useState('');
  const [editingStatusIsFinal, setEditingStatusIsFinal] = useState(false);
  
  // New substatus form
  const [addingSubstatusToStatusId, setAddingSubstatusToStatusId] = useState<string | null>(null);
  const [newSubstatusName, setNewSubstatusName] = useState('');
  
  // Edit substatus
  const [editingSubstatusId, setEditingSubstatusId] = useState<string | null>(null);
  const [editingSubstatusName, setEditingSubstatusName] = useState('');

  useEffect(() => {
    loadData();
    
    // Real-time subscription
    const statusChannel = supabase
      .channel('task_statuses_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_statuses' }, () => {
        loadData();
      })
      .subscribe();
      
    const substatusChannel = supabase
      .channel('task_substatuses_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_substatuses' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(substatusChannel);
    };
  }, [department]);

  const loadData = async () => {
    setIsLoading(true);
    
    const [statusesRes, substatusesRes] = await Promise.all([
      supabase
        .from('task_statuses')
        .select('*')
        .eq('department', department)
        .order('position', { ascending: true }),
      supabase
        .from('task_substatuses')
        .select('*')
        .order('position', { ascending: true })
    ]);
    
    if (statusesRes.data) setStatuses(statusesRes.data);
    if (substatusesRes.data) setSubstatuses(substatusesRes.data);
    
    setIsLoading(false);
  };

  const toggleExpanded = (statusId: string) => {
    setExpandedStatuses(prev => {
      const next = new Set(prev);
      if (next.has(statusId)) {
        next.delete(statusId);
      } else {
        next.add(statusId);
      }
      return next;
    });
  };

  // Status CRUD
  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    setIsAddingStatus(true);
    
    const maxPosition = Math.max(...statuses.map(s => s.position), -1) + 1;
    
    const { error } = await supabase
      .from('task_statuses')
      .insert({
        department,
        name: newStatusName.trim(),
        position: maxPosition,
        is_final: false
      });
    
    if (error) {
      toast.error('Ошибка добавления статуса');
    } else {
      toast.success('Статус добавлен');
      setNewStatusName('');
    }
    setIsAddingStatus(false);
  };

  const startEditStatus = (status: TaskStatus) => {
    setEditingStatusId(status.id);
    setEditingStatusName(status.name);
    setEditingStatusIsFinal(status.is_final);
  };

  const handleSaveStatus = async () => {
    if (!editingStatusId || !editingStatusName.trim()) return;
    
    const { error } = await supabase
      .from('task_statuses')
      .update({ 
        name: editingStatusName.trim(),
        is_final: editingStatusIsFinal
      })
      .eq('id', editingStatusId);
    
    if (error) {
      toast.error('Ошибка обновления статуса');
    } else {
      toast.success('Статус обновлён');
      setEditingStatusId(null);
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    const { error } = await supabase
      .from('task_statuses')
      .delete()
      .eq('id', statusId);
    
    if (error) {
      toast.error('Ошибка удаления статуса');
    } else {
      toast.success('Статус удалён');
    }
  };

  const handleToggleStatusActive = async (status: TaskStatus) => {
    const { error } = await supabase
      .from('task_statuses')
      .update({ is_active: !status.is_active })
      .eq('id', status.id);
    
    if (error) {
      toast.error('Ошибка обновления статуса');
    }
  };

  // Substatus CRUD
  const handleAddSubstatus = async (statusId: string) => {
    if (!newSubstatusName.trim()) return;
    
    const statusSubstatuses = substatuses.filter(s => s.status_id === statusId);
    const maxPosition = Math.max(...statusSubstatuses.map(s => s.position), -1) + 1;
    
    const { error } = await supabase
      .from('task_substatuses')
      .insert({
        status_id: statusId,
        name: newSubstatusName.trim(),
        position: maxPosition
      });
    
    if (error) {
      toast.error('Ошибка добавления подстатуса');
    } else {
      toast.success('Подстатус добавлен');
      setNewSubstatusName('');
      setAddingSubstatusToStatusId(null);
    }
  };

  const startEditSubstatus = (substatus: TaskSubstatus) => {
    setEditingSubstatusId(substatus.id);
    setEditingSubstatusName(substatus.name);
  };

  const handleSaveSubstatus = async () => {
    if (!editingSubstatusId || !editingSubstatusName.trim()) return;
    
    const { error } = await supabase
      .from('task_substatuses')
      .update({ name: editingSubstatusName.trim() })
      .eq('id', editingSubstatusId);
    
    if (error) {
      toast.error('Ошибка обновления подстатуса');
    } else {
      toast.success('Подстатус обновлён');
      setEditingSubstatusId(null);
    }
  };

  const handleDeleteSubstatus = async (substatusId: string) => {
    const { error } = await supabase
      .from('task_substatuses')
      .delete()
      .eq('id', substatusId);
    
    if (error) {
      toast.error('Ошибка удаления подстатуса');
    } else {
      toast.success('Подстатус удалён');
    }
  };

  const handleToggleSubstatusActive = async (substatus: TaskSubstatus) => {
    const { error } = await supabase
      .from('task_substatuses')
      .update({ is_active: !substatus.is_active })
      .eq('id', substatus.id);
    
    if (error) {
      toast.error('Ошибка обновления подстатуса');
    }
  };

  const getSubstatusesForStatus = (statusId: string) => {
    return substatuses.filter(s => s.status_id === statusId).sort((a, b) => a.position - b.position);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Настройки статусов</h1>
        <p className="text-muted-foreground">
          Управление статусами и подстатусами задач для вашего отдела
        </p>
      </div>

      {/* Add new status */}
      <div className="card-elevated p-4">
        <div className="flex gap-3">
          <Input
            placeholder="Название нового статуса..."
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
          />
          <Button onClick={handleAddStatus} disabled={isAddingStatus || !newStatusName.trim()}>
            {isAddingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Добавить статус
          </Button>
        </div>
      </div>

      {/* Statuses list */}
      <div className="space-y-3">
        {statuses.length === 0 ? (
          <div className="card-elevated p-8 text-center text-muted-foreground">
            Статусы ещё не созданы. Добавьте первый статус выше.
          </div>
        ) : (
          statuses.map((status) => (
            <Collapsible
              key={status.id}
              open={expandedStatuses.has(status.id)}
              onOpenChange={() => toggleExpanded(status.id)}
            >
              <div className="card-elevated">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <CollapsibleTrigger asChild>
                      <button className="p-1 hover:bg-muted rounded transition-colors">
                        {expandedStatuses.has(status.id) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    
                    <div className="flex-1">
                      {editingStatusId === status.id ? (
                        <div className="flex items-center gap-3">
                          <Input
                            value={editingStatusName}
                            onChange={(e) => setEditingStatusName(e.target.value)}
                            className="max-w-xs"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`final-${status.id}`}
                              checked={editingStatusIsFinal}
                              onCheckedChange={setEditingStatusIsFinal}
                            />
                            <Label htmlFor={`final-${status.id}`} className="text-sm">
                              Финальный
                            </Label>
                          </div>
                          <Button size="sm" variant="ghost" onClick={handleSaveStatus}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingStatusId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "font-medium",
                            !status.is_active && "text-muted-foreground line-through"
                          )}>
                            {status.name}
                          </span>
                          {status.is_final && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              Финальный
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            ({getSubstatusesForStatus(status.id).length} подстатусов)
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={status.is_active}
                        onCheckedChange={() => handleToggleStatusActive(status)}
                      />
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => startEditStatus(status)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-background">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить статус?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Будут также удалены все подстатусы. Это действие нельзя отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteStatus(status.id)}>
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
                
                <CollapsibleContent>
                  <div className="border-t border-border">
                    <div className="p-4 pl-14 space-y-2">
                      {getSubstatusesForStatus(status.id).map((substatus) => (
                        <div 
                          key={substatus.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          
                          <div className="flex-1">
                            {editingSubstatusId === substatus.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingSubstatusName}
                                  onChange={(e) => setEditingSubstatusName(e.target.value)}
                                  className="max-w-xs"
                                  autoFocus
                                />
                                <Button size="sm" variant="ghost" onClick={handleSaveSubstatus}>
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingSubstatusId(null)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className={cn(
                                "text-sm",
                                !substatus.is_active && "text-muted-foreground line-through"
                              )}>
                                {substatus.name}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={substatus.is_active}
                              onCheckedChange={() => handleToggleSubstatusActive(substatus)}
                            />
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => startEditSubstatus(substatus)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-background">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Удалить подстатус?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Это действие нельзя отменить.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSubstatus(substatus.id)}>
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add substatus form */}
                      {addingSubstatusToStatusId === status.id ? (
                        <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border">
                          <Input
                            placeholder="Название подстатуса..."
                            value={newSubstatusName}
                            onChange={(e) => setNewSubstatusName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubstatus(status.id)}
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleAddSubstatus(status.id)}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            setAddingSubstatusToStatusId(null);
                            setNewSubstatusName('');
                          }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingSubstatusToStatusId(status.id)}
                          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Добавить подстатус
                        </button>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  );
};
