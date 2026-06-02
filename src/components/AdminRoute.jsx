import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const currentUserEmail = localStorage.getItem("currentUserEmail");
  const currentUserRole = localStorage.getItem("currentUserRole");

  if (!currentUserEmail) {
    return <Navigate to="/login" replace />;
  }

  if (currentUserRole !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}