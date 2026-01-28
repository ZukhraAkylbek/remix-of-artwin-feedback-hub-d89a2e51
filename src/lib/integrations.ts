import { Feedback, Department, FEEDBACK_TYPE_CONFIG, RESIDENTIAL_OBJECTS } from '@/types/feedback';
import { getDepartmentSettings, getDepartmentName } from './departmentSettings';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllFeedback, fetchEmployees } from './database';

// Send to Telegram for department AND Rukovodstvo
export const sendToTelegram = async (feedback: Feedback): Promise<boolean> => {
  const deptSettings = await getDepartmentSettings(feedback.department);
  
  const typeConfig = FEEDBACK_TYPE_CONFIG[feedback.type];
  const typeEmojis: Record<string, string> = {
    remark: '🔴',
    suggestion: '🔵',
    gratitude: '🟢',
  };
  const emoji = typeEmojis[feedback.type] || '⚪';
  
  const objectName = feedback.objectCode 
    ? RESIDENTIAL_OBJECTS.find(o => o.code === feedback.objectCode)?.nameKey || feedback.objectCode
    : 'Не указан';
  
  const message = `
${emoji} Новое обращение

📋 Тип: ${typeConfig.label}
👤 От: ${feedback.isAnonymous ? 'Анонимно' : feedback.name} (${getRoleName(feedback.userRole)})
🏢 Департамент: ${getDepartmentName(feedback.department)}
🏠 Объект: ${objectName}
📝 Сообщение: ${feedback.message.slice(0, 200)}${feedback.message.length > 200 ? '...' : ''}
`;

  let deptSuccess = false;
  let rukovodstvoSuccess = false;

  // Send to department's Telegram
  if (deptSettings?.telegramBotToken && deptSettings?.telegramChatId) {
    try {
      console.log('Sending to department Telegram...');
      const response = await fetch(`https://api.telegram.org/bot${deptSettings.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: deptSettings.telegramChatId,
          text: message,
          parse_mode: 'HTML'
        })
      });
      
      const result = await response.json();
      console.log('Department Telegram response:', result);
      deptSuccess = response.ok;
    } catch (error) {
      console.error('Department Telegram error:', error);
    }
  } else {
    console.log('Telegram credentials not configured for department:', feedback.department);
  }

  // Also send to Rukovodstvo's Telegram (if different department)
  if (feedback.department !== 'rukovodstvo') {
    const rukovodstvoSettings = await getDepartmentSettings('rukovodstvo');
    
    if (rukovodstvoSettings?.telegramBotToken && rukovodstvoSettings?.telegramChatId) {
      try {
        console.log('Sending to Rukovodstvo Telegram...');
        const response = await fetch(`https://api.telegram.org/bot${rukovodstvoSettings.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: rukovodstvoSettings.telegramChatId,
            text: message,
            parse_mode: 'HTML'
          })
        });
        
        const result = await response.json();
        console.log('Rukovodstvo Telegram response:', result);
        rukovodstvoSuccess = response.ok;
      } catch (error) {
        console.error('Rukovodstvo Telegram error:', error);
      }
    } else {
      console.log('Telegram credentials not configured for Rukovodstvo');
    }
  }

  return deptSuccess || rukovodstvoSuccess;
};

const getRoleName = (role: string): string => {
  const names: Record<string, string> = {
    employee: 'Сотрудник',
    client: 'Клиент',
    contractor: 'Подрядчик',
    resident: 'Владелец квартиры'
  };
  return names[role] || role;
};

const getTypeName = (type: string): string => {
  return FEEDBACK_TYPE_CONFIG[type as keyof typeof FEEDBACK_TYPE_CONFIG]?.label || type;
};

export const getStatusName = (status: string): string => {
  const names: Record<string, string> = {
    new: 'Новая',
    in_progress: 'В работе',
    resolved: 'Решена'
  };
  return names[status] || status;
};

// Extract spreadsheet ID from URL or plain ID
const extractSpreadsheetId = (input: string): string => {
  const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  const cleanedId = input.split('/')[0].split('?')[0].split('#')[0];
  return cleanedId || input;
};

// Helper to update sheet for a specific department
const updateSheetForDepartment = async (
  department: Department,
  feedbackId: string,
  updateData: Record<string, any>
): Promise<boolean> => {
  const deptSettings = await getDepartmentSettings(department);
  
  if (!deptSettings?.googleSheetsId || !deptSettings?.googleServiceAccountEmail || !deptSettings?.googlePrivateKey) {
    return false;
  }

  const spreadsheetId = extractSpreadsheetId(deptSettings.googleSheetsId);

  try {
    const { data, error } = await supabase.functions.invoke('update-sheet-status', {
      body: {
        spreadsheetId,
        feedbackId,
        ...updateData,
        serviceAccountEmail: deptSettings.googleServiceAccountEmail,
        privateKey: deptSettings.googlePrivateKey
      }
    });

    if (error) {
      console.error(`Update sheet error for ${department}:`, error);
      return false;
    }
    return data?.success === true;
  } catch (error) {
    console.error(`Error updating sheet for ${department}:`, error);
    return false;
  }
};

// Helper to delete from sheet for a specific department
const deleteFromSheetForDepartment = async (
  department: Department,
  feedbackId: string
): Promise<boolean> => {
  const deptSettings = await getDepartmentSettings(department);
  
  if (!deptSettings?.googleSheetsId || !deptSettings?.googleServiceAccountEmail || !deptSettings?.googlePrivateKey) {
    return false;
  }

  const spreadsheetId = extractSpreadsheetId(deptSettings.googleSheetsId);

  try {
    const { data, error } = await supabase.functions.invoke('delete-from-sheet', {
      body: {
        spreadsheetId,
        feedbackId,
        serviceAccountEmail: deptSettings.googleServiceAccountEmail,
        privateKey: deptSettings.googlePrivateKey
      }
    });

    if (error) {
      console.error(`Delete from sheet error for ${department}:`, error);
      return false;
    }
    return data?.success === true;
  } catch (error) {
    console.error(`Error deleting from sheet for ${department}:`, error);
    return false;
  }
};

// Update status in Google Sheets for BOTH department and Rukovodstvo
export const updateStatusInGoogleSheets = async (
  feedbackId: string, 
  newStatus: string,
  department: Department,
  subStatus?: string | null
): Promise<boolean> => {
  // If the status is already a human-readable name (from dynamic statuses), use it directly
  // Otherwise, convert from old status codes (new, in_progress, resolved)
  const isLegacyStatus = ['new', 'in_progress', 'resolved'].includes(newStatus);
  const statusDisplayName = isLegacyStatus ? getStatusName(newStatus) : newStatus;
  
  const updateData = {
    newStatus: statusDisplayName,
    newSubStatus: subStatus || ''
  };

  // Update department's sheet
  const deptSuccess = await updateSheetForDepartment(department, feedbackId, updateData);
  
  // Also update Rukovodstvo's sheet
  let rukovodstvoSuccess = false;
  if (department !== 'rukovodstvo') {
    rukovodstvoSuccess = await updateSheetForDepartment('rukovodstvo', feedbackId, updateData);
  }

  return deptSuccess || rukovodstvoSuccess;
};

// Update deadline in Google Sheets for BOTH department and Rukovodstvo
export const updateDeadlineInGoogleSheets = async (
  feedbackId: string,
  deadline: string | null,
  department: Department
): Promise<boolean> => {
  const updateData = { deadline: deadline || '' };

  const deptSuccess = await updateSheetForDepartment(department, feedbackId, updateData);
  
  let rukovodstvoSuccess = false;
  if (department !== 'rukovodstvo') {
    rukovodstvoSuccess = await updateSheetForDepartment('rukovodstvo', feedbackId, updateData);
  }

  return deptSuccess || rukovodstvoSuccess;
};

// Update urgency level in Google Sheets for BOTH department and Rukovodstvo
export const updateUrgencyInGoogleSheets = async (
  feedbackId: string,
  urgencyLevel: number,
  department: Department
): Promise<boolean> => {
  const urgencyLabels: Record<number, string> = {
    1: 'Обычный',
    2: 'Средний',
    3: 'Высокий',
    4: 'Критический'
  };

  const updateData = { urgencyLevel: urgencyLabels[urgencyLevel] || 'Обычный' };

  const deptSuccess = await updateSheetForDepartment(department, feedbackId, updateData);
  
  let rukovodstvoSuccess = false;
  if (department !== 'rukovodstvo') {
    rukovodstvoSuccess = await updateSheetForDepartment('rukovodstvo', feedbackId, updateData);
  }

  return deptSuccess || rukovodstvoSuccess;
};

// Update assigned employee in Google Sheets for BOTH department and Rukovodstvo
export const updateAssignedInGoogleSheets = async (
  feedbackId: string,
  assignedToName: string | null,
  department: Department
): Promise<boolean> => {
  const updateData = { assignedTo: assignedToName || '' };

  const deptSuccess = await updateSheetForDepartment(department, feedbackId, updateData);
  
  let rukovodstvoSuccess = false;
  if (department !== 'rukovodstvo') {
    rukovodstvoSuccess = await updateSheetForDepartment('rukovodstvo', feedbackId, updateData);
  }

  return deptSuccess || rukovodstvoSuccess;
};

// Delete row from Google Sheets for BOTH department and Rukovodstvo
export const deleteFromGoogleSheets = async (
  feedbackId: string,
  department: Department
): Promise<boolean> => {
  const deptSuccess = await deleteFromSheetForDepartment(department, feedbackId);
  
  let rukovodstvoSuccess = false;
  if (department !== 'rukovodstvo') {
    rukovodstvoSuccess = await deleteFromSheetForDepartment('rukovodstvo', feedbackId);
  }

  return deptSuccess || rukovodstvoSuccess;
};

// Sync statuses from Google Sheets to database
export const syncStatusesFromGoogleSheets = async (department: Department): Promise<{ success: boolean; updatedCount: number }> => {
  const deptSettings = await getDepartmentSettings(department);
  
  if (!deptSettings?.googleSheetsId || !deptSettings?.googleServiceAccountEmail || !deptSettings?.googlePrivateKey) {
    console.log('Google Sheets not configured for department:', department);
    return { success: false, updatedCount: 0 };
  }

  const spreadsheetId = extractSpreadsheetId(deptSettings.googleSheetsId);

  try {
    const { data, error } = await supabase.functions.invoke('sync-from-sheets', {
      body: {
        spreadsheetId,
        serviceAccountEmail: deptSettings.googleServiceAccountEmail,
        privateKey: deptSettings.googlePrivateKey,
        department // Pass department to support dynamic statuses
      }
    });

    if (error) {
      console.error('Sync from sheets error:', error);
      return { success: false, updatedCount: 0 };
    }

    console.log('Sync from sheets result:', data);
    return { success: data?.success === true, updatedCount: data?.updatedCount || 0 };
  } catch (error) {
    console.error('Error syncing from sheets:', error);
    return { success: false, updatedCount: 0 };
  }
};

// Submit to Google Sheets - sends to BOTH department AND Rukovodstvo
export const syncToGoogleSheets = async (feedback: Feedback): Promise<boolean> => {
  const deptSettings = await getDepartmentSettings(feedback.department);
  
  const getUrgencyLabel = (level?: number): string => {
    const labels: Record<number, string> = {
      1: 'Обычный',
      2: 'Средний',
      3: 'Высокий',
      4: 'Критический'
    };
    return labels[level || 1] || 'Обычный';
  };

  const objectName = feedback.objectCode 
    ? RESIDENTIAL_OBJECTS.find(o => o.code === feedback.objectCode)?.nameKey || feedback.objectCode
    : '';

  // Get dynamic status name if taskStatusId is set
  let statusDisplayName = getStatusName(feedback.status);
  let subStatusDisplayName = feedback.subStatus || '';
  
  if (feedback.taskStatusId) {
    try {
      const { data: taskStatus } = await supabase
        .from('task_statuses')
        .select('name')
        .eq('id', feedback.taskStatusId)
        .single();
      
      if (taskStatus) {
        statusDisplayName = taskStatus.name;
      }

      if (feedback.taskSubstatusId) {
        const { data: taskSubstatus } = await supabase
          .from('task_substatuses')
          .select('name')
          .eq('id', feedback.taskSubstatusId)
          .single();
        
        if (taskSubstatus) {
          subStatusDisplayName = taskSubstatus.name;
        }
      }
    } catch (error) {
      console.error('Error fetching task status names:', error);
    }
  }

  const rowData = [
    feedback.id,
    feedback.createdAt,
    getRoleName(feedback.userRole),
    getTypeName(feedback.type),
    feedback.isAnonymous ? 'Анонимно' : feedback.name,
    feedback.contact || '',
    feedback.message,
    objectName,
    getDepartmentName(feedback.department),
    statusDisplayName,
    subStatusDisplayName,
    feedback.attachmentUrl || '',
    feedback.bitrixTaskId || '',
    feedback.deadline || '',
    getUrgencyLabel(feedback.urgencyLevel),
    feedback.assignedToName || ''
  ];

  let departmentSuccess = false;
  let rukovodstvoSuccess = false;

  // Send to department's Google Sheets
  if (deptSettings?.googleSheetsId && deptSettings?.googleServiceAccountEmail && deptSettings?.googlePrivateKey) {
    const spreadsheetId = extractSpreadsheetId(deptSettings.googleSheetsId);
    
    try {
      console.log('Sending to department Google Sheets:', { spreadsheetId, department: feedback.department });
      
      const { data, error } = await supabase.functions.invoke('submit-to-sheets', {
        body: {
          spreadsheetId,
          range: 'A:P',
          values: [rowData],
          serviceAccountEmail: deptSettings.googleServiceAccountEmail,
          privateKey: deptSettings.googlePrivateKey
        }
      });

      if (error) {
        console.error('Department Google Sheets error:', error);
      } else {
        console.log('Department Google Sheets result:', data);
        departmentSuccess = data?.success === true;
      }
    } catch (error) {
      console.error('Department Google Sheets error:', error);
    }
  } else {
    console.log('Google Sheets not configured for department:', feedback.department);
  }

  // Also send to Rukovodstvo's Google Sheets (all feedback goes there)
  if (feedback.department !== 'rukovodstvo') {
    const rukovodstvoSettings = await getDepartmentSettings('rukovodstvo');
    
    if (rukovodstvoSettings?.googleSheetsId && rukovodstvoSettings?.googleServiceAccountEmail && rukovodstvoSettings?.googlePrivateKey) {
      const rukovodstvoSpreadsheetId = extractSpreadsheetId(rukovodstvoSettings.googleSheetsId);
      
      try {
        console.log('Sending copy to Rukovodstvo Google Sheets:', { spreadsheetId: rukovodstvoSpreadsheetId });
        
        const { data, error } = await supabase.functions.invoke('submit-to-sheets', {
          body: {
            spreadsheetId: rukovodstvoSpreadsheetId,
            range: 'A:P',
            values: [rowData],
            serviceAccountEmail: rukovodstvoSettings.googleServiceAccountEmail,
            privateKey: rukovodstvoSettings.googlePrivateKey
          }
        });

        if (error) {
          console.error('Rukovodstvo Google Sheets error:', error);
        } else {
          console.log('Rukovodstvo Google Sheets result:', data);
          rukovodstvoSuccess = data?.success === true;
        }
      } catch (error) {
        console.error('Rukovodstvo Google Sheets error:', error);
      }
    } else {
      console.log('Google Sheets not configured for Rukovodstvo');
    }
  }

  return departmentSuccess || rukovodstvoSuccess;
};

// Send feedback to Bitrix24 as a task
export const sendToBitrix = async (feedback: Feedback): Promise<{ success: boolean; taskId?: string }> => {
  const deptSettings = await getDepartmentSettings(feedback.department);
  
  if (!deptSettings?.bitrixWebhookUrl) {
    console.log('Bitrix24 webhook not configured for department:', feedback.department);
    return { success: false };
  }

  const typeConfig = FEEDBACK_TYPE_CONFIG[feedback.type];
  const title = `${typeConfig.label}: ${feedback.message.slice(0, 50)}${feedback.message.length > 50 ? '...' : ''}`;

  try {
    console.log('Sending to Bitrix24...');
    
    const { data, error } = await supabase.functions.invoke('send-to-bitrix', {
      body: {
        webhookUrl: deptSettings.bitrixWebhookUrl,
        title,
        description: feedback.message,
        type: getTypeName(feedback.type),
        department: getDepartmentName(feedback.department),
        contactName: feedback.isAnonymous ? undefined : feedback.name,
        contactInfo: feedback.contact,
        feedbackId: feedback.id
      }
    });

    if (error) {
      console.error('Bitrix24 edge function error:', error);
      return { success: false };
    }

    console.log('Bitrix24 result:', data);
    return { success: data?.success === true, taskId: data?.taskId };
  } catch (error) {
    console.error('Bitrix24 error:', error);
    return { success: false };
  }
};

// Sync statuses from Bitrix24 to database
export const syncStatusesFromBitrix = async (department: Department): Promise<{ success: boolean; updatedCount: number }> => {
  const deptSettings = await getDepartmentSettings(department);
  
  if (!deptSettings?.bitrixWebhookUrl) {
    console.log('Bitrix24 webhook not configured for department:', department);
    return { success: false, updatedCount: 0 };
  }

  try {
    const { data, error } = await supabase.functions.invoke('sync-bitrix-status', {
      body: {
        webhookUrl: deptSettings.bitrixWebhookUrl,
        department
      }
    });

    if (error) {
      console.error('Bitrix sync error:', error);
      return { success: false, updatedCount: 0 };
    }

    console.log('Bitrix sync result:', data);
    return { success: data?.success === true, updatedCount: data?.updatedCount || 0 };
  } catch (error) {
    console.error('Error syncing from Bitrix:', error);
    return { success: false, updatedCount: 0 };
  }
};

// Get sub-status display name
export const getSubStatusName = (subStatus: string | null): string => {
  return subStatus || '';
};

// Sync all existing feedback to Rukovodstvo Google Sheets
export const syncAllToRukovodstvoSheets = async (): Promise<{ success: boolean; syncedCount: number; errors: number }> => {
  const rukovodstvoSettings = await getDepartmentSettings('rukovodstvo');
  
  if (!rukovodstvoSettings?.googleSheetsId || !rukovodstvoSettings?.googleServiceAccountEmail || !rukovodstvoSettings?.googlePrivateKey) {
    console.log('Google Sheets not configured for Rukovodstvo');
    return { success: false, syncedCount: 0, errors: 0 };
  }

  const spreadsheetId = extractSpreadsheetId(rukovodstvoSettings.googleSheetsId);
  
  const allFeedback = await fetchAllFeedback();
  const employees = await fetchEmployees();
  
  const getUrgencyLabel = (level?: number): string => {
    const labels: Record<number, string> = {
      1: 'Обычный',
      2: 'Средний',
      3: 'Высокий',
      4: 'Критический'
    };
    return labels[level || 1] || 'Обычный';
  };

  let syncedCount = 0;
  let errors = 0;

  for (const feedback of allFeedback) {
    const objectName = feedback.objectCode 
      ? RESIDENTIAL_OBJECTS.find(o => o.code === feedback.objectCode)?.nameKey || feedback.objectCode
      : '';
    
    const assignedEmployee = feedback.assignedTo 
      ? employees.find(e => e.id === feedback.assignedTo)?.name || ''
      : '';

    const rowData = [
      feedback.id,
      feedback.createdAt,
      getRoleName(feedback.userRole),
      getTypeName(feedback.type),
      feedback.isAnonymous ? 'Анонимно' : feedback.name,
      feedback.contact || '',
      feedback.message,
      objectName,
      getDepartmentName(feedback.department),
      getStatusName(feedback.status),
      feedback.subStatus || '',
      feedback.attachmentUrl || '',
      feedback.bitrixTaskId || '',
      feedback.deadline || '',
      getUrgencyLabel(feedback.urgencyLevel),
      assignedEmployee
    ];

    try {
      const { data, error } = await supabase.functions.invoke('submit-to-sheets', {
        body: {
          spreadsheetId,
          range: 'A:P',
          values: [rowData],
          serviceAccountEmail: rukovodstvoSettings.googleServiceAccountEmail,
          privateKey: rukovodstvoSettings.googlePrivateKey
        }
      });

      if (error || !data?.success) {
        console.error('Error syncing feedback:', feedback.id, error);
        errors++;
      } else {
        syncedCount++;
      }
    } catch (error) {
      console.error('Error syncing feedback:', feedback.id, error);
      errors++;
    }
  }

  console.log(`Synced ${syncedCount}/${allFeedback.length} feedback items to Rukovodstvo sheets`);
  return { success: errors === 0, syncedCount, errors };
};

export { getDepartmentName };
