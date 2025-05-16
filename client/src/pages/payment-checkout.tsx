import { useEffect, useState } from "react";
import { useSearch, useLocation } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Load stripe outside of the component tree to avoid recreation on renders
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY as string);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [paymentInfo, setPaymentInfo] = useState({
    amount: '',
    description: ''
  });

  useEffect(() => {
    // Get payment info from session storage
    const amount = sessionStorage.getItem('paymentAmount');
    const description = sessionStorage.getItem('paymentDescription');
    
    if (amount && description) {
      setPaymentInfo({
        amount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(parseFloat(amount)),
        description
      });
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsProcessing(true);
    setPaymentError("");

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        // Show error to your customer
        setPaymentError(result.error.message || "An unexpected error occurred.");
        toast({
          title: "Payment Failed",
          description: result.error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      } else {
        // The payment has been processed
        if (result.paymentIntent?.status === "succeeded") {
          // Update payment status in the database
          const paymentId = sessionStorage.getItem('currentPaymentId');
          
          if (paymentId) {
            await apiRequest("PATCH", `/api/payments/${paymentId}/status`, {
              status: "completed",
              stripePaymentIntentId: result.paymentIntent.id,
            });
          }
          
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully.",
          });
          
          // Clear session storage
          sessionStorage.removeItem('currentPaymentId');
          sessionStorage.removeItem('paymentAmount');
          sessionStorage.removeItem('paymentDescription');
          
          // Redirect to success page
          navigate("/payment-success");
        }
      }
    } catch (error: any) {
      setPaymentError(error.message || "An unexpected error occurred.");
      toast({
        title: "Payment Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="p-4 bg-primary-50 rounded-md">
          <h3 className="font-medium text-primary">Payment Details</h3>
          <div className="mt-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Amount:</span>
              <span className="font-medium">{paymentInfo.amount}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-sm text-gray-500">Description:</span>
              <span className="font-medium">{paymentInfo.description}</span>
            </div>
          </div>
        </div>
        
        <div className="px-1">
          <PaymentElement />
        </div>
        
        {paymentError && (
          <div className="text-sm text-red-600 mt-2">{paymentError}</div>
        )}
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? "Processing..." : "Pay Now"}
        </Button>
      </div>
    </form>
  );
}

export default function PaymentCheckoutPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const clientSecret = params.get("clientSecret");
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!clientSecret) {
      // If no client secret, redirect back to home
      navigate("/");
    }
  }, [clientSecret, navigate]);

  if (!clientSecret) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>
            Secure payment processing powered by Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm />
          </Elements>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <div className="text-xs text-gray-500">
            Your payment information is processed securely by Stripe. We don't store your card details.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}