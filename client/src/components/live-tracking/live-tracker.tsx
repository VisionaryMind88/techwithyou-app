import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink, 
  Clock,
  Globe,
  Wifi,
  WifiOff,
  Settings,
  Server,
  BarChart3
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface TrackingItemProps {
  item: {
    id: number;
    name: string;
    type: string;
    url: string;
    description?: string;
    isActive: boolean;
    status?: string;
    lastChecked?: string;
    createdAt?: string | Date;
  };
  onStatusChange?: () => void;
}

export function LiveTracker({ item, onStatusChange }: TrackingItemProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Get the appropriate icon based on tracking type
  const getTypeIcon = () => {
    switch (item.type?.toLowerCase()) {
      case 'website':
        return <Globe className="mr-2 h-4 w-4" />;
      case 'api':
        return <Server className="mr-2 h-4 w-4" />;
      case 'service':
        return <Settings className="mr-2 h-4 w-4" />;
      default:
        return <BarChart3 className="mr-2 h-4 w-4" />;
    }
  };
  
  // Status badge color variants
  const getStatusBadge = () => {
    if (!item.isActive) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          <Clock className="mr-1 h-3 w-3" />
          {t("status.inactive") || "Inactive"}
        </Badge>
      );
    }
    
    switch (item.status?.toLowerCase()) {
      case 'online':
      case 'active':
      case 'up':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700">
            <Wifi className="mr-1 h-3 w-3" />
            {t("status.online") || "Online"}
          </Badge>
        );
      case 'offline':
      case 'inactive':
      case 'down':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700">
            <WifiOff className="mr-1 h-3 w-3" />
            {t("status.offline") || "Offline"}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            <Clock className="mr-1 h-3 w-3" />
            {t("status.pending") || "Pending"}
          </Badge>
        );
    }
  };
  
  const toggleStatus = async () => {
    setIsUpdating(true);
    try {
      await apiRequest("PATCH", `/api/tracking/${item.id}/toggle-status`, {});
      
      // Refresh tracking data
      await queryClient.invalidateQueries({ queryKey: ["/api/tracking"] });
      
      toast({
        title: t("tracking.statusUpdated") || "Status updated",
        description: item.isActive 
          ? t("tracking.itemDeactivated") || "Item has been deactivated" 
          : t("tracking.itemActivated") || "Item has been activated",
      });
      
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Error toggling tracking status:", error);
      toast({
        title: t("error.title") || "Error",
        description: t("tracking.errorUpdatingStatus") || "Failed to update tracking status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const [, navigate] = useLocation();

  const handleOpenLink = () => {
    if (item.url) {
      // Check if this is an internal link that can be handled within the app
      const isInternalLink = item.url.startsWith('/') || 
                            item.url.includes(window.location.hostname);
      
      if (isInternalLink) {
        // For internal links, use the router to navigate
        navigate(item.url);
      } else {
        // For external links, we'll use a controlled window
        window.open(item.url, 'trackerView', 'width=800,height=600,resizable=yes');
      }
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`overflow-hidden ${!item.isActive ? 'opacity-75' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center text-lg font-semibold">
                {getTypeIcon()}
                {item.name}
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-500">
                {item.type} • {item.lastChecked ? `Last checked ${new Date(item.lastChecked).toLocaleString()}` : 'Not checked yet'}
              </CardDescription>
            </div>
            <div>
              {getStatusBadge()}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-gray-700 mb-3">{item.description || t("tracking.noDescription") || "No description provided"}</p>
          
          {item.url && (
            <div className="flex items-center text-sm text-blue-600">
              <Globe className="h-3.5 w-3.5 mr-1" />
              <span className="truncate">{item.url}</span>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between bg-gray-50 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleStatus}
            disabled={isUpdating}
            className="text-xs"
          >
            {item.isActive 
              ? t("tracking.deactivate") || "Deactivate" 
              : t("tracking.activate") || "Activate"}
          </Button>
          
          {item.url && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleOpenLink}
              className="text-xs"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              {t("action.openLink") || "Open Link"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}