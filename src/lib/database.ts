import { supabase } from '@/integrations/supabase/client';
import { Feedback, FeedbackStatus } from '@/types/feedback';

// Convert database row to Feedback type
const rowToFeedback = (row: any): Feedback => ({
  id: row.id,
  createdAt: row.created_at,
  userRole: row.user_role,
  type: row.type,
  isAnonymous: row.is_anonymous,
  name: row.name || '',
  contact: row.contact || '',
  message: row.message,
  department: row.department,
  status: row.status,
  subStatus: row.sub_status || null,
  objectCode: row.object_code || undefined,
  bitrixTaskId: row.bitrix_task_id || null,
  attachmentUrl: row.attachment_url || undefined,
  assignedTo: row.assigned_to || undefined,
  deadline: row.deadline || undefined,
  aiAnalysis: row.ai_analysis,
  comments: [],
  urgencyLevel: row.urgency_level || 1,
  redirectedFrom: row.redirected_from || null,
  redirectedAt: row.redirected_at || null,
});

// Fetch all feedback from database
export const fetchAllFeedback = async (): Promise<Feedback[]> => {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching feedback:', error);
    return [];
  }

  return (data || []).map(rowToFeedback);
};

// Add new feedback to database
export const addFeedbackToDb = async (feedback: Feedback): Promise<boolean> => {
  const { error } = await supabase
    .from('feedback')
    .insert([{
      id: feedback.id,
      created_at: feedback.createdAt,
      user_role: feedback.userRole,
      type: feedback.type,
      is_anonymous: feedback.isAnonymous,
      name: feedback.isAnonymous ? null : feedback.name,
      contact: feedback.contact || null,
      message: feedback.message,
      department: feedback.department,
      object_code: feedback.objectCode || null,
      status: feedback.status,
      attachment_url: feedback.attachmentUrl || null,
      ai_analysis: feedback.aiAnalysis ? JSON.parse(JSON.stringify(feedback.aiAnalysis)) : null
    }]);

  if (error) {
    console.error('Error adding feedback:', error);
    return false;
  }

  return true;
};

// Update feedback status
export const updateFeedbackStatus = async (
  id: string, 
  status: FeedbackStatus,
  subStatus?: string | null
): Promise<boolean> => {
  const updateData: any = { status };
  
  // Clear subStatus if status is not in_progress, otherwise set it
  if (status === 'in_progress' && subStatus) {
    updateData.sub_status = subStatus;
  } else if (status !== 'in_progress') {
    updateData.sub_status = null;
  }

  const { error } = await supabase
    .from('feedback')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating feedback:', error);
    return false;
  }

  return true;
};

// Update assigned employee
export const updateAssignedEmployee = async (id: string, assignedTo: string | null): Promise<boolean> => {
  const { error } = await supabase
    .from('feedback')
    .update({ assigned_to: assignedTo })
    .eq('id', id);

  if (error) {
    console.error('Error updating assigned employee:', error);
    return false;
  }

  return true;
};

// Update bitrix task id
export const updateBitrixTaskId = async (id: string, bitrixTaskId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('feedback')
    .update({ bitrix_task_id: bitrixTaskId })
    .eq('id', id);

  if (error) {
    console.error('Error updating bitrix task id:', error);
    return false;
  }

  return true;
};

// Delete single feedback
export const deleteFeedbackById = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('feedback')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting feedback:', error);
    return false;
  }

  return true;
};

// Delete all feedback (clear database)
export const clearAllFeedback = async (): Promise<boolean> => {
  const { error } = await supabase
    .from('feedback')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

  if (error) {
    console.error('Error clearing feedback:', error);
    return false;
  }

  return true;
};

// Get feedback count
export const getFeedbackCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('feedback')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting count:', error);
    return 0;
  }

  return count || 0;
};

// Sub-status management
export interface SubStatusItem {
  id: string;
  name: string;
  department: string;
  isActive: boolean;
}

export const fetchSubStatuses = async (department: string): Promise<SubStatusItem[]> => {
  const { data, error } = await supabase
    .from('sub_statuses')
    .select('*')
    .eq('department', department)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching sub-statuses:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    department: row.department,
    isActive: row.is_active
  }));
};

export const addSubStatus = async (name: string, department: string): Promise<SubStatusItem | null> => {
  const { data, error } = await supabase
    .from('sub_statuses')
    .insert([{ name, department }])
    .select()
    .single();

  if (error) {
    console.error('Error adding sub-status:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    department: data.department,
    isActive: data.is_active
  };
};

export const deleteSubStatus = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('sub_statuses')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting sub-status:', error);
    return false;
  }

  return true;
};

// Employee management
export interface Employee {
  id: string;
  name: string;
  email?: string;
  department: string;
  position?: string;
  isActive: boolean;
}

export const fetchEmployees = async (department?: string): Promise<Employee[]> => {
  let query = supabase
    .from('employees')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (department) {
    query = query.eq('department', department);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    email: row.email || undefined,
    department: row.department,
    position: row.position || undefined,
    isActive: row.is_active
  }));
};

export const addEmployee = async (employee: Omit<Employee, 'id' | 'isActive'>): Promise<Employee | null> => {
  const { data, error } = await supabase
    .from('employees')
    .insert([{
      name: employee.name,
      email: employee.email || null,
      department: employee.department,
      position: employee.position || null
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding employee:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email || undefined,
    department: data.department,
    position: data.position || undefined,
    isActive: data.is_active
  };
};

// Admin action log
export interface AdminActionLog {
  id: string;
  userId?: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  description?: string;
  createdAt: string;
}

export const logAdminAction = async (
  actionType: string,
  entityType: string,
  entityId?: string,
  oldValue?: any,
  newValue?: any,
  description?: string
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('admin_action_logs')
    .insert([{
      user_id: user?.id || null,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId || null,
      old_value: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
      new_value: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      description: description || null
    }]);

  if (error) {
    console.error('Error logging admin action:', error);
    return false;
  }

  return true;
};

export const fetchAdminLogs = async (limit = 50): Promise<AdminActionLog[]> => {
  const { data, error } = await supabase
    .from('admin_action_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching admin logs:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id || undefined,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id || undefined,
    oldValue: row.old_value,
    newValue: row.new_value,
    description: row.description || undefined,
    createdAt: row.created_at
  }));
};

// Update deadline for feedback
export const updateFeedbackDeadline = async (id: string, deadline: string | null): Promise<boolean> => {
  const { error } = await supabase
    .from('feedback')
    .update({ deadline })
    .eq('id', id);

  if (error) {
    console.error('Error updating deadline:', error);
    return false;
  }

  return true;
};

// Update urgency level for feedback
export const updateFeedbackUrgencyLevel = async (id: string, urgencyLevel: number): Promise<boolean> => {
  const { error } = await supabase
    .from('feedback')
    .update({ urgency_level: urgencyLevel })
    .eq('id', id);

  if (error) {
    console.error('Error updating urgency level:', error);
    return false;
  }

  return true;
};

// Redirect feedback to another department
export const redirectFeedback = async (
  id: string, 
  newDepartment: string, 
  originalDepartment: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('feedback')
    .update({ 
      department: newDepartment,
      redirected_from: originalDepartment,
      redirected_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Error redirecting feedback:', error);
    return false;
  }

  return true;
};

// App settings management
export const getAppSetting = async (key: string): Promise<any> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    console.error('Error fetching app setting:', error);
    return null;
  }

  return data?.value;
};

export const setAppSetting = async (key: string, value: any): Promise<boolean> => {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) {
    console.error('Error updating app setting:', error);
    return false;
  }

  return true;
};
