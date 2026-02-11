import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { Toaster } from 'sonner';

// Auth Pages
import { LoginPage } from './pages/auth/login';
import { SignupPage } from './pages/auth/signup';
import { ForgotPasswordPage } from './pages/auth/forgot-password';
import { ResetPasswordPage } from './pages/auth/reset-password';
import { ChangePasswordPage } from './pages/auth/change-password';
import { VerifyEmailPage } from './pages/auth/verify-email';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminBranches from './pages/admin/Branches';
import AdminPharmacies from './pages/admin/Pharmacies';
import AdminProfile from './pages/admin/Profile';

// Manager Pages
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerStaff from './pages/manager/Staff';
import ManagerManagers from './pages/manager/Managers';
import ManagerProfile from './pages/manager/Profile';
import ManagerMedicines from './pages/manager/Medicines';
import ManagerSales from './pages/manager/Sales';
import ManagerBranches from './pages/manager/Branches';

// Pharmacist Pages
import PharmacistDashboard from './pages/pharmacist/Dashboard';
import PharmacistSales from './pages/pharmacist/Sales';
import PharmacistInventory from './pages/pharmacist/Inventory';
import PharmacistReports from './pages/pharmacist/Reports';
import PharmacistProfile from './pages/pharmacist/Profile';

// Cashier Pages
import CashierDashboard from './pages/cashier/Dashboard';
import CashierPayments from './pages/cashier/Payments';
import CashierReceipts from './pages/cashier/Receipts';
import CashierReturns from './pages/cashier/Returns';
import CashierReports from './pages/cashier/Reports';
import CashierProfile from './pages/cashier/Profile';

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
            <AdminPharmacies />
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
