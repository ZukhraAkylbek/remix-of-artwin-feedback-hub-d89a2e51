import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n, LANGUAGES, Language } from '@/lib/i18n';

export const LanguageSelector = () => {
  const { language, setLanguage } = useI18n();
  const currentLang = LANGUAGES.find(l => l.code === language);

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
      <SelectTrigger className="w-auto gap-2 h-9 px-3 bg-background border-border">
        <Globe className="w-4 h-4" />
        <SelectValue>
          {currentLang?.flag} {currentLang?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-background border border-border z-50">
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
