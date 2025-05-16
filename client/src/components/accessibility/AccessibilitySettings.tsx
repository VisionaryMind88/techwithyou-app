import React, { useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Eye, 
  Monitor, 
  Type, 
  PlayCircle,
  ArrowLeftRight,
  Contrast,
  MessageSquare
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AccessibilitySettings() {
  const [open, setOpen] = useState(false);
  const { 
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
  } = useAccessibility();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          aria-label="Accessibility Settings"
          className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-full"
        >
          <Eye className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            <span>Accessibility Settings</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="display" className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="display" className="flex items-center gap-1" aria-label="Display Settings">
              <Contrast className="h-4 w-4" />
              <span>Display</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-1" aria-label="Text Settings">
              <Type className="h-4 w-4" />
              <span>Text</span>
            </TabsTrigger>
            <TabsTrigger value="motion" className="flex items-center gap-1" aria-label="Motion Settings">
              <PlayCircle className="h-4 w-4" />
              <span>Motion</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="display" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="high-contrast">High Contrast Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enhance visibility with stronger colors and contrast
                </p>
              </div>
              <Switch 
                id="high-contrast" 
                checked={isHighContrast}
                onCheckedChange={toggleHighContrast}
                aria-describedby="high-contrast-description"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="screen-reader">Screen Reader Optimization</Label>
                <p className="text-sm text-muted-foreground" id="screen-reader-description">
                  Optimize interface for screen readers
                </p>
              </div>
              <Switch 
                id="screen-reader" 
                checked={isScreenReaderOptimized}
                onCheckedChange={toggleScreenReaderOptimization}
                aria-describedby="screen-reader-description"
              />
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-size">Text Size</Label>
              <Select 
                value={textSize} 
                onValueChange={(value) => setTextSize(value as 'default' | 'large' | 'larger')}
              >
                <SelectTrigger id="text-size" aria-label="Select text size">
                  <SelectValue placeholder="Select text size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="larger">Larger</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Example text will look like this.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="motion" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reduced-motion">Reduced Motion</Label>
                <p className="text-sm text-muted-foreground" id="reduced-motion-description">
                  Minimize animations and transitions
                </p>
              </div>
              <Switch 
                id="reduced-motion" 
                checked={isReducedMotion}
                onCheckedChange={toggleReducedMotion}
                aria-describedby="reduced-motion-description"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            Your accessibility settings are saved automatically and will be applied across your sessions.
          </p>
        </div>

        <DialogFooter className="mt-6">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}