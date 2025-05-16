import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the zod schema for form validation
const paymentRequestSchema = z.object({
  amount: z.preprocess(
    (val) => parseFloat(val as string),
    z.number().positive({ message: "Amount must be a positive number" })
  ),
  projectId: z.preprocess(
    (val) => parseInt(val as string, 10),
    z.number({ message: "Project is required" })
  ),
  userId: z.preprocess(
    (val) => parseInt(val as string, 10),
    z.number({ message: "Customer is required" })
  ),
  description: z.string().min(5, { message: "Description is required (min 5 characters)" }),
  messageContent: z.string().optional(),
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
      projectId: undefined,
      userId: undefined,
      description: "",
      messageContent: "",
    },
  });

  const onSubmit = async (data: PaymentRequestForm) => {
    setIsSubmitting(true);
    
    try {
      // Set default message content if not provided
      if (!data.messageContent) {
        data.messageContent = `Payment Request: $${data.amount} - ${data.description}`;
      }
      
      const response = await apiRequest("POST", "/api/payment-requests", data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create payment request");
      }
      
      toast({
        title: "Success!",
        description: "Payment request has been created and sent to the customer.",
      });
      
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
  
  // Filter users to only show customers
  const customerUsers = users.filter(user => user.role === 'customer' || user.role === 'user');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  step="0.01" 
                  min="0.01"
                  {...field} 
                />
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
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
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
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customerUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName || user.email} {user.lastName || ""}
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
        
        <FormField
          control={form.control}
          name="messageContent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Custom message to send with the payment request. If left blank, a default message will be generated."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Payment Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}