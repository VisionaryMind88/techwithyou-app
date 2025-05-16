import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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
          <AccordionTrigger className="py-2 text-sm hover:no-underline">
            <div className="flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              <span>Live Tracking</span>
              {activeItems.length > 0 && (
                <Badge 
                  variant="outline" 
                  className="ml-2 bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700"
                >
                  {activeItems.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-1 pt-1">
            {/* Search Input */}
            <div className="mb-2 px-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tracking items..."
                  className="h-8 w-full pl-8 text-xs"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2 py-0"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <CircleDashed className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : activeItems.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground">
                {searchTerm ? "No matching tracking items" : "No active tracking items"}
              </div>
            ) : (
              <div className="space-y-1">
                {activeItems.map((item: any) => (
                  <div 
                    key={item.id} 
                    className="group flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <div className="flex items-center truncate">
                      {item.type === "website" ? (
                        <Globe className="mr-2 h-4 w-4 flex-shrink-0 text-blue-500" />
                      ) : (
                        <Activity className="mr-2 h-4 w-4 flex-shrink-0 text-purple-500" />
                      )}
                      <span className="truncate">{item.name}</span>
                    </div>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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
                Manage tracking items
              </Button>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-[90vw] max-w-3xl overflow-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Manage Live Tracking</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsTrackingModalOpen(false)}>
                Close
              </Button>
            </div>
            <LiveTracker />
          </div>
        </div>
      )}
    </div>
  );
}