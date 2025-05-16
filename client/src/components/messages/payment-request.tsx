import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentCheckout } from "@/components/checkout";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

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
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePaymentSuccess = async () => {
    // Close payment dialog
    setIsOpen(false);
    
    // Show success message
    toast({
      title: "Payment Initiated",
      description: "Your payment is being processed. You'll be redirected to the payment success page shortly.",
    });
    
    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ["/api/messages/project", projectId] });
    queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
  };

  const handleCancelRequest = async () => {
    if (!paymentId) {
      toast({
        title: "Cannot Cancel",
        description: "Payment ID not found. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest("PATCH", `/api/payments/${paymentId}/status`, {
        status: "canceled"
      });
      
      if (response.ok) {
        toast({
          title: "Payment Request Canceled",
          description: "The payment request has been canceled successfully."
        });
        
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ["/api/messages/project", projectId] });
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to cancel payment request",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Status indicator color
  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    completed: "bg-green-100 text-green-800 border-green-300",
    failed: "bg-red-100 text-red-800 border-red-300",
    canceled: "bg-gray-100 text-gray-800 border-gray-300"
  };

  return (
    <>
      <Card className="mt-2 mb-2 border border-muted">
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Payment Request</CardTitle>
            <Badge className={statusColor[status]}>{status}</Badge>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="text-xl font-bold">${amount.toFixed(2)}</div>
        </CardContent>
        <CardFooter className="pt-0 pb-3 flex justify-end gap-2">
          {status === "pending" && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelRequest}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Cancel"}
              </Button>
              <Button 
                size="sm" 
                onClick={() => setIsOpen(true)}
              >
                Pay Now
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <PaymentCheckout
            paymentId={paymentId || 0}
            amount={amount}
            description={description}
            projectId={projectId}
            onClose={() => setIsOpen(false)}
            onSuccess={handlePaymentSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}