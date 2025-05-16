import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Globe, 
  Activity, 
  ExternalLink,
  ChevronRight, 
  ChevronDown,
  CircleDashed,
  Search
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiveTracker } from "../live-tracking/live-tracker";

export function LiveTrackingSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  
  const { data: trackingData, isLoading } = useQuery({
    queryKey: ["/api/tracking"],
    enabled: isAuthenticated,
  });
  
  const trackingItems = trackingData?.trackingItems || [];
  const activeItems = trackingItems
    .filter((item: any) => item.isActive)
    .filter((item: any) => 
      searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  return (
    <div className="space-y-4 py-2">
      <Accordion type="single" collapsible defaultValue="live-tracking">
        <AccordionItem value="live-tracking" className="border-none">
          <AccordionTrigger className="py-2 text-sm hover:no-underline text-white">
            <div className="flex items-center">
              <Activity className="mr-2 h-4 w-4 text-blue-300" />
              <span className="text-blue-100 font-medium">{t('tracking.title')}</span>
              {activeItems.length > 0 && (
                <Badge 
                  variant="outline" 
                  className="ml-2 bg-blue-600 text-white border-blue-400 hover:bg-blue-500 shadow-lg transform translate-z-1"
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    boxShadow: '0 3px 10px rgba(0, 157, 255, 0.2), 0 0 3px rgba(0, 157, 255, 0.3)',
                    transform: 'translateY(-1px)'
                  }}
                >
                  {activeItems.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-1 pt-1 bg-blue-700 rounded-md mx-1 shadow-inner" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
            {/* Search Input */}
            <div className="mb-2 px-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('tracking.searchPlaceholder') || "Search tracking items..."}
                  className="h-8 w-full pl-8 text-xs bg-blue-800 border-blue-600 text-white placeholder:text-blue-300"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 py-0 text-blue-300 hover:text-white hover:bg-transparent"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <CircleDashed className="h-5 w-5 animate-spin text-blue-300" />
              </div>
            ) : activeItems.length === 0 ? (
              <div className="px-2 py-3 text-sm text-blue-300 text-center">
                {searchTerm ? t('tracking.noMatchingItems') || "No matching tracking items" : t('tracking.noItems') || "No active tracking items"}
              </div>
            ) : (
              <div className="space-y-1">
                {activeItems.map((item: any) => (
                  <div 
                    key={item.id} 
                    className="group flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-blue-600 bg-blue-800 mb-1 shadow-md"
                    style={{ 
                      transform: 'translateZ(5px)', 
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2), 0 0 1px rgba(0,157,255,0.3)',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div className="flex items-center truncate">
                      {item.type === "website" ? (
                        <Globe className="mr-2 h-4 w-4 flex-shrink-0 text-blue-300" />
                      ) : (
                        <Activity className="mr-2 h-4 w-4 flex-shrink-0 text-blue-300" />
                      )}
                      <span className="truncate text-white">{item.name}</span>
                    </div>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 flex-shrink-0 opacity-50 group-hover:opacity-100"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-300 hover:text-white" />
                    </a>
                  </div>
                ))}
              </div>
            )}
            
            {user?.role === "admin" && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full justify-start text-xs text-muted-foreground"
                onClick={() => setIsTrackingModalOpen(true)}
              >
                {t('tracking.manageItems') || "Manage tracking items"}
              </Button>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-[90vw] max-w-3xl overflow-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('tracking.manageTitle') || "Manage Live Tracking"}</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsTrackingModalOpen(false)}>
                {t('common.close') || "Close"}
              </Button>
            </div>
            <LiveTracker />
          </div>
        </div>
      )}
    </div>
  );
}