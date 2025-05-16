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
import { motion } from "framer-motion";

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1,
        duration: 0.3
      } 
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };
  
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      className="flex flex-col min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <PageHeader 
        title={t("tracking.title") || "Live Tracking"} 
        actions={
          <motion.div 
            className="flex space-x-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button 
              variant="outline" 
              onClick={handleBackToDashboard}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t("common.backToDashboard") || "Go back to Dashboard"}</span>
            </Button>
          </motion.div>
        }
      />

      <motion.div 
        className="flex-1 container mx-auto px-4 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
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
              <motion.div 
                className="flex justify-center p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <CircleDashed className="h-8 w-8 animate-spin text-primary" />
              </motion.div>
            ) : trackingItems.filter(item => item.isActive).length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {trackingItems
                  .filter(item => item.isActive)
                  .map(item => (
                    <motion.div key={item.id} variants={itemVariants}>
                      <LiveTracker 
                        item={item} 
                        onStatusChange={() => {}}
                      />
                    </motion.div>
                  ))
                }
              </motion.div>
            ) : (
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
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
              </motion.div>
            )}
          </TabsContent>
          
          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <motion.div 
                className="flex justify-center p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <CircleDashed className="h-8 w-8 animate-spin text-primary" />
              </motion.div>
            ) : trackingItems.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {trackingItems.map(item => (
                  <motion.div key={item.id} variants={itemVariants}>
                    <LiveTracker 
                      item={item} 
                      onStatusChange={() => {}}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
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
              </motion.div>
            )}
          </TabsContent>
          
          <TabsContent value="settings">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <CardHeader>
                  <CardTitle>{t("tracking.settingsTitle") || "Tracking Settings"}</CardTitle>
                  <CardDescription>
                    {t("tracking.settingsDescription") || "Configure how tracking items are displayed and managed"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
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
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
      
      {/* Add tracking item modal would go here */}
    </motion.div>
  );
}