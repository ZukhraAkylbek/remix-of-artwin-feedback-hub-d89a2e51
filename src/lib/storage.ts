import { Feedback, AppSettings, FEEDBACK_TYPE_CONFIG } from '@/types/feedback';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllFeedback } from './database';

const FEEDBACK_KEY = 'artwin_feedback';
const SETTINGS_KEY = 'integration_settings';

// Legacy localStorage functions for backwards compatibility
export const getFeedback = (): Feedback[] => {
  const data = localStorage.getItem(FEEDBACK_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveFeedback = (feedback: Feedback[]): void => {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback));
};

export const addFeedback = (feedback: Feedback): void => {
  const current = getFeedback();
  saveFeedback([feedback, ...current]);
};

export const updateFeedback = (id: string, updates: Partial<Feedback>): void => {
  const current = getFeedback();
  const updated = current.map(f => f.id === id ? { ...f, ...updates } : f);
  saveFeedback(updated);
};

// Database-backed settings functions
export const getSettings = async (): Promise<AppSettings> => {
  const defaultSettings: AppSettings = {
    googleSheetsId: '',
    googleSheetsSheetName: 'Sheet1',
    googleSheetsToken: '',
    googlePrivateKey: '',
    googleServiceAccountEmail: '',
    telegramBotToken: '',
    telegramChatId: '',
  };

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      return defaultSettings;
    }

    if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
      return { ...defaultSettings, ...(data.value as unknown as AppSettings) };
    }

    return defaultSettings;
  } catch (e) {
    console.error('Error in getSettings:', e);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: AppSettings): Promise<boolean> => {
  try {
    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .eq('key', SETTINGS_KEY)
      .maybeSingle();

    const settingsJson = JSON.parse(JSON.stringify(settings));

    if (existing) {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: settingsJson })
        .eq('key', SETTINGS_KEY);

      if (error) {
        console.error('Error updating settings:', error);
        return false;
      }
    } else {
      const { error } = await supabase
        .from('app_settings')
        .insert([{ key: SETTINGS_KEY, value: settingsJson }]);

      if (error) {
        console.error('Error inserting settings:', error);
        return false;
      }
    }

    return true;
  } catch (e) {
    console.error('Error in saveSettings:', e);
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

const getDepartmentNameCSV = (dept: string): string => {
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

const getStatusName = (status: string): string => {
  const names: Record<string, string> = {
    new: 'Новая',
    in_progress: 'В работе',
    resolved: 'Решена'
  };
  return names[status] || status;
};

export const exportToCSV = async (): Promise<string> => {
  const feedback = await fetchAllFeedback();
  const BOM = '\uFEFF';
  const headers = ['ID', 'Дата', 'Роль', 'Тип', 'Имя', 'Контакт', 'Сообщение', 'Объект', 'Департамент', 'Статус'];
  const rows = feedback.map(f => [
    f.id,
    f.createdAt,
    getRoleName(f.userRole),
    getTypeName(f.type),
    f.isAnonymous ? 'Анонимно' : f.name,
    f.contact || '',
    `"${f.message.replace(/"/g, '""')}"`,
    f.objectCode || '',
    getDepartmentNameCSV(f.department),
    getStatusName(f.status)
  ]);
  
  return BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};
