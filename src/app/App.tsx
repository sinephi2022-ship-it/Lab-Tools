import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { Shell } from "./Shell";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { SignupPage } from "../features/auth/pages/SignupPage";
import { LabsLobbyPage } from "../features/labs/pages/LabsLobbyPage";
import { LabPage } from "../features/labs/pages/LabPage";

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/labs" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/labs" replace /> : <SignupPage />}
      />
      <Route
        path="/"
        element={<Navigate to={user ? "/labs" : "/login"} replace />}
      />

      <Route
        path="/labs"
        element={
          user ? (
            <Shell>
              <LabsLobbyPage />
            </Shell>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/lab/:labId/*"
        element={
          user ? (
            <Shell>
              <LabPage />
            </Shell>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
