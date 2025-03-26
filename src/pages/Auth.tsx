
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
      }
    };

    handleEmailVerification();
  }, [location]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?type=recovery`,
        });
        if (error) throw error;
        toast.success("Password reset link sent", {
          description: "We've sent you a password reset link. Please check your email.",
        });
        setIsForgotPassword(false);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?type=signup`,
          },
        });
        if (error) {
          if (error.message === "User already registered") {
            toast.error("Account exists", {
              description: "This email is already registered. Please sign in instead.",
            });
            setIsSignUp(false);
          } else {
            throw error;
          }
          return;
        }
        toast.success("Verification email sent", {
          description: "Please check your email to verify your account. You can close this tab after verification and log in to your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
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
        toast.success("Welcome back!", {
          description: "Successfully signed in.",
        });
        navigate("/notes");
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message,
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
                <Button onClick={() => setVerificationMessage(null)} variant="outline" className="w-full mt-4">
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
                  onClick={() => resetForm()}
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
