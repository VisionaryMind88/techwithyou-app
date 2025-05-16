import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Globe, 
  Activity, 
  ExternalLink,
  CircleDashed
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LiveTracker } from "../live-tracking/live-tracker";

interface LiveTrackingSidebarProps {
  minimal?: boolean;
}

export function LiveTrackingSidebar({ minimal = false }: LiveTrackingSidebarProps) {
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  
  const { data: trackingData, isLoading } = useQuery({
    queryKey: ["/api/tracking"],
    enabled: isAuthenticated,
  });
  
  const trackingItems = trackingData?.trackingItems || [];
  const activeItems = trackingItems.filter((item: any) => item.isActive);
  
  // If minimal mode, just return the badge with counter
  if (minimal) {
    if (activeItems.length > 0) {
      return (
        <Badge 
          variant="outline" 
          className="ml-auto bg-blue-600 text-white border-blue-400 hover:bg-blue-500 shadow-lg"
          style={{
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            boxShadow: '0 3px 10px rgba(0, 157, 255, 0.2), 0 0 3px rgba(0, 157, 255, 0.3)'
          }}
        >
          {activeItems.length}
        </Badge>
      );
    }
    return null;
  }
  
  return (
    <div className="space-y-4 py-2 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-blue-800">{t('tracking.title')}</h2>
        {user?.role === "admin" && (
          <Button
            variant="outline"
            size="sm"
            className="text-sm text-blue-600"
            onClick={() => setIsTrackingModalOpen(true)}
          >
            {t('tracking.manageItems') || "Manage tracking items"}
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <CircleDashed className="h-5 w-5 animate-spin text-blue-500" />
        </div>
      ) : activeItems.length === 0 ? (
        <div className="px-2 py-3 text-sm text-gray-500 text-center">
          {t('tracking.noItems') || "No active tracking items"}
        </div>
      ) : (
        <div className="space-y-2">
          {activeItems.map((item: any) => (
            <div 
              key={item.id} 
              className="group flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-blue-50 bg-white mb-2 shadow-sm border border-blue-100"
              style={{ 
                transition: 'all 0.2s ease'
              }}
            >
              <div className="flex items-center truncate">
                {item.type === "website" ? (
                  <Globe className="mr-2 h-4 w-4 flex-shrink-0 text-blue-500" />
                ) : (
                  <Activity className="mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                )}
                <span className="truncate text-gray-800">{item.name}</span>
              </div>
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 flex-shrink-0 opacity-50 group-hover:opacity-100"
              >
                <ExternalLink className="h-4 w-4 text-blue-500 hover:text-blue-700" />
              </a>
            </div>
          ))}
        </div>
      )}

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