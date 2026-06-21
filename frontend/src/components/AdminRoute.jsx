import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function AdminRoute({ children }) {
  const { user, checkedSession } = useSelector((s) => s.auth);
  const token = localStorage.getItem("token");

  if (token && !checkedSession && !user) {
    return <div className="text-center py-20 text-gray-400">Loading...</div>;
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
