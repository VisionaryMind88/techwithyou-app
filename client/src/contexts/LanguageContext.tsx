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
  'messages.about': {
    nl: 'Over',
    en: 'About',
  },
  'messages.toAdmin': {
    nl: 'Uw bericht wordt verzonden naar het admin team',
    en: 'Your message will be sent to the admin team',
  },
  'messages.typeMessage': {
    nl: 'Typ hier uw bericht...',
    en: 'Type your message here...',
  },
  'messages.sending': {
    nl: 'Verzenden...',
    en: 'Sending...',
  },
  'messages.sentSuccessfully': {
    nl: 'Bericht succesvol verzonden',
    en: 'Message sent successfully',
  },
  'messages.adminNotified': {
    nl: 'Een beheerder zal binnenkort op uw bericht reageren.',
    en: 'An administrator will respond to your message soon.',
  },
  'messages.error': {
    nl: 'Fout',
    en: 'Error',
  },
  'messages.sendError': {
    nl: 'Bericht verzenden mislukt. Probeer het opnieuw.',
    en: 'Failed to send message. Please try again.',
  },
  'messages.send': {
    nl: 'Bericht versturen',
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
  
  // Help system
  'help.title': {
    nl: 'Hulp & Ondersteuning',
    en: 'Help & Support',
  },
  'help.loading': {
    nl: 'Hulpinformatie laden...',
    en: 'Loading help information...',
  },
  'help.askPlaceholder': {
    nl: 'Stel een vraag...',
    en: 'Ask a question...',
  },
  'help.askAI': {
    nl: 'Stel een vraag aan AI',
    en: 'Ask AI a question',
  },
  'help.hideAI': {
    nl: 'Verberg AI assistent',
    en: 'Hide AI assistant',
  },
  'help.emptyQuestion': {
    nl: 'Lege vraag',
    en: 'Empty question',
  },
  'help.typeQuestion': {
    nl: 'Typ eerst een vraag.',
    en: 'Please type a question first.',
  },
  'help.noAnswer': {
    nl: 'Sorry, ik kon geen antwoord vinden op deze vraag.',
    en: 'Sorry, I couldn\'t find an answer to this question.',
  },
  'help.aiUnavailable': {
    nl: 'AI-hulp is momenteel niet beschikbaar. Probeer het later nog eens.',
    en: 'AI help is currently unavailable. Please try again later.',
  },
  'help.errorAskingQuestion': {
    nl: 'Er is een fout opgetreden bij het verwerken van uw vraag.',
    en: 'An error occurred while processing your question.',
  },
  'help.wasHelpful': {
    nl: 'Was dit antwoord nuttig?',
    en: 'Was this answer helpful?',
  },
  'help.yes': {
    nl: 'Ja',
    en: 'Yes',
  },
  'help.no': {
    nl: 'Nee',
    en: 'No',
  },
  'help.feedbackReceived': {
    nl: 'Feedback ontvangen',
    en: 'Feedback received',
  },
  'help.thankYouFeedback': {
    nl: 'Bedankt voor je feedback!',
    en: 'Thank you for your feedback!',
  },
  'help.feedbackError': {
    nl: 'Fout bij verzenden feedback',
    en: 'Error submitting feedback',
  },
  'help.tryAgainLater': {
    nl: 'Probeer het later opnieuw.',
    en: 'Please try again later.',
  },
  'help.userQuestion': {
    nl: 'U',
    en: 'You',
  },
  'help.aiResponse': {
    nl: 'Assistent',
    en: 'Assistant',
  },
  'help.defaultHelp': {
    nl: 'Hoe kan ik je helpen? Stel een vraag over de applicatie.',
    en: 'How can I help you? Ask a question about the application.',
  },
  'help.generalHelp': {
    nl: 'Welkom bij de help functie. Kies een onderwerp of stel een vraag om hulp te krijgen.',
    en: 'Welcome to the help feature. Choose a topic or ask a question to get assistance.',
  },
  'help.dashboardHelp': {
    nl: 'Het dashboard toont een overzicht van al je projecten, recente activiteiten en berichten. Gebruik het zijmenu om te navigeren naar verschillende onderdelen van de applicatie.',
    en: 'The dashboard shows an overview of all your projects, recent activities, and messages. Use the sidebar to navigate to different parts of the application.',
  },
  'help.projectsHelp': {
    nl: 'Hier kun je al je projecten bekijken en beheren. Klik op een project om details te zien of maak een nieuw project aan.',
    en: 'Here you can view and manage all your projects. Click on a project to see details or create a new project.',
  },
  'help.messagesHelp': {
    nl: 'Communiceer hier met het projectteam. Alle berichten worden opgeslagen en zijn altijd terug te vinden per project.',
    en: 'Communicate with the project team here. All messages are stored and can always be found per project.',
  },
  'help.filesHelp': {
    nl: 'Upload en beheer bestanden voor je projecten. Je kunt meerdere versies van bestanden bijhouden en bekijken wie welke wijzigingen heeft aangebracht.',
    en: 'Upload and manage files for your projects. You can keep track of multiple versions of files and see who made which changes.',
  },
  'help.trackingHelp': {
    nl: 'Live tracking geeft je real-time inzicht in de voortgang van je projecten. Schakel items in of uit om bij te houden waar je aan werkt.',
    en: 'Live tracking gives you real-time insight into the progress of your projects. Toggle items on or off to keep track of what you\'re working on.',
  },
  'help.settingsHelp': {
    nl: 'Pas je accountinstellingen aan, wijzig je wachtwoord, en beheer je gebruikersprofiel vanuit dit scherm.',
    en: 'Adjust your account settings, change your password, and manage your user profile from this screen.',
  },
  'help.profileHelp': {
    nl: 'Beheer hier je persoonlijke informatie en profielfoto. Deze informatie is zichtbaar voor teamleden.',
    en: 'Manage your personal information and profile picture here. This information is visible to team members.',
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