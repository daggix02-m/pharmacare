import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/common/StatusBadge';
import { pharmacistService } from '@/services';
import {
  Package,
  AlertTriangle,
  Clock,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Plus,
  FileText,
  RotateCcw,
  CheckCircle,
  History,
} from 'lucide-react';

const PharmacistDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    inventorySummary: {
      totalMedicines: 0,
      lowStockCount: 0,
      expiringCount: 0,
      totalValue: 0,
    },
    salesSummary: {
      today: { count: 0, revenue: 0 },
      thisWeek: { count: 0, revenue: 0 },
      thisMonth: { count: 0, revenue: 0 },
    },
    alerts: {
      lowStock: [],
      expiring: [],
    },
    restockRequests: [],
    recentActivity: [],
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      const response = await pharmacistService.getDashboard();

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

  const StatCard = ({ title, value, icon: Icon, color, description, onClick }) => (
    <Card
      className={`hover:shadow-lg transition-shadow cursor-pointer border-slate-200 dark:border-slate-800 ${onClick ? '' : ''}`}
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
        {description && <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>{description}</p>}
      </CardContent>
    </Card>
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'sale':
        return ShoppingCart;
      case 'restock_request':
        return Package;
      case 'inventory_update':
        return RotateCcw;
      case 'expiry_alert':
        return AlertTriangle;
      default:
        return History;
    }
  };

  const getActivityIconColor = (type) => {
    switch (type) {
      case 'sale':
        return 'bg-green-100 dark:bg-green-900/20';
      case 'restock_request':
        return 'bg-blue-100 dark:bg-blue-900/20';
      case 'inventory_update':
        return 'bg-purple-100 dark:bg-purple-900/20';
      case 'expiry_alert':
        return 'bg-red-100 dark:bg-red-900/20';
      default:
        return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  const { inventorySummary, salesSummary, alerts, restockRequests, recentActivity } = dashboardData;

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <Navigation />

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-50'>Pharmacist Dashboard</h1>
              <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
                Welcome back! Here's an overview of your inventory and sales.
              </p>
            </div>
            <Button onClick={fetchDashboard} disabled={refreshing} variant='outline'>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Inventory Stats */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <StatCard
              title='Total Medicines'
              value={inventorySummary?.totalMedicines || 0}
              icon={Package}
              color='bg-slate-100 dark:bg-slate-800'
              description='Unique medicines in stock'
              onClick={() => navigate('/pharmacist/medicines')}
            />
            <StatCard
              title='Low Stock'
              value={inventorySummary?.lowStockCount || 0}
              icon={AlertTriangle}
              color='bg-slate-100 dark:bg-slate-800'
              description='Items below minimum level'
              onClick={() => navigate('/pharmacist/inventory')}
            />
            <StatCard
              title='Expiring Soon'
              value={inventorySummary?.expiringCount || 0}
              icon={Clock}
              color='bg-slate-100 dark:bg-slate-800'
              description='Within next 30 days'
              onClick={() => navigate('/pharmacist/reports')}
            />
            <StatCard
              title='Inventory Value'
              value={`$${(inventorySummary?.totalValue || 0).toLocaleString()}`}
              icon={DollarSign}
              color='bg-slate-100 dark:bg-slate-800'
              description='Total estimated value'
              onClick={() => navigate('/pharmacist/reports')}
            />
          </div>

          {/* Sales Summary */}
          <div className='mb-8'>
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
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
            {/* Low Stock Alerts */}
            <Card className='border-slate-200 dark:border-slate-800'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-sm font-medium flex items-center text-slate-900 dark:text-slate-50'>
                    <AlertTriangle className='h-4 w-4 mr-2 text-slate-600 dark:text-slate-400' />
                    Low Stock Alerts
                  </CardTitle>
                  {(alerts?.lowStock?.length || 0) > 5 && (
                    <Button
                      variant='link'
                      className='p-0 h-auto text-sm'
                      onClick={() => navigate('/pharmacist/inventory')}
                    >
                      View all ({alerts?.lowStock?.length}) →
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {alerts?.lowStock?.length === 0 ? (
                  <div className='text-center py-4 text-slate-500 dark:text-slate-400 text-sm'>
                    No low stock items. Great job!
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {alerts.lowStock.slice(0, 5).map((item, idx) => (
                      <div key={idx} className='flex items-center justify-between text-sm p-2 bg-slate-50 dark:bg-slate-900/50 rounded'>
                        <span className='font-medium text-slate-900 dark:text-slate-50'>{item.name}</span>
                        <div className='flex items-center gap-2'>
                          <span className='text-slate-600 dark:text-slate-400'>
                            {item.quantity} / {item.minStockLevel}
                          </span>
                          <StatusBadge
                            status={item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                            type={item.quantity === 0 ? 'error' : 'warning'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expiring Soon */}
            <Card className='border-slate-200 dark:border-slate-800'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-sm font-medium flex items-center text-slate-900 dark:text-slate-50'>
                    <Clock className='h-4 w-4 mr-2 text-slate-600 dark:text-slate-400' />
                    Expiring Soon
                  </CardTitle>
                  {(alerts?.expiring?.length || 0) > 5 && (
                    <Button
                      variant='link'
                      className='p-0 h-auto text-sm'
                      onClick={() => navigate('/pharmacist/reports')}
                    >
                      View all ({alerts?.expiring?.length}) →
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {alerts?.expiring?.length === 0 ? (
                  <div className='text-center py-4 text-slate-500 dark:text-slate-400 text-sm'>
                    No expiring items within 30 days.
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {alerts.expiring.slice(0, 5).map((item, idx) => (
                      <div key={idx} className='flex items-center justify-between text-sm p-2 bg-slate-50 dark:bg-slate-900/50 rounded'>
                        <span className='font-medium text-slate-900 dark:text-slate-50'>{item.name}</span>
                        <div className='flex items-center gap-2'>
                          <span className='text-slate-600 dark:text-slate-400'>{item.daysRemaining} days</span>
                          <StatusBadge
                            status={item.daysRemaining < 0 ? 'Expired' : 'Expiring Soon'}
                            type={item.daysRemaining < 0 ? 'error' : 'warning'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Restock Requests */}
          {(restockRequests?.length || 0) > 0 && (
            <Card className='mb-8 border-slate-200 dark:border-slate-800'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-slate-900 dark:text-slate-50'>Restock Requests</CardTitle>
                  <Button
                    variant='link'
                    className='p-0 h-auto text-sm'
                    onClick={() => navigate('/pharmacist/inventory')}
                  >
                    View all →
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {restockRequests.slice(0, 5).map((request, idx) => (
                    <div key={idx} className='flex items-center justify-between text-sm p-3 border border-slate-200 dark:border-slate-700 rounded-lg'>
                      <div className='flex-1'>
                        <p className='font-medium text-slate-900 dark:text-slate-50'>{request.medicineName}</p>
                        <p className='text-xs text-slate-600 dark:text-slate-400'>
                          Requested: {request.requestedQty} units • {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority?.toUpperCase()}
                        </Badge>
                        <StatusBadge status={request.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className='mb-8 border-slate-200 dark:border-slate-800'>
            <CardHeader>
              <CardTitle className='text-slate-900 dark:text-slate-50'>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <Button
                  variant='outline'
                  className='h-auto py-4 flex-col items-start'
                  onClick={() => navigate('/pharmacist/sales')}
                >
                  <div className='flex items-center w-full'>
                    <ShoppingCart className='h-5 w-5 mr-2' />
                    <span className='font-semibold'>New Sale</span>
                    <ArrowRight className='h-4 w-4 ml-auto' />
                  </div>
                  <p className='text-xs text-muted-foreground mt-2'>Create a new sale</p>
                </Button>

                <Button
                  variant='outline'
                  className='h-auto py-4 flex-col items-start'
                  onClick={() => navigate('/pharmacist/medicines')}
                >
                  <div className='flex items-center w-full'>
                    <Package className='h-5 w-5 mr-2' />
                    <span className='font-semibold'>View Inventory</span>
                    <ArrowRight className='h-4 w-4 ml-auto' />
                  </div>
                  <p className='text-xs text-muted-foreground mt-2'>Manage medicine stock</p>
                </Button>

                <Button
                  variant='outline'
                  className='h-auto py-4 flex-col items-start'
                  onClick={() => navigate('/pharmacist/inventory')}
                >
                  <div className='flex items-center w-full'>
                    <Plus className='h-5 w-5 mr-2' />
                    <span className='font-semibold'>Request Restock</span>
                    <ArrowRight className='h-4 w-4 ml-auto' />
                  </div>
                  <p className='text-xs text-muted-foreground mt-2'>Request new stock</p>
                </Button>

                <Button
                  variant='outline'
                  className='h-auto py-4 flex-col items-start'
                  onClick={() => navigate('/pharmacist/reports')}
                >
                  <div className='flex items-center w-full'>
                    <FileText className='h-5 w-5 mr-2' />
                    <span className='font-semibold'>View Reports</span>
                    <ArrowRight className='h-4 w-4 ml-auto' />
                  </div>
                  <p className='text-xs text-muted-foreground mt-2'>View inventory reports</p>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className='border-slate-200 dark:border-slate-800'>
            <CardHeader>
              <CardTitle className='text-slate-900 dark:text-slate-50'>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity?.length === 0 ? (
                <div className='text-center py-8 text-slate-500 dark:text-slate-400'>
                  <History className='h-12 w-12 mx-auto mb-3 text-slate-400 dark:text-slate-600' />
                  <p className='text-sm'>No recent activity to display</p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {recentActivity.map((activity, index) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    const iconColor = getActivityIconColor(activity.type);
                    return (
                      <div
                        key={index}
                        className='flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors'
                      >
                        <div className={`p-2 rounded-full ${iconColor}`}>
                          <ActivityIcon className='h-4 w-4 text-slate-600 dark:text-slate-400' />
                        </div>
                        <div className='flex-1'>
                          <p className='text-sm font-medium text-slate-900 dark:text-slate-50'>
                            {activity.title}
                          </p>
                          {activity.description && (
                            <p className='text-xs text-slate-600 dark:text-slate-400'>
                              {activity.description}
                            </p>
                          )}
                          <p className='text-xs text-slate-600 dark:text-slate-400 mt-1'>
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PharmacistDashboard;
