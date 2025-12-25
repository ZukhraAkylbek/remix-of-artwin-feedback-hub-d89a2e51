import { supabase } from '@/integrations/supabase/client';
import { Department, DepartmentSettings, DEPARTMENT_LABELS } from '@/types/feedback';

export const getDepartmentSettings = async (department: Department): Promise<DepartmentSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('department_settings')
      .select('*')
      .eq('department', department)
      .maybeSingle();

    if (error) {
      console.error('Error fetching department settings:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      department: data.department as Department,
      googleSheetsId: data.google_sheets_id,
      googleServiceAccountEmail: data.google_service_account_email,
      googlePrivateKey: data.google_private_key,
      telegramBotToken: data.telegram_bot_token,
      telegramChatId: data.telegram_chat_id,
      bitrixWebhookUrl: (data as any).bitrix_webhook_url,
    };
  } catch (e) {
    console.error('Error in getDepartmentSettings:', e);
    return null;
  }
};

const ALL_DEPARTMENTS: Department[] = [
  'ssl', 'zamgd_kom', 'service_aho', 'otitb_hse', 'omto', 
  'hr', 'zamgd_tech', 'otd_razv', 'legal', 'finance', 'security'
];

export const getAllDepartmentSettings = async (): Promise<DepartmentSettings[]> => {
  try {
    const { data, error } = await supabase
      .from('department_settings')
      .select('*')
      .order('department');

    if (error) {
      console.error('Error fetching all department settings:', error);
    }

    const existingSettings = (data || []).map(row => ({
      id: row.id,
      department: row.department as Department,
      googleSheetsId: row.google_sheets_id,
      googleServiceAccountEmail: row.google_service_account_email,
      googlePrivateKey: row.google_private_key,
      telegramBotToken: row.telegram_bot_token,
      telegramChatId: row.telegram_chat_id,
      bitrixWebhookUrl: (row as any).bitrix_webhook_url,
    }));

    // Ensure all departments have settings (create empty ones for missing)
    return ALL_DEPARTMENTS.map(dept => {
      const existing = existingSettings.find(s => s.department === dept);
      if (existing) return existing;
      return {
        id: '',
        department: dept,
        googleSheetsId: null,
        googleServiceAccountEmail: null,
        googlePrivateKey: null,
        telegramBotToken: null,
        telegramChatId: null,
        bitrixWebhookUrl: null,
      };
    });
  } catch (e) {
    console.error('Error in getAllDepartmentSettings:', e);
    return ALL_DEPARTMENTS.map(dept => ({
      id: '',
      department: dept,
      googleSheetsId: null,
      googleServiceAccountEmail: null,
      googlePrivateKey: null,
      telegramBotToken: null,
      telegramChatId: null,
      bitrixWebhookUrl: null,
    }));
  }
};

export const saveDepartmentSettings = async (settings: DepartmentSettings): Promise<boolean> => {
  try {
    // Use upsert to create or update
    const { error } = await supabase
      .from('department_settings')
      .upsert({
        department: settings.department,
        google_sheets_id: settings.googleSheetsId,
        google_service_account_email: settings.googleServiceAccountEmail,
        google_private_key: settings.googlePrivateKey,
        telegram_bot_token: settings.telegramBotToken,
        telegram_chat_id: settings.telegramChatId,
        bitrix_webhook_url: settings.bitrixWebhookUrl,
      } as any, { onConflict: 'department' });

    if (error) {
      console.error('Error saving department settings:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error in saveDepartmentSettings:', e);
    return false;
  }
};

export const getDepartmentName = (dept: string): string => {
  return DEPARTMENT_LABELS[dept as Department] || dept;
};
