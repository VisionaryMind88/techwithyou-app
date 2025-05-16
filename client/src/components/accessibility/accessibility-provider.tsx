import React, { useState, useEffect, ReactNode } from 'react';
import { 
  AccessibilityContext, 
  AccessibilityState, 
  TextSize, 
  FocusMode,
  detectUserAccessibilityPreferences 
} from '@/lib/accessibility';

interface AccessibilityProviderProps {
  children: ReactNode;
}

// Local storage key for storing accessibility preferences
const STORAGE_KEY = 'tech_with_you_accessibility_preferences';

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [state, setState] = useState<AccessibilityState>(() => {
    // Try to load stored preferences
    if (typeof window !== 'undefined') {
      const storedPrefs = localStorage.getItem(STORAGE_KEY);
      if (storedPrefs) {
        try {
          return JSON.parse(storedPrefs) as AccessibilityState;
        } catch (e) {
          console.error('Failed to parse stored accessibility preferences', e);
        }
      }
    }
    
    // Use system preferences if available or default state
    return {
      mode: 'default',
      textSize: 'default',
      focusMode: 'default',
      screenReaderMode: false,
      isHighContrast: false,
      isReducedMotion: false,
      ...detectUserAccessibilityPreferences(),
    };
  });
  
  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    // Apply CSS classes to body
    document.body.classList.toggle('high-contrast-mode', state.isHighContrast);
    document.body.classList.toggle('reduced-motion', state.isReducedMotion);
    document.body.classList.toggle('screen-reader-mode', state.screenReaderMode);
    
    // Apply text size classes
    document.body.classList.remove('text-size-large', 'text-size-xl');
    if (state.textSize === 'large') {
      document.body.classList.add('text-size-large');
    } else if (state.textSize === 'extra-large') {
      document.body.classList.add('text-size-xl');
    }
    
    // Apply focus mode classes
    document.body.classList.toggle('focus-enhanced', state.focusMode === 'enhanced');
    
  }, [state]);
  
  // Toggle high contrast mode
  const toggleHighContrast = () => {
    setState(prev => ({ 
      ...prev, 
      isHighContrast: !prev.isHighContrast,
      mode: !prev.isHighContrast ? 'high-contrast' : 'default'
    }));
  };
  
  // Toggle reduced motion mode
  const toggleReducedMotion = () => {
    setState(prev => ({ 
      ...prev, 
      isReducedMotion: !prev.isReducedMotion,
      mode: !prev.isReducedMotion ? 'reduced-motion' : 'default'
    }));
  };
  
  // Toggle screen reader optimizations
  const toggleScreenReader = () => {
    setState(prev => ({ ...prev, screenReaderMode: !prev.screenReaderMode }));
  };
  
  // Set text size
  const setTextSize = (size: TextSize) => {
    setState(prev => ({ ...prev, textSize: size }));
  };
  
  // Set focus mode
  const setFocusMode = (mode: FocusMode) => {
    setState(prev => ({ ...prev, focusMode: mode }));
  };
  
  // Reset all accessibility settings to defaults
  const reset = () => {
    setState({
      mode: 'default',
      textSize: 'default',
      focusMode: 'default',
      screenReaderMode: false,
      isHighContrast: false,
      isReducedMotion: false,
    });
  };
  
  const contextValue = {
    state,
    toggleHighContrast,
    toggleReducedMotion,
    toggleScreenReader,
    setTextSize,
    setFocusMode,
    reset,
  };
  
  return (
    <AccessibilityContext.Provider value={contextValue}>
      {/* Screen reader announcer element */}
      <div 
        id="screen-reader-announcer" 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      ></div>
      
      {children}
    </AccessibilityContext.Provider>
  );
}