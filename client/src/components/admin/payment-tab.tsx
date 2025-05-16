import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, MoreVertical, PlusCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { PaymentRequestForm } from "./payment-request-form";

// Status badges
const PaymentStatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "canceled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
        status
      )}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// No longer needed as we're using the PaymentRequestForm component

export function PaymentTab() {
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all projects for the dropdown
  const { data: projectsData } = useQuery({
    queryKey: ["/api/projects/admin"],
  });

  // Fetch users for the dropdown
  const { data: usersData } = useQuery({
    queryKey: ["/api/users/admin"],
  });

  // Fetch all payments
  const { data: paymentsData, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["/api/payments/admin"],
  });

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: "",
      projectId: "",
      userId: "",
      description: "",
    },
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      return await apiRequest("POST", "/api/payments", {
        amount: parseFloat(data.amount),
        projectId: parseInt(data.projectId),
        userId: parseInt(data.userId),
        description: data.description,
      });
    },
    onSuccess: () => {
      toast({
        title: "Payment request created",
        description: "The payment request has been sent to the customer.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/admin"] });
      setIsNewPaymentOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating payment request",
        description: error.message || "There was an error creating the payment request.",
        variant: "destructive",
      });
    },
  });

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/payments/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Payment status updated",
        description: "The payment status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/admin"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating payment status",
        description: error.message || "There was an error updating the payment status.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: PaymentFormValues) => {
    createPaymentMutation.mutate(values);
  };

  // Payment stats calculation
  const getPaymentStats = () => {
    if (!paymentsData?.payments) return { total: 0, pending: 0, completed: 0, failed: 0 };

    const payments = paymentsData.payments;
    
    return {
      total: payments.length,
      pending: payments.filter((p: any) => p.status === "pending").length,
      completed: payments.filter((p: any) => p.status === "completed").length,
      failed: payments.filter((p: any) => p.status === "failed").length,
      canceled: payments.filter((p: any) => p.status === "canceled").length,
      totalAmount: payments
        .filter((p: any) => p.status === "completed")
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0)
        .toFixed(2),
    };
  };

  const stats = getPaymentStats();

  // Find project and user names
  const getProjectName = (projectId: number) => {
    if (!projectsData?.projects) return "Unknown Project";
    const project = projectsData.projects.find((p: any) => p.id === projectId);
    return project ? project.name : "Unknown Project";
  };

  const getUserName = (userId: number) => {
    if (!usersData?.users) return "Unknown User";
    const user = usersData.users.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Management</h2>
        <Dialog open={isNewPaymentOpen} onOpenChange={setIsNewPaymentOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Payment Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Payment Request</DialogTitle>
              <DialogDescription>
                Create a payment request that will be sent to the customer.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projectsData?.projects?.map((project: any) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {usersData?.users
                            ?.filter((user: any) => user.role === "customer")
                            .map((user: any) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
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
                        <Textarea
                          placeholder="Describe what this payment is for..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createPaymentMutation.isPending}
                  >
                    {createPaymentMutation.isPending ? "Creating..." : "Create Request"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalAmount || "0.00"}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <PaymentTable
            payments={paymentsData?.payments || []}
            getProjectName={getProjectName}
            getUserName={getUserName}
            onUpdateStatus={(id, status) =>
              updatePaymentStatusMutation.mutate({ id, status })
            }
            isLoading={isLoadingPayments}
          />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <PaymentTable
            payments={(paymentsData?.payments || []).filter((p: any) => p.status === "pending")}
            getProjectName={getProjectName}
            getUserName={getUserName}
            onUpdateStatus={(id, status) =>
              updatePaymentStatusMutation.mutate({ id, status })
            }
            isLoading={isLoadingPayments}
          />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <PaymentTable
            payments={(paymentsData?.payments || []).filter((p: any) => p.status === "completed")}
            getProjectName={getProjectName}
            getUserName={getUserName}
            onUpdateStatus={(id, status) =>
              updatePaymentStatusMutation.mutate({ id, status })
            }
            isLoading={isLoadingPayments}
          />
        </TabsContent>
        <TabsContent value="failed" className="mt-4">
          <PaymentTable
            payments={(paymentsData?.payments || []).filter((p: any) => p.status === "failed")}
            getProjectName={getProjectName}
            getUserName={getUserName}
            onUpdateStatus={(id, status) =>
              updatePaymentStatusMutation.mutate({ id, status })
            }
            isLoading={isLoadingPayments}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentTable({
  payments,
  getProjectName,
  getUserName,
  onUpdateStatus,
  isLoading,
}: {
  payments: any[];
  getProjectName: (id: number) => string;
  getUserName: (id: number) => string;
  onUpdateStatus: (id: number, status: string) => void;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableCaption>
            {isLoading
              ? "Loading payments..."
              : payments.length === 0
              ? "No payments found"
              : "List of all payment requests"}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.id}</TableCell>
                  <TableCell>${parseFloat(payment.amount).toFixed(2)}</TableCell>
                  <TableCell>{getProjectName(payment.projectId)}</TableCell>
                  <TableCell>{getUserName(payment.userId)}</TableCell>
                  <TableCell>
                    {payment.createdAt
                      ? format(new Date(payment.createdAt), "MMM d, yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {payment.status === "pending" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => onUpdateStatus(payment.id, "completed")}
                            >
                              Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onUpdateStatus(payment.id, "failed")}
                            >
                              Mark as Failed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onUpdateStatus(payment.id, "canceled")}
                            >
                              Cancel Payment
                            </DropdownMenuItem>
                          </>
                        )}
                        {payment.status === "failed" && (
                          <DropdownMenuItem
                            onClick={() => onUpdateStatus(payment.id, "pending")}
                          >
                            Retry Payment
                          </DropdownMenuItem>
                        )}
                        {payment.status === "canceled" && (
                          <DropdownMenuItem
                            onClick={() => onUpdateStatus(payment.id, "pending")}
                          >
                            Reactivate Payment
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}