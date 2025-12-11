import { supabase } from '@/integrations/supabase/client';
import { Department, DepartmentSettings } from '@/types/feedback';

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

export const getAllDepartmentSettings = async (): Promise<DepartmentSettings[]> => {
  try {
    const { data, error } = await supabase
      .from('department_settings')
      .select('*')
      .order('department');

    if (error) {
      console.error('Error fetching all department settings:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      department: row.department as Department,
      googleSheetsId: row.google_sheets_id,
      googleServiceAccountEmail: row.google_service_account_email,
      googlePrivateKey: row.google_private_key,
      telegramBotToken: row.telegram_bot_token,
      telegramChatId: row.telegram_chat_id,
      bitrixWebhookUrl: (row as any).bitrix_webhook_url,
    }));
  } catch (e) {
    console.error('Error in getAllDepartmentSettings:', e);
    return [];
  }
};

export const saveDepartmentSettings = async (settings: DepartmentSettings): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('department_settings')
      .update({
        google_sheets_id: settings.googleSheetsId,
        google_service_account_email: settings.googleServiceAccountEmail,
        google_private_key: settings.googlePrivateKey,
        telegram_bot_token: settings.telegramBotToken,
        telegram_chat_id: settings.telegramChatId,
        bitrix_webhook_url: settings.bitrixWebhookUrl,
      } as any)
      .eq('department', settings.department);

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
  const names: Record<string, string> = {
    management: 'Руководство',
    sales: 'Продажи',
    it: 'IT',
    logistics: 'Логистика',
    accounting: 'Бухгалтерия',
    warehouse: 'Склад',
    hr: 'HR',
    marketing: 'Маркетинг',
    design: 'Дизайн',
  };
  return names[dept] || dept;
};
