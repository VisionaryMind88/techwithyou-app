import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentRequestForm } from "./payment-request-form";
import { Project, User, Payment } from "@shared/schema";
import { Loader2, ArrowUpRight, FileText, Check, XCircle, AlertTriangle, Filter } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

// Status badge component
const PaymentStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    pending: { variant: "outline", icon: <FileText className="h-3 w-3 mr-1" />, label: "Pending" },
    completed: { variant: "success", icon: <Check className="h-3 w-3 mr-1" />, label: "Completed" },
    failed: { variant: "destructive", icon: <XCircle className="h-3 w-3 mr-1" />, label: "Failed" },
    canceled: { variant: "secondary", icon: <AlertTriangle className="h-3 w-3 mr-1" />, label: "Canceled" }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <Badge variant={config.variant as any} className="inline-flex items-center">
      {config.icon}
      {config.label}
    </Badge>
  );
};

// Payment table component
const PaymentsTable = ({ payments, users, projects }: { 
  payments: Payment[], 
  users: User[],
  projects: Project[]
}) => {
  // Helper function to find user or project name
  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return "Unknown";
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.email;
  };
  
  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "N/A";
  };
  
  const handleUpdateStatus = async (paymentId: number, newStatus: string) => {
    try {
      const response = await apiRequest("PATCH", `/api/payments/${paymentId}/status`, { status: newStatus });
      
      if (!response.ok) {
        throw new Error("Failed to update payment status");
      }
      
      // Refresh payment data
      queryClient.invalidateQueries({ queryKey: ['/api/payments/admin'] });
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                No payments found
              </TableCell>
            </TableRow>
          ) : (
            payments.map(payment => (
              <TableRow key={payment.id}>
                <TableCell>
                  {payment.createdAt ? format(new Date(payment.createdAt), 'MMM d, yyyy') : 'N/A'}
                </TableCell>
                <TableCell>{getUserName(payment.userId)}</TableCell>
                <TableCell>
                  {payment.projectId > 0 ? (
                    <Link to={`/project-detail/${payment.projectId}`} className="text-primary hover:underline flex items-center">
                      {getProjectName(payment.projectId)}
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Link>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={payment.description}>
                  {payment.description}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={payment.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {payment.status === 'pending' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateStatus(payment.id, 'completed')}
                        >
                          Mark Paid
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleUpdateStatus(payment.id, 'canceled')}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {payment.status === 'failed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUpdateStatus(payment.id, 'pending')}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export function PaymentTab() {
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Fetch payments
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<{ payments: Payment[] }>({
    queryKey: ['/api/payments/admin'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/payments/admin');
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      return response.json();
    }
  });
  
  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/auth/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/auth/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    }
  });
  
  // Fetch projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    }
  });
  
  const isLoading = paymentsLoading || usersLoading || projectsLoading;
  
  const payments = paymentsData?.payments || [];
  const users = usersData || [];
  const projects = projectsData || [];
  
  // Filter payments based on active tab
  const filteredPayments = payments.filter(payment => {
    if (activeTab === 'all') return true;
    return payment.status === activeTab;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Payment Request Form */}
        <div className="md:w-1/3">
          <PaymentRequestForm 
            users={users} 
            projects={projects} 
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['/api/payments/admin'] })}
          />
        </div>
        
        {/* Payment Stats Cards */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : payments.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading ? 'Loading...' : 'All time'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="animate-spin h-6 w-6" />
                ) : (
                  `$${payments
                    .filter(p => p.status === 'completed')
                    .reduce((sum, payment) => sum + payment.amount, 0)
                    .toFixed(2)}`
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading ? 'Loading...' : 'Completed payments'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="animate-spin h-6 w-6" />
                ) : (
                  `$${payments
                    .filter(p => p.status === 'pending')
                    .reduce((sum, payment) => sum + payment.amount, 0)
                    .toFixed(2)}`
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading ? 'Loading...' : 'Awaiting payment'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Manage all customer payments</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="failed">Failed</TabsTrigger>
                <TabsTrigger value="canceled">Canceled</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center">
                <Button variant="outline" size="sm" className="ml-auto hidden md:flex">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
            
            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <PaymentsTable 
                  payments={filteredPayments} 
                  users={users} 
                  projects={projects} 
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}