import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationProps {
  email: string;
  onComplete?: () => void;
}

export function EmailVerification({ email, onComplete }: EmailVerificationProps) {
  const [isResending, setIsResending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(true);
  const { resendVerificationEmail } = useAuth();
  const { toast } = useToast();

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      await resendVerificationEmail();
      setVerificationSent(true);
      toast({
        title: "Verification Email Sent",
        description: "A new verification email has been sent to your inbox.",
      });
    } catch (error) {
      console.error("Failed to resend verification email:", error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-center mb-4 text-blue-500">
          <Mail size={48} />
        </div>
        <CardTitle className="text-2xl text-center">Verify Your Email</CardTitle>
        <CardDescription className="text-center">
          We've sent a verification link to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={verificationSent ? "default" : "destructive"}>
          <div className="flex items-start gap-3">
            {verificationSent ? (
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5" />
            )}
            <div>
              <AlertTitle>{verificationSent ? "Verification Email Sent" : "Email Not Received?"}</AlertTitle>
              <AlertDescription className="mt-1">
                {verificationSent
                  ? "Please check your email inbox and click on the verification link to continue. Don't forget to check your spam folder."
                  : "If you haven't received the verification email, click the button below to resend it."}
              </AlertDescription>
            </div>
          </div>
        </Alert>

        <div className="text-sm text-muted-foreground">
          <p>What happens next?</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Open the email from TechWithYou</li>
            <li>Click the verification link in the email</li>
            <li>Once verified, you'll be able to access your account</li>
          </ol>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button 
          onClick={handleResendVerification} 
          disabled={isResending}
          variant="outline"
          className="w-full"
        >
          {isResending ? "Sending..." : "Resend Verification Email"}
        </Button>
        {onComplete && (
          <Button 
            onClick={onComplete} 
            className="w-full"
          >
            I've Verified My Email
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}