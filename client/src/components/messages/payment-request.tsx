import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useRouter } from "wouter";
import { DollarSign, Check, X, CreditCard } from "lucide-react";

type PaymentRequestProps = {
  messageId: number;
  projectId: number;
  amount: number;
  description: string;
  status: "pending" | "completed" | "failed" | "canceled";
  paymentId?: number;
};

export function PaymentRequest({ 
  messageId, 
  projectId, 
  amount, 
  description, 
  status, 
  paymentId 
}: PaymentRequestProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useRouter();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

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

  const handlePayNow = async () => {
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/payment-intent", {
        amount,
        description,
        projectId,
        messageId,
        paymentId,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create payment");
      }

      const { clientSecret, paymentId: newPaymentId } = await response.json();

      // Store the payment ID in session storage to reference after payment completion
      sessionStorage.setItem('currentPaymentId', newPaymentId.toString());
      sessionStorage.setItem('paymentAmount', amount.toString());
      sessionStorage.setItem('paymentDescription', description);

      // Navigate to payment page
      navigate(`/payment-checkout?clientSecret=${clientSecret}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "There was an error processing your payment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!paymentId) return;

    setIsLoading(true);
    
    try {
      const response = await apiRequest("PATCH", `/api/payments/${paymentId}/status`, {
        status: "canceled",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel payment");
      }
      
      setCurrentStatus("canceled");
      toast({
        title: "Payment Canceled",
        description: "The payment request has been canceled.",
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/messages/project", projectId] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-2 w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-primary mr-2" />
            <CardTitle className="text-base">Payment Request</CardTitle>
          </div>
          <Badge className={getStatusColor(currentStatus)}>
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-xl font-bold">{formatCurrency(amount)}</p>
      </CardContent>
      {currentStatus === "pending" && (
        <CardFooter className="pt-0 flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-1" />
            Decline
          </Button>
          <Button 
            size="sm" 
            onClick={handlePayNow}
            disabled={isLoading}
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Pay Now
          </Button>
        </CardFooter>
      )}
      {currentStatus === "completed" && (
        <CardFooter className="pt-0 flex justify-end">
          <div className="flex items-center text-green-600">
            <Check className="h-4 w-4 mr-1" />
            <span className="text-sm">Paid</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}