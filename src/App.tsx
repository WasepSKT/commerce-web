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
import MyOrders from './pages/MyOrders';
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProductsPage from "./pages/admin/Products";
import UserManagement from "./pages/admin/UserManagement";
import AdminCampaignPage from "./pages/admin/Campaign";
import ReferralsPage from "./pages/admin/Referrals";
import ReferralSettingsPage from "./pages/admin/ReferralSettings";
import ReferralPurchasesPage from "./pages/admin/ReferralPurchases";
import BlogPage from "./pages/Blog";
import Payments from "./pages/admin/Payments";
import AdminShipingsPage from "./pages/admin/Shipings";
import AdminBlogsPage from "./pages/admin/Blogs";
import BlogList from "./pages/BlogList";
import BlogPost from "./pages/BlogPost";
import TermPage from './pages/Term';
import PrivacyPage from './pages/Privacy';
import CaseStudiesPage from './pages/CaseStudies';
import ReviewsPage from './pages/Reviews';
import UpdatesPage from './pages/Updates';
import ReportBugPage from './pages/ReportBug';
import AdminOrders from './pages/admin/Orders';
import AdminRoute from "./components/admin/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
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
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/career" element={<CareerPage />} />
            <Route path="/career/openings" element={<CareerOpenings />} />
            <Route path="/career/benefits" element={<CareerBenefits />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/terms" element={<TermPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/case-studies" element={<CaseStudiesPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/updates" element={<UpdatesPage />} />
            <Route path="/report" element={<ReportBugPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/cart" element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            } />
            <Route path="/my-orders" element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <AdminOrders />
                </AdminRoute>
              }
            />
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
                  <UserManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/campaign"
              element={
                <AdminRoute>
                  <AdminCampaignPage />
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
              path="/admin/shipping"
              element={
                <AdminRoute>
                  <AdminShipingsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/blogs"
              element={
                <AdminRoute>
                  <AdminBlogsPage />
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

            {/* Catch-all route for 404 - MUST BE LAST */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
