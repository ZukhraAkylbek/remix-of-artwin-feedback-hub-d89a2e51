import { Department, AIAnalysis } from '@/types/feedback';

const DEPARTMENT_KEYWORDS: Record<Department, string[]> = {
  management: ['руководство', 'директор', 'стратегия', 'решение', 'управление'],
  sales: ['продажи', 'клиент', 'сделка', 'контракт', 'выручка'],
  it: ['компьютер', 'программа', 'сервер', 'интернет', 'система', 'техподдержка'],
  logistics: ['доставка', 'транспорт', 'маршрут', 'перевозка', 'груз'],
  accounting: ['бухгалтерия', 'счет', 'оплата', 'налог', 'отчет', 'финансы'],
  warehouse: ['склад', 'хранение', 'товар', 'инвентарь', 'запас'],
  hr: ['сотрудник', 'зарплата', 'отпуск', 'увольнение', 'найм', 'кадры', 'коллектив', 'обучение'],
  marketing: ['реклама', 'маркетинг', 'продвижение', 'бренд', 'кампания'],
  design: ['дизайн', 'макет', 'визуал', 'оформление', 'графика'],
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

export const generateAutoResponse = async (message: string, type: 'complaint' | 'suggestion'): Promise<string> => {
  return type === 'complaint' 
    ? 'Благодарим вас за обращение. Мы зафиксировали вашу жалобу и приступили к её рассмотрению. Наши специалисты свяжутся с вами в ближайшее время.'
    : 'Спасибо за ваше предложение! Мы ценим вашу обратную связь и обязательно рассмотрим её на ближайшем совещании.';
};
