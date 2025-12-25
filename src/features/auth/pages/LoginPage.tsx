import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "../useAuth";
import { useToast } from "../../../components/toast/ToastProvider";

export function LoginPage() {
  const { signIn } = useAuth();
  const { push } = useToast();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      nav("/labs");
    } catch (err: any) {
      push({ title: "Login failed", message: err?.message ?? "Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <Card title="Sign in" subtitle="Email & password">
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
            autoComplete="current-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <div className="text-sm text-slate-600">
            No account?{" "}
            <Link className="underline underline-offset-4" to="/signup">
              Create one
            </Link>
          </div>
        </form>
      </Card>
    </AuthLayout>
  );
}
