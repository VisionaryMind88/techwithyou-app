import React, { createContext, useContext, useState, useEffect } from 'react';

type AccessibilityMode = 'default' | 'high-contrast' | 'reduced-motion';
type TextSize = 'default' | 'large' | 'larger';

interface AccessibilityContextType {
  mode: AccessibilityMode;
  textSize: TextSize;
  isScreenReaderOptimized: boolean;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  setMode: (mode: AccessibilityMode) => void;
  setTextSize: (size: TextSize) => void;
  toggleScreenReaderOptimization: () => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  // Load settings from localStorage if available
  const [mode, setMode] = useState<AccessibilityMode>(() => {
    const savedMode = localStorage.getItem('accessibility-mode');
    return (savedMode as AccessibilityMode) || 'default';
  });
  
  const [textSize, setTextSize] = useState<TextSize>(() => {
    const savedSize = localStorage.getItem('accessibility-text-size');
    return (savedSize as TextSize) || 'default';
  });
  
  const [isScreenReaderOptimized, setIsScreenReaderOptimized] = useState<boolean>(() => {
    return localStorage.getItem('accessibility-screen-reader') === 'true';
  });

  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('accessibility-high-contrast') === 'true' || mode === 'high-contrast';
  });

  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(() => {
    return localStorage.getItem('accessibility-reduced-motion') === 'true' || mode === 'reduced-motion';
  });

  // Effect to check for prefers-reduced-motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !isReducedMotion) {
      setIsReducedMotion(true);
      setMode('reduced-motion');
    }
  }, []);

  // Effect to handle mode changes
  useEffect(() => {
    localStorage.setItem('accessibility-mode', mode);
    
    // Set related settings based on mode
    if (mode === 'high-contrast') {
      setIsHighContrast(true);
      localStorage.setItem('accessibility-high-contrast', 'true');
      document.documentElement.classList.add('high-contrast');
    } else if (mode === 'reduced-motion') {
      setIsReducedMotion(true);
      localStorage.setItem('accessibility-reduced-motion', 'true');
      document.documentElement.classList.add('reduced-motion');
    } else {
      // Default mode - respect individual settings
      document.documentElement.classList.remove('high-contrast', 'reduced-motion');
    }
  }, [mode]);

  // Effects to handle individual settings
  useEffect(() => {
    localStorage.setItem('accessibility-text-size', textSize);
    document.documentElement.dataset.textSize = textSize;
  }, [textSize]);

  useEffect(() => {
    localStorage.setItem('accessibility-screen-reader', isScreenReaderOptimized.toString());
    if (isScreenReaderOptimized) {
      document.documentElement.setAttribute('role', 'application');
      document.documentElement.classList.add('screen-reader-optimized');
    } else {
      document.documentElement.removeAttribute('role');
      document.documentElement.classList.remove('screen-reader-optimized');
    }
  }, [isScreenReaderOptimized]);

  useEffect(() => {
    localStorage.setItem('accessibility-high-contrast', isHighContrast.toString());
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else if (mode !== 'high-contrast') {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast, mode]);

  useEffect(() => {
    localStorage.setItem('accessibility-reduced-motion', isReducedMotion.toString());
    if (isReducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else if (mode !== 'reduced-motion') {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [isReducedMotion, mode]);

  const toggleScreenReaderOptimization = () => {
    setIsScreenReaderOptimized(prev => !prev);
  };

  const toggleHighContrast = () => {
    setIsHighContrast(prev => !prev);
    if (!isHighContrast) {
      setMode('high-contrast');
    } else if (mode === 'high-contrast') {
      setMode('default');
    }
  };

  const toggleReducedMotion = () => {
    setIsReducedMotion(prev => !prev);
    if (!isReducedMotion) {
      setMode('reduced-motion');
    } else if (mode === 'reduced-motion') {
      setMode('default');
    }
  };

  const value = {
    mode,
    textSize,
    isScreenReaderOptimized,
    isHighContrast,
    isReducedMotion,
    setMode,
    setTextSize,
    toggleScreenReaderOptimization,
    toggleHighContrast,
    toggleReducedMotion
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};