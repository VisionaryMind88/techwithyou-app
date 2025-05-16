import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Payment } from "@shared/schema";

// Make sure to call `loadStripe` outside of a component's render to avoid recreating the Stripe object on every render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing Stripe public key. Payment functionality will be limited.');
}

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = ({ 
  onSuccess,
  onCancel,
  paymentInfo
}: { 
  onSuccess: () => void; 
  onCancel: () => void;
  paymentInfo: {
    amount: number;
    description: string;
    paymentId: number;
  }
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Payment processing is not available at the moment.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment-success',
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An unknown error occurred",
          variant: "destructive",
        });
      } else {
        // Payment succeeded if no error and we're still here (didn't redirect)
        toast({
          title: "Payment Successful",
          description: "Thank you for your payment!",
        });
        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Amount:</span>
          <span className="text-sm font-bold">${paymentInfo.amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium">Description:</span>
          <span className="text-sm">{paymentInfo.description}</span>
        </div>
      </div>
      
      <PaymentElement />
      
      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing}>
          {isProcessing ? "Processing..." : "Pay Now"}
        </Button>
      </div>
    </form>
  );
};

export function PaymentCheckout({ 
  paymentId,
  amount,
  description,
  projectId,
  onClose,
  onSuccess
}: { 
  paymentId: number;
  amount: number;
  description: string;
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          paymentId,
          amount,
          projectId,
          description
        });
        
        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("Could not initialize payment processor");
          toast({
            title: "Payment Error",
            description: "Could not initialize payment. Please try again later.",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while setting up the payment");
        toast({
          title: "Payment Setup Error",
          description: err.message || "An error occurred while setting up the payment",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [paymentId, amount, projectId, description, toast]);

  if (!stripePromise) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Payment Unavailable</CardTitle>
          <CardDescription>
            Payment processing is not available at the moment. Please contact support.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={onClose} className="w-full">Close</Button>
        </CardFooter>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Setting Up Payment</CardTitle>
          <CardDescription>Please wait while we set up your payment...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </CardContent>
      </Card>
    );
  }

  if (error || !clientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Payment Error</CardTitle>
          <CardDescription>
            {error || "Could not initialize payment. Please try again later."}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={onClose} className="w-full">Close</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
        <CardDescription>
          Enter your payment details to complete this transaction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm 
            onSuccess={onSuccess} 
            onCancel={onClose}
            paymentInfo={{
              amount,
              description,
              paymentId
            }}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}

// Component for success page after redirect
export function PaymentSuccessPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [paymentInfo, setPaymentInfo] = useState<Payment | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const paymentIntentId = queryParams.get('payment_intent');
    
    if (paymentIntentId) {
      // Verify payment status on the server
      apiRequest("GET", `/api/payment-verify?payment_intent=${paymentIntentId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setStatus('success');
            setPaymentInfo(data.payment);
            toast({
              title: "Payment Confirmed",
              description: "Your payment has been successfully processed!",
            });
          } else {
            setStatus('error');
            toast({
              title: "Payment Verification Failed",
              description: data.message || "We could not verify your payment. Please contact support.",
              variant: "destructive",
            });
          }
        })
        .catch(err => {
          setStatus('error');
          toast({
            title: "Payment Verification Error",
            description: err.message || "An error occurred while verifying your payment",
            variant: "destructive",
          });
        });
    } else {
      setStatus('error');
    }
  }, [toast]);
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" aria-label="Loading"/>
          <h2 className="text-xl font-semibold">Verifying Your Payment...</h2>
          <p className="text-muted-foreground mt-2">Please wait while we confirm your payment details.</p>
        </div>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Payment Verification Failed</h2>
          <p className="text-muted-foreground mt-2">
            We could not verify your payment. Please contact our support team for assistance.
          </p>
          <Button className="mt-6" onClick={() => window.location.href = '/'}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Payment Successful!</h2>
        <p className="text-muted-foreground mt-2">
          Thank you for your payment. Your transaction has been completed successfully.
        </p>
        {paymentInfo && (
          <div className="mt-4 p-4 bg-muted rounded-md text-left">
            <div className="flex justify-between py-1">
              <span className="font-medium">Amount:</span>
              <span>${parseFloat(paymentInfo.amount.toString()).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium">Date:</span>
              <span>{new Date(paymentInfo.updatedAt || paymentInfo.createdAt || Date.now()).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium">Status:</span>
              <span className="capitalize">{paymentInfo.status}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium">Description:</span>
              <span>{paymentInfo.description}</span>
            </div>
          </div>
        )}
        <Button className="mt-6" onClick={() => window.location.href = '/'}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}