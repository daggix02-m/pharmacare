import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cashierService } from '@/services';
import {
  ShoppingCart,
  DollarSign,
  Clock,
  RotateCcw,
  CreditCard,
  RefreshCw,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Smartphone,
  ShieldCheck,
  Wallet,
  TrendingUp,
} from 'lucide-react';
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
} from 'recharts';

const CashierDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    performance: {
      todaySales: 0,
      totalRevenue: 0,
      pendingPayments: 0,
      returnsToday: 0,
    },
    paymentMethods: {
      cash: { count: 0, amount: 0 },
      card: { count: 0, amount: 0 },
      mobileMoney: { count: 0, amount: 0 },
      insurance: { count: 0, amount: 0 },
    },
    pendingPayments: [],
    recentTransactions: [],
  });
  const [transactionTrendData, setTransactionTrendData] = useState([]);

  // Chart colors
  const CHART_COLORS = {
    primary: 'hsl(142, 76%, 36%)',
    secondary: 'hsl(210, 40%, 50%)',
    tertiary: 'hsl(173, 58%, 39%)',
    quaternary: 'hsl(197, 37%, 24%)',
    accent: 'hsl(43, 74%, 66%)',
  };

  const PAYMENT_COLORS = {
    cash: 'hsl(142, 76%, 36%)',
    card: 'hsl(210, 40%, 50%)',
    mobile_money: 'hsl(270, 50%, 50%)',
    mobileMoney: 'hsl(270, 50%, 50%)',
    insurance: 'hsl(25, 95%, 53%)',
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setRefreshing(true);

      // Fetch dashboard data (includes pending payments)
      const dashboardResponse = await cashierService.getDashboard();

      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data || {});
      } else {
        toast.error(dashboardResponse.message || 'Failed to load dashboard');
      }

      // Transaction trend data should be included in dashboard response
      // If not available, generate sample data
      const transactions = dashboardResponse.data?.recentTransactions || dashboardResponse.data?.transactions || [];

      // Group transactions by date
      const transactionsByDate = {};
      transactions.forEach((txn) => {
        const date = new Date(txn.created_at || txn.createdAt || txn.date).toLocaleDateString(
          'en-US',
          {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }
        );
        if (!transactionsByDate[date]) {
          transactionsByDate[date] = { date, revenue: 0, transactions: 0 };
        }
        transactionsByDate[date].revenue +=
          txn.amount || txn.total_amount || txn.totalAmount || 0;
        transactionsByDate[date].transactions += 1;
      });

      const trendData = Object.values(transactionsByDate).slice(-7);
      setTransactionTrendData(trendData.length > 0 ? trendData : generateSampleTrendData());
    } catch (error) {
      toast.error('An error occurred while loading dashboard');
      console.error('Error fetching dashboard:', error);
      setTransactionTrendData(generateSampleTrendData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateSampleTrendData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day) => ({
      date: day,
      revenue: 0,
      transactions: 0,
    }));
  };

  // Get payment method distribution for pie chart
  const getPaymentDistribution = () => {
    const { paymentMethods } = dashboardData;
    if (!paymentMethods) return [];

    return Object.entries(paymentMethods)
      .map(([method, data]) => ({
        name: method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value: data.amount || 0,
        count: data.count || 0,
        color: PAYMENT_COLORS[method] || CHART_COLORS.secondary,
      }))
      .filter((item) => item.value > 0);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg'>
          <p className='text-sm font-medium text-slate-900 dark:text-slate-100'>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className='text-sm' style={{ color: entry.color }}>
              {entry.name}:{' '}
              {entry.name === 'Revenue' || entry.dataKey === 'revenue'
                ? `$${Number(entry.value).toFixed(2)}`
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return Wallet;
      case 'card':
        return CreditCard;
      case 'mobile_money':
      case 'mobilemoney':
        return Smartphone;
      case 'insurance':
        return ShieldCheck;
      default:
        return DollarSign;
    }
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

  const { performance, pendingPayments } = dashboardData;
  const paymentDistribution = getPaymentDistribution();
  const totalRevenue = performance?.totalRevenue || 0;

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
                Overview of your daily performance and transactions
              </p>
            </div>
            <Button onClick={fetchAllData} disabled={refreshing} variant='outline' size='sm'>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Key Metrics Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
            <StatCard
              title="Today's Sales"
              value={performance?.todaySales || 0}
              icon={ShoppingCart}
              subtitle='Transactions processed'
            />
            <StatCard
              title='Total Revenue'
              value={`$${(totalRevenue || 0).toFixed(2)}`}
              icon={DollarSign}
              subtitle='Revenue collected today'
              onClick={() => navigate('/cashier/reports')}
            />
            <StatCard
              title='Pending Payments'
              value={performance?.pendingPayments || 0}
              icon={Clock}
              subtitle='Awaiting processing'
              onClick={() => navigate('/cashier/payments')}
            />
            <StatCard
              title='Returns Today'
              value={performance?.returnsToday || 0}
              icon={RotateCcw}
              subtitle='Returns processed'
              onClick={() => navigate('/cashier/returns')}
            />
          </div>

          {/* Charts Row */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
            {/* Transaction Trend Chart */}
            <Card className='lg:col-span-2 border-slate-200 dark:border-slate-800'>
              <CardHeader>
                <CardTitle className='text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center'>
                  <Activity className='h-5 w-5 mr-2 text-slate-600 dark:text-slate-400' />
                  Transaction Trend
                </CardTitle>
                <CardDescription>Revenue over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-[280px]'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart
                      data={transactionTrendData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id='colorRevenueCashier' x1='0' y1='0' x2='0' y2='1'>
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
                        fill='url(#colorRevenueCashier)'
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Distribution */}
            <Card className='border-slate-200 dark:border-slate-800'>
              <CardHeader>
                <CardTitle className='text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center'>
                  <CreditCard className='h-5 w-5 mr-2 text-slate-600 dark:text-slate-400' />
                  Payment Methods
                </CardTitle>
                <CardDescription>Distribution by method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-[200px]'>
                  {paymentDistribution.length > 0 ? (
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={paymentDistribution}
                          cx='50%'
                          cy='50%'
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey='value'
                        >
                          {paymentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className='h-full flex items-center justify-center text-slate-500'>
                      No payment data
                    </div>
                  )}
                </div>
                {/* Legend */}
                <div className='grid grid-cols-2 gap-2 mt-4'>
                  {paymentDistribution.map((item, index) => (
                    <div key={index} className='flex items-center gap-2'>
                      <div
                        className='w-3 h-3 rounded-full'
                        style={{ backgroundColor: item.color }}
                      />
                      <span className='text-xs text-slate-600 dark:text-slate-400'>
                        {item.name} ({item.count})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Payment Methods Breakdown Bar Chart */}
            <Card className='border-slate-200 dark:border-slate-800'>
              <CardHeader>
                <CardTitle className='text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center'>
                  <TrendingUp className='h-5 w-5 mr-2 text-slate-600 dark:text-slate-400' />
                  Payment Breakdown
                </CardTitle>
                <CardDescription>Revenue by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-[200px]'>
                  {paymentDistribution.length > 0 ? (
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={paymentDistribution}
                        layout='vertical'
                        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          className='stroke-slate-200 dark:stroke-slate-700'
                          horizontal={true}
                          vertical={false}
                        />
                        <XAxis
                          type='number'
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <YAxis dataKey='name' type='category' tick={{ fontSize: 11 }} width={80} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey='value'
                          name='Revenue'
                          fill={CHART_COLORS.secondary}
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className='h-full flex items-center justify-center text-slate-500'>
                      No payment data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pending & Recent Transactions */}
            <Card className='border-slate-200 dark:border-slate-800'>
              <CardHeader>
                <CardTitle className='text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center'>
                  <Clock className='h-5 w-5 mr-2 text-slate-600 dark:text-slate-400' />
                  Pending Payments
                </CardTitle>
                <CardDescription>Payments awaiting processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3 max-h-[220px] overflow-y-auto'>
                  {pendingPayments?.length > 0 ? (
                    pendingPayments.slice(0, 5).map((payment, idx) => {
                      const PaymentIcon = getPaymentMethodIcon(
                        payment.paymentMethod || payment.payment_method
                      );
                      return (
                        <div
                          key={payment.saleId || idx}
                          className='flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg'
                        >
                          <div className='flex items-center gap-3'>
                            <div className='p-2 bg-slate-200 dark:bg-slate-700 rounded-lg'>
                              <PaymentIcon className='h-4 w-4 text-slate-600 dark:text-slate-400' />
                            </div>
                            <div>
                              <p className='text-sm font-medium text-slate-900 dark:text-slate-100'>
                                #{payment.saleId || payment.sale_id}
                              </p>
                              <p className='text-xs text-slate-500'>
                                {payment.customerName ||
                                  payment.customer_name ||
                                  'Walk-in Customer'}
                              </p>
                            </div>
                          </div>
                          <div className='text-right'>
                            <p className='text-sm font-bold text-slate-900 dark:text-slate-100'>
                              $
                              {parseFloat(payment.totalAmount || payment.total_amount || 0).toFixed(
                                2
                              )}
                            </p>
                            <Button
                              size='sm'
                              variant='outline'
                              className='mt-1 h-6 text-xs'
                              onClick={() => navigate('/cashier/payments')}
                            >
                              Process
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className='text-center py-8 text-slate-500'>
                      <Clock className='h-8 w-8 mx-auto mb-2 opacity-50' />
                      <p className='text-sm'>No pending payments</p>
                    </div>
                  )}
                </div>

                {pendingPayments?.length > 5 && (
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full mt-4'
                    onClick={() => navigate('/cashier/payments')}
                  >
                    View All ({pendingPayments.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CashierDashboard;
