export type UserRole = 'employee' | 'client' | 'contractor';
export type FeedbackType = 'complaint' | 'suggestion';
export type Department = 'management' | 'sales' | 'it' | 'logistics' | 'accounting' | 'warehouse' | 'hr' | 'marketing' | 'design';
export type FeedbackStatus = 'new' | 'in_progress' | 'resolved';
export type Urgency = 'normal' | 'urgent';

export interface Feedback {
  id: string;
  createdAt: string;
  userRole: UserRole;
  type: FeedbackType;
  name: string;
  isAnonymous: boolean;
  contact: string;
  message: string;
  urgency: Urgency;
  department: Department;
  status: FeedbackStatus;
  attachmentName?: string;
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
}
