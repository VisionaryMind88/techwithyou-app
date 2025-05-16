import React from 'react';
import { motion } from 'framer-motion';
import { useAccessibility } from '@/lib/accessibility';
import { Button } from '@/components/ui/button';
import { 
  Accessibility, 
  Eye, 
  Type, 
  ArrowUpDown, 
  RefreshCw, 
  MoveHorizontal, 
  Contrast, 
  MousePointer
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const { 
    state, 
    toggleHighContrast, 
    toggleReducedMotion, 
    toggleScreenReader,
    setTextSize,
    setFocusMode,
    reset
  } = useAccessibility();

  // Animations for the panel
  const panelVariants = {
    hidden: { 
      opacity: 0, 
      x: '100%',
      transition: { 
        duration: state.isReducedMotion ? 0 : 0.3,
        ease: 'easeInOut' 
      }
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: state.isReducedMotion ? 0 : 0.3,
        ease: 'easeInOut'
      }
    }
  };

  if (!isOpen) return null;

  return (
    <TooltipProvider>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}>
        <motion.div 
          className="fixed top-0 right-0 h-full w-80 bg-background shadow-xl p-4 overflow-y-auto"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Accessibility className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Accessibility</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              aria-label="Close accessibility panel"
            >
              ✕
            </Button>
          </div>

          <div className="space-y-6">
            {/* High Contrast Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Contrast className="h-5 w-5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>High contrast makes text and interface elements easier to see</p>
                    </TooltipContent>
                  </Tooltip>
                  <h3 className="font-medium">High Contrast</h3>
                </div>
                <Button 
                  variant={state.isHighContrast ? "default" : "outline"}
                  size="sm"
                  onClick={toggleHighContrast}
                  aria-pressed={state.isHighContrast}
                >
                  {state.isHighContrast ? 'On' : 'Off'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Increases contrast between text and background for better readability.
              </p>
            </div>

            {/* Reduced Motion */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <MoveHorizontal className="h-5 w-5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reduces or eliminates animation effects</p>
                    </TooltipContent>
                  </Tooltip>
                  <h3 className="font-medium">Reduced Motion</h3>
                </div>
                <Button 
                  variant={state.isReducedMotion ? "default" : "outline"}
                  size="sm"
                  onClick={toggleReducedMotion}
                  aria-pressed={state.isReducedMotion}
                >
                  {state.isReducedMotion ? 'On' : 'Off'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Reduces or eliminates animations and transitions.
              </p>
            </div>

            {/* Screen Reader Optimizations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Eye className="h-5 w-5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Optimizes the site for screen readers</p>
                    </TooltipContent>
                  </Tooltip>
                  <h3 className="font-medium">Screen Reader Mode</h3>
                </div>
                <Button 
                  variant={state.screenReaderMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleScreenReader}
                  aria-pressed={state.screenReaderMode}
                >
                  {state.screenReaderMode ? 'On' : 'Off'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Enhances compatibility with screen readers and provides additional context.
              </p>
            </div>

            {/* Text Size */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Type className="h-5 w-5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Change the text size across the application</p>
                  </TooltipContent>
                </Tooltip>
                <h3 className="font-medium">Text Size</h3>
              </div>
              <Select
                value={state.textSize}
                onValueChange={(value) => setTextSize(value as any)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select text size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra-large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Focus Mode */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <MousePointer className="h-5 w-5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enhanced focus indicators make it easier to see which element is focused</p>
                  </TooltipContent>
                </Tooltip>
                <h3 className="font-medium">Focus Indicators</h3>
              </div>
              <Select
                value={state.focusMode}
                onValueChange={(value) => setFocusMode(value as any)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select focus mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="enhanced">Enhanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={reset}
                aria-label="Reset all accessibility settings"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset All Settings
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}