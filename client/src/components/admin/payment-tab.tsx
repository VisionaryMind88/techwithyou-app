import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

// Define the payment status badge colors
const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  completed: "bg-green-100 text-green-800 hover:bg-green-100",
  failed: "bg-red-100 text-red-800 hover:bg-red-100",
  canceled: "bg-gray-100 text-gray-800 hover:bg-gray-100"
};

// Form schema for creating payment requests
const paymentRequestSchema = z.object({
  projectId: z.string().min(1, { message: "Project is required" }),
  userId: z.string().min(1, { message: "Customer is required" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  messageContent: z.string().min(1, { message: "Message content is required" })
});

type PaymentRequestFormValues = z.infer<typeof paymentRequestSchema>;

// Payment status component
interface PaymentStatusProps {
  status: string;
}

function PaymentStatus({ status }: PaymentStatusProps) {
  let icon = null;
  let statusText = status.charAt(0).toUpperCase() + status.slice(1);
  
  switch (status) {
    case "completed":
      icon = <CheckCircle className="h-4 w-4 mr-1" />;
      break;
    case "failed":
      icon = <XCircle className="h-4 w-4 mr-1" />;
      break;
    case "pending":
      icon = <Clock className="h-4 w-4 mr-1" />;
      break;
    default:
      icon = <AlertCircle className="h-4 w-4 mr-1" />;
  }
  
  return (
    <Badge 
      variant="outline" 
      className={`flex items-center ${statusColors[status as keyof typeof statusColors] || "bg-gray-100"}`}
    >
      {icon}
      <span>{statusText}</span>
    </Badge>
  );
}

// Main payment tab component
export function PaymentTab() {
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch payments
  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/admin/payments'],
    enabled: true,
  });
  
  // Fetch projects for the dropdown
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/projects/admin'],
    enabled: true,
  });
  
  // Fetch users for the dropdown
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users/admin'],
    enabled: true,
  });
  
  // Create payment request mutation
  const createPaymentRequest = useMutation({
    mutationFn: async (data: PaymentRequestFormValues) => {
      return apiRequest('POST', '/api/payment-requests', {
        projectId: parseInt(data.projectId),
        userId: parseInt(data.userId),
        amount: parseFloat(data.amount),
        description: data.description,
        messageContent: data.messageContent
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments'] });
      toast({
        title: "Payment Request Created",
        description: "The payment request has been sent to the customer.",
        variant: "default",
      });
      setIsNewRequestOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Payment Request",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Form for creating new payment requests
  const form = useForm<PaymentRequestFormValues>({
    resolver: zodResolver(paymentRequestSchema),
    defaultValues: {
      projectId: "",
      userId: "",
      amount: "",
      description: "",
      messageContent: "Please review and approve this payment request."
    }
  });
  
  // Handle form submission
  function onSubmit(data: PaymentRequestFormValues) {
    createPaymentRequest.mutate(data);
  }
  
  // Handle project selection to auto-select the project owner
  function handleProjectChange(projectId: string) {
    const project = projects?.projects.find((p: any) => p.id.toString() === projectId);
    if (project) {
      form.setValue('userId', project.userId.toString());
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Payments</h2>
          <p className="text-muted-foreground">Manage payment requests and track payment status</p>
        </div>
        
        <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              New Payment Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Payment Request</DialogTitle>
              <DialogDescription>
                This will send a payment request to the customer and create a message with payment information.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleProjectChange(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingProjects ? (
                            <SelectItem value="loading" disabled>Loading projects...</SelectItem>
                          ) : (
                            projects?.projects.map((project: any) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingUsers ? (
                            <SelectItem value="loading" disabled>Loading users...</SelectItem>
                          ) : (
                            users?.users
                              .filter((user: any) => user.role === "customer")
                              .map((user: any) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.firstName} {user.lastName} ({user.email})
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Website development - Phase 1" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="messageContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message to Customer</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter a message to include with the payment request" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewRequestOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPaymentRequest.isPending}
                  >
                    {createPaymentRequest.isPending ? "Creating..." : "Create Payment Request"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Payment Requests</CardTitle>
          <CardDescription>
            Showing all payment requests across your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingPayments ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : payments?.payments?.length > 0 ? (
                payments.payments.map((payment: any) => {
                  // Find the associated project and user
                  const project = projects?.projects.find(
                    (p: any) => p.id === payment.projectId
                  );
                  const user = users?.users.find(
                    (u: any) => u.id === payment.userId
                  );
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                          ${parseFloat(payment.amount).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell>{project?.name || 'Unknown Project'}</TableCell>
                      <TableCell>
                        {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            {payment.createdAt ? format(new Date(payment.createdAt), 'MMM d, yyyy') : ''}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {payment.createdAt ? formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true }) : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PaymentStatus status={payment.status} />
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <CreditCard className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No payment requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment Statistics</CardTitle>
          <CardDescription>
            Overview of payment activity and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-md flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-3">
                <CreditCard className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Payments</p>
                <p className="text-xl font-semibold">
                  {isLoadingPayments ? (
                    <Skeleton className="h-6 w-12 inline-block" />
                  ) : (
                    payments?.payments?.length || 0
                  )}
                </p>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-md flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-3">
                <CheckCircle className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-green-700">Completed</p>
                <p className="text-xl font-semibold">
                  {isLoadingPayments ? (
                    <Skeleton className="h-6 w-12 inline-block" />
                  ) : (
                    payments?.payments?.filter((p: any) => p.status === "completed").length || 0
                  )}
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-md flex items-center">
              <div className="rounded-full bg-yellow-100 p-3 mr-3">
                <Clock className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm text-yellow-700">Pending</p>
                <p className="text-xl font-semibold">
                  {isLoadingPayments ? (
                    <Skeleton className="h-6 w-12 inline-block" />
                  ) : (
                    payments?.payments?.filter((p: any) => p.status === "pending").length || 0
                  )}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md flex items-center">
              <div className="rounded-full bg-gray-100 p-3 mr-3">
                <DollarSign className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <p className="text-sm text-gray-700">Total Revenue</p>
                <p className="text-xl font-semibold">
                  {isLoadingPayments ? (
                    <Skeleton className="h-6 w-20 inline-block" />
                  ) : (
                    `$${payments?.payments
                      ?.filter((p: any) => p.status === "completed")
                      .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0)
                      .toFixed(2) || "0.00"}`
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}