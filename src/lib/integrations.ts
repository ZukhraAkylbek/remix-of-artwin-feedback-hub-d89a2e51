import { Feedback } from '@/types/feedback';
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

const getStatusName = (status: string): string => {
  const names: Record<string, string> = {
    new: 'Новая',
    in_progress: 'В работе',
    resolved: 'Решена'
  };
  return names[status] || status;
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

export { getDepartmentName };
