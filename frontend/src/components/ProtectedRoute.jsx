import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children }) {
  const { user, checkedSession } = useSelector((s) => s.auth);
  const location = useLocation();

  // Avoid bouncing to /login before the initial session check (GET /users/me) resolves
  const token = localStorage.getItem("token");
  if (token && !checkedSession && !user) {
    return <div className="text-center py-20 text-gray-400">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
