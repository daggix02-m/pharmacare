import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { Toaster } from 'sonner';

// Loading fallback component
const PageLoader = () => (
  <div className='flex items-center justify-center min-h-screen'>
    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
  </div>
);

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/login').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/auth/signup').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/forgot-password').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/reset-password').then(m => ({ default: m.ResetPasswordPage })));
const ChangePasswordPage = lazy(() => import('./pages/auth/change-password').then(m => ({ default: m.ChangePasswordPage })));
const VerifyEmailPage = lazy(() => import('./pages/auth/verify-email').then(m => ({ default: m.VerifyEmailPage })));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminBranches = lazy(() => import('./pages/admin/Branches'));
const AdminManagers = lazy(() => import('./pages/admin/Managers'));
const AdminPharmacies = lazy(() => import('./pages/admin/Pharmacies'));
const AdminProfile = lazy(() => import('./pages/admin/Profile'));

// Manager Pages
const ManagerDashboard = lazy(() => import('./pages/manager/Dashboard'));
const ManagerStaff = lazy(() => import('./pages/manager/Staff'));
const ManagerManagers = lazy(() => import('./pages/manager/Managers'));
const ManagerProfile = lazy(() => import('./pages/manager/Profile'));
const ManagerMedicines = lazy(() => import('./pages/manager/Medicines'));
const ManagerSales = lazy(() => import('./pages/manager/Sales'));
const ManagerBranches = lazy(() => import('./pages/manager/Branches'));

// Pharmacist Pages
const PharmacistDashboard = lazy(() => import('./pages/pharmacist/Dashboard'));
const PharmacistSales = lazy(() => import('./pages/pharmacist/Sales'));
const PharmacistInventory = lazy(() => import('./pages/pharmacist/Inventory'));
const PharmacistReports = lazy(() => import('./pages/pharmacist/Reports'));
const PharmacistProfile = lazy(() => import('./pages/pharmacist/Profile'));

// Cashier Pages
const CashierDashboard = lazy(() => import('./pages/cashier/Dashboard'));
const CashierPayments = lazy(() => import('./pages/cashier/Payments'));
const CashierReceipts = lazy(() => import('./pages/cashier/Receipts'));
const CashierReturns = lazy(() => import('./pages/cashier/Returns'));
const CashierReports = lazy(() => import('./pages/cashier/Reports'));
const CashierProfile = lazy(() => import('./pages/cashier/Profile'));

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<LoginPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/auth/login' element={<LoginPage />} />
        <Route path='/auth/signup' element={<SignupPage />} />
        <Route path='/auth/forgot-password' element={<ForgotPasswordPage />} />
        <Route path='/auth/reset-password' element={<ResetPasswordPage />} />
        <Route path='/auth/change-password' element={<ChangePasswordPage />} />
        <Route path='/auth/verify-email' element={<VerifyEmailPage />} />

        {/* Admin Routes */}
        <Route
          path='/admin/dashboard'
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/managers'
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminManagers />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/branches'
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminBranches />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin/profile'
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminProfile />
            </ProtectedRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path='/manager/dashboard'
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/manager/staff'
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerStaff />
            </ProtectedRoute>
          }
        />
        <Route
          path='/manager/managers'
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerManagers />
            </ProtectedRoute>
          }
        />
        <Route
          path='/manager/profile'
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path='/manager/medicines'
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerMedicines />
            </ProtectedRoute>
          }
        />
        <Route
          path='/manager/sales'
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerSales />
            </ProtectedRoute>
          }
        />
        <Route
          path='/manager/branches'
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerBranches />
            </ProtectedRoute>
          }
        />

        {/* Pharmacist Routes */}
        <Route
          path='/pharmacist/dashboard'
          element={
            <ProtectedRoute allowedRoles={['pharmacist']}>
              <PharmacistDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/pharmacist/sales'
          element={
            <ProtectedRoute allowedRoles={['pharmacist']}>
              <PharmacistSales />
            </ProtectedRoute>
          }
        />
        <Route
          path='/pharmacist/inventory'
          element={
            <ProtectedRoute allowedRoles={['pharmacist']}>
              <PharmacistInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path='/pharmacist/reports'
          element={
            <ProtectedRoute allowedRoles={['pharmacist']}>
              <PharmacistReports />
            </ProtectedRoute>
          }
        />
        <Route
          path='/pharmacist/profile'
          element={
            <ProtectedRoute allowedRoles={['pharmacist']}>
              <PharmacistProfile />
            </ProtectedRoute>
          }
        />

        {/* Cashier Routes */}
        <Route
          path='/cashier/dashboard'
          element={
            <ProtectedRoute allowedRoles={['cashier']}>
              <CashierDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/cashier/payments'
          element={
            <ProtectedRoute allowedRoles={['cashier']}>
              <CashierPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path='/cashier/receipts'
          element={
            <ProtectedRoute allowedRoles={['cashier']}>
              <CashierReceipts />
            </ProtectedRoute>
          }
        />
        <Route
          path='/cashier/returns'
          element={
            <ProtectedRoute allowedRoles={['cashier']}>
              <CashierReturns />
            </ProtectedRoute>
          }
        />
        <Route
          path='/cashier/reports'
          element={
            <ProtectedRoute allowedRoles={['cashier']}>
              <CashierReports />
            </ProtectedRoute>
          }
        />
        <Route
          path='/cashier/profile'
          element={
            <ProtectedRoute allowedRoles={['cashier']}>
              <CashierProfile />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
          <Toaster position='top-right' richColors />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
