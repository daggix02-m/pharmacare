import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { pharmacyService } from '@/services';
import {
  Home,
  Users,
  Package,
  ShoppingCart,
  FileText,
  LogOut,
  Building2,
  UserCog,
  Warehouse,
  Receipt,
  RotateCcw,
  User,
  ShieldCheck,
} from 'lucide-react';

const Navigation = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pharmacyName, setPharmacyName] = useState('PharmaCare');

  useEffect(() => {
    const fetchPharmacyName = async () => {
      try {
        const response = await pharmacyService.getPharmacyInfo(role);
        if (response.success && response.data?.name) {
          setPharmacyName(response.data.name);
        }
      } catch (error) {
        console.error('Error fetching pharmacy name:', error);
        // Keep default name if fetch fails
      }
    };

    fetchPharmacyName();
  }, [role]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    // Navigate to appropriate profile page based on role
    const profileRoutes = {
      admin: '/admin/profile',
      manager: '/manager/profile',
      pharmacist: '/pharmacist/profile',
      cashier: '/cashier/profile',
    };
    navigate(profileRoutes[role] || '/manager/profile');
  };

  // Role-based menu items
  const menuItems = {
    admin: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: Home },
      { path: '/admin/managers', label: 'Pharmacy Requests', icon: UserCog },
      { path: '/admin/branches', label: 'Pharmacy Management', icon: Building2 },
    ],
    manager: [
      { path: '/manager/dashboard', label: 'Dashboard', icon: Home },
      { path: '/manager/branches', label: 'Branches', icon: Building2 },
      { path: '/manager/staff', label: 'Staff', icon: Users },
      { path: '/manager/managers', label: 'Managers', icon: ShieldCheck },
      { path: '/manager/medicines', label: 'Medicines', icon: Package },
      { path: '/manager/sales', label: 'Sales', icon: ShoppingCart },
    ],
    pharmacist: [
      { path: '/pharmacist/dashboard', label: 'Dashboard', icon: Home },
      { path: '/pharmacist/sales', label: 'Sales', icon: ShoppingCart },
      { path: '/pharmacist/inventory', label: 'Inventory', icon: Warehouse },
      { path: '/pharmacist/reports', label: 'Reports', icon: FileText },
    ],
    cashier: [
      { path: '/cashier/dashboard', label: 'Dashboard', icon: Home },
      { path: '/cashier/payments', label: 'Payments', icon: ShoppingCart },
      { path: '/cashier/receipts', label: 'Receipts', icon: Receipt },
      { path: '/cashier/returns', label: 'Returns', icon: RotateCcw },
      { path: '/cashier/reports', label: 'Reports', icon: FileText },
    ],
  };

  const currentMenuItems = menuItems[role] || [];

  return (
    <nav className='bg-white shadow-sm border-b'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <img src='/logo.png' alt={pharmacyName} className='h-10 w-10' />
            <span className='ml-2 text-xl font-semibold text-gray-900'>{pharmacyName}</span>
          </div>

          {/* Menu Items */}
          <div className='flex items-center space-x-1'>
            {currentMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className='h-4 w-4 mr-2' />
                  {item.label}
                </Link>
              );
            })}

            {/* User Info & Logout */}
            <div className='flex items-center space-x-3 border-l pl-4 ml-4'>
              <div 
                className='text-sm text-right cursor-pointer hover:text-blue-600 transition-colors'
                onClick={handleProfileClick}
                title='Click to edit profile'
              >
                <p className='font-medium text-gray-900'>{user?.full_name}</p>
                <p className='text-gray-500 text-xs capitalize'>{role}</p>
              </div>
              <Button variant='ghost' size='sm' onClick={handleLogout} title='Logout'>
                <LogOut className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
