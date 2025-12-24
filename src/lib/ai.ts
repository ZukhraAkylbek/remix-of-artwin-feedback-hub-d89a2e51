import { Department, AIAnalysis, FeedbackType } from '@/types/feedback';

const DEPARTMENT_KEYWORDS: Record<Department, string[]> = {
  management: ['руководство', 'директор', 'стратегия', 'решение', 'управление'],
  reception: ['ресепшн', 'приёмная', 'reception', 'встреча', 'посетитель'],
  sales: ['продажи', 'клиент', 'сделка', 'контракт', 'выручка'],
  hr: ['сотрудник', 'зарплата', 'отпуск', 'увольнение', 'найм', 'кадры', 'коллектив', 'обучение'],
  marketing: ['реклама', 'маркетинг', 'продвижение', 'бренд', 'кампания'],
  favorites_ssl: ['любимчики', 'ссл', 'ssl', 'сервис'],
  construction_tech: ['стройка', 'строительство', 'техотдел', 'технический', 'объект', 'ремонт'],
  other: ['прочее', 'другое', 'разное'],
};

export const classifyDepartment = (text: string): Department => {
  const lowerText = text.toLowerCase();
  let maxScore = 0;
  let bestDepartment: Department = 'management';

  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    const score = keywords.filter(kw => lowerText.includes(kw)).length;
    if (score > maxScore) {
      maxScore = score;
      bestDepartment = dept as Department;
    }
  }

  return bestDepartment;
};

export const analyzeWithAI = async (message: string): Promise<AIAnalysis> => {
  return {
    sentiment: message.includes('проблем') || message.includes('жалоб') ? 'negative' : 
               message.includes('хорош') || message.includes('благодар') ? 'positive' : 'neutral',
    summary: message.slice(0, 100) + (message.length > 100 ? '...' : ''),
    urgencyScore: message.toLowerCase().includes('срочн') ? 8 : 5,
    recommendedAction: 'Рассмотреть обращение и связаться с заявителем',
  };
};

export const generateAutoResponse = async (message: string, type: FeedbackType): Promise<string> => {
  const responses: Record<FeedbackType, string> = {
    remark: 'Благодарим вас за обращение. Мы зафиксировали ваше замечание и приступили к его рассмотрению.',
    suggestion: 'Спасибо за ваше предложение! Мы ценим вашу обратную связь и обязательно рассмотрим её.',
    gratitude: 'Большое спасибо за вашу благодарность! Мы рады, что наша работа вам понравилась.',
  };
  return responses[type] || 'Благодарим за ваше обращение.';
};
