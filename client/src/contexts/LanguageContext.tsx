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
  'action.edit': {
    nl: 'Bewerken',
    en: 'Edit',
  },
  'action.view': {
    nl: 'Bekijken',
    en: 'View',
  },
  'action.upload': {
    nl: 'Uploaden',
    en: 'Upload',
  },
  'action.download': {
    nl: 'Downloaden',
    en: 'Download',
  },
  'action.search': {
    nl: 'Zoeken',
    en: 'Search',
  },
  'action.filter': {
    nl: 'Filteren',
    en: 'Filter',
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
  'projects.name': {
    nl: 'Projectnaam',
    en: 'Project Name',
  },
  'projects.description': {
    nl: 'Beschrijving',
    en: 'Description',
  },
  'projects.deadline': {
    nl: 'Deadline',
    en: 'Deadline',
  },
  'projects.client': {
    nl: 'Klant',
    en: 'Client',
  },
  'projects.manager': {
    nl: 'Projectmanager',
    en: 'Project Manager',
  },
  'projects.team': {
    nl: 'Team',
    en: 'Team',
  },
  'projects.progress': {
    nl: 'Voortgang',
    en: 'Progress',
  },
  'projects.created': {
    nl: 'Aangemaakt op',
    en: 'Created on',
  },
  'projects.updated': {
    nl: 'Bijgewerkt op',
    en: 'Updated on',
  },
  'projects.files': {
    nl: 'Bestanden',
    en: 'Files',
  },
  'projects.noProjects': {
    nl: 'Geen projecten gevonden',
    en: 'No projects found',
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
  'messages.reply': {
    nl: 'Beantwoorden',
    en: 'Reply',
  },
  'messages.from': {
    nl: 'Van',
    en: 'From',
  },
  'messages.to': {
    nl: 'Aan',
    en: 'To',
  },
  'messages.subject': {
    nl: 'Onderwerp',
    en: 'Subject',
  },
  'messages.content': {
    nl: 'Inhoud',
    en: 'Content',
  },
  'messages.date': {
    nl: 'Datum',
    en: 'Date',
  },
  'messages.noMessages': {
    nl: 'Geen berichten gevonden',
    en: 'No messages found',
  },
  'messages.newMessage': {
    nl: 'Nieuw Bericht',
    en: 'New Message',
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
  'settings.language': {
    nl: 'Taal',
    en: 'Language',
  },
  'settings.theme': {
    nl: 'Thema',
    en: 'Theme',
  },
  'settings.security': {
    nl: 'Beveiliging',
    en: 'Security',
  },
  'settings.privacy': {
    nl: 'Privacy',
    en: 'Privacy',
  },
  
  // Dashboard
  'dashboard.welcome': {
    nl: 'Welkom bij',
    en: 'Welcome to',
  },
  'dashboard.summary': {
    nl: 'Samenvatting',
    en: 'Summary',
  },
  'dashboard.recentActivity': {
    nl: 'Recente Activiteit',
    en: 'Recent Activity',
  },
  'dashboard.recentProjects': {
    nl: 'Recente Projecten',
    en: 'Recent Projects',
  },
  'dashboard.recentMessages': {
    nl: 'Recente Berichten',
    en: 'Recent Messages',
  },
  'dashboard.projectOverview': {
    nl: 'Project Overzicht',
    en: 'Project Overview',
  },
  'dashboard.tasks': {
    nl: 'Taken',
    en: 'Tasks',
  },
  'dashboard.calendar': {
    nl: 'Kalender',
    en: 'Calendar',
  },
  'dashboard.stats': {
    nl: 'Statistieken',
    en: 'Statistics',
  },
  'dashboard.adminTitle': {
    nl: 'Admin Dashboard',
    en: 'Admin Dashboard',
  },
  'dashboard.analyticsOverview': {
    nl: 'Analyse Overzicht',
    en: 'Analytics Overview',
  },
  'dashboard.recentProjectRequests': {
    nl: 'Recente Project Verzoeken',
    en: 'Recent Project Requests',
  },
  'dashboard.customerActivity': {
    nl: 'Klant Activiteit',
    en: 'Customer Activity',
  },
  'dashboard.advancedAnalytics': {
    nl: 'Geavanceerde Analyses',
    en: 'Advanced Analytics',
  },
  
  // User profile
  'profile.name': {
    nl: 'Naam',
    en: 'Name',
  },
  'profile.email': {
    nl: 'E-mail',
    en: 'Email',
  },
  'profile.phone': {
    nl: 'Telefoon',
    en: 'Phone',
  },
  'profile.address': {
    nl: 'Adres',
    en: 'Address',
  },
  'profile.bio': {
    nl: 'Biografie',
    en: 'Bio',
  },
  'profile.role': {
    nl: 'Rol',
    en: 'Role',
  },
  'profile.joinDate': {
    nl: 'Lid sinds',
    en: 'Member since',
  },
  'profile.lastLogin': {
    nl: 'Laatste login',
    en: 'Last login',
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
  
  // Files
  'files.upload': {
    nl: 'Bestand uploaden',
    en: 'Upload file',
  },
  'files.download': {
    nl: 'Download',
    en: 'Download',
  },
  'files.preview': {
    nl: 'Voorbeeld',
    en: 'Preview',
  },
  'files.delete': {
    nl: 'Verwijderen',
    en: 'Delete',
  },
  'files.size': {
    nl: 'Grootte',
    en: 'Size',
  },
  'files.type': {
    nl: 'Type',
    en: 'Type',
  },
  'files.name': {
    nl: 'Bestandsnaam',
    en: 'Filename',
  },
  'files.dateAdded': {
    nl: 'Datum toegevoegd',
    en: 'Date added',
  },
  'files.noFiles': {
    nl: 'Geen bestanden gevonden',
    en: 'No files found',
  },

  // Tracking
  'tracking.title': {
    nl: 'Live Tracking',
    en: 'Live Tracking',
  },
  'tracking.status': {
    nl: 'Status',
    en: 'Status',
  },
  'tracking.active': {
    nl: 'Actief',
    en: 'Active',
  },
  'tracking.inactive': {
    nl: 'Inactief',
    en: 'Inactive',
  },
  'tracking.lastUpdate': {
    nl: 'Laatste update',
    en: 'Last update',
  },
  'tracking.noItems': {
    nl: 'Geen tracking items gevonden',
    en: 'No tracking items found',
  },
  'tracking.addNew': {
    nl: 'Nieuw tracking item',
    en: 'New tracking item',
  },
  'tracking.deactivate': {
    nl: 'Deactiveren',
    en: 'Deactivate',
  },
  'tracking.activate': {
    nl: 'Activeren',
    en: 'Activate',
  },
  'tracking.description': {
    nl: 'Beheer en monitor real-time tracking items',
    en: 'Monitor and manage real-time tracking items',
  },
  'tracking.chat': {
    nl: 'Chat',
    en: 'Chat',
  },
  'tracking.live': {
    nl: 'LIVE',
    en: 'LIVE',
  },
  'tracking.noDescription': {
    nl: 'Geen beschrijving beschikbaar',
    en: 'No description provided',
  },
  'tracking.all': {
    nl: 'Alle tracking items',
    en: 'All tracking items',
  },
  'tracking.settings': {
    nl: 'Tracking instellingen',
    en: 'Tracking settings',
  },
  'tracking.settingsTitle': {
    nl: 'Instellingen',
    en: 'Settings',
  },
  'tracking.settingsDescription': {
    nl: 'Configureer hoe tracking items worden weergegeven en bijgewerkt',
    en: 'Configure how tracking items are displayed and updated',
  },
  'tracking.settingsAutoRefresh': {
    nl: 'Automatisch vernieuwen',
    en: 'Auto refresh',
  },
  'tracking.settingsNotifications': {
    nl: 'Notificaties',
    en: 'Notifications',
  },
  'status.pending': {
    nl: 'In afwachting',
    en: 'Pending',
  },
  'status.online': {
    nl: 'Online',
    en: 'Online',
  },
  'status.offline': {
    nl: 'Offline',
    en: 'Offline',
  },
  'status.inactive': {
    nl: 'Inactief',
    en: 'Inactive',
  },
  'action.openLink': {
    nl: 'Open Link',
    en: 'Open Link',
  },
  'common.backToDashboard': {
    nl: 'Ga terug naar Dashboard',
    en: 'Go back to Dashboard',
  },
  'common.enabled': {
    nl: 'Ingeschakeld',
    en: 'Enabled',
  },
  'common.configure': {
    nl: 'Configureren',
    en: 'Configure',
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