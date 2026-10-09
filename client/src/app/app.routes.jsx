import React, { Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import PremiumLoader from "../Components/PremiumLoader";

const PublicRequirementForm = lazy(() => import("../Client/PublicRequirementForm"));
const PublicInvoice = lazy(() => import("../Client/PublicInvoice"));
const PublicProposal = lazy(() => import("../Client/PublicProposal"));
const Login = lazy(() => import("../features/auth/pages/LoginPage"));
const RegisterAdmin = lazy(() => import("../features/auth/pages/RegisterAdminPage"));
const ForgotPassword = lazy(() => import("../features/auth/pages/ForgotPasswordPage"));
const AdminRouter = lazy(() => import("../Routers/AdminRouter"));
const BDRouter = lazy(() => import("../Routers/BDRouter"));

function LoadingFallback() {
  return (
    <div className="loading-container">
      <div className="spinner-wrapper">
        <div className="spinner-ring"></div>
        <PremiumLoader />
      </div>
    </div>
  );
}

export default function AppRoutes() {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();

  const isPublicRoute =
    location.pathname.startsWith("/public/") ||
    (location.hash && location.hash.startsWith("#/public/"));

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/public/r/:slug" element={<PublicRequirementForm />} />
        <Route path="/public/re_invoice/:token" element={<PublicInvoice />} />
        <Route path="/public/proposal/:token" element={<PublicProposal />} />

        {/* Home / Login */}
        <Route
          path="/"
          element={
            !currentUser ? (
              <Login />
            ) : isPublicRoute ? (
              <Navigate
                to={location.pathname + location.search + location.hash}
                replace
              />
            ) : currentUser.role === "Owner" ? (
              <Navigate to="/admin/dashboard" replace />
            ) : currentUser.role === "BD" ? (
              <Navigate to="/BD/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Auth Routes */}
        <Route
          path="/register-admin"
          element={
            currentUser?.role === "Owner" ? (
              <Navigate to="/admin/dashboard" />
            ) : currentUser?.role === "BD" ? (
              <Navigate to="/BD/dashboard" />
            ) : (
              <RegisterAdmin />
            )
          }
        />

        <Route
          path="/password-reset"
          element={
            currentUser?.role === "Owner" ? (
              <Navigate to="/admin/dashboard" />
            ) : currentUser?.role === "BD" ? (
              <Navigate to="/BD/dashboard" />
            ) : (
              <ForgotPassword />
            )
          }
        />

        {/* Business Developer Module */}
        <Route
          path="/BD/*"
          element={
            currentUser?.role === "BD" ? (
              <Suspense fallback={<LoadingFallback />}>
                <BDRouter />
              </Suspense>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Admin Module */}
        <Route
          path="/admin/*"
          element={
            currentUser?.role === "Owner" ? (
              <Suspense fallback={<LoadingFallback />}>
                <AdminRouter />
              </Suspense>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
