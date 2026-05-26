import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { RestaurantProvider } from '@/contexts/RestaurantContext';
import { CartProvider } from '@/contexts/CartContext';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { PWAInstallButton } from '@/components/common/PWAInstallButton';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { UserRole } from '@/types/types';

// Pages
import Login from '@/pages/Login';
import Home from '@/pages/customer/Home';
import MenuItemDetail from '@/pages/customer/MenuItemDetail';
import Cart from '@/pages/customer/Cart';
import Checkout from '@/pages/customer/Checkout';
import OrderTracking from '@/pages/customer/OrderTracking';
import OrderHistory from '@/pages/customer/OrderHistory';
import Location from '@/pages/customer/Location';
import PreOrder from '@/pages/customer/PreOrder';
import Profile from '@/pages/customer/Profile';
import PaymentSuccess from '@/pages/customer/PaymentSuccess';
import KitchenDisplay from '@/pages/worker/KitchenDisplay';
import Dashboard from '@/pages/manager/Dashboard';
import MenuManager from '@/pages/manager/MenuManager';
import OrdersManager from '@/pages/manager/OrdersManager';
import StaffManager from '@/pages/manager/StaffManager';
import Settings from '@/pages/manager/Settings';
import PromoCodesManager from '@/pages/manager/PromoCodesManager';

function RoleRoute({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile && !roles.includes(profile.role)) {
    if (profile.role === 'worker') return <Navigate to="/kitchen" replace />;
    if (profile.role === 'manager' || profile.role === 'admin') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/menu" replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (user && profile) {
    if (profile.role === 'worker') return <Navigate to="/kitchen" replace />;
    if (profile.role === 'manager' || profile.role === 'admin') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/menu" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/menu" replace />} />

      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Customer */}
      <Route path="/menu" element={<Home />} />
      <Route path="/menu/:id" element={<MenuItemDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<RoleRoute roles={['customer', 'admin', 'manager', 'worker']}><Checkout /></RoleRoute>} />
      <Route path="/orders" element={<RoleRoute roles={['customer', 'admin', 'manager']}><OrderHistory /></RoleRoute>} />
      <Route path="/orders/:id" element={<RoleRoute roles={['customer', 'admin', 'manager', 'worker']}><OrderTracking /></RoleRoute>} />
      <Route path="/location" element={<Location />} />
      <Route path="/preorder" element={<PreOrder />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/profile" element={<RoleRoute roles={['customer', 'admin', 'manager', 'worker']}><Profile /></RoleRoute>} />

      {/* Worker */}
      <Route path="/kitchen" element={<RoleRoute roles={['worker', 'admin', 'manager']}><KitchenDisplay /></RoleRoute>} />

      {/* Manager / Admin */}
      <Route path="/dashboard" element={<RoleRoute roles={['manager', 'admin']}><Dashboard /></RoleRoute>} />
      <Route path="/dashboard/menu" element={<RoleRoute roles={['manager', 'admin']}><MenuManager /></RoleRoute>} />
      <Route path="/dashboard/orders" element={<RoleRoute roles={['manager', 'admin']}><OrdersManager /></RoleRoute>} />
      <Route path="/dashboard/staff" element={<RoleRoute roles={['manager', 'admin']}><StaffManager /></RoleRoute>} />
      <Route path="/dashboard/settings" element={<RoleRoute roles={['manager', 'admin']}><Settings /></RoleRoute>} />
      <Route path="/dashboard/promos" element={<RoleRoute roles={['manager', 'admin']}><PromoCodesManager /></RoleRoute>} />

      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <RestaurantProvider>
          <CartProvider>
            <TooltipProvider>
              <OfflineBanner />
              <AppRoutes />
              <PWAInstallButton />
              <Toaster richColors position="top-center" />
            </TooltipProvider>
          </CartProvider>
        </RestaurantProvider>
      </AuthProvider>
    </Router>
  );
}
