import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { managerService } from '@/services';
import {
  Building2,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  DollarSign,
  RefreshCw,
  ShoppingCart,
  Pill,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
} from 'lucide-react';
import DatabaseErrorAlert from '@/components/common/DatabaseErrorAlert';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    branchOverview: {},
    inventorySummary: {},
    salesSummary: {},
    alerts: {
      lowStock: [],
      expiring: [],
    },
  });
  const [topSellingData, setTopSellingData] = useState([]);
  const [salesTrendData, setSalesTrendData] = useState([]);
  const [dbError, setDbError] = useState(null);

  // Chart colors using CSS variables
  const CHART_COLORS = {
    primary: 'hsl(142, 76%, 36%)',
    secondary: 'hsl(210, 40%, 50%)',
    tertiary: 'hsl(173, 58%, 39%)',
    quaternary: 'hsl(197, 37%, 24%)',
    accent: 'hsl(43, 74%, 66%)',
  };

  const INVENTORY_COLORS = {
    healthy: 'hsl(142, 76%, 36%)',
    lowStock: 'hsl(43, 74%, 50%)',
    expiring: 'hsl(25, 95%, 53%)',
    expired: 'hsl(0, 84%, 60%)',
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      fetchAllData();
    }
  }, [selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const response = await managerService.getBranches();
      if (response.success) {
        const branchesData = Array.isArray(response.data) ? response.data : [];
        setBranches(branchesData);
        // Auto-select first branch if none selected
        if (!selectedBranchId && branchesData.length > 0) {
          setSelectedBranchId(branchesData[0].branch_id);
        }
      } else {
        toast.error(response.message || 'Failed to load branches');
      }
    } catch (error) {
      toast.error('Failed to load branches');
      console.error('Error fetching branches:', error);
    }
  };

  const fetchAllData = async () => {
    try {
      setRefreshing(true);
      setDbError(null);

      // Fetch all data in parallel with branch context
      const [dashboardResponse, topSellingResponse, salesResponse] = await Promise.all([
        managerService.getDashboard(selectedBranchId ? { branch_id: selectedBranchId } : {}),
        managerService.getTopSellingMedicines({ period: 'week', limit: 5, branch_id: selectedBranchId }),
        managerService.getSales({ limit: 30, branch_id: selectedBranchId }),
      ]);

      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data || {});
      } else {
        if (dashboardResponse.message?.includes('Database query error')) {
          setDbError(dashboardResponse);
        }
        toast.error(dashboardResponse.message || 'Failed to load dashboard');
      }

      // Process top selling medicines
      if (topSellingResponse.success && topSellingResponse.data) {
        const medicines = Array.isArray(topSellingResponse.data)
          ? topSellingResponse.data
          : topSellingResponse.data.medicines || [];
        setTopSellingData(
          medicines.map((item) => ({
            name: item.medicine_name || item.name || item.medicineName || 'Unknown',
            sales: item.total_sold || item.totalSold || item.quantity || 0,
            revenue: item.total_revenue || item.revenue || 0,
          }))
        );
      } else if (topSellingResponse.message?.includes('Database query error')) {
        setDbError(topSellingResponse);
      }

      // Process sales trend data - aggregate by date
      if (salesResponse.success && salesResponse.data) {
        const salesList = Array.isArray(salesResponse.data)
          ? salesResponse.data
          : salesResponse.data.sales || [];

        // Group sales by date
        const salesByDate = {};
        salesList.forEach((sale) => {
          const date = new Date(sale.created_at || sale.createdAt || sale.date).toLocaleDateString(
            'en-US',
            { weekday: 'short', month: 'short', day: 'numeric' }
          );
          if (!salesByDate[date]) {
            salesByDate[date] = { date, revenue: 0, transactions: 0 };
          }
          salesByDate[date].revenue += sale.total_amount || sale.totalAmount || sale.total || 0;
          salesByDate[date].transactions += 1;
        });

        // Convert to array and sort by date
        const trendData = Object.values(salesByDate).slice(-7);
        setSalesTrendData(trendData.length > 0 ? trendData : generateSampleTrendData());
      } else {
        if (salesResponse.message?.includes('Database query error')) {
          setDbError(salesResponse);
          console.error('[DASHBOARD] Sales trend data failed due to backend SQL incompatibility');
        }
        setSalesTrendData(generateSampleTrendData());
      }
    } catch (error) {
      toast.error('An error occurred while loading dashboard');
      console.error('Error fetching dashboard:', error);
      setSalesTrendData(generateSampleTrendData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Generate sample trend data when no real data available
  const generateSampleTrendData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day) => ({
      date: day,
      revenue: 0,
      transactions: 0,
    }));
  };

  // Calculate inventory distribution for pie chart
  const getInventoryDistribution = () => {
    const { inventorySummary } = dashboardData;
    const total = inventorySummary?.totalMedicines || 0;
    const lowStock = inventorySummary?.lowStockCount || 0;
    const expiring = inventorySummary?.expiringSoonCount || 0;
    const expired = inventorySummary?.expiredCount || 0;
    const healthy = Math.max(0, total - lowStock - expiring - expired);

    return [
      { name: 'Healthy Stock', value: healthy, color: INVENTORY_COLORS.healthy },
      { name: 'Low Stock', value: lowStock, color: INVENTORY_COLORS.lowStock },
      { name: 'Expiring Soon', value: expiring, color: INVENTORY_COLORS.expiring },
      { name: 'Expired', value: expired, color: INVENTORY_COLORS.expired },
    ].filter((item) => item.value > 0);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg'>
          <p className='text-sm font-medium text-slate-900 dark:text-slate-100'>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className='text-sm' style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Revenue' ? `$${entry.value.toFixed(2)}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Stat card component
  const StatCard = ({ title, value, icon: Icon, subtitle, trend, onClick }) => (
    <Card
      className={`hover:shadow-lg transition-all duration-200 border-slate-200 dark:border-slate-800 ${onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700' : ''}`}
      onClick={onClick}
    >
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-slate-500 dark:text-slate-400'>{title}</p>
            <p className='text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1'>{value}</p>
            {subtitle && (
              <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>{subtitle}</p>
            )}
          </div>
          <div className='flex flex-col items-end'>
            <div className='p-3 rounded-xl bg-slate-100 dark:bg-slate-800'>
              <Icon className='h-5 w-5 text-slate-600 dark:text-slate-400' />
            </div>
            {trend !== undefined && (
              <div
                className={`flex items-center mt-2 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {trend >= 0 ? (
                  <ArrowUpRight className='h-3 w-3 mr-1' />
                ) : (
                  <ArrowDownRight className='h-3 w-3 mr-1' />
                )}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
        <Navigation />
        <div className='flex items-center justify-center min-h-[80vh]'>
          <div className='flex flex-col items-center gap-4'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-slate-100'></div>
            <p className='text-sm text-slate-500 dark:text-slate-400'>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const { branchOverview, inventorySummary, salesSummary, alerts } = dashboardData;
  const inventoryDistribution = getInventoryDistribution();

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <Navigation />

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          {/* Header */}
          <div className='flex items-center justify-between mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-50'>Dashboard</h1>
              <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
                {branchOverview?.pharmacyName || branchOverview?.pharmacy_name || 'PharmaCare'} -{' '}
                {selectedBranchId
                  ? branches.find(b => b.branch_id === selectedBranchId)?.name || 'Selected Branch'
                  : 'All Branches'}
                {selectedBranchId && (
                  <span className='ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full'>
                    Active Branch
                  </span>
                )}
              </p>
            </div>
            <div className='flex gap-3'>
              {branches.length > 1 && (
                <Select value={selectedBranchId || 'all'} onValueChange={(value) => setSelectedBranchId(value === 'all' ? null : value)}>
                  <SelectTrigger className='w-[200px]'>
                    <div className='flex items-center gap-2'>
                      <Building2 className='h-4 w-4' />
                      <SelectValue placeholder='Select branch' />
                      <ChevronDown className='h-4 w-4 opacity-50' />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.branch_id} value={branch.branch_id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={fetchAllData} disabled={refreshing} variant='outline' size='sm'>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Database Error Alert */}
          {dbError && (
            <div className="mb-8">
              <DatabaseErrorAlert 
                error={dbError} 
                onRetry={fetchAllData} 
                isRetrying={refreshing}
                showDetails={true}
              />
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
            <StatCard
              title="Today's Revenue"
              value={`$${(salesSummary?.today?.revenue || 0).toFixed(2)}`}
              icon={DollarSign}
              subtitle={`${salesSummary?.today?.count || 0} transactions`}
            />
            <StatCard
              title='Total Medicines'
              value={inventorySummary?.totalMedicines || 0}
              icon={Pill}
              subtitle={`${inventorySummary?.totalQuantity || 0} units in stock`}
              onClick={() => navigate('/manager/medicines')}
            />
            <StatCard
              title='Low Stock Items'
              value={inventorySummary?.lowStockCount || 0}
              icon={AlertTriangle}
              subtitle='Requires attention'
              onClick={() => navigate('/manager/medicines?filter=low_stock')}
            />
            <StatCard
              title='Staff Members'
              value={branchOverview?.totalEmployees || 0}
              icon={Users}
              subtitle='Active employees'
              onClick={() => navigate('/manager/staff')}
            />
          </div>

          {/* Charts Row */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
            {/* Sales Trend Chart */}
            <Card className='lg:col-span-2 border-slate-200 dark:border-slate-800'>
              <CardHeader>
                <CardTitle className='text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center'>
                  <Activity className='h-5 w-5 mr-2 text-slate-600 dark:text-slate-400' />
                  Sales Trend
                </CardTitle>
                <CardDescription>Revenue over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-[280px]'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart
                      data={salesTrendData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id='colorRevenue' x1='0' y1='0' x2='0' y2='1'>
                          <stop offset='5%' stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                          <stop offset='95%' stopColor={CHART_COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        className='stroke-slate-200 dark:stroke-slate-700'
                      />
                      <XAxis dataKey='date' tick={{ fontSize: 12 }} className='text-slate-500' />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        className='text-slate-500'
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type='monotone'
                        dataKey='revenue'
                        name='Revenue'
                        stroke={CHART_COLORS.primary}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill='url(#colorRevenue)'
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Distribution */}
            <Card className='border-slate-200 dark:border-slate-800'>
              <CardHeader>
                <CardTitle className='text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center'>
                  <Package className='h-5 w-5 mr-2 text-slate-600 dark:text-slate-400' />
                  Inventory Status
                </CardTitle>
                <CardDescription>Stock distribution overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-[200px]'>
                  {inventoryDistribution.length > 0 ? (
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={inventoryDistribution}
                          cx='50%'
                          cy='50%'
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey='value'
                        >
                          {inventoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className='h-full flex items-center justify-center text-slate-500'>
                      No inventory data
                    </div>
                  )}
                </div>
                {/* Legend */}
                <div className='grid grid-cols-2 gap-2 mt-4'>
                  {inventoryDistribution.map((item, index) => (
                    <div key={index} className='flex items-center gap-2'>
                      <div
                        className='w-3 h-3 rounded-full'
                        style={{ backgroundColor: item.color }}
                      />
                      <span className='text-xs text-slate-600 dark:text-slate-400'>
                        {item.name} ({item.value})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Top Selling Medicines */}
            <Card className='border-slate-200 dark:border-slate-800'>
              <CardHeader>
                <CardTitle className='text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center'>
                  <TrendingUp className='h-5 w-5 mr-2 text-slate-600 dark:text-slate-400' />
                  Top Selling Medicines
                </CardTitle>
                <CardDescription>Best performers this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-[250px]'>
                  {topSellingData.length > 0 ? (
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={topSellingData}
                        layout='vertical'
                        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          className='stroke-slate-200 dark:stroke-slate-700'
                          horizontal={true}
                          vertical={false}
                        />
                        <XAxis type='number' tick={{ fontSize: 11 }} />
                        <YAxis dataKey='name' type='category' tick={{ fontSize: 11 }} width={100} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey='sales'
                          name='Units Sold'
                          fill={CHART_COLORS.secondary}
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className='h-full flex items-center justify-center text-slate-500'>
                      No sales data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alerts & Quick Stats */}
            <Card className='border-slate-200 dark:border-slate-800'>
              <CardHeader>
                <CardTitle className='text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center'>
                  <AlertTriangle className='h-5 w-5 mr-2 text-slate-600 dark:text-slate-400' />
                  Alerts & Notifications
                </CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {/* Sales Summary Cards */}
                  <div className='grid grid-cols-3 gap-3'>
                    <div className='p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center'>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>Today</p>
                      <p className='text-lg font-bold text-slate-900 dark:text-slate-50'>
                        ${(salesSummary?.today?.revenue || 0).toFixed(0)}
                      </p>
                    </div>
                    <div className='p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center'>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>This Week</p>
                      <p className='text-lg font-bold text-slate-900 dark:text-slate-50'>
                        ${(salesSummary?.thisWeek?.revenue || 0).toFixed(0)}
                      </p>
                    </div>
                    <div className='p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center'>
                      <p className='text-xs text-slate-500 dark:text-slate-400'>This Month</p>
                      <p className='text-lg font-bold text-slate-900 dark:text-slate-50'>
                        ${(salesSummary?.thisMonth?.revenue || 0).toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Alert Items */}
                  <div className='space-y-2 max-h-[160px] overflow-y-auto'>
                    {alerts?.lowStock?.slice(0, 3).map((item, idx) => (
                      <div
                        key={`low-${idx}`}
                        className='flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg'
                      >
                        <div className='flex items-center gap-2'>
                          <AlertTriangle className='h-4 w-4 text-amber-600' />
                          <span className='text-sm text-slate-700 dark:text-slate-300'>
                            {item.name}
                          </span>
                        </div>
                        <span className='text-xs font-medium text-amber-700 dark:text-amber-400'>
                          {item.currentStock} left
                        </span>
                      </div>
                    ))}
                    {alerts?.expiring?.slice(0, 2).map((item, idx) => (
                      <div
                        key={`exp-${idx}`}
                        className='flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg'
                      >
                        <div className='flex items-center gap-2'>
                          <Clock className='h-4 w-4 text-orange-600' />
                          <span className='text-sm text-slate-700 dark:text-slate-300'>
                            {item.name}
                          </span>
                        </div>
                        <span className='text-xs font-medium text-orange-700 dark:text-orange-400'>
                          {item.daysRemaining} days
                        </span>
                      </div>
                    ))}
                    {!alerts?.lowStock?.length && !alerts?.expiring?.length && (
                      <div className='text-center py-6 text-slate-500'>
                        <Activity className='h-8 w-8 mx-auto mb-2 opacity-50' />
                        <p className='text-sm'>No alerts at this time</p>
                      </div>
                    )}
                  </div>

                  {(alerts?.lowStock?.length > 3 || alerts?.expiring?.length > 2) && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full'
                      onClick={() => navigate('/manager/medicines')}
                    >
                      View All Alerts
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
