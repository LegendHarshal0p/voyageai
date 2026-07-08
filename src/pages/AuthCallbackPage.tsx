import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        setStatus("error");
        return;
      }
      setStatus("success");
      setTimeout(() => navigate("/dashboard"), 1500);
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 pb-8">
          {status === "checking" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Confirming your email...</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <p className="text-sm text-muted-foreground">
                Email confirmed. Redirecting to your dashboard...
              </p>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-muted-foreground">
                We couldn't confirm this link. It may have expired.
              </p>
              <Link to="/login">
                <Button variant="outline" className="mt-2">
                  Back to login
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
