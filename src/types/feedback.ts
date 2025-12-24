export type UserRole = 'resident' | 'client' | 'employee' | 'contractor';
export type FeedbackType = 'remark' | 'suggestion' | 'safety' | 'gratitude';
export type Department = 'management' | 'reception' | 'sales' | 'hr' | 'marketing' | 'favorites_ssl' | 'construction_tech' | 'other';
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

export const FEEDBACK_TYPE_CONFIG: Record<FeedbackType, { label: string; color: string; bgColor: string }> = {
  remark: { label: 'Замечание', color: 'hsl(0 72% 51%)', bgColor: 'hsl(0 72% 96%)' },
  suggestion: { label: 'Предложение', color: 'hsl(217 91% 60%)', bgColor: 'hsl(217 91% 96%)' },
  safety: { label: 'Безопасность', color: 'hsl(38 92% 50%)', bgColor: 'hsl(38 92% 96%)' },
  gratitude: { label: 'Благодарность', color: 'hsl(142 71% 45%)', bgColor: 'hsl(142 71% 96%)' },
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
