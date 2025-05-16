import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Globe, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type TrackingItem = {
  id: number;
  name: string;
  url: string;
  type: "app" | "website";
  key?: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdById: number;
  isActive: boolean;
  description?: string;
  thumbnailUrl?: string;
};

export function LiveTracker() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"app" | "website">("website");
  const [key, setKey] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TrackingItem | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  // Fetch tracking items
  const { data: trackingData, isLoading: isLoadingTrackingItems } = useQuery({
    queryKey: ["/api/tracking"],
  });
  
  // Add tracking item mutation
  const addTrackingItemMutation = useMutation({
    mutationFn: async (trackingItem: Omit<TrackingItem, "id" | "createdAt" | "updatedAt" | "createdById" | "isActive">) => {
      return await apiRequest("POST", "/api/tracking", trackingItem);
    },
    onSuccess: () => {
      toast({
        title: "Tracking item added",
        description: "The tracking item has been added successfully.",
      });
      setIsAddingNew(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/tracking"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding tracking item",
        description: error.message || "There was an error adding the tracking item.",
        variant: "destructive",
      });
    }
  });
  
  // Toggle tracking item status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/tracking/${id}/toggle`);
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The tracking item status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tracking"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating status",
        description: error.message || "There was an error updating the status.",
        variant: "destructive",
      });
    }
  });
  
  // Delete tracking item mutation
  const deleteTrackingItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/tracking/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Tracking item deleted",
        description: "The tracking item has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tracking"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting tracking item",
        description: error.message || "There was an error deleting the tracking item.",
        variant: "destructive",
      });
    }
  });
  
  const resetForm = () => {
    setUrl("");
    setName("");
    setDescription("");
    setType("website");
    setKey("");
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !url) {
      toast({
        title: "Missing information",
        description: "Please provide a name and URL for the tracking item.",
        variant: "destructive",
      });
      return;
    }
    
    addTrackingItemMutation.mutate({
      name,
      url,
      type,
      description,
      key: key || undefined,
    });
  };
  
  const handleToggleStatus = (id: number) => {
    toggleStatusMutation.mutate(id);
  };
  
  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this tracking item?")) {
      deleteTrackingItemMutation.mutate(id);
    }
  };
  
  const isAdmin = user?.role === "admin";
  const trackingItems = trackingData?.trackingItems || [];
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Live Tracking</h2>
        {isAdmin && (
          <Button onClick={() => setIsAddingNew(!isAddingNew)}>
            {isAddingNew ? "Cancel" : "Add New Tracking Item"}
          </Button>
        )}
      </div>
      
      {isAddingNew && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Tracking Item</CardTitle>
            <CardDescription>
              Add a new app or website to track and display to users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="My App"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Tabs value={type} onValueChange={(value) => setType(value as "app" | "website")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="website">Website</TabsTrigger>
                    <TabsTrigger value="app">Mobile App</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the tracked item"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="key">Access Key (Optional)</Label>
                <Input
                  id="key"
                  placeholder="Secret key for restricted access"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                />
              </div>
              
              <Button type="submit" disabled={addTrackingItemMutation.isPending}>
                {addTrackingItemMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Tracking Item"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      
      {isLoadingTrackingItems ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : trackingItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-muted p-3">
              <Eye className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No tracking items available</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              {isAdmin
                ? "Add your first tracking item to monitor websites or apps."
                : "There are no items being tracked at the moment."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trackingItems.map((item: TrackingItem) => (
            <Card key={item.id} className={!item.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {item.type === "website" ? (
                        <span className="flex items-center">
                          <Globe className="h-3 w-3 mr-1" /> Website
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Upload className="h-3 w-3 mr-1" /> Mobile App
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {item.thumbnailUrl && (
                    <div className="h-10 w-10 rounded overflow-hidden">
                      <img 
                        src={item.thumbnailUrl} 
                        alt={item.name} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {item.description || "No description provided."}
                </p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {item.url}
                </a>
              </CardContent>
              {isAdmin && (
                <CardFooter className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(item.id)}
                  >
                    {item.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">{selectedItem.name}</h3>
              <Button
                className="absolute top-4 right-4"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                &times;
              </Button>
            </div>
            <div className="p-0">
              <iframe
                src={selectedItem.url}
                className="w-full h-[70vh]"
                title={selectedItem.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}