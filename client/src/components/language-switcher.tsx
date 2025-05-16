import React, { useState } from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-1 px-2 rounded-full ${className}`}
          aria-label={t('language.switcher')}
        >
          <Globe className="h-4 w-4" />
          <span className="font-medium uppercase">{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          className={`flex items-center gap-2 ${language === 'nl' ? 'bg-primary/10' : ''}`}
          onClick={() => handleLanguageChange('nl')}
        >
          <span className={`w-6 text-center ${language === 'nl' ? 'font-bold' : ''}`}>NL</span>
          <span>{t('language.nl')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`flex items-center gap-2 ${language === 'en' ? 'bg-primary/10' : ''}`}
          onClick={() => handleLanguageChange('en')}
        >
          <span className={`w-6 text-center ${language === 'en' ? 'font-bold' : ''}`}>EN</span>
          <span>{t('language.en')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}