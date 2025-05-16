import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { 
  Globe, 
  Activity, 
  ExternalLink,
  CircleDashed,
  Plus,
  Settings,
  ArrowLeft,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { LiveTracker } from "@/components/live-tracking/live-tracker";
import { Badge } from "@/components/ui/badge";

export default function TrackingPage() {
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  
  const { data: trackingData, isLoading } = useQuery({
    queryKey: ["/api/tracking"],
    enabled: isAuthenticated,
  });
  
  const trackingItems = trackingData?.trackingItems || [];
  
  const handleBackToDashboard = () => {
    setLocation("/");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader 
        title={t("tracking.title") || "Live Tracking"} 
        description={t("tracking.description") || "Monitor and manage real-time tracking items"}
        actions={
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleBackToDashboard}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t("common.backToDashboard") || "Back to Dashboard"}</span>
            </Button>
            <Button 
              onClick={() => setIsTrackingModalOpen(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>{t("tracking.addItem") || "Add Item"}</span>
            </Button>
          </div>
        }
      />

      <div className="flex-1 container mx-auto px-4 py-6">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="active">
              <Activity className="h-4 w-4 mr-2" />
              {t("tracking.active") || "Active Items"}
            </TabsTrigger>
            <TabsTrigger value="all">
              <Globe className="h-4 w-4 mr-2" />
              {t("tracking.all") || "All Items"}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              {t("tracking.settings") || "Settings"}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <CircleDashed className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : trackingItems.filter(item => item.isActive).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trackingItems
                  .filter(item => item.isActive)
                  .map(item => (
                    <LiveTracker 
                      key={item.id} 
                      item={item} 
                      onStatusChange={() => {}}
                    />
                  ))
                }
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    {t("tracking.noActiveItems") || "No active tracking items found"}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsTrackingModalOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("tracking.createFirst") || "Create your first tracking item"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <CircleDashed className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : trackingItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trackingItems.map(item => (
                  <LiveTracker 
                    key={item.id} 
                    item={item} 
                    onStatusChange={() => {}}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    {t("tracking.noItems") || "No tracking items found"}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsTrackingModalOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("tracking.createFirst") || "Create your first tracking item"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>{t("tracking.settingsTitle") || "Tracking Settings"}</CardTitle>
                <CardDescription>
                  {t("tracking.settingsDescription") || "Configure how tracking items are displayed and managed"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Settings content can be added here */}
                  <div className="flex items-center justify-between">
                    <span>{t("tracking.settingsAutoRefresh") || "Auto-refresh tracking items"}</span>
                    <Button variant="outline" size="sm">
                      {t("common.enabled") || "Enabled"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t("tracking.settingsNotifications") || "Notifications"}</span>
                    <Button variant="outline" size="sm">
                      {t("common.configure") || "Configure"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add tracking item modal would go here */}
    </div>
  );
}