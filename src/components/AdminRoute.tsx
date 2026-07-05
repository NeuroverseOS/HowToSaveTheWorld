import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Helper to check admin role for a given user id
    const checkAdminRole = async (userId: string) => {
      try {
        console.log("Checking admin role for user:", userId);
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();

        console.log("Admin check result:", { data, error });

        if (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(!!data);

        if (!data) {
          toast({
            title: "Access Denied",
            description: "You do not have admin privileges.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Admin role check error:", error);
        setIsAdmin(false);
      }
    };

    console.log("Starting admin auth check...");

    // 1) Listen for auth state changes (synchronous callback only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change event:", event, session?.user?.email);
        setSession(session);

        if (!session?.user) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        // Defer role check to avoid issues inside callback
        setTimeout(() => {
          checkAdminRole(session.user.id);
        }, 0);
      }
    );

    // 2) Initial session load
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Session error:", error);
        setIsLoading(false);
        setIsAdmin(false);
        return;
      }

      console.log("Initial session:", session?.user?.email);
      setSession(session);

      if (!session?.user) {
        setIsLoading(false);
        setIsAdmin(false);
        return;
      }

      checkAdminRole(session.user.id).finally(() => {
        setIsLoading(false);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-neuro-cyan animate-pulse">Verifying admin access...</div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to dashboard if not admin
  if (isAdmin === false) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render protected content
  return <>{children}</>;
}
