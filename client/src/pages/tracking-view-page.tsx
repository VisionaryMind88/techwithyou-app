import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function TrackingViewPage() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [urlDetails, setUrlDetails] = useState({
    url: "",
    name: "External Resource"
  });
  
  // Get URL from query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    const name = params.get("name");
    
    if (url) {
      setUrlDetails({
        url: decodeURIComponent(url),
        name: name ? decodeURIComponent(name) : "External Resource"
      });
      setIsLoading(false);
    } else {
      // If no URL is provided, go back to tracking page
      navigate("/tracking");
    }
  }, [navigate]);
  
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };
  
  const handleBack = () => {
    navigate("/tracking");
  };
  
  const handleOpenExternal = () => {
    if (urlDetails.url) {
      window.open(urlDetails.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader 
        title={urlDetails.name || t("tracking.externalResource") || "External Resource"}
        description={urlDetails.url}
        actions={
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t("common.backToTracking") || "Back to Tracking"}</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{t("common.refresh") || "Refresh"}</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleOpenExternal}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              <span>{t("common.openInNewTab") || "Open in New Tab"}</span>
            </Button>
          </div>
        }
      />

      <div className="flex-1 container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full overflow-hidden border rounded-lg shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-[80vh]">
                  <RefreshCw className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : (
                <iframe 
                  src={urlDetails.url}
                  className="w-full h-[80vh] border-0"
                  title={urlDetails.name}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  loading="lazy"
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}