import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import PublicApp from "./PublicApp";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";

function Router() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/admin/login") return <AdminLogin />;
  if (path === "/admin") return <AdminDashboard />;
  return <PublicApp />;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><Router /></React.StrictMode>);
