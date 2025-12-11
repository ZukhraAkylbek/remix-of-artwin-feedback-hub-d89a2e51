import { Feedback, Department } from '@/types/feedback';
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

  const emoji = feedback.type === 'complaint' ? '🔴' : '🟢';
  const urgencyEmoji = feedback.urgency === 'urgent' ? '⚡️' : '';
  
  const message = `
${emoji} ${urgencyEmoji} Новое обращение

📋 Тип: ${feedback.type === 'complaint' ? 'Жалоба' : 'Предложение'}
👤 От: ${feedback.isAnonymous ? 'Анонимно' : feedback.name} (${feedback.userRole === 'employee' ? 'Сотрудник' : feedback.userRole === 'client' ? 'Клиент' : 'Подрядчик'})
🏢 Департамент: ${getDepartmentName(feedback.department)}
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
    contractor: 'Подрядчик'
  };
  return names[role] || role;
};

const getTypeName = (type: string): string => {
  return type === 'complaint' ? 'Жалоба' : 'Предложение';
};

const getUrgencyName = (urgency: string): string => {
  return urgency === 'urgent' ? 'Срочно' : 'Обычно';
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
  department: Department
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

  try {
    console.log('Sending to Google Sheets:', { spreadsheetId, department: feedback.department });
    
    const { data, error } = await supabase.functions.invoke('submit-to-sheets', {
      body: {
        spreadsheetId,
        range: 'A:J',
        values: [[
          feedback.id,
          feedback.createdAt,
          getRoleName(feedback.userRole),
          getTypeName(feedback.type),
          feedback.isAnonymous ? 'Анонимно' : feedback.name,
          feedback.contact || '',
          feedback.message,
          getUrgencyName(feedback.urgency),
          getDepartmentName(feedback.department),
          getStatusName(feedback.status)
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

  const title = `${feedback.type === 'complaint' ? '🔴 Жалоба' : '🟢 Предложение'}: ${feedback.message.slice(0, 50)}${feedback.message.length > 50 ? '...' : ''}`;

  try {
    console.log('Sending to Bitrix24...');
    
    const { data, error } = await supabase.functions.invoke('send-to-bitrix', {
      body: {
        webhookUrl: deptSettings.bitrixWebhookUrl,
        title,
        description: feedback.message,
        type: getTypeName(feedback.type),
        urgency: getUrgencyName(feedback.urgency),
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
  const names: Record<string, string> = {
    working_group: 'Рабочая группа',
    management_meeting: 'Собрание руководства',
    foremen_tech_meeting: 'Собрание прорабов с тех отделом (пн 8:00)',
    managers_meeting: 'Собрание руководителей (пн 10:00)',
    top_management_meeting: 'Собрание топ менеджмента (пн 14:00)',
    site_inspection: 'Обходы по объектам',
    project_committee: 'Собрание проектного комитета (1/в 2 недели)',
    production_meeting: 'Производственные собрания'
  };
  return subStatus ? names[subStatus] || subStatus : '';
};

export { getDepartmentName };
