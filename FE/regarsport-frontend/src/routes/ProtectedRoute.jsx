import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  adminOnly = false,
  allowedRoles = null,
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const effectiveAllowedRoles = allowedRoles || (adminOnly ? ["admin"] : null);

  if (effectiveAllowedRoles && !effectiveAllowedRoles.includes(user.role)) {
    if (user.role === "logistics") {
      return <Navigate to="/admin/orders" />;
    }
    return <Navigate to="/dashboard" />;
  }

  return children;
}