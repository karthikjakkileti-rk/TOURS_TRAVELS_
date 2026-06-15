import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Bookings from './pages/Bookings';
import Trips from './pages/Trips';
import LiveTracking from './pages/LiveTracking';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import DetailPage from './pages/DetailPage';
import { Box } from '@mui/material';

// Dashboard router switch: Redirects drivers to /trips, admins to /dashboard
const DashboardRedirect = () => {
  const { isDriver } = useAuth();
  if (isDriver) {
    return <Navigate to="/trips" replace />;
  }
  return <Dashboard />;
};

// Flexible route wrapper: Renders with sidebar layout if logged in, else without sidebar (public guest tracking)
const FlexTrackingRoute = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return (
      <Layout>
        <LiveTracking />
      </Layout>
    );
  }
  return (
    <Box sx={{ p: 4, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <LiveTracking />
    </Box>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Public or Auth flexible route for Guest Customers */}
          <Route path="/tracking" element={<FlexTrackingRoute />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['admin', 'driver']}>
                <Layout>
                  <DashboardRedirect />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/vehicles"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <Vehicles />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/drivers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <Drivers />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/bookings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <Bookings />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/trips"
            element={
              <ProtectedRoute allowedRoles={['admin', 'driver']}>
                <Layout>
                  <Trips />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/trips/detail/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <DetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['admin', 'driver']}>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
