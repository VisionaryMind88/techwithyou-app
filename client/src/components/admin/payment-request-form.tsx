import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Form schema and validation
const paymentRequestSchema = z.object({
  amount: z.preprocess(
    (a) => parseFloat(a as string), 
    z.number().positive("Amount must be positive").min(0.01, "Minimum amount is $0.01")
  ),
  projectId: z.string().min(1, "Project is required"),
  userId: z.string().min(1, "User is required"),
  description: z.string().min(5, "Description is required").max(200, "Description is too long"),
  messageContent: z.string().min(5, "Message content is required").max(500, "Message is too long"),
});

type PaymentRequestForm = z.infer<typeof paymentRequestSchema>;

type Project = {
  id: number;
  name: string;
  userId: number;
};

type User = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

interface PaymentRequestFormProps {
  projects: Project[];
  users: User[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentRequestForm({ 
  projects, 
  users, 
  onSuccess, 
  onCancel 
}: PaymentRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<PaymentRequestForm>({
    resolver: zodResolver(paymentRequestSchema),
    defaultValues: {
      amount: undefined,
      projectId: "",
      userId: "",
      description: "",
      messageContent: "Please review the following payment request:",
    },
  });

  const usersByProject = projects.reduce<Record<number, number>>((acc, project) => {
    acc[project.id] = project.userId;
    return acc;
  }, {});

  const handleSelectProject = (projectId: string) => {
    // When project is selected, auto-select the user if there's only one associated
    const userId = usersByProject[parseInt(projectId)];
    if (userId) {
      form.setValue("userId", userId.toString());
    }
  };

  const onSubmit = async (data: PaymentRequestForm) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/payment-requests", {
        amount: parseFloat(data.amount.toString()),
        projectId: parseInt(data.projectId),
        userId: parseInt(data.userId),
        description: data.description,
        messageContent: data.messageContent,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create payment request");
      }
      
      // Successfully created payment request
      const result = await response.json();
      
      toast({
        title: "Payment Request Sent",
        description: "The payment request has been sent to the customer.",
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/messages/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/admin"] });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Payment Request</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleSelectProject(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
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
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users
                        .filter(user => user.id !== 1) // Exclude admin user
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.firstName} {user.lastName} ({user.email})
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
                  <FormLabel>Payment Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Project milestone payment"
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
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Message to the customer"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Payment Request"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}