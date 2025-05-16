// Accessibility context and utilities
import { createContext, useContext, useEffect, useState } from 'react';

export type AccessibilityMode = 'default' | 'high-contrast' | 'reduced-motion';
export type TextSize = 'default' | 'large' | 'extra-large';
export type FocusMode = 'default' | 'enhanced';

export interface AccessibilityState {
  mode: AccessibilityMode;
  textSize: TextSize;
  focusMode: FocusMode;
  screenReaderMode: boolean;
  isHighContrast: boolean;
  isReducedMotion: boolean;
}

export interface AccessibilityContextType {
  state: AccessibilityState;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleScreenReader: () => void;
  setTextSize: (size: TextSize) => void;
  setFocusMode: (mode: FocusMode) => void;
  reset: () => void;
}

const defaultState: AccessibilityState = {
  mode: 'default',
  textSize: 'default',
  focusMode: 'default',
  screenReaderMode: false,
  isHighContrast: false,
  isReducedMotion: false,
};

export const AccessibilityContext = createContext<AccessibilityContextType>({
  state: defaultState,
  toggleHighContrast: () => {},
  toggleReducedMotion: () => {},
  toggleScreenReader: () => {},
  setTextSize: () => {},
  setFocusMode: () => {},
  reset: () => {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

// Helper to apply certain class names based on accessibility state
export const getAccessibilityClasses = (state: AccessibilityState): string => {
  const classes: string[] = [];
  
  if (state.isHighContrast) {
    classes.push('high-contrast-mode');
  }
  
  if (state.isReducedMotion) {
    classes.push('reduced-motion');
  }
  
  if (state.screenReaderMode) {
    classes.push('screen-reader-mode');
  }
  
  if (state.textSize === 'large') {
    classes.push('text-size-large');
  } else if (state.textSize === 'extra-large') {
    classes.push('text-size-xl');
  }
  
  if (state.focusMode === 'enhanced') {
    classes.push('focus-enhanced');
  }
  
  return classes.join(' ');
};

// Check if user has set any accessibility preferences at system level
export const detectUserAccessibilityPreferences = (): Partial<AccessibilityState> => {
  const preferences: Partial<AccessibilityState> = {};
  
  if (typeof window !== 'undefined') {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      preferences.isReducedMotion = true;
      preferences.mode = 'reduced-motion';
    }
    
    // Check for high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
    if (prefersHighContrast) {
      preferences.isHighContrast = true;
      preferences.mode = 'high-contrast';
    }
  }
  
  return preferences;
};

// Utility to announce messages to screen readers
export const announceToScreenReader = (message: string): void => {
  const announcer = document.getElementById('screen-reader-announcer');
  
  if (!announcer) {
    // Create the announcer element if it doesn't exist
    const element = document.createElement('div');
    element.id = 'screen-reader-announcer';
    element.className = 'sr-only';
    element.setAttribute('aria-live', 'polite');
    element.setAttribute('aria-atomic', 'true');
    document.body.appendChild(element);
    
    // Announce the message
    setTimeout(() => {
      element.textContent = message;
    }, 100);
  } else {
    // Use existing announcer
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
  }
};

// Hook for managing keybaord navigation
export const useKeyboardNavigation = (
  items: HTMLElement[],
  onSelect: (item: HTMLElement) => void
) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!items.length) return;
    
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % items.length);
        break;
        
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          onSelect(items[focusedIndex]);
        }
        break;
        
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
        
      case 'End':
        e.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
        
      default:
        break;
    }
  };
  
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < items.length) {
      items[focusedIndex].focus();
    }
  }, [focusedIndex, items]);
  
  return { focusedIndex, handleKeyDown };
};