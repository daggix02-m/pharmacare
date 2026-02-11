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
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminService, pharmacyService } from '@/services';
import {
  Building2,
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
  Phone,
  Activity,
  BarChart3,
  AlertTriangle,
  Users,
} from 'lucide-react';

/**
 * Transform manager data to pharmacy-centric structure
 */
const transformManagerToPharmacy = (manager) => {
  const regData = manager.registration_data || manager.registrationData || manager.user || {};

  return {
    pharmacyId: manager.user_id || manager.id,
    pharmacyName:
      manager.pharmacy_name ||
      manager.pharmacyName ||
      manager.pharmacy ||
      regData.pharmacy_name ||
      regData.pharmacyName ||
      'N/A',
    manager: {
      id: manager.user_id || manager.id,
      name: manager.full_name || manager.name || 'N/A',
      email: manager.email || 'N/A',
      status: manager.is_active ? 'Active' : manager.pending_activation ? 'Pending' : 'Inactive',
    },
    branch: {
      id: manager.branch_id || manager.branch?.id,
      name:
        manager.branch_name ||
        manager.branchName ||
        manager.location ||
        regData.branch_name ||
        regData.branchName ||
        regData.location ||
        manager.branch?.name ||
        'N/A',
      phone:
        manager.phone ||
        manager.branch_phone ||
        manager.contact_phone ||
        regData.phone ||
        manager.branch?.phone ||
        'N/A',
      email:
        manager.branch_email ||
        manager.branchEmail ||
        regData.branch_email ||
        regData.branchEmail ||
        manager.branch?.email ||
        'N/A',
      totalStaff: manager.total_staff || manager.branch?.total_staff || 0,
      totalManagers: manager.total_managers || manager.branch?.total_managers || 0,
    },
    status: manager.is_active ? 'Active' : manager.pending_activation ? 'Pending' : 'Inactive',
    createdAt: manager.created_at || manager.createdAt,
    isActive: manager.is_active,
    isPending: manager.pending_activation,
  };
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [pharmacyName, setPharmacyName] = useState('PharmaCare');
  const [topPharmacy, setTopPharmacy] = useState({ name: '', totalStaff: 0 });
  const [activeUsers, setActiveUsers] = useState(0);
  const [newRegistrations, setNewRegistrations] = useState(0);
  const [stats, setStats] = useState({
    totalPharmacies: 0,
    totalBranches: 0,
    totalStaff: 0,
    pendingPharmacies: 0,
    activatedPharmacies: 0,
  });
  const [pharmacies, setPharmacies] = useState([]);
  const [pendingPharmacies, setPendingPharmacies] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchPharmacies();
    fetchPharmacyInfo();
    fetchRecentActivity();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await adminService.getDashboard();

      if (response.success) {
        const dashboardStats = response.data?.summary || {};

        // Transform stats to pharmacy-centric structure
        setStats({
          totalPharmacies: dashboardStats.totalPharmacies || dashboardStats.totalManagers || 0,
          totalBranches: dashboardStats.totalBranches || 0,
          totalStaff: dashboardStats.totalStaff || 0,
          pendingPharmacies: dashboardStats.pendingPharmacies || dashboardStats.pendingManagers || 0,
          activatedPharmacies: dashboardStats.activatedPharmacies || dashboardStats.activatedManagers || 0,
        });

        // Extract pharmacy performance data
        if (response.data?.topPharmacy || response.data?.topBranch) {
          const pharmacyData = response.data.topPharmacy || response.data.topBranch;
          setTopPharmacy({
            name: pharmacyData.name || '',
            totalStaff: pharmacyData.totalStaff || pharmacyData.avgSales || 0,
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

  const fetchPharmacies = async () => {
    try {
      const response = await adminService.getManagers();
      if (response.success) {
        let managersData = [];

        if (response.data && typeof response.data === 'object') {
          managersData = response.data.all || [];
        }

        // Transform to pharmacy-centric structure
        const pharmaciesData = managersData.map(transformManagerToPharmacy);
        setPharmacies(pharmaciesData);

        // Filter pending pharmacies
        const pending = pharmaciesData.filter((p) => p.isPending);
        setPendingPharmacies(pending);
      }
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
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

  const fetchRecentActivity = async () => {
    try {
      const response = await adminService.getRecentActivity();
      if (response.success && response.data) {
        setRecentActivity(response.data);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description, trend, onClick }) => (
    <Card
      className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200 dark:border-slate-800 ${onClick ? 'hover:border-blue-300 dark:hover:border-blue-700' : ''}`}
      onClick={onClick}
    >
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-slate-900 dark:text-slate-50'>
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className='h-4 w-4' />
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
        {description && (
          <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>{description}</p>
        )}
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
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900'>
      <Navigation />

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          {/* Header */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3'>
                <Shield className='h-8 w-8 text-blue-600' />
                Admin Dashboard
              </h1>
              <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
                Overview and management of {pharmacyName} system
              </p>
            </div>
            <Button
              onClick={() => {
                fetchDashboardData();
                fetchPharmacies();
                fetchRecentActivity();
              }}
              disabled={refreshing}
              variant='outline'
              className='self-start sm:self-auto'
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Statistics Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
            <StatCard
              title='Total Pharmacies'
              value={stats.totalPharmacies || 0}
              icon={Building2}
              color='bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              description='Registered pharmacies'
              onClick={() => navigate('/admin/branches')}
            />
            <StatCard
              title='Pending Pharmacies'
              value={stats.pendingPharmacies || 0}
              icon={UserX}
              color='bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
              description='Awaiting activation'
              onClick={() => navigate('/admin/managers')}
            />
            <StatCard
              title='Activated Pharmacies'
              value={stats.activatedPharmacies || 0}
              icon={UserCheck}
              color='bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              description='Active and operational'
              trend={8}
              onClick={() => navigate('/admin/managers')}
            />
            <StatCard
              title='Active Users Today'
              value={activeUsers}
              icon={Activity}
              color='bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              description='Currently logged in'
              trend={15}
            />
          </div>

          {/* Additional Stats Row */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
            <StatCard
              title='New Registrations'
              value={newRegistrations}
              icon={Users}
              color='bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              description='Recent sign-ups'
              trend={5}
            />
          </div>

          {/* Tabs for different views */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className='space-y-4'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='requests' className='relative'>
                Pharmacy Requests
                {pendingPharmacies && pendingPharmacies.length > 0 && (
                  <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white'>
                    {pendingPharmacies.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value='actions'>Quick Actions</TabsTrigger>
              <TabsTrigger value='activity'>Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value='overview' className='space-y-4'>
              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader>
                  <CardTitle className='text-slate-900 dark:text-slate-50'>
                    System Overview
                  </CardTitle>
                  <CardDescription>Key metrics and performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg'>
                      <h3 className='font-semibold text-slate-900 dark:text-slate-50 mb-2 flex items-center gap-2'>
                        <BarChart3 className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                        Pharmacy Performance
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Top performing pharmacy:{' '}
                        <span className='font-bold text-slate-900 dark:text-slate-50'>
                          {topPharmacy.name || 'N/A'}
                        </span>
                      </p>
                      <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                        Total staff:{' '}
                        <span className='font-bold text-slate-900 dark:text-slate-50'>
                          {topPharmacy.totalStaff || 0}
                        </span>
                      </p>
                    </div>
                    <div className='p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border border-green-200 dark:border-green-800 rounded-lg'>
                      <h3 className='font-semibold text-slate-900 dark:text-slate-50 mb-2 flex items-center gap-2'>
                        <Activity className='h-5 w-5 text-green-600 dark:text-green-400' />
                        User Activity
                      </h3>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Active users today:{' '}
                        <span className='font-bold text-slate-900 dark:text-slate-50'>
                          {activeUsers}
                        </span>
                      </p>
                      <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                        New registrations:{' '}
                        <span className='font-bold text-slate-900 dark:text-slate-50'>
                          {newRegistrations}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='requests' className='space-y-4'>
              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader>
                  <CardTitle className='text-slate-900 dark:text-slate-50'>
                    Pharmacy Requests
                  </CardTitle>
                  <CardDescription>Review and approve new pharmacy registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingPharmacies.length === 0 ? (
                    <div className='text-center py-8 text-muted-foreground italic'>
                      No pending pharmacy registrations
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {pendingPharmacies.map((pharmacy) => (
                        <Card
                          key={pharmacy.pharmacyId}
                          className='border-l-4 border-l-yellow-400 dark:border-l-yellow-600 hover:shadow-md transition-shadow'
                        >
                          <CardContent className='pt-6'>
                            <div className='flex justify-between items-start mb-4'>
                              <div className='flex items-center gap-3'>
                                <div className='h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-bold'>
                                  {(pharmacy.manager?.name || 'U').charAt(0)}
                                </div>
                                <div>
                                  <h4 className='font-semibold text-slate-900 dark:text-slate-50'>
                                    {pharmacy.manager?.name || 'Unknown Manager'}
                                  </h4>
                                  <p className='text-xs text-slate-600 dark:text-slate-400'>
                                    {pharmacy.manager?.email || 'No email'}
                                  </p>
                                  {pharmacy.branch?.phone && (
                                    <p className='text-xs text-slate-600 dark:text-slate-400'>
                                      <Phone className='h-3 w-3 inline mr-1' />
                                      {pharmacy.branch.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Badge
                                variant='outline'
                                className='bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                              >
                                Pending
                              </Badge>
                            </div>

                            <div className='space-y-2 mb-6'>
                              <div className='flex items-center text-sm text-slate-600 dark:text-slate-400'>
                                <Building2 className='h-4 w-4 mr-2' />
                                <span className='font-medium text-slate-900 dark:text-slate-50'>
                                  {pharmacy.pharmacyName || 'New Pharmacy'}
                                </span>
                              </div>
                              <div className='flex items-center text-sm text-slate-600 dark:text-slate-400 ml-6 italic'>
                                <span>
                                  {pharmacy.branch?.name || 'New Branch'}
                                </span>
                              </div>
                              <div className='flex items-center text-sm text-slate-600 dark:text-slate-400'>
                                <Clock className='h-4 w-4 mr-2' />
                                <span>
                                  Requested:{' '}
                                  {new Date(pharmacy.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div className='flex gap-2 mt-4'>
                              <Button
                                size='sm'
                                className='flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
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
                  {pendingPharmacies.length > 0 && (
                    <div className='mt-4 text-center'>
                      <Button variant='link' onClick={() => navigate('/admin/managers')}>
                        View all pharmacy requests →
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
                  <CardDescription>Common pharmacy management tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <Button
                      variant='outline'
                      className='h-auto py-4 flex-col items-start hover:border-blue-300 dark:hover:border-blue-700'
                      onClick={() => navigate('/admin/branches')}
                    >
                      <div className='flex items-center w-full'>
                        <Building2 className='h-5 w-5 mr-2 text-blue-600 dark:text-blue-400' />
                        <span className='font-semibold'>Pharmacy Management</span>
                        <ArrowRight className='h-4 w-4 ml-auto' />
                      </div>
                      <p className='text-xs text-muted-foreground mt-2'>Manage pharmacies, branches & staff</p>
                    </Button>

                    <Button
                      variant='outline'
                      className='h-auto py-4 flex-col items-start hover:border-green-300 dark:hover:border-green-700'
                      onClick={() => navigate('/admin/managers')}
                    >
                      <div className='flex items-center w-full'>
                        <UserCheck className='h-5 w-5 mr-2 text-green-600 dark:text-green-400' />
                        <span className='font-semibold'>Pharmacy Requests</span>
                        <ArrowRight className='h-4 w-4 ml-auto' />
                      </div>
                      <p className='text-xs text-muted-foreground mt-2'>
                        Activate or manage pharmacies
                      </p>
                    </Button>

                    <Button
                      variant='outline'
                      className='h-auto py-4 flex-col items-start hover:border-yellow-300 dark:hover:border-yellow-700'
                      onClick={() => navigate('/admin/managers')}
                    >
                      <div className='flex items-center w-full'>
                        <UserX className='h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400' />
                        <span className='font-semibold'>Pending Requests</span>
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
                  <CardTitle className='text-slate-900 dark:text-slate-50'>
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest system events and actions</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <div className='text-center py-8 text-slate-600 dark:text-slate-400'>
                      <Clock className='h-12 w-12 mx-auto mb-3 text-slate-400 dark:text-slate-600' />
                      <p className='text-sm'>No recent activity</p>
                      <p className='text-xs mt-1'>
                        Activity will appear here when actions are performed
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {recentActivity.map((activity, index) => (
                        <div
                          key={activity.id || index}
                          className='flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors'
                        >
                          <div className='flex-shrink-0'>
                            {activity.type === 'pharmacy' ? (
                              <Building2 className='h-5 w-5 text-blue-500' />
                            ) : activity.type === 'branch' ? (
                              <Briefcase className='h-5 w-5 text-green-500' />
                            ) : activity.type === 'activation' ? (
                              <CheckCircle className='h-5 w-5 text-emerald-500' />
                            ) : activity.type === 'deactivation' ? (
                              <XCircle className='h-5 w-5 text-red-500' />
                            ) : activity.type === 'staff' ? (
                              <Users className='h-5 w-5 text-purple-500' />
                            ) : (
                              <Clock className='h-5 w-5 text-slate-400 dark:text-slate-600' />
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-slate-900 dark:text-slate-50'>
                              {activity.description || activity.message || 'Activity event'}
                            </p>
                            <p className='text-xs text-slate-600 dark:text-slate-400 mt-1'>
                              {activity.user && `By ${activity.user}`}
                              {activity.pharmacy && activity.user && ' • '}
                              {activity.pharmacy && activity.pharmacy}
                            </p>
                            <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>
                              {new Date(activity.created_at || activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Alert for pending pharmacies */}
          {stats.pendingPharmacies > 0 && (
            <div className='mt-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4'>
              <div className='flex'>
                <AlertTriangle className='h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0' />
                <div className='flex-1'>
                  <h3 className='text-sm font-medium text-slate-900 dark:text-slate-50'>
                    Pending Pharmacy Requests
                  </h3>
                  <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
                    You have {stats.pendingPharmacies} pharmac{stats.pendingPharmacies !== 1 ? 'ies' : 'y'}{' '}
                    waiting for activation.
                  </p>
                  <Button
                    variant='link'
                    className='mt-2 p-0 h-auto text-yellow-700 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300'
                    onClick={() => navigate('/admin/managers')}
                  >
                    Review pharmacy requests →
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
