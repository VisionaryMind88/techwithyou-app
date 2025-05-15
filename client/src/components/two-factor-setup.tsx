import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Smartphone } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorSetupProps {
  onComplete?: () => void;
}

export function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  
  const { setupTwoFactorAuth, completeTwoFactorSetup } = useAuth();
  const { toast } = useToast();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      if (!phoneNumber || phoneNumber.trim().length < 10) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid phone number to continue.",
          variant: "destructive",
        });
        return;
      }
      
      // Format phone number to E.164 format if needed
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      const vid = await setupTwoFactorAuth(formattedPhone);
      setVerificationId(vid);
      setStep('code');
    } catch (error) {
      console.error("Failed to send verification code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      if (!verificationCode || verificationCode.trim().length < 6) {
        toast({
          title: "Invalid Code",
          description: "Please enter the 6-digit verification code.",
          variant: "destructive",
        });
        return;
      }
      
      await completeTwoFactorSetup(verificationId, verificationCode);
      
      toast({
        title: "Two-Factor Authentication Enabled",
        description: "Your account is now protected with 2FA.",
      });
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Failed to verify code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-center mb-4 text-blue-500">
          {step === 'phone' ? (
            <Smartphone size={48} />
          ) : (
            <ShieldCheck size={48} />
          )}
        </div>
        <CardTitle className="text-2xl text-center">
          {step === 'phone' ? "Set Up Two-Factor Authentication" : "Verify Your Phone"}
        </CardTitle>
        <CardDescription className="text-center">
          {step === 'phone' 
            ? "Add an extra layer of security to your account with 2FA" 
            : "Enter the verification code sent to your phone"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter your phone number in international format (e.g., +1234567890)
              </p>
            </div>
            
            {/* reCAPTCHA container */}
            <div id="recaptcha-container" className="flex justify-center my-4"></div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending Code..." : "Send Verification Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to your phone
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full mt-2"
              onClick={() => setStep('phone')}
              disabled={isLoading}
            >
              Change Phone Number
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col text-center text-sm text-muted-foreground">
        <p>
          Two-factor authentication adds an extra layer of security by requiring
          a verification code from your phone in addition to your password.
        </p>
      </CardFooter>
    </Card>
  );
}