import { useEffect, useState } from 'react';
import { useLocation, Link } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { BottomNavigation } from "@/components/mobile/bottom-navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  useEffect(() => {
    // Get payment_intent from URL
    const params = new URLSearchParams(window.location.search);
    const paymentIntent = params.get('payment_intent');
    const paymentStatus = params.get('redirect_status');
    
    if (!paymentIntent) {
      setError('No payment information found');
      setLoading(false);
      return;
    }
    
    if (paymentStatus !== 'succeeded') {
      setError('Payment was not successful');
      setLoading(false);
      return;
    }
    
    // Verify payment with our server
    const verifyPayment = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("GET", `/api/payment-verify?payment_intent=${paymentIntent}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to verify payment');
        }
        
        const data = await response.json();
        setPaymentData(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred while verifying the payment');
        console.error('Payment verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, []);

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
          title="Payment Successful"
        />
        
        {/* Main Content */}
        <main className="p-4 md:p-6 max-w-4xl mx-auto">
          <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
              <CardDescription>
                Your payment has been processed
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-sm text-gray-600">Verifying your payment...</p>
                </div>
              ) : error ? (
                <div className="py-6">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-center">Payment Successful!</h3>
                    <p className="text-gray-500 text-center mt-2">
                      Thank you for your payment. Your transaction was successful.
                    </p>
                  </div>
                  
                  {paymentData?.payment && (
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">${paymentData.payment.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span className="font-medium">{paymentData.payment.description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-green-600">Completed</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {new Date(paymentData.payment.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-center">
              <Link to={paymentData?.payment?.projectId ? `/project-detail/${paymentData.payment.projectId}` : "/"}>
                <Button>
                  {paymentData?.payment?.projectId ? "Go to Project" : "Return to Dashboard"}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}