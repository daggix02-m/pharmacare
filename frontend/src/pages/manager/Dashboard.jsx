import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import { managerService } from '@/services';
import {
  Building2,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    branchOverview: {},
    inventorySummary: {},
    salesSummary: {},
    alerts: {
      lowStock: [],
      expiring: [],
    },
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      const response = await managerService.getDashboard();
 
      if (response.success) {
        setDashboardData(response.data || {});
      } else {
        toast.error(response.message || 'Failed to load dashboard');
      }
    } catch (error) {
      toast.error('An error occurred while loading dashboard');
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, onClick }) => (
    <Card
      className={`hover:shadow-lg transition-shadow border-slate-200 dark:border-slate-800 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-slate-900 dark:text-slate-50'>{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className='h-4 w-4 text-slate-600 dark:text-slate-400' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold text-slate-900 dark:text-slate-50'>{value}</div>
        {subtitle && <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>{subtitle}</p>}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  const { branchOverview, inventorySummary, salesSummary, alerts } = dashboardData;

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <Navigation />

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-50'>Manager Dashboard</h1>
              <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
                Welcome back! Here's an overview of your branch.
              </p>
            </div>
            <Button onClick={fetchDashboard} disabled={refreshing} variant='outline'>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Branch Overview */}
          <Card className='mb-6 border-slate-200 dark:border-slate-800'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='flex items-center text-slate-900 dark:text-slate-50'>
                <Building2 className='h-5 w-5 mr-2' />
                Branch Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>Pharmacy Name</p>
                  <p className='text-lg font-semibold capitalize text-slate-900 dark:text-slate-50'>
                    {branchOverview?.branchName ? branchOverview.branchName.split(' - ')[0] : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>Branch Name</p>
                  <p className='text-lg font-semibold capitalize text-slate-900 dark:text-slate-50'>{branchOverview?.location || 'N/A'}</p>
                </div>
                <div>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>Total Employees</p>
                  <p className='text-lg font-semibold text-slate-900 dark:text-slate-50'>{branchOverview?.totalEmployees || 0}</p>
                </div>
                <div>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>Active Employees</p>
                  <p className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
                    {branchOverview?.activeEmployees || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Summary */}
          <div className='mb-6'>
            <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4'>Inventory Summary</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
              <StatCard
                title='Total Medicines'
                value={inventorySummary?.totalMedicines || 0}
                icon={Package}
                color='bg-slate-100 dark:bg-slate-800'
                onClick={() => navigate('/manager/medicines')}
              />
              <StatCard
                title='Total Quantity'
                value={inventorySummary?.totalQuantity || 0}
                icon={Package}
                color='bg-slate-100 dark:bg-slate-800'
              />
              <StatCard
                title='Low Stock'
                value={inventorySummary?.lowStockCount || 0}
                icon={AlertTriangle}
                color='bg-slate-100 dark:bg-slate-800'
                onClick={() => navigate('/manager/medicines?filter=low_stock')}
              />
              <StatCard
                title='Expiring Soon'
                value={inventorySummary?.expiringSoonCount || 0}
                icon={Clock}
                color='bg-slate-100 dark:bg-slate-800'
              />
              <StatCard
                title='Expired'
                value={inventorySummary?.expiredCount || 0}
                icon={AlertTriangle}
                color='bg-slate-100 dark:bg-slate-800'
              />
            </div>
          </div>

          {/* Sales Summary */}
          <div className='mb-6'>
            <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4'>Sales Summary</h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-sm font-medium text-slate-900 dark:text-slate-50'>Today's Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-baseline justify-between'>
                    <div>
                      <p className='text-2xl font-bold text-slate-900 dark:text-slate-50'>{salesSummary?.today?.count || 0}</p>
                      <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>Transactions</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-xl font-bold text-slate-900 dark:text-slate-50'>
                        ${salesSummary?.today?.revenue?.toFixed(2) || '0.00'}
                      </p>
                      <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-sm font-medium text-slate-900 dark:text-slate-50'>This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-baseline justify-between'>
                    <div>
                      <p className='text-2xl font-bold text-slate-900 dark:text-slate-50'>{salesSummary?.thisWeek?.count || 0}</p>
                      <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>Transactions</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-xl font-bold text-slate-900 dark:text-slate-50'>
                        ${salesSummary?.thisWeek?.revenue?.toFixed(2) || '0.00'}
                      </p>
                      <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-sm font-medium text-slate-900 dark:text-slate-50'>This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex items-baseline justify-between'>
                    <div>
                      <p className='text-2xl font-bold text-slate-900 dark:text-slate-50'>{salesSummary?.thisMonth?.count || 0}</p>
                      <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>Transactions</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-xl font-bold text-slate-900 dark:text-slate-50'>
                        ${salesSummary?.thisMonth?.revenue?.toFixed(2) || '0.00'}
                      </p>
                      <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Alerts Section */}
          {(alerts?.lowStock?.length > 0 || alerts?.expiring?.length > 0) && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
              {/* Low Stock Alerts */}
              {alerts?.lowStock?.length > 0 && (
                <Card className='border-slate-200 dark:border-slate-800'>
                  <CardHeader>
                    <CardTitle className='text-sm font-medium flex items-center text-slate-900 dark:text-slate-50'>
                      <AlertTriangle className='h-4 w-4 mr-2 text-slate-600 dark:text-slate-400' />
                      Low Stock Medicines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      {alerts.lowStock.slice(0, 5).map((item, idx) => (
                        <div key={idx} className='flex items-center justify-between text-sm'>
                          <span className='font-medium text-slate-900 dark:text-slate-50'>{item.name}</span>
                          <StatusBadge status={`${item.currentStock} units`} type='warning' />
                        </div>
                      ))}
                      {alerts.lowStock.length > 5 && (
                        <Button
                          variant='link'
                          className='p-0 h-auto text-sm'
                          onClick={() => navigate('/manager/medicines?filter=low_stock')}
                        >
                          View all ({alerts.lowStock.length}) →
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Expiring Medicines */}
              {alerts?.expiring?.length > 0 && (
                <Card className='border-slate-200 dark:border-slate-800'>
                  <CardHeader>
                    <CardTitle className='text-sm font-medium flex items-center text-slate-900 dark:text-slate-50'>
                      <Clock className='h-4 w-4 mr-2 text-slate-600 dark:text-slate-400' />
                      Expiring Soon
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      {alerts.expiring.slice(0, 5).map((item, idx) => (
                        <div key={idx} className='flex items-center justify-between text-sm'>
                          <span className='font-medium text-slate-900 dark:text-slate-50'>{item.name}</span>
                          <span className='text-xs text-slate-500 dark:text-slate-500'>{item.daysRemaining} days</span>
                        </div>
                      ))}
                      {alerts.expiring.length > 5 && (
                        <Button
                          variant='link'
                          className='p-0 h-auto text-sm'
                          onClick={() => navigate('/manager/medicines')}
                        >
                          View all ({alerts.expiring.length}) →
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <Card className='border-slate-200 dark:border-slate-800'>
            <CardHeader>
              <CardTitle className='text-slate-900 dark:text-slate-50'>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <Button
                  variant='outline'
                  className='h-auto py-4 flex-col items-start'
                  onClick={() => navigate('/manager/medicines')}
                >
                  <div className='flex items-center w-full'>
                    <Package className='h-5 w-5 mr-2' />
                    <span className='font-semibold'>View Medicines</span>
                    <ArrowRight className='h-4 w-4 ml-auto' />
                  </div>
                  <p className='text-xs text-muted-foreground mt-2'>
                    Manage your medicine inventory
                  </p>
                </Button>

                <Button
                  variant='outline'
                  className='h-auto py-4 flex-col items-start'
                  onClick={() => navigate('/manager/staff')}
                >
                  <div className='flex items-center w-full'>
                    <Users className='h-5 w-5 mr-2' />
                    <span className='font-semibold'>Manage Staff</span>
                    <ArrowRight className='h-4 w-4 ml-auto' />
                  </div>
                  <p className='text-xs text-muted-foreground mt-2'>Add or verify staff members</p>
                </Button>

                <Button
                  variant='outline'
                  className='h-auto py-4 flex-col items-start'
                  onClick={() => navigate('/manager/sales')}
                >
                  <div className='flex items-center w-full'>
                    <TrendingUp className='h-5 w-5 mr-2' />
                    <span className='font-semibold'>View Sales</span>
                    <ArrowRight className='h-4 w-4 ml-auto' />
                  </div>
                  <p className='text-xs text-muted-foreground mt-2'>View sales and reports</p>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
