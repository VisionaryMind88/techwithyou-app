import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { BottomNavigation } from "@/components/mobile/bottom-navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ amount, description, projectId }: { amount: number, description: string, projectId: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    setIsProcessing(false);

    if (error) {
      setErrorMessage(error.message || "An unknown error occurred");
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <PaymentElement />
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            Processing...
          </>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Parse query parameters
  const params = new URLSearchParams(window.location.search);
  const amount = parseFloat(params.get('amount') || '0');
  const description = params.get('description') || 'Payment';
  const projectId = parseInt(params.get('projectId') || '0');
  
  useEffect(() => {
    if (!amount || isNaN(amount) || amount <= 0) {
      setError('Invalid payment amount');
      setLoading(false);
      return;
    }
    
    // Create PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          amount, 
          projectId,
          description
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create payment');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message || 'An error occurred while setting up the payment');
        console.error('Payment setup error:', err);
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, projectId, description]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Desktop view (always visible) and Mobile view (conditionally visible) */}
      {isMobileSidebarOpen ? (
        <Sidebar 
          isMobile={true} 
          onClose={() => setIsMobileSidebarOpen(false)} 
          userRole={user?.role || 'customer'}
        />
      ) : (
        <Sidebar 
          isMobile={false} 
          onClose={() => {}} 
          userRole={user?.role || 'customer'} 
        />
      )}
      
      <div className="flex-1">
        {/* Mobile Header */}
        <MobileHeader 
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          title="Payment Checkout"
        />
        
        {/* Main Content */}
        <main className="p-4 md:p-6 max-w-4xl mx-auto">
          <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardHeader>
              <CardTitle>Complete Your Payment</CardTitle>
              <CardDescription>
                {description} - ${amount.toFixed(2)}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-sm text-gray-600">Setting up your payment...</p>
                </div>
              ) : error ? (
                <div className="py-6">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  <div className="mt-4 text-center">
                    <Link to="/">
                      <Button variant="outline">Return to Dashboard</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm 
                    amount={amount} 
                    description={description}
                    projectId={projectId}
                  />
                </Elements>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-xs text-gray-500">
                <p>Your payment is securely processed by Stripe.</p>
                <p>Your card information is never stored on our servers.</p>
              </div>
            </CardFooter>
          </Card>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}