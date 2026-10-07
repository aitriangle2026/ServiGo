import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home/Home';
import Services from '@/pages/Services/Services';
import FindPros from '@/pages/FindPros/FindPros';
import Login from '@/pages/Auth/Login';
import Register from '@/pages/Auth/Register';
import ForgotPassword from '@/pages/Auth/ForgotPassword';
import VerifyOTP from '@/pages/Auth/VerifyOTP';
import ResetPassword from '@/pages/Auth/ResetPassword';
import ProtectedRoute from '@/routes/ProtectedRoute';
import CustomerDashboard from '@/pages/Customer/Dashboard';
import MyBookings from '@/pages/Customer/MyBookings';
import Favorites from '@/pages/Customer/Favorites';
import Profile from '@/pages/Customer/Profile';
import MyJobRequests from '@/pages/Customer/MyJobRequests';
import PostJobRequest from '@/pages/Customer/PostJobRequest';
import JobRequestDetail from '@/pages/Customer/JobRequestDetail';
import About from '@/pages/About/About';
import ProviderDashboard from '@/pages/Provider/Dashboard';
import ProviderServices from '@/pages/Provider/Services';
import ProviderBookings from '@/pages/Provider/Bookings';
import ProviderProfile from '@/pages/Provider/Profile';
import ProviderReviews from '@/pages/Provider/Reviews';
import ProviderEarnings from '@/pages/Provider/Earnings';
import ProviderOnboarding from '@/pages/Provider/Onboarding';
import ProviderJobRequests from '@/pages/Provider/JobRequests';
import ProviderVerification from '@/pages/Provider/Verification';
import AdminDashboard from '@/pages/Admin/Dashboard';
import AdminProviders from '@/pages/Admin/Providers';
import ServiceDetail from '@/pages/Services/ServiceDetail';
import AdminCategories from '@/pages/Admin/Categories';
import AdminUsers from '@/pages/Admin/Users';
import AdminBookings from '@/pages/Admin/Bookings';
import AdminPayouts from '@/pages/Admin/Payouts';
import AdminInvoices from '@/pages/Admin/Invoices';
import AdminSupportRequests from '@/pages/Admin/SupportRequests';
import AdminSupportChat from '@/pages/Admin/SupportChat';
import AdminSupportChatRoom from '@/pages/Admin/SupportChatRoom';
import ProviderSupport from '@/pages/Provider/Support';
import ProviderDetail from '@/pages/Providers/ProviderDetail';
import ChatList from '@/pages/Chat/ChatList';
import ChatRoom from '@/pages/Chat/ChatRoom';
import { Toaster } from 'react-hot-toast';
import { CallProvider } from '@/context/CallContext';
import { CountryProvider } from '@/context/CountryContext';
import { NotificationProvider } from '@/context/NotificationContext';
import CallModal from '@/components/call/CallModal';
import CustomerNotifications from '@/pages/Customer/Notifications';
import ProviderNotifications from '@/pages/Provider/Notifications';
import AdminNotifications from '@/pages/Admin/Notifications';

const ComingSoon = ({ label }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
    <span className="rounded-full bg-primary-light px-4 py-1.5 text-xs font-semibold text-primary">
      Under construction
    </span>
    <h1 className="font-display text-2xl font-bold text-secondary">{label}</h1>
    <p className="max-w-sm text-sm text-text-muted">
      This page is being built in the next phase of the ServiGo frontend.
    </p>
    <a href="/" className="mt-2 text-sm font-semibold text-primary hover:underline">
      ← Back to home
    </a>
  </div>
);

function App() {
  return (
    <CountryProvider>
    <NotificationProvider>
    <CallProvider>
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Home />} />
      <Route path="/services" element={<Services />} />
      <Route path="/services/:id" element={<ServiceDetail />} />
      <Route path="/providers/:id" element={<ProviderDetail />} />
      <Route path="/find-pros" element={<FindPros />} />
      <Route path="/about" element={<About />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Customer portal */}
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/bookings"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <MyBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/favorites"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Favorites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/profile"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/notifications"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerNotifications />
          </ProtectedRoute>
        }
      />

      {/* Job requests — "/new" stays ahead of the "/:id" route below */}
      <Route
        path="/customer/job-requests"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <MyJobRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/job-requests/new"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <PostJobRequest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/job-requests/:id"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <JobRequestDetail />
          </ProtectedRoute>
        }
      />

      {/* Messaging — shared between customers and providers */}
      <Route
        path="/messages"
        element={
          <ProtectedRoute allowedRoles={['customer', 'provider']}>
            <ChatList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages/:conversationId"
        element={
          <ProtectedRoute allowedRoles={['customer', 'provider']}>
            <ChatRoom />
          </ProtectedRoute>
        }
      />

      {/* Provider portal */}
      <Route
        path="/provider/onboarding"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderOnboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/verification"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderVerification />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/dashboard"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/services"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderServices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/notifications"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderNotifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/job-requests"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderJobRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/bookings"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/profile"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/reviews"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderReviews />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/earnings"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderEarnings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/provider/support"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderSupport />
          </ProtectedRoute>
        }
      />

      {/* Admin portal */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNotifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/providers"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminProviders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCategories />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminBookings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/payouts"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPayouts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/invoices"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminInvoices />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/support-requests"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSupportRequests />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/support"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSupportChat />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/support/:conversationId"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSupportChatRoom />
          </ProtectedRoute>
        }
      />

      {/* Catch-all — must stay last */}
      <Route path="*" element={<ComingSoon label="Page Not Found" />} />
    </Routes>
    <CallModal />
    <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </CallProvider>
    </NotificationProvider>
    </CountryProvider>
  );
}

export default App;