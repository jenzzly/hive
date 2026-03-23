import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import OwnerDashboard from './pages/OwnerDashboard';
import TenantDashboard from './pages/TenantDashboard';
import MaintenancePage from './pages/MaintenancePage';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SettingsPage from './pages/SettingsPage';
import OwnerAnalyticsPage from './pages/OwnerAnalyticsPage';
import PlatformAnalyticsPage from './pages/PlatformAnalyticsPage';
import MessagesPage from './pages/MessagesPage';
import ForgotPassword from './pages/ForgotPassword';
import AccountReset from './pages/AccountReset';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';


function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { userProfile, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!userProfile) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(userProfile.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { userProfile, loading } = useAuth();
  if (loading) return null; // or spinner
  if (userProfile) {
    if (userProfile.role === 'superAdmin') return <Navigate to="/super-admin" replace />;
    if (userProfile.role === 'admin') return <Navigate to="/admin" replace />;
    if (userProfile.role === 'owner') return <Navigate to="/dashboard" replace />;
    if (userProfile.role === 'tenant') return <Navigate to="/my-rent" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/account_reset" element={<AccountReset />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />


          {/* Any logged-in user */}
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          {/* Owner + above */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['owner', 'admin', 'superAdmin']}>
              <OwnerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute roles={['owner', 'admin', 'superAdmin']}>
              <OwnerAnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="/maintenance" element={
            <ProtectedRoute roles={['tenant', 'owner', 'admin', 'superAdmin']}>
              <MaintenancePage />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute roles={['tenant', 'owner', 'admin', 'superAdmin']}>
              <MessagesPage />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin', 'superAdmin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* SuperAdmin */}
          <Route path="/super-admin" element={
            <ProtectedRoute roles={['superAdmin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/platform-analytics" element={
            <ProtectedRoute roles={['admin', 'superAdmin']}>
              <PlatformAnalyticsPage />
            </ProtectedRoute>
          } />

          {/* Tenant — my-rent replaces my-property */}
          <Route path="/my-property" element={<Navigate to="/my-rent" replace />} />
          <Route path="/my-rent" element={
            <ProtectedRoute roles={['tenant']}>
              <TenantDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <SettingsProvider>
            <AppRoutes />
          </SettingsProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}