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
export const updateFeedbackStatus = async (id: string, status: FeedbackStatus): Promise<boolean> => {
  const { error } = await supabase
    .from('feedback')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating feedback:', error);
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
