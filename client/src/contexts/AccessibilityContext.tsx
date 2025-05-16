import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Import our accessibility CSS files
import '../styles/accessibility.css';
import '../styles/focus-indicators.css';

// Type for our accessibility settings
interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  fontScale: number;
}

// Default accessibility settings
const defaultSettings: AccessibilitySettings = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  fontScale: 1.0,
};

// Local storage key
const STORAGE_KEY = 'tech-with-you-accessibility-settings';

// Context type definition
interface AccessibilityContextType {
  settings: AccessibilitySettings;
  setReducedMotion: (value: boolean) => void;
  setHighContrast: (value: boolean) => void;
  setLargeText: (value: boolean) => void;
  setFontScale: (value: number) => void;
  resetSettings: () => void;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
}

// Create the context
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Provider component
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved settings on initial render
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        // Check for user OS preferences if no settings are saved
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const prefersColorScheme = window.matchMedia('(prefers-color-scheme: high-contrast)').matches;
        
        if (prefersReducedMotion || prefersColorScheme) {
          setSettings(prev => ({
            ...prev,
            reducedMotion: prefersReducedMotion || prev.reducedMotion,
            highContrast: prefersColorScheme || prev.highContrast,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Apply settings to document elements
  useEffect(() => {
    if (!isInitialized) return;
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    // Apply settings to the document
    const html = document.documentElement;
    
    // Reduced motion
    if (settings.reducedMotion) {
      html.style.setProperty('--animation-duration', '0s');
      html.classList.add('reduce-motion');
    } else {
      html.style.removeProperty('--animation-duration');
      html.classList.remove('reduce-motion');
    }
    
    // High contrast
    if (settings.highContrast) {
      html.classList.add('high-contrast');
    } else {
      html.classList.remove('high-contrast');
    }
    
    // Large text
    if (settings.largeText) {
      html.classList.add('large-text');
    } else {
      html.classList.remove('large-text');
    }
    
    // Font scale
    html.style.setProperty('--font-scale', settings.fontScale.toString());
    
  }, [settings, isInitialized]);

  // Setter functions
  const setReducedMotion = (value: boolean) => {
    setSettings(prev => ({ ...prev, reducedMotion: value }));
  };

  const setHighContrast = (value: boolean) => {
    setSettings(prev => ({ ...prev, highContrast: value }));
  };

  const setLargeText = (value: boolean) => {
    setSettings(prev => ({ ...prev, largeText: value }));
  };

  const setFontScale = (value: number) => {
    setSettings(prev => ({ ...prev, fontScale: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // Context value
  const value = {
    settings,
    setReducedMotion,
    setHighContrast,
    setLargeText,
    setFontScale,
    resetSettings,
    updateSettings,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      <div 
        id="accessibility-announcement" 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      ></div>
    </AccessibilityContext.Provider>
  );
}

// Hook for using accessibility context
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Utility function to announce messages to screen readers
export function announceToScreenReader(message: string) {
  const announcement = document.getElementById('accessibility-announcement');
  if (announcement) {
    announcement.textContent = message;
  }
}