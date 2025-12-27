export type UserRole = 'resident' | 'client' | 'employee' | 'contractor';
export type FeedbackType = 'remark' | 'suggestion' | 'gratitude';

// Internal department codes for admin panel
export type Department = 
  | 'ssl'           // ССЛ - Сервис для владельцев недвижимости
  | 'zamgd_kom'     // ЗамГД Ком - Продажи и консультации
  | 'marketing'     // ЗАМ ГД Ком Маркетинг - Маркетинг и партнерства
  | 'service_aho'   // Сервис / АХО - Ресепшн и офис-сервис
  | 'otitb_hse'     // ОТиТБ (HSE) - Безопасность труда
  | 'omto'          // ОМТО - Закупки и поставки
  | 'hr'            // HR - HR и условия труда
  | 'zamgd_tech'    // ЗамГД Тех - Стройка и подрядчики
  | 'otd_razv'      // Отд.Разв - Проектные замечания и решения
  | 'legal'         // Юр.отдел - Юристы и нотариус
  | 'finance'       // Фин Отдел - Оплата и финансы
  | 'security'      // СБ - Служба безопасности
  | 'rukovodstvo';  // Руководство

export type FeedbackStatus = 'new' | 'in_progress' | 'resolved';
export type SubStatus = string | null;

export type ResidentialObject = 
  | 'HQ'
  | 'TKY'
  | 'EST'
  | 'TKC'
  | 'SEL'
  | 'HYT'
  | 'URP'
  | 'WLT'
  | 'LND'
  | 'S_УЧ';

export const RESIDENTIAL_OBJECTS: { code: ResidentialObject; nameKey: string }[] = [
  { code: 'HQ', nameKey: 'objectHQ' },
  { code: 'TKY', nameKey: 'objectTokyo' },
  { code: 'EST', nameKey: 'objectEsentai' },
  { code: 'TKC', nameKey: 'objectTokyoCity' },
  { code: 'SEL', nameKey: 'objectSeoul' },
  { code: 'HYT', nameKey: 'objectHayat' },
  { code: 'URP', nameKey: 'objectUrpaqPark' },
  { code: 'WLT', nameKey: 'objectWiltonPark' },
  { code: 'LND', nameKey: 'objectLondonSquare' },
  { code: 'S_УЧ', nameKey: 'objectUmutChyragy' },
];

// User-friendly subject options (shown in feedback form)
export const FEEDBACK_SUBJECTS: { code: Department; labelKey: string }[] = [
  { code: 'ssl', labelKey: 'subjectPropertyService' },
  { code: 'zamgd_kom', labelKey: 'subjectSalesConsulting' },
  { code: 'service_aho', labelKey: 'subjectReceptionOffice' },
  { code: 'otitb_hse', labelKey: 'subjectHSE' },
  { code: 'omto', labelKey: 'subjectProcurement' },
  { code: 'marketing', labelKey: 'subjectMarketingPartnerships' },
  { code: 'hr', labelKey: 'subjectHRConditions' },
  { code: 'zamgd_tech', labelKey: 'subjectConstructionContractors' },
  { code: 'otd_razv', labelKey: 'subjectProjectRemarks' },
  { code: 'legal', labelKey: 'subjectLegal' },
  { code: 'finance', labelKey: 'subjectFinance' },
  { code: 'security', labelKey: 'subjectSecurity' },
];

// Short department labels for admin panel
export const DEPARTMENT_LABELS: Record<Department, string> = {
  ssl: 'ССЛ',
  zamgd_kom: 'ЗамГД Ком',
  marketing: 'ЗАМ ГД Ком Маркетинг',
  service_aho: 'Сервис / АХО',
  otitb_hse: 'ОТиТБ (HSE)',
  omto: 'ОМТО',
  hr: 'HR',
  zamgd_tech: 'ЗамГД Тех',
  otd_razv: 'Отд.Разв',
  legal: 'Юр.отдел',
  finance: 'Фин Отдел',
  security: 'СБ',
  rukovodstvo: 'Руководство',
};

export const FEEDBACK_TYPE_CONFIG: Record<FeedbackType, { label: string; color: string; bgColor: string }> = {
  remark: { label: 'Замечание', color: 'hsl(0 72% 51%)', bgColor: 'hsl(0 72% 96%)' },
  suggestion: { label: 'Предложение', color: 'hsl(217 91% 60%)', bgColor: 'hsl(217 91% 96%)' },
  gratitude: { label: 'Благодарность', color: 'hsl(142 71% 45%)', bgColor: 'hsl(142 71% 96%)' },
};

export type UrgencyLevel = 1 | 2 | 3 | 4;

export const URGENCY_LEVEL_CONFIG: Record<UrgencyLevel, { label: string; color: string; bgColor: string }> = {
  1: { label: '1 - Первая линия', color: 'hsl(142 71% 45%)', bgColor: 'hsl(142 71% 96%)' },
  2: { label: '2 - Средний', color: 'hsl(217 91% 60%)', bgColor: 'hsl(217 91% 96%)' },
  3: { label: '3 - Высокий', color: 'hsl(38 92% 50%)', bgColor: 'hsl(38 92% 96%)' },
  4: { label: '4 - Критический', color: 'hsl(0 72% 51%)', bgColor: 'hsl(0 72% 96%)' },
};

export interface Feedback {
  id: string;
  createdAt: string;
  userRole: UserRole;
  type: FeedbackType;
  name: string;
  isAnonymous: boolean;
  contact: string;
  message: string;
  department: Department;
  status: FeedbackStatus;
  subStatus?: SubStatus;
  objectCode?: ResidentialObject;
  bitrixTaskId?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  assignedTo?: string;
  deadline?: string;
  aiAnalysis?: AIAnalysis;
  comments: Comment[];
  urgencyLevel?: UrgencyLevel;
  redirectedFrom?: Department | null;
  redirectedAt?: string | null;
}

export interface AIAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  summary: string;
  urgencyScore: number;
  recommendedAction: string;
}

export interface Comment {
  id: string;
  createdAt: string;
  author: string;
  text: string;
}

export interface AdminUser {
  department: Department;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  email?: string;
  department: string;
  position?: string;
  isActive: boolean;
}

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

export interface AppSettings {
  googleSheetsId: string;
  googleSheetsSheetName: string;
  googleSheetsToken: string;
  googlePrivateKey: string;
  googleServiceAccountEmail: string;
  telegramBotToken: string;
  telegramChatId: string;
}

export interface DepartmentSettings {
  id: string;
  department: Department;
  googleSheetsId: string | null;
  googleServiceAccountEmail: string | null;
  googlePrivateKey: string | null;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  bitrixWebhookUrl: string | null;
}
