import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "../useAuth";
import { useToast } from "../../../components/toast/ToastProvider";

export function SignupPage() {
  const { signUp } = useAuth();
  const { push } = useToast();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      push({ title: "Password too short", message: "Use at least 8 characters." });
      return;
    }
    setBusy(true);
    try {
      await signUp(email.trim(), password);
      nav("/labs");
    } catch (err: any) {
      push({ title: "Signup failed", message: err?.message ?? "Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <Card title="Create account" subtitle="Email & password">
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            label="Email"
            autoComplete="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            autoComplete="new-password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Creating…" : "Create account"}
          </Button>
          <div className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="underline underline-offset-4" to="/login">
              Sign in
            </Link>
          </div>
        </form>
      </Card>
    </AuthLayout>
  );
}
