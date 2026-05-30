import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Import Pages (we will create these next)
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductManagement from "./pages/ProductManagement";
import OrderManagement from "./pages/OrderManagement";
import UserShop from "./pages/UserShop";

// Protected Route Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-background">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user role is not allowed, redirect to correct default page
    if (user.role === "ADMIN") {
      return <Navigate to="/admin/products" replace />;
    } else {
      return <Navigate to="/shop" replace />;
    }
  }

  return children;
};

// Root Redirect component
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/shop" replace />;
  }

  return user.role === "ADMIN" ? (
    <Navigate to="/admin/products" replace />
  ) : (
    <Navigate to="/shop" replace />
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Routes */}
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <ProductManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <OrderManagement />
                </ProtectedRoute>
              }
            />

            {/* User Shop Routes */}
            <Route path="/shop" element={<UserShop />} />

            {/* Root Redirection */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* Fallback to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
