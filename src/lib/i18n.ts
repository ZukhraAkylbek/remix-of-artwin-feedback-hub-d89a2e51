import { ReactNode } from 'react';
import { create } from 'zustand';

export type Language = 'ru' | 'ky' | 'zh' | 'en';

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ky', label: 'Кыргызча', flag: '🇰🇬' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

const translations = {
  ru: {
    feedback: 'Обратная связь',
    selectRole: 'Выберите вашу роль, чтобы начать',
    employee: 'Сотрудник',
    employeeDesc: 'Работник компании',
    client: 'Клиент',
    clientDesc: 'Заказчик услуг',
    contractor: 'Подрядчик',
    contractorDesc: 'Партнёр или поставщик',
    resident: 'Владелец квартиры',
    residentDesc: 'Жилец жилого комплекса',
    feedbackType: 'Тип обращения',
    whatToReport: 'Что вы хотите сообщить?',
    remark: 'Замечание',
    remarkDesc: 'Сообщить о проблеме или недостатке',
    suggestion: 'Предложение',
    suggestionDesc: 'Идея для улучшения',
    safety: 'Безопасность',
    safetyDesc: 'Вопрос, связанный с безопасностью',
    gratitude: 'Благодарность',
    gratitudeDesc: 'Выразить благодарность',
    anonymous: 'Анонимное обращение',
    yourName: 'Ваше имя',
    namePlaceholder: 'Иван Иванов',
    contactInfo: 'Контакт для связи',
    emailOrPhone: 'Email или телефон',
    message: 'Сообщение',
    describeMessage: 'Опишите ваше обращение...',
    department: 'Департамент',
    selectDepartment: 'Выберите департамент',
    object: 'Объект',
    selectObject: 'Выберите объект',
    attachFile: 'Прикрепить файл',
    submit: 'Отправить',
    submitting: 'Отправка...',
    management: 'Руководство',
    sales: 'Продажи',
    hr: 'HR',
    marketing: 'Маркетинг',
    favorites_ssl: 'Любимчики - ССЛ',
    construction_tech: 'Стройка - Техотдел',
    other: 'Прочее',
    successTitle: 'Обращение отправлено!',
    successDesc: 'Спасибо за ваше обращение. Мы рассмотрим его в ближайшее время.',
    newFeedback: 'Новое обращение',
    back: 'Назад',
    errorMessage: 'Пожалуйста, введите сообщение',
    errorSubmit: 'Ошибка при отправке. Попробуйте снова.',
    successSubmit: 'Ваше обращение успешно отправлено!',
  },
  ky: {
    feedback: 'Кайтарым байланыш',
    selectRole: 'Баштоо үчүн ролуңузду тандаңыз',
    employee: 'Кызматкер',
    employeeDesc: 'Компаниянын кызматкери',
    client: 'Кардар',
    clientDesc: 'Кызмат буюртмачысы',
    contractor: 'Подрядчик',
    contractorDesc: 'Өнөктөш же жеткирүүчү',
    resident: 'Батир ээси',
    residentDesc: 'Турак жай комплексинин тургуну',
    feedbackType: 'Кайрылуу түрү',
    whatToReport: 'Эмне жөнүндө кабарлагыңыз келет?',
    remark: 'Эскертүү',
    remarkDesc: 'Көйгөй же кемчилик жөнүндө кабарлоо',
    suggestion: 'Сунуш',
    suggestionDesc: 'Жакшыртуу үчүн идея',
    safety: 'Коопсуздук',
    safetyDesc: 'Коопсуздук маселеси',
    gratitude: 'Ыраазычылык',
    gratitudeDesc: 'Ыраазычылык билдирүү',
    anonymous: 'Аноним кайрылуу',
    yourName: 'Сиздин атыңыз',
    namePlaceholder: 'Асан Асанов',
    contactInfo: 'Байланыш',
    emailOrPhone: 'Email же телефон',
    message: 'Билдирүү',
    describeMessage: 'Кайрылууңузду сүрөттөп бериңиз...',
    department: 'Бөлүм',
    selectDepartment: 'Бөлүмдү тандаңыз',
    object: 'Объект',
    selectObject: 'Объектти тандаңыз',
    attachFile: 'Файл тиркөө',
    submit: 'Жөнөтүү',
    submitting: 'Жөнөтүлүүдө...',
    management: 'Жетекчилик',
    sales: 'Сатуу',
    hr: 'HR',
    marketing: 'Маркетинг',
    favorites_ssl: 'Сүйүктүүлөр - ССЛ',
    construction_tech: 'Курулуш - Техотдел',
    other: 'Башка',
    successTitle: 'Кайрылуу жөнөтүлдү!',
    successDesc: 'Кайрылууңуз үчүн рахмат. Биз аны жакын арада карайбыз.',
    newFeedback: 'Жаңы кайрылуу',
    back: 'Артка',
    errorMessage: 'Сураныч, билдирүү киргизиңиз',
    errorSubmit: 'Жөнөтүүдө ката. Кайра аракет кылыңыз.',
    successSubmit: 'Кайрылууңуз ийгиликтүү жөнөтүлдү!',
  },
  zh: {
    feedback: '反馈',
    selectRole: '请选择您的角色以开始',
    employee: '员工',
    employeeDesc: '公司员工',
    client: '客户',
    clientDesc: '服务订购者',
    contractor: '承包商',
    contractorDesc: '合作伙伴或供应商',
    resident: '业主',
    residentDesc: '住宅小区住户',
    feedbackType: '反馈类型',
    whatToReport: '您想报告什么？',
    remark: '意见',
    remarkDesc: '报告问题或不足',
    suggestion: '建议',
    suggestionDesc: '改进建议',
    safety: '安全',
    safetyDesc: '安全相关问题',
    gratitude: '感谢',
    gratitudeDesc: '表达感谢',
    anonymous: '匿名反馈',
    yourName: '您的姓名',
    namePlaceholder: '张三',
    contactInfo: '联系方式',
    emailOrPhone: '电子邮件或电话',
    message: '消息',
    describeMessage: '描述您的反馈...',
    department: '部门',
    selectDepartment: '选择部门',
    object: '项目',
    selectObject: '选择项目',
    attachFile: '附加文件',
    submit: '提交',
    submitting: '提交中...',
    management: '管理层',
    sales: '销售',
    hr: '人力资源',
    marketing: '市场营销',
    favorites_ssl: '喜爱 - ССЛ',
    construction_tech: '建设 - 技术部',
    other: '其他',
    successTitle: '反馈已提交！',
    successDesc: '感谢您的反馈。我们会尽快处理。',
    newFeedback: '新反馈',
    back: '返回',
    errorMessage: '请输入消息',
    errorSubmit: '提交失败。请重试。',
    successSubmit: '您的反馈已成功提交！',
  },
  en: {
    feedback: 'Feedback',
    selectRole: 'Select your role to begin',
    employee: 'Employee',
    employeeDesc: 'Company employee',
    client: 'Client',
    clientDesc: 'Service customer',
    contractor: 'Contractor',
    contractorDesc: 'Partner or supplier',
    resident: 'Apartment Owner',
    residentDesc: 'Residential complex resident',
    feedbackType: 'Feedback Type',
    whatToReport: 'What would you like to report?',
    remark: 'Remark',
    remarkDesc: 'Report a problem or issue',
    suggestion: 'Suggestion',
    suggestionDesc: 'Idea for improvement',
    safety: 'Safety',
    safetyDesc: 'Safety-related issue',
    gratitude: 'Gratitude',
    gratitudeDesc: 'Express gratitude',
    anonymous: 'Anonymous feedback',
    yourName: 'Your name',
    namePlaceholder: 'John Smith',
    contactInfo: 'Contact information',
    emailOrPhone: 'Email or phone',
    message: 'Message',
    describeMessage: 'Describe your feedback...',
    department: 'Department',
    selectDepartment: 'Select department',
    object: 'Object',
    selectObject: 'Select object',
    attachFile: 'Attach file',
    submit: 'Submit',
    submitting: 'Submitting...',
    management: 'Management',
    sales: 'Sales',
    hr: 'HR',
    marketing: 'Marketing',
    favorites_ssl: 'Favorites - SSL',
    construction_tech: 'Construction - Tech',
    other: 'Other',
    successTitle: 'Feedback submitted!',
    successDesc: 'Thank you for your feedback. We will review it soon.',
    newFeedback: 'New feedback',
    back: 'Back',
    errorMessage: 'Please enter a message',
    errorSubmit: 'Error submitting. Please try again.',
    successSubmit: 'Your feedback was successfully submitted!',
  },
};

type TranslationKey = keyof typeof translations.ru;

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language');
    if (saved && ['ru', 'ky', 'zh', 'en'].includes(saved)) {
      return saved as Language;
    }
  }
  return 'ru';
};

export const useI18nStore = create<I18nStore>((set) => ({
  language: getInitialLanguage(),
  setLanguage: (lang: Language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
    set({ language: lang });
  },
}));

export const useI18n = () => {
  const { language, setLanguage } = useI18nStore();
  
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.ru[key] || key;
  };

  return { language, setLanguage, t };
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  return children;
};
