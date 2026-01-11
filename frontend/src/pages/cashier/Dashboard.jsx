import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/common/StatusBadge';
import { cashierService } from '@/services';
import {
  ShoppingCart,
  DollarSign,
  Clock,
  RotateCcw,
  CreditCard,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  FileText,
  Receipt,
  CheckCircle,
  History,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

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

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      const response = await cashierService.getDashboard();

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

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return DollarSign;
      case 'card':
        return CreditCard;
      case 'mobile_money':
        return Smartphone;
      case 'insurance':
        return ShieldCheck;
      default:
        return CreditCard;
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'cash':
        return 'bg-green-600';
      case 'card':
        return 'bg-blue-600';
      case 'mobile_money':
        return 'bg-purple-600';
      case 'insurance':
        return 'bg-orange-600';
      default:
        return 'bg-slate-600';
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  const { performance, paymentMethods, pendingPayments, recentTransactions } = dashboardData;
  const totalRevenue = performance?.totalRevenue || 0;

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <Navigation />

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-50'>Cashier Dashboard</h1>
              <p className='mt-1 text-sm text-slate-600 dark:text-slate-400'>
                Welcome back! Here's an overview of your daily performance.
              </p>
            </div>
            <Button onClick={fetchDashboard} disabled={refreshing} variant='outline'>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Performance Stats */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <StatCard
              title="Today's Sales"
              value={performance?.todaySales || 0}
              icon={ShoppingCart}
              color='bg-slate-100 dark:bg-slate-800'
              description='Transactions today'
              onClick={() => navigate('/cashier/reports')}
            />
            <StatCard
              title='Total Revenue'
              value={`$${(performance?.totalRevenue || 0).toFixed(2)}`}
              icon={DollarSign}
              color='bg-slate-100 dark:bg-slate-800'
              description='Revenue collected today'
              onClick={() => navigate('/cashier/reports')}
            />
            <StatCard
              title='Pending Payments'
              value={performance?.pendingPayments || 0}
              icon={Clock}
              color='bg-slate-100 dark:bg-slate-800'
              description='Awaiting processing'
              onClick={() => navigate('/cashier/payments')}
            />
            <StatCard
              title='Returns Today'
              value={performance?.returnsToday || 0}
              icon={RotateCcw}
              color='bg-slate-100 dark:bg-slate-800'
              description='Returns processed'
              onClick={() => navigate('/cashier/returns')}
            />
          </div>

          {/* Payment Methods Breakdown */}
          <div className='mb-8'>
            <h2 className='text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4'>Payment Methods</h2>
            <Card className='border-slate-200 dark:border-slate-800'>
              <CardHeader>
                <CardTitle className='text-slate-900 dark:text-slate-50'>Payment Distribution</CardTitle>
                <CardDescription>Breakdown of payments by method today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {Object.entries(paymentMethods || {}).map(([method, data]) => {
                    const percentage = totalRevenue > 0 ? ((data.amount / totalRevenue) * 100).toFixed(1) : 0;
                    const MethodIcon = getPaymentMethodIcon(method);
                    const barColor = getPaymentMethodColor(method);

                    return (
                      <div key={method} className='space-y-2'>
                        <div className='flex justify-between text-sm'>
                          <div className='flex items-center gap-2'>
                            <MethodIcon className='h-4 w-4 text-slate-600 dark:text-slate-400' />
                            <span className='capitalize font-medium text-slate-900 dark:text-slate-50'>
                              {method.replace('_', ' ')}
                            </span>
                          </div>
                          <span className='text-slate-600 dark:text-slate-400'>
                            ${data.amount?.toFixed(2) || '0.00'} ({percentage}%)
                          </span>
                        </div>
                        <div className='h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden'>
                          <div
                            className={`h-full ${barColor} rounded-full transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className='flex justify-between text-xs text-slate-500 dark:text-slate-500'>
                          <span>{data.count || 0} transactions</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Payments Queue */}
          {(pendingPayments?.length || 0) > 0 && (
            <Card className='mb-8 border-slate-200 dark:border-slate-800'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-slate-900 dark:text-slate-50'>Pending Payments</CardTitle>
                  <Button
                    variant='link'
                    className='p-0 h-auto text-sm'
                    onClick={() => navigate('/cashier/payments')}
                  >
                    View all ({pendingPayments.length}) →
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {pendingPayments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.saleId}
                      className='flex items-center justify-between text-sm p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors'
                    >
                      <div className='flex-1'>
                        <p className='font-medium text-slate-900 dark:text-slate-50'>
                          #{payment.saleId} - {payment.customerName || 'Walk-in Customer'}
                        </p>
                        <p className='text-xs text-slate-600 dark:text-slate-400'>
                          {new Date(payment.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-right'>
                          <p className='font-bold text-slate-900 dark:text-slate-50'>
                            ${parseFloat(payment.totalAmount).toFixed(2)}
                          </p>
                          <p className='text-xs text-slate-600 dark:text-slate-400 capitalize'>
                            {payment.paymentMethod}
                          </p>
                        </div>
                        <Button
                          size='sm'
                          onClick={() => navigate('/cashier/payments')}
                          className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
                        >
                          Process
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Transactions */}
          <Card className='mb-8 border-slate-200 dark:border-slate-800'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-slate-900 dark:text-slate-50'>Recent Transactions</CardTitle>
                <Button
                  variant='link'
                  className='p-0 h-auto text-sm'
                  onClick={() => navigate('/cashier/receipts')}
                >
                  View all →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentTransactions?.length === 0 ? (
                <div className='text-center py-8 text-slate-500 dark:text-slate-400'>
                  <History className='h-12 w-12 mx-auto mb-3 text-slate-400 dark:text-slate-600' />
                  <p className='text-sm'>No recent transactions to display</p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.saleId}
                      className='flex items-center justify-between text-sm p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors'
                    >
                      <div className='flex-1'>
                        <p className='font-medium text-slate-900 dark:text-slate-50'>
                          #{transaction.saleId} - {transaction.customerName || 'Walk-in Customer'}
                        </p>
                        <p className='text-xs text-slate-600 dark:text-slate-400'>
                          {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-right'>
                          <p className='font-bold text-slate-900 dark:text-slate-50'>
                            ${parseFloat(transaction.amount).toFixed(2)}
                          </p>
                          <p className='text-xs text-slate-600 dark:text-slate-400 capitalize'>
                            {transaction.paymentMethod}
                          </p>
                        </div>
                        <StatusBadge status={transaction.status || 'completed'} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className='border-slate-200 dark:border-slate-800'>
            <CardHeader>
              <CardTitle className='text-slate-900 dark:text-slate-50'>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <Button
                  variant='outline'
                  className='h-auto py-4 flex-col items-start'
                  onClick={() => navigate('/cashier/payments')}
                >
                  <div className='flex items-center w-full'>
                    <Clock className='h-5 w-5 mr-2' />
                    <span className='font-semibold'>Process Payments</span>
                    <ArrowRight className='h-4 w-4 ml-auto' />
                  </div>
                  <p className='text-xs text-muted-foreground mt-2'>Process pending payments</p>
                </Button>

                <Button
                  variant='outline'
                  className='h-auto py-4 flex-col items-start'
                  onClick={() => navigate('/cashier/receipts')}
                >
                  <div className='flex items-center w-full'>
                    <Receipt className='h-5 w-5 mr-2' />
                    <span className='font-semibold'>View Receipts</span>
                    <ArrowRight className='h-4 w-4 ml-auto' />
                  </div>
                  <p className='text-xs text-muted-foreground mt-2'>View transaction receipts</p>
                </Button>

                <Button
                  variant='outline'
                  className='h-auto py-4 flex-col items-start'
                  onClick={() => navigate('/cashier/returns')}
                >
                  <div className='flex items-center w-full'>
                    <RotateCcw className='h-5 w-5 mr-2' />
                    <span className='font-semibold'>Process Returns</span>
                    <ArrowRight className='h-4 w-4 ml-auto' />
                  </div>
                  <p className='text-xs text-muted-foreground mt-2'>Handle product returns</p>
                </Button>

                <Button
                  variant='outline'
                  className='h-auto py-4 flex-col items-start'
                  onClick={() => navigate('/cashier/reports')}
                >
                  <div className='flex items-center w-full'>
                    <FileText className='h-5 w-5 mr-2' />
                    <span className='font-semibold'>View Reports</span>
                    <ArrowRight className='h-4 w-4 ml-auto' />
                  </div>
                  <p className='text-xs text-muted-foreground mt-2'>View performance reports</p>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CashierDashboard;
