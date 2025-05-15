import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { insertUserSchema } from "@shared/schema";
import { RiGoogleFill, RiGithubFill } from "react-icons/ri";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// Registration form schema
const registerSchema = insertUserSchema.pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
}).extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
.refine((data) => {
  // Password strength validation
  // At least 8 characters, with uppercase, lowercase and numbers
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(data.password);
}, {
  message: "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number",
  path: ["password"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

interface AuthFormProps {
  onSuccessfulAuth?: () => void;
}

export function AuthForm({ onSuccessfulAuth }: AuthFormProps) {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [emailExists, setEmailExists] = useState(false);
  const { toast } = useToast();
  const { signUp, signIn, signInWithGoogle, signInWithGitHub } = useAuth();

  // Login form
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Register form
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const onLoginSubmit = async (values: LoginValues) => {
    try {
      await signIn(values.email, values.password);
      onSuccessfulAuth?.();
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    }
  };

  const onRegisterSubmit = async (values: RegisterValues) => {
    try {
      await signUp(values.email, values.password, values.firstName, values.lastName);
      onSuccessfulAuth?.();
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again with different credentials",
        variant: "destructive",
      });
    }
  };

  const handleEmailCheck = async (email: string) => {
    if (!email) return;
    
    try {
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setEmailExists(data.exists);
      }
    } catch (error) {
      console.error("Error checking email:", error);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await signInWithGoogle();
      // Google auth will redirect, so we don't need to call onSuccessfulAuth here
    } catch (error: any) {
      toast({
        title: "Google Sign In failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleGitHubAuth = async () => {
    try {
      await signInWithGitHub();
      // GitHub auth will redirect, so we don't need to call onSuccessfulAuth here
    } catch (error: any) {
      toast({
        title: "GitHub Sign In failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8">
      {/* Toggle Buttons */}
      <div className="flex w-full rounded-md overflow-hidden mb-6 text-sm">
        <button 
          className={`flex-1 py-2 font-medium ${authMode === "login" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600"}`}
          onClick={() => setAuthMode("login")}
        >
          Login
        </button>
        <button 
          className={`flex-1 py-2 font-medium ${authMode === "register" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600"}`}
          onClick={() => setAuthMode("register")}
        >
          Register
        </button>
      </div>

      {/* Login Form */}
      {authMode === "login" && (
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <FormField
                control={loginForm.control}
                name="rememberMe"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-me" 
                      checked={field.value} 
                      onCheckedChange={field.onChange} 
                    />
                    <label 
                      htmlFor="remember-me" 
                      className="text-sm font-medium text-gray-700"
                    >
                      Remember me
                    </label>
                  </div>
                )}
              />
              <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                Forgot password?
              </a>
            </div>
            <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
              {loginForm.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>
      )}

      {/* Register Form */}
      {authMode === "register" && (
        <Form {...registerForm}>
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
            <FormField
              control={registerForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="you@example.com" 
                      {...field} 
                      onBlur={(e) => {
                        field.onBlur();
                        handleEmailCheck(e.target.value);
                      }}
                    />
                  </FormControl>
                  {emailExists && (
                    <div className="mt-1 text-sm text-destructive">
                      This email already exists. 
                      <button 
                        className="font-medium underline ml-1" 
                        onClick={() => setAuthMode("login")}
                      >
                        Login instead?
                      </button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={registerForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={registerForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <div className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
              {registerForm.formState.isSubmitting ? "Registering..." : "Register"}
            </Button>
          </form>
        </Form>
      )}

      {/* OAuth Options */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={handleGoogleAuth}
            className="flex items-center justify-center"
          >
            <RiGoogleFill className="mr-2 h-4 w-4" />
            Google
          </Button>
          <Button 
            variant="outline" 
            onClick={handleGitHubAuth}
            className="flex items-center justify-center"
          >
            <RiGithubFill className="mr-2 h-4 w-4" />
            GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}
