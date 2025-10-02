import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AboutPage from "./pages/About";
import CareerPage from "./pages/Career";
import ContactPage from "./pages/Contact";
import CareerOpenings from "./pages/career/Openings";
import CareerBenefits from "./pages/career/Benefits";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import CartPage from './pages/Cart';
import ProfilePage from './pages/Profile';
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProductsPage from "./pages/admin/Products";
import AdminUsersPage from "./pages/admin/Users";
import AdminKampanyePage from "./pages/admin/Kampanye";
import ReferralsPage from "./pages/admin/Referrals";
import ReferralSettingsPage from "./pages/admin/ReferralSettings";
import ReferralPurchasesPage from "./pages/admin/ReferralPurchases";
import Payments from "./pages/admin/Payments";
import AdminRoute from "./components/admin/AdminRoute";
import NotFound from "./pages/NotFound";
import Loading from "@/components/ui/Loading";
import { useAuth } from "@/hooks/useAuth";
import ScrollToTopOnNav from './components/ScrollToTopOnNav';

const queryClient = new QueryClient();

export default function App() {
  const { loading } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {/* Global loader while auth is initializing. Always mount Loading so it can enforce minVisibleMs */}
        <Loading fullscreen active={loading} minVisibleMs={2000} />

        <BrowserRouter>
          <ScrollToTopOnNav />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/career" element={<CareerPage />} />
            <Route path="/career/openings" element={<CareerOpenings />} />
            <Route path="/career/benefits" element={<CareerBenefits />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminProductsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/kampanye"
              element={
                <AdminRoute>
                  <AdminKampanyePage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/referrals"
              element={
                <AdminRoute>
                  <ReferralsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/referrals/purchases"
              element={
                <AdminRoute>
                  <ReferralPurchasesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <AdminRoute>
                  <Payments />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/referrals/settings"
              element={
                <AdminRoute>
                  <ReferralSettingsPage />
                </AdminRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
