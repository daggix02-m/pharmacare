import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cashierService } from '@/services';
import {
  Download,
  CreditCard,
  RotateCcw,
  TrendingUp,
  RefreshCw,
  Calendar,
  DollarSign,
} from 'lucide-react';

const CashierReports = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentStats, setPaymentStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    byMethod: { cash: 0, card: 0, mobile_money: 0, insurance: 0 },
  });
  const [returnStats, setReturnStats] = useState({
    count: 0,
    totalRefunded: 0,
    items: [],
  });
  const [performance, setPerformance] = useState({
    dailySales: 0,
    weeklySales: 0,
    monthlySales: 0,
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      const [paymentsRes, returnsRes, performanceRes] = await Promise.all([
        cashierService.getPaymentReports(),
        cashierService.getReturnReports(),
        cashierService.getPerformanceReport(),
      ]);

      if (paymentsRes.success) {
        setPaymentStats(
          paymentsRes.data || {
            totalSales: 0,
            totalRevenue: 0,
            byMethod: { cash: 0, card: 0, mobile_money: 0, insurance: 0 },
          }
        );
      }

      if (returnsRes.success) {
        setReturnStats(
          returnsRes.data || {
            count: 0,
            totalRefunded: 0,
            items: [],
          }
        );
      }

      if (performanceRes.success) {
        setPerformance(
          performanceRes.data || {
            dailySales: 0,
            weeklySales: 0,
            monthlySales: 0,
          }
        );
      }
    } catch (error) {
      toast.error('Failed to load reports');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExport = (type) => {
    toast.success(`${type} report download started`);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className='h-4 w-4 text-white' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {subtitle && <p className='text-xs text-muted-foreground mt-1'>{subtitle}</p>}
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
          <div className='flex justify-between items-center mb-6'>
            <div>
              <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-50'>Cashier Reports</h1>
              <p className='text-slate-600 dark:text-slate-400'>Overview of sales, payments, and returns</p>
            </div>
            <Button onClick={fetchReports} variant='outline' disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>

          {/* Performance Stats */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <StatCard
              title='Total Revenue'
              value={`$${(paymentStats.totalRevenue || 0).toFixed(2)}`}
              icon={DollarSign}
              color='bg-slate-100 dark:bg-slate-800'
              subtitle='Total sales revenue'
            />
            <StatCard
              title='Daily Sales'
              value={performance.dailySales || 0}
              icon={TrendingUp}
              color='bg-slate-100 dark:bg-slate-800'
              subtitle='Transactions today'
            />
            <StatCard
              title='Returns'
              value={returnStats.count || 0}
              icon={RotateCcw}
              color='bg-slate-100 dark:bg-slate-800'
              subtitle='Total returns processed'
            />
            <StatCard
              title='Refunded Amount'
              value={`$${(returnStats.totalRefunded || 0).toFixed(2)}`}
              icon={CreditCard}
              color='bg-slate-100 dark:bg-slate-800'
              subtitle='Total amount refunded'
            />
          </div>

          <Tabs defaultValue='payments' className='space-y-6'>
            <TabsList>
              <TabsTrigger value='payments'>Payment Analysis</TabsTrigger>
              <TabsTrigger value='returns'>Returns History</TabsTrigger>
            </TabsList>

            <TabsContent value='payments'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods Breakdown</CardTitle>
                    <CardDescription>Distribution of sales by payment method</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {Object.entries(paymentStats.byMethod || {}).map(([method, amount]) => {
                        const total = paymentStats.totalRevenue || 1; // Prevent division by zero
                        const percentage = ((amount / total) * 100).toFixed(1);

                        return (
                          <div key={method} className='space-y-1'>
                            <div className='flex justify-between text-sm'>
                              <span className='capitalize font-medium'>
                                {method.replace('_', ' ')}
                              </span>
                              <span>
                                ${Number(amount).toFixed(2)} ({percentage}%)
                              </span>
                            </div>
                            <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
                              <div
                                className='h-full bg-blue-600 rounded-full'
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className='flex justify-between items-center'>
                      <div>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Latest completed payments</CardDescription>
                      </div>
                      <Button variant='outline' size='sm' onClick={() => handleExport('Payments')}>
                        <Download className='h-4 w-4 mr-2' />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='rounded-md border'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className='text-right'>Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* This would typically come from an API endpoint for recent transactions */}
                          <TableRow>
                            <TableCell colSpan={4} className='text-center py-8 text-slate-500 dark:text-slate-400'>
                              No recent transactions to display
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='returns'>
              <Card>
                <CardHeader>
                  <div className='flex justify-between items-center'>
                    <div>
                      <CardTitle>Returns Report</CardTitle>
                      <CardDescription>Detailed history of processed returns</CardDescription>
                    </div>
                    <Button variant='outline' size='sm' onClick={() => handleExport('Returns')}>
                      <Download className='h-4 w-4 mr-2' />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Sale ID</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className='text-right'>Refund Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(returnStats.items || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className='text-center py-8 text-slate-500 dark:text-slate-400'>
                              No returns found in this period
                            </TableCell>
                          </TableRow>
                        ) : (
                          returnStats.items.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                              <TableCell>#{item.sale_id}</TableCell>
                              <TableCell>{item.medicine_name}</TableCell>
                              <TableCell>{item.reason}</TableCell>
                              <TableCell className='text-right font-medium text-slate-900 dark:text-slate-50'>
                                -${Number(item.refund_amount).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default CashierReports;
