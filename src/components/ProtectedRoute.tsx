import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkEmailVerification = async () => {
      if (user) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setIsVerified(!!currentUser?.email_confirmed_at);
      }
      setChecking(false);
    };

    checkEmailVerification();
  }, [user]);

  if (loading || checking) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (!isVerified) {
    return <Navigate to="/auth?type=unverified" />;
  }

  return <>{children}</>;
}