import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "wouter";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccessRoute() {
  const [, navigate] = useRouter();
  const [paymentDetails, setPaymentDetails] = useState({
    amount: '',
    description: ''
  });

  useEffect(() => {
    // Get payment details from session storage
    const amount = sessionStorage.getItem('paymentAmount');
    const description = sessionStorage.getItem('paymentDescription');
    
    if (amount) {
      setPaymentDetails({
        amount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(parseFloat(amount)),
        description: description || 'Your payment'
      });
    }
    
    // Clear session storage
    sessionStorage.removeItem('currentPaymentId');
    sessionStorage.removeItem('paymentAmount');
    sessionStorage.removeItem('paymentDescription');
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Thank you for your payment of <strong>{paymentDetails.amount}</strong> for{" "}
            <strong>{paymentDetails.description}</strong>
          </p>
          <p className="text-gray-500">
            A receipt has been sent to your email address.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => navigate("/")}>
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}