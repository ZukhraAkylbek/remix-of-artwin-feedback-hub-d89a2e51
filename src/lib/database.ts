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
  urgency: row.urgency,
  department: row.department,
  status: row.status,
  subStatus: row.sub_status || null,
  bitrixTaskId: row.bitrix_task_id || null,
  aiAnalysis: row.ai_analysis,
  comments: []
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
      urgency: feedback.urgency,
      department: feedback.department,
      status: feedback.status,
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
