"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthShell, FullPageSpinner } from "@/components/app/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
const supabase = createClient();
const router = useRouter();
  const { toast } = useToast();

const [loading, setLoading] = useState(true);
const [updating, setUpdating] = useState(false);
const [password, setPassword] = useState("");
const [confirm, setConfirm] = useState("");
const [error, setError] = useState<string | null>(null);
const [ready, setReady] = useState(false);

// Step 1: detect recovery session from URL hash
useEffect(() => {
  const initRecovery = async () => {
    try {
      setLoading(true);

      const hash = window.location.hash;

      const params = new URLSearchParams(hash.replace("#", ""));

      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const type = params.get("type");

      if (type !== "recovery" || !access_token || !refresh_token) {
        setError("Invalid or expired reset link");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setReady(true);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  initRecovery();
}, []);

// Step 2: update password
const handleUpdatePassword = async () => {
setError(null);

if (!password || !confirm) {
  setError("Please fill in both fields");
  return;
}

if (password !== confirm) {
  setError("Passwords do not match");
  return;
}

if (password.length < 6) {
  setError("Password must be at least 6 characters");
  return;
}

setUpdating(true);

const { error } = await supabase.auth.updateUser({
  password,
});

setUpdating(false);

if (error) {
  setError(error.message);
  return;
}

toast({ title: "Password updated", description: "Please sign in with your new password." });

await supabase.auth.signOut();
router.push("/auth/login");

};

if (loading) {
  return <FullPageSpinner label="Verifying your reset link" />;
}

if (error && !ready) {
  return (
    <AuthShell
      title="This link can't be used"
      description="Reset links expire and can only be used once."
    >
      <Alert variant="destructive">
        <AlertCircle />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      <Button asChild size="lg" className="mt-6 w-full">
        <Link href="/auth/login">Back to sign in</Link>
      </Button>
    </AuthShell>
  );
}

return (
  <AuthShell
    title="Choose a new password"
    description="Use at least 6 characters. You will be asked to sign in again afterwards."
  >
    <div className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        onClick={handleUpdatePassword}
        disabled={updating || !ready}
        loading={updating}
        size="lg"
        className="w-full"
      >
        {updating ? "Updating…" : "Update password"}
      </Button>
    </div>
  </AuthShell>
);
}
