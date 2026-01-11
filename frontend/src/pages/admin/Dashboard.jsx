import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminService, pharmacyService } from '@/services';
import {
  Building2,
  Users,
  ShoppingCart,
  UserCheck,
  UserX,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  Plus,
  AlertCircle,
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [pharmacyName, setPharmacyName] = useState('PharmaCare');
  const [topBranch, setTopBranch] = useState({ name: '', avgSales: '$0' });
  const [activeUsers, setActiveUsers] = useState(0);
  const [newRegistrations, setNewRegistrations] = useState(0);
  const [stats, setStats] = useState({
    totalBranches: 0,
    totalUsers: 0,
    totalSales: 0,
    pendingManagers: 0,
    activatedManagers: 0,
  });
  const [pendingManagers, setPendingManagers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingManagers();
    fetchRecentActivity();
    fetchPharmacyInfo();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await adminService.getDashboard();

      if (response.success) {
        setStats(response.data?.summary || {});
        
        // Extract branch performance data
        if (response.data?.topBranch) {
          const branchData = response.data.topBranch;
          setTopBranch({
            name: branchData.name || '',
            avgSales: branchData.avgSales ? `$${branchData.avgSales.toLocaleString()}` : '$0'
          });
        }
        
        // Extract user activity data
        if (response.data?.userActivity) {
          setActiveUsers(response.data.userActivity.activeUsers || 0);
          setNewRegistrations(response.data.userActivity.newRegistrations || 0);
        }
      } else {
        toast.error(response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      toast.error('An error occurred while loading dashboard');
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPendingManagers = async () => {
    try {
      const response = await adminService.getManagers();
      if (response.success && response.data?.pending) {
        setPendingManagers(response.data.pending);
      }
    } catch (error) {
      console.error('Error fetching pending managers:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      setActivityLoading(true);
      const response = await adminService.getRecentActivity();
      
      if (response.success && response.data?.activities) {
        setRecentActivity(response.data.activities);
      } else {
        // If API returns empty or error, show empty state
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchPharmacyInfo = async () => {
    try {
      const response = await pharmacyService.getPharmacyInfo('admin');
      if (response.success && response.data?.name) {
        setPharmacyName(response.data.name);
      }
    } catch (error) {
      console.error('Error fetching pharmacy info:', error);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'manager_activated':
        return UserCheck;
      case 'manager_deactivated':
        return UserX;
      case 'manager_created':
        return UserCheck;
      case 'branch_created':
        return Building2;
      case 'branch_activated':
        return Building2;
      case 'branch_deactivated':
        return Building2;
      case 'sales_milestone':
        return ShoppingCart;
      case 'system_alert':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getActivityIconColor = (type) => {
    switch (type) {
      case 'manager_activated':
      case 'branch_activated':
        return 'bg-green-100 dark:bg-green-900/20';
      case 'manager_deactivated':
      case 'branch_deactivated':
        return 'bg-red-100 dark:bg-red-900/20';
      case 'manager_created':
      case 'branch_created':
        return 'bg-blue-100 dark:bg-blue-900/20';
      case 'sales_milestone':
        return 'bg-purple-100 dark:bg-purple-900/20';
      case 'system_alert':
        return 'bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description, trend, onClick }) => (
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
        <div className='flex items-baseline gap-2'>
          <div className='text-2xl font-bold text-slate-900 dark:text-slate-50'>{value}</div>
          {trend && (
            <Badge variant={trend > 0 ? 'default' : 'destructive'} className='text-xs'>
              {trend > 0 ? (
                <>
                  <TrendingUp className='h-3 w-3 mr-1' />+{trend}%
                </>
              ) : (
                <>
                  <TrendingDown className='h-3 w-3 mr-1' />
                  {trend}%
                </>
              )}
            </Badge>
          )}
        </div>
        {description && <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>{description}</p>}
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

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <Navigation />

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-50'>Admin Dashboard</h1>
              <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
                Overview of your {pharmacyName} system
              </p>
            </div>
            <Button
              onClick={() => {
                fetchDashboardData();
                fetchPendingManagers();
                fetchRecentActivity();
              }}
              disabled={refreshing}
              variant='outline'
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Statistics Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
            <StatCard
              title='Total Branches'
              value={stats.totalBranches || 0}
              icon={Building2}
              color='bg-slate-100 dark:bg-slate-800'
              description='Active pharmacy branches'
              trend={12}
              onClick={() => navigate('/admin/branches')}
            />
            <StatCard
              title='Total Users'
              value={stats.totalUsers || 0}
              icon={Users}
              color='bg-slate-100 dark:bg-slate-800'
              description='All system users'
              trend={8}
            />
            <StatCard
              title='Total Sales'
              value={stats.totalSales || 0}
              icon={ShoppingCart}
              color='bg-slate-100 dark:bg-slate-800'
              description='Sales transactions'
              trend={15}
            />
            <StatCard
              title='Pending Managers'
              value={stats.pendingManagers || 0}
              icon={UserX}
              color='bg-slate-100 dark:bg-slate-800'
              description='Awaiting activation'
              onClick={() => navigate('/admin/managers')}
            />
            <StatCard
              title='Activated Managers'
              value={stats.activatedManagers || 0}
              icon={UserCheck}
              color='bg-slate-100 dark:bg-slate-800'
              description='Active managers'
              trend={5}
              onClick={() => navigate('/admin/managers')}
            />
          </div>

          {/* Tabs for different views */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className='space-y-4'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='requests' className='relative'>
                Registration Requests
                {pendingManagers && pendingManagers.length > 0 && (
                  <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white'>
                    {pendingManagers.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value='actions'>Quick Actions</TabsTrigger>
              <TabsTrigger value='activity'>Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value='overview' className='space-y-4'>
              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader>
                  <CardTitle className='text-slate-900 dark:text-slate-50'>System Overview</CardTitle>
                  <CardDescription>Key metrics and performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='p-4 border border-slate-200 dark:border-slate-700 rounded-lg'>
                      <h3 className='font-semibold text-slate-900 dark:text-slate-50 mb-2'>Branch Performance</h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Average sales per branch:{' '}
                        <span className='font-bold text-slate-900 dark:text-slate-50'>{topBranch.avgSales}</span>
                      </p>
                      <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                        Top performing branch:{' '}
                        <span className='font-bold text-slate-900 dark:text-slate-50'>{topBranch.name}</span>
                      </p>
                    </div>
                    <div className='p-4 border border-slate-200 dark:border-slate-700 rounded-lg'>
                      <h3 className='font-semibold text-slate-900 dark:text-slate-50 mb-2'>User Activity</h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Active users today: <span className='font-bold text-slate-900 dark:text-slate-50'>{activeUsers}</span>
                      </p>
                      <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                        New registrations: <span className='font-bold text-slate-900 dark:text-slate-50'>{newRegistrations}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='requests' className='space-y-4'>
              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader>
                  <CardTitle className='text-slate-900 dark:text-slate-50'>Manager Registration Requests</CardTitle>
                  <CardDescription>Review and approve new manager accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingManagers.length === 0 ? (
                    <div className='text-center py-8 text-muted-foreground italic'>
                      No pending registration requests
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {pendingManagers.map((manager) => (
                        <Card
                          key={manager.user_id || manager.id}
                          className='border-l-4 border-l-slate-400 dark:border-l-slate-600'
                        >
                          <CardContent className='pt-6'>
                            <div className='flex justify-between items-start mb-4'>
                              <div className='flex items-center gap-3'>
                                <div className='h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold'>
                                  {(manager.full_name || manager.name || 'U').charAt(0)}
                                </div>
                                <div>
                                  <h4 className='font-semibold text-slate-900 dark:text-slate-50'>
                                    {manager.full_name || manager.name}
                                  </h4>
                                  <p className='text-xs text-slate-600 dark:text-slate-400'>{manager.email}</p>
                                </div>
                              </div>
                              <Badge
                                variant='outline'
                                className='bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                              >
                                Pending
                              </Badge>
                            </div>

                            <div className='space-y-2 mb-6'>
                              <div className='flex items-center text-sm text-slate-600 dark:text-slate-400'>
                                <Building2 className='h-4 w-4 mr-2' />
                                <span className='font-medium text-slate-900 dark:text-slate-50'>
                                  {manager.pharmacy_name || manager.pharmacyName || 'New Pharmacy'}
                                </span>
                              </div>
                              <div className='flex items-center text-sm text-slate-600 dark:text-slate-400 ml-6 italic'>
                                <span>
                                  {manager.branch_name ||
                                    manager.branchName ||
                                    manager.branch?.name ||
                                    'New Branch'}
                                </span>
                              </div>
                              <div className='flex items-center text-sm text-slate-600 dark:text-slate-400'>
                                <Clock className='h-4 w-4 mr-2' />
                                <span>
                                  Requested:{' '}
                                  {new Date(
                                    manager.created_at || manager.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div className='flex gap-2 mt-4'>
                              <Button
                                size='sm'
                                className='flex-1 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
                                onClick={() => navigate('/admin/managers')}
                              >
                                <CheckCircle className='h-3 w-3 mr-1' />
                                Review & Activate
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                className='flex-1'
                                onClick={() => navigate('/admin/managers')}
                              >
                                <Eye className='h-3 w-3 mr-1' />
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  {pendingManagers.length > 0 && (
                    <div className='mt-4 text-center'>
                      <Button variant='link' onClick={() => navigate('/admin/managers')}>
                        View all managers in management console →
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='actions' className='space-y-4'>
              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader>
                  <CardTitle className='text-slate-900 dark:text-slate-50'>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <Button
                      variant='outline'
                      className='h-auto py-4 flex-col items-start'
                      onClick={() => navigate('/admin/branches')}
                    >
                      <div className='flex items-center w-full'>
                        <Building2 className='h-5 w-5 mr-2' />
                        <span className='font-semibold'>View All Branches</span>
                        <ArrowRight className='h-4 w-4 ml-auto' />
                      </div>
                      <p className='text-xs text-muted-foreground mt-2'>Manage pharmacy branches</p>
                    </Button>

                    <Button
                      variant='outline'
                      className='h-auto py-4 flex-col items-start'
                      onClick={() => navigate('/admin/managers')}
                    >
                      <div className='flex items-center w-full'>
                        <UserCheck className='h-5 w-5 mr-2' />
                        <span className='font-semibold'>View All Managers</span>
                        <ArrowRight className='h-4 w-4 ml-auto' />
                      </div>
                      <p className='text-xs text-muted-foreground mt-2'>
                        Activate or manage managers
                      </p>
                    </Button>

                    <Button
                      variant='outline'
                      className='h-auto py-4 flex-col items-start'
                      onClick={() => navigate('/admin/managers')}
                    >
                      <div className='flex items-center w-full'>
                        <UserX className='h-5 w-5 mr-2 text-slate-600 dark:text-slate-400' />
                        <span className='font-semibold'>Pending Managers</span>
                        <ArrowRight className='h-4 w-4 ml-auto' />
                      </div>
                      <p className='text-xs text-muted-foreground mt-2'>
                        Review pending activations
                      </p>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='activity' className='space-y-4'>
              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader>
                  <CardTitle className='text-slate-900 dark:text-slate-50'>Recent Activity</CardTitle>
                  <CardDescription>Latest system events and actions</CardDescription>
                </CardHeader>
                <CardContent>
                  {activityLoading ? (
                    <div className='flex items-center justify-center py-8'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className='text-center py-8 text-slate-600 dark:text-slate-400'>
                      <Clock className='h-12 w-12 mx-auto mb-3 text-slate-400 dark:text-slate-600' />
                      <p className='text-sm'>No recent activity to display</p>
                      <p className='text-xs mt-1'>System events will appear here</p>
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
                                {activity.title || activity.description}
                              </p>
                              {activity.description && activity.title && (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  {activity.description}
                                </p>
                              )}
                              {activity.user_name && (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  by {activity.user_name}
                                </p>
                              )}
                              {activity.pharmacy_name && activity.branch_name && (
                                <p className='text-xs text-slate-600 dark:text-slate-400'>
                                  {activity.pharmacy_name} - {activity.branch_name}
                                </p>
                              )}
                              {activity.created_at && (
                                <p className='text-xs text-slate-600 dark:text-slate-400 mt-1'>
                                  {new Date(activity.created_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Alert for pending managers */}
          {stats.pendingManagers > 0 && (
            <div className='mt-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4'>
              <div className='flex'>
                <UserX className='h-5 w-5 text-slate-600 dark:text-slate-400 mr-2' />
                <div className='flex-1'>
                  <h3 className='text-sm font-medium text-slate-900 dark:text-slate-50'>
                    Pending Manager Activations
                  </h3>
                  <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
                    You have {stats.pendingManagers} manager{stats.pendingManagers !== 1 ? 's' : ''}{' '}
                    waiting for activation.
                  </p>
                  <Button
                    variant='link'
                    className='mt-2 p-0 h-auto text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    onClick={() => navigate('/admin/managers')}
                  >
                    Review pending managers →
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
