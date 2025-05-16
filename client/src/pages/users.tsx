import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Menu, Bell, Search, Mail, UserPlus, Filter, MoreHorizontal, Eye, Edit, Trash2, MessageSquare } from "lucide-react";
import { User } from "@shared/schema";
import { useAuth } from "@/context/auth-context";
import { FloatingActionMenu } from "@/components/mobile/floating-action-menu";
import { BottomNavigation } from "@/components/mobile/bottom-navigation";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { UserForm } from "@/components/admin/user-form";
import { UserDetailDialog } from "@/components/admin/user-detail-dialog";
import { DirectChatModule } from "@/components/admin/direct-chat-module";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, 
  DialogFooter
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function UsersPage() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isViewingUserDetails, setIsViewingUserDetails] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const {
    data: users,
    isLoading,
    error,
    refetch
  } = useQuery<User[]>({
    queryKey: ["/api/users/admin"],
    enabled: !!user && user.role === "admin",
    // Custom fetcher to ensure credentials are included
    queryFn: async () => {
      const res = await fetch("/api/users/admin", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch users: ${res.statusText}`);
      }
      return res.json();
    }
  });
  
  // Log any errors or successful data for debugging
  useEffect(() => {
    if (error) {
      console.error("Error fetching users:", error);
    }
    if (users) {
      console.log("Successfully fetched users:", users);
    }
  }, [error, users]);

  // Handle error with useEffect to prevent render loop
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading users",
        description: "There was a problem loading the users. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Filter users based on search and role
  const filteredUsers = users?.filter(user => {
    const matchesSearch = searchQuery ? 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    
    const matchesRole = filterRole ? user.role === filterRole : true;
    
    return matchesSearch && matchesRole;
  });

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewingUserDetails(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditingUser(true);
    toast({
      title: "Edit user",
      description: `Editing user ${user.email}`,
    });
  };

  const handleStartChat = (user: User) => {
    setSelectedUser(user);
    setIsChatOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    const userToDelete = users?.find(u => u.id === userId);
    if (userToDelete) {
      setSelectedUser(userToDelete);
      setIsDeleteConfirmOpen(true);
    } else {
      toast({
        title: "Fout",
        description: "Gebruiker niet gevonden.",
        variant: "destructive"
      });
    }
  };
  
  const confirmDeleteUser = async () => {
    if (!selectedUser) {
      toast({
        title: "Fout",
        description: "Geen gebruiker geselecteerd om te verwijderen.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log(`Verwijderen van gebruiker met ID ${selectedUser.id}`);
      
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server antwoord bij verwijderen:", errorData);
        throw new Error(errorData.message || "Fout bij verwijderen gebruiker");
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/users/admin"] });
      toast({
        title: "Gebruiker verwijderd",
        description: "De gebruiker is succesvol verwijderd.",
      });
      
      // Reset state
      setIsDeleteConfirmOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een probleem opgetreden bij het verwijderen van de gebruiker.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Desktop view (always visible) and Mobile view (conditionally visible) */}
      {isMobileSidebarOpen ? (
        <Sidebar 
          isMobile={true} 
          onClose={() => setIsMobileSidebarOpen(false)} 
          userRole="admin"
        />
      ) : (
        <Sidebar 
          isMobile={false} 
          onClose={() => {}} 
          userRole="admin" 
        />
      )}
      
      <div className="flex-1">
        {/* Mobile Header */}
        <MobileHeader 
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          title="Users"
        />
        
        {/* Main Content */}
        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Users</h1>
              <p className="text-gray-600">Manage all registered users in the system</p>
            </div>
            <Button className="mt-3 md:mt-0" onClick={() => setIsUserFormOpen(true)}>
              <UserPlus size={16} className="mr-2" />
              Add User
            </Button>
          </div>
          
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter size={16} />
                  {filterRole ? `Role: ${filterRole}` : 'Filter by Role'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterRole(null)}>
                  All Roles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole("admin")}>
                  Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole("customer")}>
                  Customer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Users Table */}
          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Auth Provider</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers && filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 rounded-full bg-gray-200 items-center justify-center text-gray-700 font-semibold uppercase">
                              {user.firstName ? user.firstName.charAt(0) : user.email.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}` 
                                  : 'Unnamed User'}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            {user.createdAt 
                              ? format(new Date(user.createdAt), 'MMM d, yyyy') 
                              : 'Unknown date'}
                          </TableCell>
                          <TableCell>
                            {user.provider || 'local'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                  <Eye size={16} className="mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Edit size={16} className="mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStartChat(user)}>
                                  <MessageSquare size={16} className="mr-2" />
                                  Direct Message
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                          {searchQuery || filterRole 
                            ? 'No users match your search criteria' 
                            : 'No users found in the system'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </main>
      </div>
      
      {/* Quick Action Floating Menu */}
      <FloatingActionMenu 
        items={[
          {
            icon: <UserPlus size={20} />,
            label: "Add User",
            onClick: () => {
              setIsUserFormOpen(true);
            },
            color: "bg-blue-500 text-white"
          },
          {
            icon: <Mail size={20} />,
            label: "Messages",
            onClick: () => {
              setLocation('/messages');
            },
            color: "bg-green-500 text-white"
          },
          {
            icon: <Search size={20} />,
            label: "Search",
            onClick: () => {
              const searchInput = document.querySelector('input[placeholder="Search users..."]') as HTMLInputElement;
              if (searchInput) {
                searchInput.focus();
              }
            },
            color: "bg-amber-500 text-white"
          }
        ]}
        position="bottom-right"
        userRole="admin"
      />
      
      {/* Mobile Bottom Navigation */}
      <BottomNavigation />

      {/* User Form Modal - New User */}
      <UserForm 
        isOpen={isUserFormOpen} 
        onClose={() => setIsUserFormOpen(false)} 
      />

      {/* User Form Modal - Edit User */}
      {selectedUser && (
        <UserForm 
          isOpen={isEditingUser} 
          user={selectedUser}
          onClose={() => {
            setIsEditingUser(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Direct Chat Module */}
      {selectedUser && (
        <DirectChatModule 
          targetUser={selectedUser}
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={isDeleteConfirmOpen} 
        onOpenChange={(open) => {
          setIsDeleteConfirmOpen(open);
          if (!open) setSelectedUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gebruiker verwijderen</DialogTitle>
            <DialogDescription>
              Weet u zeker dat u {selectedUser?.email} wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteConfirmOpen(false);
                setSelectedUser(null);
              }}
            >
              Annuleren
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>
              Verwijderen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* User Detail Dialog */}
      {selectedUser && (
        <UserDetailDialog 
          user={selectedUser}
          isOpen={isViewingUserDetails}
          onClose={() => {
            setIsViewingUserDetails(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}