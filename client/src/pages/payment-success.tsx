import { useEffect } from "react";
import { PaymentSuccessPage } from "@/components/checkout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessRoute() {
  // Use the payment success component we defined earlier
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Payment Status</h1>
        <Link href="/">
          <Button variant="outline">Return to Dashboard</Button>
        </Link>
      </div>
      
      <PaymentSuccessPage />
    </div>
  );
}