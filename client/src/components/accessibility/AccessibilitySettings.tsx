import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, ZoomIn, Eye, Sparkles } from 'lucide-react';

interface AccessibilitySettingsProps {
  className?: string;
  triggerLabel?: string;
}

// Define interface for accessibility settings
interface AccessibilityOptions {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  fontScale: number;
}

// Default settings
const defaultSettings: AccessibilityOptions = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  fontScale: 1.0,
};

// Local storage key for settings
const STORAGE_KEY = 'tech-with-you-accessibility-settings';

export function AccessibilitySettings({ 
  className, 
  triggerLabel = "Accessibility Settings" 
}: AccessibilitySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilityOptions>(defaultSettings);

  // Load settings from localStorage on initial render
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        // Check if user has reduced motion preference set in their OS
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
          setSettings(prev => ({ ...prev, reducedMotion: true }));
        }
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  }, []);

  // Apply settings to document/HTML whenever they change
  useEffect(() => {
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
    
    // Announce changes to screen readers
    const announcement = document.getElementById('accessibility-announcement');
    if (announcement) {
      const changes = [];
      if (settings.reducedMotion) changes.push('reduced motion enabled');
      if (settings.highContrast) changes.push('high contrast enabled');
      if (settings.largeText) changes.push('large text enabled');
      if (settings.fontScale !== 1.0) changes.push(`font scale set to ${settings.fontScale.toFixed(1)}`);
      
      if (changes.length > 0) {
        announcement.textContent = `Accessibility settings updated: ${changes.join(', ')}`;
      }
    }
  }, [settings]);

  const handleToggleReducedMotion = () => {
    setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const handleToggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const handleToggleLargeText = () => {
    setSettings(prev => ({ ...prev, largeText: !prev.largeText }));
  };

  const handleFontScaleChange = (value: number[]) => {
    setSettings(prev => ({ ...prev, fontScale: value[0] }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <>
      {/* Hidden announcement for screen readers */}
      <div 
        id="accessibility-announcement" 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      ></div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`flex items-center gap-2 ${className}`}
            aria-label={triggerLabel}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline-block">{triggerLabel}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle id="accessibility-dialog-title">Accessibility Settings</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Display Preferences</h3>
              
              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-gray-500" />
                  <label 
                    htmlFor="reduced-motion" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Reduce animations
                  </label>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={settings.reducedMotion}
                  onCheckedChange={handleToggleReducedMotion}
                  aria-describedby="reduced-motion-description"
                />
              </div>
              <p id="reduced-motion-description" className="text-xs text-gray-500 dark:text-gray-400">
                Minimizes animations and motion effects throughout the application.
              </p>
              
              {/* High Contrast */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <label 
                    htmlFor="high-contrast" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    High contrast mode
                  </label>
                </div>
                <Switch
                  id="high-contrast"
                  checked={settings.highContrast}
                  onCheckedChange={handleToggleHighContrast}
                  aria-describedby="high-contrast-description"
                />
              </div>
              <p id="high-contrast-description" className="text-xs text-gray-500 dark:text-gray-400">
                Increases contrast for better text readability and visibility.
              </p>
              
              {/* Text Size */}
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Text Size</h3>
                
                {/* Large Text */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ZoomIn className="h-4 w-4 text-gray-500" />
                    <label 
                      htmlFor="large-text" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Large text
                    </label>
                  </div>
                  <Switch
                    id="large-text"
                    checked={settings.largeText}
                    onCheckedChange={handleToggleLargeText}
                    aria-describedby="large-text-description"
                  />
                </div>
                <p id="large-text-description" className="text-xs text-gray-500 dark:text-gray-400">
                  Increases the base text size throughout the application.
                </p>
                
                {/* Font Scale */}
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <label 
                      htmlFor="font-scale-slider" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Font scale: {settings.fontScale.toFixed(1)}x
                    </label>
                  </div>
                  <Slider
                    id="font-scale-slider"
                    defaultValue={[1.0]}
                    max={2.0}
                    min={0.8}
                    step={0.1}
                    value={[settings.fontScale]}
                    onValueChange={handleFontScaleChange}
                    className="w-full"
                    aria-describedby="font-scale-description"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.8x</span>
                    <span>1.0x</span>
                    <span>1.5x</span>
                    <span>2.0x</span>
                  </div>
                  <p id="font-scale-description" className="text-xs text-gray-500 dark:text-gray-400">
                    Adjusts the size of all text elements.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={resetSettings}
                aria-label="Reset all accessibility settings to default values"
              >
                Reset to Defaults
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                aria-label="Save settings and close dialog"
              >
                Save & Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}