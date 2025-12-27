import { Feedback, Department, FEEDBACK_TYPE_CONFIG, RESIDENTIAL_OBJECTS } from '@/types/feedback';
import { getDepartmentSettings, getDepartmentName } from './departmentSettings';
import { supabase } from '@/integrations/supabase/client';

export const sendToTelegram = async (feedback: Feedback): Promise<boolean> => {
  const deptSettings = await getDepartmentSettings(feedback.department);
  
  console.log('Telegram dept settings:', { 
    department: feedback.department,
    hasBotToken: !!deptSettings?.telegramBotToken, 
    hasChatId: !!deptSettings?.telegramChatId 
  });
  
  if (!deptSettings?.telegramBotToken || !deptSettings?.telegramChatId) {
    console.log('Telegram credentials not configured for department:', feedback.department);
    return false;
  }

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

  try {
    console.log('Sending to Telegram...');
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
    console.log('Telegram response:', result);
    
    return response.ok;
  } catch (error) {
    console.error('Telegram error:', error);
    return false;
  }
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

// Update status in Google Sheets when changed in admin
export const updateStatusInGoogleSheets = async (
  feedbackId: string, 
  newStatus: string,
  department: Department,
  subStatus?: string | null
): Promise<boolean> => {
  const deptSettings = await getDepartmentSettings(department);
  
  if (!deptSettings?.googleSheetsId || !deptSettings?.googleServiceAccountEmail || !deptSettings?.googlePrivateKey) {
    console.log('Google Sheets not configured for department:', department);
    return false;
  }

  const spreadsheetId = extractSpreadsheetId(deptSettings.googleSheetsId);

  try {
    const { data, error } = await supabase.functions.invoke('update-sheet-status', {
      body: {
        spreadsheetId,
        feedbackId,
        newStatus: getStatusName(newStatus),
        newSubStatus: subStatus || '',
        serviceAccountEmail: deptSettings.googleServiceAccountEmail,
        privateKey: deptSettings.googlePrivateKey
      }
    });

    if (error) {
      console.error('Update sheet status error:', error);
      return false;
    }

    console.log('Sheet status update result:', data);
    return data?.success === true;
  } catch (error) {
    console.error('Error updating sheet status:', error);
    return false;
  }
};

// Update deadline in Google Sheets
export const updateDeadlineInGoogleSheets = async (
  feedbackId: string,
  deadline: string | null,
  department: Department
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
        deadline: deadline || '',
        serviceAccountEmail: deptSettings.googleServiceAccountEmail,
        privateKey: deptSettings.googlePrivateKey
      }
    });

    if (error) {
      console.error('Update sheet deadline error:', error);
      return false;
    }
    return data?.success === true;
  } catch (error) {
    console.error('Error updating sheet deadline:', error);
    return false;
  }
};

// Update urgency level in Google Sheets
export const updateUrgencyInGoogleSheets = async (
  feedbackId: string,
  urgencyLevel: number,
  department: Department
): Promise<boolean> => {
  const deptSettings = await getDepartmentSettings(department);
  
  if (!deptSettings?.googleSheetsId || !deptSettings?.googleServiceAccountEmail || !deptSettings?.googlePrivateKey) {
    return false;
  }

  const spreadsheetId = extractSpreadsheetId(deptSettings.googleSheetsId);
  
  const urgencyLabels: Record<number, string> = {
    1: 'Обычный',
    2: 'Средний',
    3: 'Высокий',
    4: 'Критический'
  };

  try {
    const { data, error } = await supabase.functions.invoke('update-sheet-status', {
      body: {
        spreadsheetId,
        feedbackId,
        urgencyLevel: urgencyLabels[urgencyLevel] || 'Обычный',
        serviceAccountEmail: deptSettings.googleServiceAccountEmail,
        privateKey: deptSettings.googlePrivateKey
      }
    });

    if (error) {
      console.error('Update sheet urgency error:', error);
      return false;
    }
    return data?.success === true;
  } catch (error) {
    console.error('Error updating sheet urgency:', error);
    return false;
  }
};

// Update assigned employee in Google Sheets
export const updateAssignedInGoogleSheets = async (
  feedbackId: string,
  assignedToName: string | null,
  department: Department
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
        assignedTo: assignedToName || '',
        serviceAccountEmail: deptSettings.googleServiceAccountEmail,
        privateKey: deptSettings.googlePrivateKey
      }
    });

    if (error) {
      console.error('Update sheet assigned error:', error);
      return false;
    }
    return data?.success === true;
  } catch (error) {
    console.error('Error updating sheet assigned:', error);
    return false;
  }
};

// Delete row from Google Sheets
export const deleteFromGoogleSheets = async (
  feedbackId: string,
  department: Department
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
      console.error('Delete from sheet error:', error);
      return false;
    }
    console.log('Delete from sheet result:', data);
    return data?.success === true;
  } catch (error) {
    console.error('Error deleting from sheet:', error);
    return false;
  }
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
        privateKey: deptSettings.googlePrivateKey
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

// Extract spreadsheet ID from URL or plain ID
const extractSpreadsheetId = (input: string): string => {
  // If it's a full URL, extract the ID
  const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  // If it contains /edit or other URL parts, try to clean it
  const cleanedId = input.split('/')[0].split('?')[0].split('#')[0];
  return cleanedId || input;
};

export const syncToGoogleSheets = async (feedback: Feedback): Promise<boolean> => {
  const deptSettings = await getDepartmentSettings(feedback.department);
  
  if (!deptSettings?.googleSheetsId) {
    console.log('Google Sheets ID not configured for department:', feedback.department);
    return false;
  }
  
  if (!deptSettings?.googleServiceAccountEmail || !deptSettings?.googlePrivateKey) {
    console.log('Google service account credentials not configured for department:', feedback.department);
    return false;
  }

  const spreadsheetId = extractSpreadsheetId(deptSettings.googleSheetsId);
  const objectName = feedback.objectCode 
    ? RESIDENTIAL_OBJECTS.find(o => o.code === feedback.objectCode)?.nameKey || feedback.objectCode
    : '';

  try {
    console.log('Sending to Google Sheets:', { spreadsheetId, department: feedback.department });
    
    // Get urgency level label
    const getUrgencyLabel = (level?: number): string => {
      const labels: Record<number, string> = {
        1: 'Обычный',
        2: 'Средний',
        3: 'Высокий',
        4: 'Критический'
      };
      return labels[level || 1] || 'Обычный';
    };
    
    const { data, error } = await supabase.functions.invoke('submit-to-sheets', {
      body: {
        spreadsheetId,
        range: 'A:P',
        values: [[
          feedback.id,                                        // A - ID
          feedback.createdAt,                                 // B - Дата
          getRoleName(feedback.userRole),                     // C - Роль
          getTypeName(feedback.type),                         // D - Тип
          feedback.isAnonymous ? 'Анонимно' : feedback.name,  // E - Имя
          feedback.contact || '',                             // F - Контакт
          feedback.message,                                   // G - Сообщение
          objectName,                                         // H - Объект
          getDepartmentName(feedback.department),             // I - Отдел
          getStatusName(feedback.status),                     // J - Статус
          feedback.subStatus || '',                           // K - Подстатус
          feedback.attachmentUrl || '',                       // L - Файл
          feedback.bitrixTaskId || '',                        // M - Bitrix ID
          feedback.deadline || '',                            // N - Дедлайн
          getUrgencyLabel(feedback.urgencyLevel),             // O - Уровень срочности
          feedback.assignedToName || ''                       // P - Ответственный
        ]],
        serviceAccountEmail: deptSettings.googleServiceAccountEmail,
        privateKey: deptSettings.googlePrivateKey
      }
    });

    if (error) {
      console.error('Google Sheets edge function error:', error);
      return false;
    }

    console.log('Google Sheets sync result:', data);
    return data?.success === true;
  } catch (error) {
    console.error('Google Sheets error:', error);
    return false;
  }
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

export { getDepartmentName };
