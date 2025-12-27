import { Department, AIAnalysis, FeedbackType } from '@/types/feedback';

const DEPARTMENT_KEYWORDS: Record<Department, string[]> = {
  ssl: ['недвижимость', 'собственник', 'владелец', 'квартира', 'сервис', 'любимчики', 'ссл'],
  zamgd_kom: ['продажи', 'консультация'],
  marketing: ['маркетинг', 'реклама', 'партнёрство', 'бренд', 'pr', 'продвижение'],
  service_aho: ['ресепшн', 'офис', 'приёмная', 'reception', 'встреча', 'посетитель'],
  otitb_hse: ['безопасность труда', 'hse', 'охрана труда', 'экология'],
  omto: ['закупки', 'поставки', 'снабжение', 'материалы'],
  hr: ['сотрудник', 'зарплата', 'отпуск', 'увольнение', 'найм', 'кадры', 'коллектив', 'обучение'],
  zamgd_tech: ['стройка', 'строительство', 'подрядчик', 'технический', 'объект', 'ремонт'],
  otd_razv: ['проект', 'замечание', 'решение', 'разработка'],
  legal: ['юрист', 'нотариус', 'договор', 'право', 'суд'],
  finance: ['оплата', 'финансы', 'счёт', 'деньги', 'платёж'],
  security: ['охрана', 'безопасность', 'пропуск', 'камера'],
  rukovodstvo: ['руководство', 'директор', 'управление', 'стратегия'],
};

export const classifyDepartment = (text: string): Department => {
  const lowerText = text.toLowerCase();
  let maxScore = 0;
  let bestDepartment: Department = 'ssl';

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
