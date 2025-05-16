import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="flex flex-col min-h-screen">
      <div className="fixed top-4 left-4 z-50">
        <Button 
          variant="default" 
          onClick={handleBack}
          className="flex items-center gap-1 shadow-md"
          size="sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("common.backToTracking") || "Back"}</span>
        </Button>
      </div>

      <div className="flex-1 w-full h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-screen w-full">
              <RefreshCw className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <iframe 
              src={urlDetails.url}
              className="w-full h-screen border-0"
              title={urlDetails.name}
              sandbox="allow-scripts allow-same-origin allow-forms"
              loading="lazy"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}