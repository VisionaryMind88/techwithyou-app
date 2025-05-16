import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define available languages
export type Language = 'nl' | 'en';

// Define context type
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Translations data structure
interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

// Translations dictionary
const translations: Translations = {
  // Common interface elements
  'app.name': {
    nl: 'Tech With You',
    en: 'Tech With You',
  },
  'nav.dashboard': {
    nl: 'Dashboard',
    en: 'Dashboard',
  },
  'nav.projects': {
    nl: 'Projecten',
    en: 'Projects',
  },
  'nav.messages': {
    nl: 'Berichten',
    en: 'Messages',
  },
  'nav.settings': {
    nl: 'Instellingen',
    en: 'Settings',
  },
  'nav.users': {
    nl: 'Gebruikers',
    en: 'Users',
  },
  
  // Actions
  'action.login': {
    nl: 'Inloggen',
    en: 'Login',
  },
  'action.logout': {
    nl: 'Uitloggen',
    en: 'Logout',
  },
  'action.save': {
    nl: 'Opslaan',
    en: 'Save',
  },
  'action.cancel': {
    nl: 'Annuleren',
    en: 'Cancel',
  },
  'action.submit': {
    nl: 'Versturen',
    en: 'Submit',
  },
  'action.delete': {
    nl: 'Verwijderen',
    en: 'Delete',
  },
  
  // Projects
  'projects.title': {
    nl: 'Projecten',
    en: 'Projects',
  },
  'projects.create': {
    nl: 'Nieuw Project',
    en: 'New Project',
  },
  'projects.status': {
    nl: 'Status',
    en: 'Status',
  },
  
  // Messages
  'messages.title': {
    nl: 'Berichten',
    en: 'Messages',
  },
  'messages.send': {
    nl: 'Bericht Versturen',
    en: 'Send Message',
  },
  
  // Settings
  'settings.title': {
    nl: 'Instellingen',
    en: 'Settings',
  },
  'settings.profile': {
    nl: 'Profiel',
    en: 'Profile',
  },
  'settings.account': {
    nl: 'Account',
    en: 'Account',
  },
  'settings.notifications': {
    nl: 'Notificaties',
    en: 'Notifications',
  },
  
  // Accessibility
  'accessibility.settings': {
    nl: 'Toegankelijkheid',
    en: 'Accessibility',
  },
  'accessibility.reducedMotion': {
    nl: 'Verminder Animaties',
    en: 'Reduce Animations',
  },
  'accessibility.highContrast': {
    nl: 'Hoog Contrast',
    en: 'High Contrast',
  },
  'accessibility.largeText': {
    nl: 'Grote Tekst',
    en: 'Large Text',
  },

  // Language
  'language.switcher': {
    nl: 'Taal',
    en: 'Language', 
  },
  'language.nl': {
    nl: 'Nederlands',
    en: 'Dutch',
  },
  'language.en': {
    nl: 'Engels',
    en: 'English',
  },
};

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = 'tech-with-you-language';

// Provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('nl'); // Default to Dutch

  // Load saved language preference on initial render
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem(STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'nl' || savedLanguage === 'en')) {
        setLanguageState(savedLanguage as Language);
      } else {
        // If no saved preference, check browser language
        const browserLang = navigator.language.substring(0, 2).toLowerCase();
        if (browserLang === 'nl' || browserLang === 'en') {
          setLanguageState(browserLang as Language);
        }
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  }, []);

  // Update language and save to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      // Announce language change for screen readers
      const announcement = document.getElementById('language-announcement');
      if (announcement) {
        const langName = lang === 'nl' ? 'Nederlands' : 'English';
        announcement.textContent = `Language changed to ${langName}`;
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Translation function
  const t = (key: string): string => {
    if (!translations[key]) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return translations[key][language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
      <div 
        id="language-announcement" 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      ></div>
    </LanguageContext.Provider>
  );
}

// Hook for using language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}