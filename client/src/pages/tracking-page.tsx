import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Globe, 
  Activity, 
  ExternalLink,
  CircleDashed,
  Plus,
  Settings
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
  
  const { data: trackingData, isLoading } = useQuery({
    queryKey: ["/api/tracking"],
    enabled: isAuthenticated,
  });
  
  const trackingItems = trackingData?.trackingItems || [];
  const activeItems = trackingItems.filter((item: any) => item.isActive);
  const websiteItems = activeItems.filter((item: any) => item.type === "website");
  const systemItems = activeItems.filter((item: any) => item.type !== "website");
  
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <PageHeader
        title={t('tracking.title')}
        description={t('tracking.description') || "Monitor your active tracking items"}
        actions={
          user?.role === "admin" && (
            <Button
              variant="default"
              className="ml-auto"
              onClick={() => setIsTrackingModalOpen(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              {t('tracking.manageItems') || "Manage tracking items"}
            </Button>
          )
        }
      />
      
      <div className="container mx-auto py-6 flex-1">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="all">
              {t('tracking.allItems') || "All Items"}
              {activeItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="websites">
              {t('tracking.websiteItems') || "Websites"}
              {websiteItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {websiteItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="systems">
              {t('tracking.systemItems') || "Systems"}
              {systemItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {systemItems.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse h-48">
                    <CardHeader className="pb-2">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))
              ) : activeItems.length === 0 ? (
                <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
                  <Activity className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    {t('tracking.noActiveItems') || "No Active Tracking Items"}
                  </h3>
                  <p className="text-gray-500 max-w-md mb-6">
                    {t('tracking.noActiveItemsDescription') || "There are currently no active tracking items to display."}
                  </p>
                  {user?.role === "admin" && (
                    <Button
                      variant="outline"
                      onClick={() => setIsTrackingModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('tracking.addTrackingItem') || "Add tracking item"}
                    </Button>
                  )}
                </div>
              ) : (
                activeItems.map((item: any) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {item.type === "website" ? (
                            <Globe className="mr-2 h-5 w-5 text-blue-500" />
                          ) : (
                            <Activity className="mr-2 h-5 w-5 text-green-500" />
                          )}
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                        </div>
                        <Badge variant={item.type === "website" ? "default" : "secondary"}>
                          {item.type === "website" ? 
                            (t('tracking.typeWebsite') || "Website") : 
                            (t('tracking.typeSystem') || "System")}
                        </Badge>
                      </div>
                      <CardDescription>{item.description || "-"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-4 truncate">
                          {item.url}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => window.open(item.url, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {t('action.openLink') || "Open Link"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="websites" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse h-48">
                    <CardHeader className="pb-2">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))
              ) : websiteItems.length === 0 ? (
                <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
                  <Globe className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    {t('tracking.noWebsiteItems') || "No Website Tracking Items"}
                  </h3>
                  <p className="text-gray-500 max-w-md mb-6">
                    {t('tracking.noWebsiteItemsDescription') || "There are currently no website tracking items to display."}
                  </p>
                  {user?.role === "admin" && (
                    <Button
                      variant="outline"
                      onClick={() => setIsTrackingModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('tracking.addWebsiteTracking') || "Add website tracking"}
                    </Button>
                  )}
                </div>
              ) : (
                websiteItems.map((item: any) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Globe className="mr-2 h-5 w-5 text-blue-500" />
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                        </div>
                        <Badge variant="default">
                          {t('tracking.typeWebsite') || "Website"}
                        </Badge>
                      </div>
                      <CardDescription>{item.description || "-"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-4 truncate">
                          {item.url}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => window.open(item.url, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {t('action.openLink') || "Open Link"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="systems" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse h-48">
                    <CardHeader className="pb-2">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))
              ) : systemItems.length === 0 ? (
                <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
                  <Activity className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    {t('tracking.noSystemItems') || "No System Tracking Items"}
                  </h3>
                  <p className="text-gray-500 max-w-md mb-6">
                    {t('tracking.noSystemItemsDescription') || "There are currently no system tracking items to display."}
                  </p>
                  {user?.role === "admin" && (
                    <Button
                      variant="outline"
                      onClick={() => setIsTrackingModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('tracking.addSystemTracking') || "Add system tracking"}
                    </Button>
                  )}
                </div>
              ) : (
                systemItems.map((item: any) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Activity className="mr-2 h-5 w-5 text-green-500" />
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                        </div>
                        <Badge variant="secondary">
                          {t('tracking.typeSystem') || "System"}
                        </Badge>
                      </div>
                      <CardDescription>{item.description || "-"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-4 truncate">
                          {item.url}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => window.open(item.url, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {t('action.openLink') || "Open Link"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-[90vw] max-w-3xl overflow-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('tracking.manageTitle') || "Manage Live Tracking"}</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsTrackingModalOpen(false)}>
                {t('common.close') || "Close"}
              </Button>
            </div>
            <LiveTracker onItemSaved={() => setIsTrackingModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}