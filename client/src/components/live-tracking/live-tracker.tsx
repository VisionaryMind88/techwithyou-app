import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Globe, 
  Activity,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  CircleDashed
} from "lucide-react";

interface TrackingItem {
  id: number;
  name: string;
  type: string;
  url: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

interface TrackingItemFormData {
  name: string;
  type: string;
  url: string;
  description: string;
  isActive: boolean;
}

export function LiveTracker() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TrackingItemFormData>({
    name: "",
    type: "website",
    url: "",
    description: "",
    isActive: true
  });
  const [editItemId, setEditItemId] = useState<number | null>(null);

  // Fetch tracking items
  const { data, isLoading: isFetching, refetch } = useQuery({
    queryKey: ["/api/tracking"],
    enabled: isAuthenticated,
  });

  const trackingItems: TrackingItem[] = data?.trackingItems || [];
  
  // Filtered items based on active tab
  const filteredItems = activeTab === "all" 
    ? trackingItems 
    : activeTab === "active" 
      ? trackingItems.filter(item => item.isActive)
      : trackingItems.filter(item => !item.isActive);

  // Create tracking item mutation
  const createMutation = useMutation({
    mutationFn: async (data: TrackingItemFormData) => {
      return await apiRequest("POST", "/api/tracking", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking"] });
      toast({
        title: "Success",
        description: "Tracking item created successfully.",
      });
      setFormData({
        name: "",
        type: "website",
        url: "",
        description: "",
        isActive: true
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tracking item.",
        variant: "destructive",
      });
    },
  });

  // Update tracking item mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TrackingItemFormData }) => {
      return await apiRequest("PATCH", `/api/tracking/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking"] });
      toast({
        title: "Success",
        description: "Tracking item updated successfully.",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tracking item.",
        variant: "destructive",
      });
    },
  });

  // Delete tracking item mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/tracking/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking"] });
      toast({
        title: "Success",
        description: "Tracking item deleted successfully.",
      });
      setDeleteItemId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tracking item.",
        variant: "destructive",
      });
    },
  });

  // Toggle tracking item status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/tracking/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracking"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle status.",
        variant: "destructive",
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle create form submission
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Handle edit form submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editItemId) {
      updateMutation.mutate({ id: editItemId, data: formData });
    }
  };

  // Open edit dialog with item data
  const handleEditClick = (item: TrackingItem) => {
    setEditItemId(item.id);
    setFormData({
      name: item.name,
      type: item.type,
      url: item.url,
      description: item.description || "",
      isActive: item.isActive
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deleteItemId) {
      deleteMutation.mutate(deleteItemId);
    }
  };

  // Handle toggle status
  const handleToggleStatus = (id: number) => {
    toggleStatusMutation.mutate(id);
  };

  if (user?.role !== "admin") {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">{t('tracking.noPermission') || "You don't have permission to access this page."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('tracking.manageTitle') || "Live Tracking Management"}</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              <span>{t('tracking.addNew') || "Add New"}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tracking Item</DialogTitle>
              <DialogDescription>
                Create a new tracking item for your clients to monitor.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="name" className="col-span-4">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="col-span-4"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="type" className="col-span-4">
                    Type
                  </Label>
                  <Select 
                    name="type" 
                    value={formData.type} 
                    onValueChange={(value) => handleSelectChange("type", value)}
                  >
                    <SelectTrigger className="col-span-4">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="url" className="col-span-4">
                    URL
                  </Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    className="col-span-4"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="description" className="col-span-4">
                    Description
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="col-span-4"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-blue-50">
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">{t('tracking.all') || "All"}</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">{t('tracking.active') || "Active"}</TabsTrigger>
          <TabsTrigger value="inactive" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">{t('tracking.inactive') || "Inactive"}</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {renderTrackingItemsTable(filteredItems)}
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          {renderTrackingItemsTable(filteredItems)}
        </TabsContent>
        <TabsContent value="inactive" className="mt-4">
          {renderTrackingItemsTable(filteredItems)}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tracking Item</DialogTitle>
            <DialogDescription>
              Modify the tracking item details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="edit-name" className="col-span-4">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-4"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="edit-type" className="col-span-4">
                  Type
                </Label>
                <Select 
                  name="type" 
                  value={formData.type} 
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger className="col-span-4">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="edit-url" className="col-span-4">
                  URL
                </Label>
                <Input
                  id="edit-url"
                  name="url"
                  type="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  className="col-span-4"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="edit-description" className="col-span-4">
                  Description
                </Label>
                <Input
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="col-span-4"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tracking item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {deleteMutation.isPending ? (
                <>
                  <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  function renderTrackingItemsTable(items: TrackingItem[]) {
    if (isFetching) {
      return (
        <div className="flex items-center justify-center py-12">
          <CircleDashed className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('tracking.noItems') || "No tracking items found."}</p>
        </div>
      );
    }

    return (
      <div className="rounded-md border border-blue-100">
        <Table>
          <TableHeader className="bg-blue-50">
            <TableRow>
              <TableHead>{t('tracking.tableName') || "Name"}</TableHead>
              <TableHead>{t('tracking.tableType') || "Type"}</TableHead>
              <TableHead>{t('tracking.tableUrl') || "URL"}</TableHead>
              <TableHead>{t('tracking.tableStatus') || "Status"}</TableHead>
              <TableHead className="text-right">{t('tracking.tableActions') || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {item.type === "website" ? (
                      <Globe className="mr-2 h-4 w-4 text-blue-500" />
                    ) : item.type === "api" ? (
                      <Activity className="mr-2 h-4 w-4 text-purple-500" />
                    ) : (
                      <Activity className="mr-2 h-4 w-4 text-gray-500" />
                    )}
                    {item.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className="truncate max-w-[200px]">{item.url}</span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.isActive}
                      onCheckedChange={() => handleToggleStatus(item.id)}
                      disabled={toggleStatusMutation.isPending}
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <span className={item.isActive ? "text-blue-600 font-medium" : "text-muted-foreground"}>
                      {item.isActive 
                        ? t('tracking.active') || "Active" 
                        : t('tracking.inactive') || "Inactive"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditClick(item)}
                      className="hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">{t('tracking.edit') || "Edit"}</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteItemId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t('tracking.delete') || "Delete"}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
}