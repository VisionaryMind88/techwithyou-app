import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { User, Project } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, DollarSign, Send } from "lucide-react";

const paymentSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  description: z.string().min(5, "Description should be at least 5 characters"),
  userId: z.string().min(1, "User is required"),
  projectId: z.string().min(1, "Project is required"),
  messageContent: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentRequestFormProps {
  users: User[];
  projects: Project[];
  onSuccess?: () => void;
}

export function PaymentRequestForm({ users, projects, onSuccess }: PaymentRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      description: "",
      userId: "",
      projectId: "",
      messageContent: "",
    },
  });
  
  const onSubmit = async (data: PaymentFormValues) => {
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest("POST", "/api/payment-requests", {
        amount: data.amount,
        description: data.description,
        userId: parseInt(data.userId),
        projectId: parseInt(data.projectId),
        messageContent: data.messageContent || `Payment Request: $${data.amount} - ${data.description}`,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create payment request");
      }
      
      // Reset form
      form.reset({
        amount: "",
        description: "",
        userId: "",
        projectId: "",
        messageContent: "",
      });
      
      // Invalidate queries to refresh related data
      queryClient.invalidateQueries({ queryKey: ['/api/payments/admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      
      toast({
        title: "Payment Request Created",
        description: "The payment request has been sent to the user",
      });
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error creating payment request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create payment request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filter projects by selected user
  const selectedUserId = form.watch("userId");
  const userProjects = selectedUserId 
    ? projects.filter(project => project.userId === parseInt(selectedUserId))
    : [];
  
  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle>Create Payment Request</CardTitle>
        <CardDescription>Send a payment request to a customer</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users
                        .filter(user => user.role === "customer")
                        .map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.email}
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
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!selectedUserId || userProjects.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedUserId 
                            ? "Select a customer first"
                            : userProjects.length === 0
                              ? "No projects available"
                              : "Select project"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userProjects.map(project => (
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (USD)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input 
                        {...field} 
                        placeholder="0.00" 
                        className="pl-9"
                        type="number"
                        step="0.01"
                        min="0.01"
                      />
                    </div>
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
                      {...field} 
                      placeholder="e.g., Project deposit, Monthly fee, etc." 
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
                  <FormLabel>Custom Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter a custom message to the customer" 
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    If left empty, a standard payment request message will be generated.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Payment Request
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}