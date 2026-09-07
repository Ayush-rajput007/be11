import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore.js';
import { api } from './lib/api.js';

// Components
import { Header } from './components/common/Header.jsx';
import { Footer } from './components/common/Footer.jsx';
import { ScrollToTop } from './components/common/ScrollToTop.jsx';
import { Toss } from './pages/Toss.jsx';

// Pages
import { Home } from './pages/Home.jsx';
import { Venues } from './pages/Venues.jsx';
import { VenueDetail } from './pages/VenueDetail.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Admin } from './pages/Admin.jsx';
import { Shop } from './pages/Shop.jsx';
import { JerseyBuilder } from './pages/JerseyBuilder/index.jsx';
import { Tournaments } from './pages/Tournaments.jsx';
import { BecomeVendor } from './pages/BecomeVendor.jsx';
import { LiveMatches } from './pages/LiveMatches.jsx';
import { KitBuilder } from './pages/KitBuilder.jsx';
import { Coaches } from './pages/Coaches.jsx';
import { CoachProfile } from './pages/CoachProfile.jsx';
import { CoachDashboard } from './pages/CoachDashboard.jsx';
import { MyTraining } from './pages/MyTraining.jsx';
import { Login } from './pages/Login.jsx';
import { Signup } from './pages/Signup.jsx';
import { ForgotPassword } from './pages/ForgotPassword.jsx';
import { ProfileSettings } from './pages/ProfileSettings.jsx';
import { Capture } from './pages/Capture.jsx';
import { VerifyEmail } from './pages/VerifyEmail.jsx';
import { AdminBookings } from './pages/AdminBookings.jsx';
import { MyBookings } from './pages/MyBookings.jsx';

const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Redirect unverified accounts
  if (user && user.emailVerified === false) {
    return <Navigate to="/verify-email" replace state={{ email: user.email }} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { login, logout } = useAuthStore();
  const [checkingSession, setCheckingSession] = React.useState(true);

  // Validate token on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('be11_token');
      if (!token) {
        // Aesthetic delay for smooth splash transition
        setTimeout(() => setCheckingSession(false), 800);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        login(res.data.data.user, token);
      } catch (err) {
        console.error('Session validation failed:', err);
        logout();
      } finally {
        setTimeout(() => setCheckingSession(false), 800);
      }
    };
    checkSession();
  }, [login, logout]);

  if (checkingSession) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white dark:bg-[#001a49] transition-all">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <img
            src="/be11_logo.png"
            alt="be11 Official Logo"
            className="h-16 w-auto object-contain"
          />
          <div className="w-16 h-[2px] bg-gradient-to-r from-[#FF9933] via-gray-200 to-[#138808]"></div>
        </div>
      </div>
    );
  }

  const AppContent: React.FC = () => {
    const location = useLocation();
    const showFooter = location.pathname !== '/jersey-builder';

    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              }
            />
            <Route path="/venues" element={<Venues />} />
            <Route path="/venues/:id" element={<VenueDetail />} />
            <Route path="/store/*" element={<Shop />} />
            <Route path="/jersey-builder" element={<JerseyBuilder />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/become-vendor" element={<BecomeVendor />} />
            <Route path="/toss" element={<Toss />} />
            <Route path="/capture" element={<Capture />} />
            
            <Route path="/live-matches" element={<LiveMatches />} />
            <Route path="/host-match" element={<Navigate to="/live-matches" replace state={{ permissionDenied: true }} />} />
            <Route path="/host-lobbies" element={<Navigate to="/live-matches" replace state={{ permissionDenied: true }} />} />
            <Route
              path="/host-dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'OWNER', 'COACH']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-matches"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'OWNER', 'COACH']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-match"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'OWNER', 'COACH']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-match"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'OWNER', 'COACH']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/kit-builder" element={<KitBuilder />} />
            
            <Route path="/coaches" element={<Coaches />} />
            <Route path="/coaches/:id" element={<CoachProfile />} />
            
            <Route
              path="/coach-dashboard"
              element={
                <ProtectedRoute allowedRoles={['COACH']}>
                  <CoachDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/my-training"
              element={
                <ProtectedRoute>
                  <MyTraining />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <Admin />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <AdminBookings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/venue-bookings"
              element={<Navigate to="/admin/bookings" replace />}
            />

            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {showFooter && <Footer />}
      </div>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
};
export default App;
