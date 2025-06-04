import React, { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import AdminRoute from "@/components/common/AdminRoute";
import PageLoader from "@/components/common/PageLoader";
import { Layout } from "@/components/layout";

// Lazy load pages for code splitting
const LandingPage = React.lazy(() => import("@/pages/auth/LandingPage"));
const LoginPage = React.lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = React.lazy(() => import("@/pages/auth/RegisterPage"));

// Student Pages
const DashboardPage = React.lazy(() => import("@/pages/student/DashboardPage"));
const ChatPage = React.lazy(() => import("@/pages/student/ChatPage"));
const ChatSessionsPage = React.lazy(
  () => import("@/pages/student/ChatSessionsPage")
);

// Admin Pages
const AdminDashboardPage = React.lazy(
  () => import("@/pages/admin/AdminDashboardPage")
);
const AdminTopicsPage = React.lazy(
  () => import("@/pages/admin/AdminTopicsPage")
);
const CreateTopicPage = React.lazy(
  () => import("@/pages/admin/CreateTopicPage")
);
const TopicDetailsPage = React.lazy(
  () => import("@/pages/admin/TopicDetailsPage")
);
const TopicDocumentsPage = React.lazy(
  () => import("@/pages/TopicDocumentsPage")
);
const EditTopicPage = React.lazy(() => import("@/pages/admin/EditTopicPage"));
const UsersPage = React.lazy(() => import("@/pages/admin/UsersPage"));
const AnalyticsPage = React.lazy(() => import("@/pages/admin/AnalyticsPage"));

// Wrap lazy components with Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const appRouter = createBrowserRouter([
  // Public routes (no layout)
  {
    path: ROUTES.HOME,
    element: withSuspense(LandingPage),
  },
  {
    path: ROUTES.LOGIN,
    element: withSuspense(LoginPage),
  },
  {
    path: ROUTES.REGISTER,
    element: withSuspense(RegisterPage),
  },

  // Protected routes with layout
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // Student routes
      {
        path: ROUTES.DASHBOARD,
        element: withSuspense(DashboardPage),
      },
      {
        path: "/chats",
        element: withSuspense(ChatSessionsPage),
      },
      {
        path: "/chat/:sessionId",
        element: withSuspense(ChatPage),
      },

      // Admin routes
      {
        path: ROUTES.ADMIN_DASHBOARD,
        element: <AdminRoute>{withSuspense(AdminDashboardPage)}</AdminRoute>,
      },
      {
        path: "/admin/topics",
        element: <AdminRoute>{withSuspense(AdminTopicsPage)}</AdminRoute>,
      },
      {
        path: "/admin/topics/new",
        element: <AdminRoute>{withSuspense(CreateTopicPage)}</AdminRoute>,
      },
      {
        path: "/admin/topics/:id",
        element: <AdminRoute>{withSuspense(TopicDetailsPage)}</AdminRoute>,
      },
      {
        path: "/admin/topics/:id/documents",
        element: <AdminRoute>{withSuspense(TopicDocumentsPage)}</AdminRoute>,
      },
      {
        path: "/admin/topics/edit/:id",
        element: <AdminRoute>{withSuspense(EditTopicPage)}</AdminRoute>,
      },
      {
        path: "/admin/users",
        element: <AdminRoute>{withSuspense(UsersPage)}</AdminRoute>,
      },
      {
        path: "/admin/analytics",
        element: <AdminRoute>{withSuspense(AnalyticsPage)}</AdminRoute>,
      },
    ],
  },

  // Catch all - redirect to home
  {
    path: "*",
    element: <Navigate to={ROUTES.HOME} replace />,
  },
]);
