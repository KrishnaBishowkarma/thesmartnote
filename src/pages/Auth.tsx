import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircleIcon, XCircleIcon } from "lucide-react";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for verification parameters on page load
  useEffect(() => {
    const handleEmailVerification = async () => {
      const queryParams = new URLSearchParams(location.search);
      const type = queryParams.get('type');
      const error = queryParams.get('error');
      const errorDescription = queryParams.get('error_description');

      if (type === 'signup' || type === 'recovery') {
        if (error) {
          setVerificationMessage({
            type: 'error',
            message: errorDescription || 'Verification link is expired or invalid. Please request a new one.'
          });
        } else {
          setVerificationMessage({
            type: 'success',
            message: 'Email verification successful! You can now sign in to your account.'
          });
        }
      } else if (type === 'unverified') {
        setVerificationMessage({
          type: 'error',
          message: 'Please verify your email before accessing the application.'
        });
      }
    };

    handleEmailVerification();
  }, [location]);

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isForgotPassword) {
        if (!email) {
          toast.error("Please enter your email address");
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?type=recovery`,
        });
        if (error) throw error;
        toast.success("Password reset link sent", {
          description: "We've sent you a password reset link. Please check your email.",
        });
        setIsForgotPassword(false);
        setEmail("");
        setPassword("");
      } else if (isSignUp) {
        // Validate password
        const passwordError = validatePassword(password);
        if (passwordError) {
          toast.error("Invalid password", {
            description: passwordError,
          });
          return;
        }

        // Check if user exists
        const { data: existingUser } = await supabase.auth.getUser();
        if (existingUser.user) {
          toast.error("Account exists", {
            description: "This email is already registered. Please sign in instead.",
          });
          setIsSignUp(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?type=signup`,
          },
        });

        if (error) throw error;

        if (data?.user) {
          toast.success("Verification email sent", {
            description: "Please check your email to verify your account. You must verify your email before signing in.",
          });
          // Sign out the user until they verify their email
          await supabase.auth.signOut();
          setEmail("");
          setPassword("");
        }
      } else {
        // Sign in
        if (!email || !password) {
          toast.error("Please enter both email and password");
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message === "Invalid login credentials") {
            toast.error("Invalid credentials", {
              description: "Please check your email and password and try again.",
            });
          } else {
            throw error;
          }
          return;
        }

        // Check if email is verified
        if (!data.user?.email_confirmed_at) {
          toast.error("Email not verified", {
            description: "Please verify your email before signing in. Check your inbox for the verification link.",
          });
          // Sign out the user since they're not verified
          await supabase.auth.signOut();
          return;
        }

        toast.success("Welcome back!", {
          description: "Successfully signed in.",
        });
        navigate("/notes");
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error("Error", {
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setIsForgotPassword(false);
    setIsSignUp(false);
    setVerificationMessage(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          {verificationMessage ? (
            <>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                {verificationMessage.type === 'success' ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-500" />
                )}
                {verificationMessage.type === 'success' ? 'Verification Successful' : 'Verification Failed'}
              </CardTitle>
              <Alert className={`${verificationMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                <AlertTitle>
                  {verificationMessage.type === 'success' ? 'Success!' : 'Error!'}
                </AlertTitle>
                <AlertDescription>{verificationMessage.message}</AlertDescription>
              </Alert>
              {verificationMessage.type === 'success' && (
                <Button onClick={() => setVerificationMessage(null)} className="w-full mt-4">
                  Proceed to Sign In
                </Button>
              )}
              {verificationMessage.type === 'error' && (
                <Button onClick={resetForm} variant="outline" className="w-full mt-4">
                  Try Again
                </Button>
              )}
            </>
          ) : (
            <>
              <CardTitle className="text-2xl font-bold">
                {isForgotPassword
                  ? "Reset Password"
                  : isSignUp
                  ? "Create an account"
                  : "Welcome back"}
              </CardTitle>
              <CardDescription>
                {isForgotPassword
                  ? "Enter your email below to receive a password reset link"
                  : isSignUp
                  ? "Enter your email below to create your account"
                  : "Enter your email below to sign in to your account"}
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        {!verificationMessage && (
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {!isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {isSignUp && (
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters long and contain uppercase, lowercase, and numbers.
                    </p>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Loading..."
                  : isForgotPassword
                  ? "Send Reset Link"
                  : isSignUp
                  ? "Sign Up"
                  : "Sign In"}
              </Button>
              {!isForgotPassword && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </Button>
              )}
              {!isSignUp && !isForgotPassword && (
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => setIsForgotPassword(true)}
                >
                  Forgot your password?
                </Button>
              )}
              {isForgotPassword && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={resetForm}
                >
                  Back to sign in
                </Button>
              )}
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
