import { useState, useEffect } from 'react';
import { Department, DEPARTMENT_LABELS } from '@/types/feedback';
import { Employee, fetchEmployees, addEmployee, logAdminAction } from '@/lib/database';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  User, 
  Mail, 
  Briefcase, 
  Loader2, 
  Trash2,
  Edit2,
  Check,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

interface EmployeesPanelProps {
  department: Department;
}

export const EmployeesPanel = ({ department }: EmployeesPanelProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formDepartment, setFormDepartment] = useState<Department>(department);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPosition, setEditPosition] = useState('');

  const loadEmployees = async () => {
    setIsLoading(true);
    const data = await fetchEmployees();
    setEmployees(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPosition('');
    setFormDepartment(department);
  };

  const handleAdd = async () => {
    if (!formName.trim()) {
      toast.error('Введите имя сотрудника');
      return;
    }

    setIsAdding(true);
    const newEmployee = await addEmployee({
      name: formName.trim(),
      email: formEmail.trim() || undefined,
      department: formDepartment,
      position: formPosition.trim() || undefined,
    });

    if (newEmployee) {
      await logAdminAction('create', 'employee', newEmployee.id, null, newEmployee);
      setEmployees([...employees, newEmployee]);
      resetForm();
      setShowAddDialog(false);
      toast.success('Сотрудник добавлен');
    } else {
      toast.error('Ошибка при добавлении');
    }
    setIsAdding(false);
  };

  const handleStartEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditName(emp.name);
    setEditEmail(emp.email || '');
    setEditPosition(emp.position || '');
  };

  const handleSaveEdit = async (emp: Employee) => {
    const { error } = await supabase
      .from('employees')
      .update({
        name: editName.trim(),
        email: editEmail.trim() || null,
        position: editPosition.trim() || null,
      })
      .eq('id', emp.id);

    if (error) {
      toast.error('Ошибка при сохранении');
      return;
    }

    await logAdminAction('update', 'employee', emp.id, emp, { name: editName, email: editEmail, position: editPosition });
    setEmployees(employees.map(e => 
      e.id === emp.id 
        ? { ...e, name: editName.trim(), email: editEmail.trim() || undefined, position: editPosition.trim() || undefined }
        : e
    ));
    setEditingId(null);
    toast.success('Изменения сохранены');
  };

  const handleDelete = async (emp: Employee) => {
    const { error } = await supabase
      .from('employees')
      .update({ is_active: false })
      .eq('id', emp.id);

    if (error) {
      toast.error('Ошибка при удалении');
      return;
    }

    await logAdminAction('delete', 'employee', emp.id, emp);
    setEmployees(employees.filter(e => e.id !== emp.id));
    toast.success('Сотрудник удалён');
  };

  const departmentEmployees = employees.filter(e => e.department === department);
  const otherEmployees = employees.filter(e => e.department !== department);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Сотрудники</h1>
          <p className="text-muted-foreground">Управление сотрудниками для назначения ответственных</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Добавить сотрудника
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Добавить сотрудника</DialogTitle>
              <DialogDescription>Заполните данные нового сотрудника</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Имя *</label>
                <Input 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  placeholder="Иван Иванов"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <Input 
                  value={formEmail} 
                  onChange={(e) => setFormEmail(e.target.value)} 
                  placeholder="ivan@company.com"
                  type="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Должность</label>
                <Input 
                  value={formPosition} 
                  onChange={(e) => setFormPosition(e.target.value)} 
                  placeholder="Менеджер"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Отдел</label>
                <Select value={formDepartment} onValueChange={(v) => setFormDepartment(v as Department)}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {Object.entries(DEPARTMENT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Отмена</Button>
              <Button onClick={handleAdd} disabled={isAdding || !formName.trim()}>
                {isAdding && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Добавить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="card-elevated p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current department employees */}
          <div className="card-elevated p-6">
            <h3 className="font-semibold mb-4">{DEPARTMENT_LABELS[department]}</h3>
            {departmentEmployees.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Нет сотрудников</p>
            ) : (
              <div className="space-y-2">
                {departmentEmployees.map((emp) => (
                  <EmployeeRow
                    key={emp.id}
                    employee={emp}
                    isEditing={editingId === emp.id}
                    editName={editName}
                    editEmail={editEmail}
                    editPosition={editPosition}
                    onEditNameChange={setEditName}
                    onEditEmailChange={setEditEmail}
                    onEditPositionChange={setEditPosition}
                    onStartEdit={() => handleStartEdit(emp)}
                    onSaveEdit={() => handleSaveEdit(emp)}
                    onCancelEdit={() => setEditingId(null)}
                    onDelete={() => handleDelete(emp)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Other departments */}
          {otherEmployees.length > 0 && (
            <div className="card-elevated p-6">
              <h3 className="font-semibold mb-4">Другие отделы</h3>
              <div className="space-y-2">
                {otherEmployees.map((emp) => (
                  <EmployeeRow
                    key={emp.id}
                    employee={emp}
                    isEditing={editingId === emp.id}
                    editName={editName}
                    editEmail={editEmail}
                    editPosition={editPosition}
                    onEditNameChange={setEditName}
                    onEditEmailChange={setEditEmail}
                    onEditPositionChange={setEditPosition}
                    onStartEdit={() => handleStartEdit(emp)}
                    onSaveEdit={() => handleSaveEdit(emp)}
                    onCancelEdit={() => setEditingId(null)}
                    onDelete={() => handleDelete(emp)}
                    showDepartment
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface EmployeeRowProps {
  employee: Employee;
  isEditing: boolean;
  editName: string;
  editEmail: string;
  editPosition: string;
  onEditNameChange: (v: string) => void;
  onEditEmailChange: (v: string) => void;
  onEditPositionChange: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  showDepartment?: boolean;
}

const EmployeeRow = ({
  employee,
  isEditing,
  editName,
  editEmail,
  editPosition,
  onEditNameChange,
  onEditEmailChange,
  onEditPositionChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  showDepartment = false
}: EmployeeRowProps) => {
  if (isEditing) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <Input 
          value={editName} 
          onChange={(e) => onEditNameChange(e.target.value)} 
          placeholder="Имя"
          className="flex-1 h-8"
        />
        <Input 
          value={editEmail} 
          onChange={(e) => onEditEmailChange(e.target.value)} 
          placeholder="Email"
          className="flex-1 h-8"
        />
        <Input 
          value={editPosition} 
          onChange={(e) => onEditPositionChange(e.target.value)} 
          placeholder="Должность"
          className="w-32 h-8"
        />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onSaveEdit}>
          <Check className="w-4 h-4 text-success" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancelEdit}>
          <X className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{employee.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {employee.position && <span>{employee.position}</span>}
            {employee.email && (
              <>
                {employee.position && <span>•</span>}
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{employee.email}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showDepartment && (
          <Badge variant="outline" className="text-xs">
            {DEPARTMENT_LABELS[employee.department as Department] || employee.department}
          </Badge>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onStartEdit}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
