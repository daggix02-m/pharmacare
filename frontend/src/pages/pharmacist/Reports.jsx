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
import StatusBadge from '@/components/common/StatusBadge';
import { pharmacistService } from '@/services';
import { Download, AlertTriangle, Clock, Package, TrendingDown, RefreshCw } from 'lucide-react';

const PharmacistReports = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    totalMedicines: 0,
    lowStockCount: 0,
    expiringCount: 0,
    totalValue: 0,
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      const [summaryRes, lowStockRes, expiryRes] = await Promise.all([
        pharmacistService.getInventorySummary(),
        pharmacistService.getLowStockReport(),
        pharmacistService.getExpiryReport(90), // 90 days expiry window
      ]);

      if (summaryRes.success) {
        setSummary(summaryRes.data || {});
      }

      if (lowStockRes.success) {
        setLowStockItems(lowStockRes.data || []);
      }

      if (expiryRes.success) {
        setExpiringItems(expiryRes.data || []);
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
    // Mock export functionality
    toast.success(`${type} report download started`);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-slate-900 dark:text-slate-50'>{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className='h-4 w-4 text-slate-600 dark:text-slate-400' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold text-slate-900 dark:text-slate-50'>{value}</div>
        {subtitle && <p className='text-xs text-slate-600 dark:text-slate-400 mt-1'>{subtitle}</p>}
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
              <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-50'>Inventory Reports</h1>
              <p className='text-slate-600 dark:text-slate-400'>Overview of inventory status and alerts</p>
            </div>
            <Button onClick={fetchReports} variant='outline' disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>

          {/* Summary Stats */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <StatCard
              title='Total Items'
              value={summary.totalMedicines || 0}
              icon={Package}
              color='bg-slate-100 dark:bg-slate-800'
              subtitle='Unique medicines in stock'
            />
            <StatCard
              title='Low Stock'
              value={summary.lowStockCount || lowStockItems.length}
              icon={TrendingDown}
              color='bg-slate-100 dark:bg-slate-800'
              subtitle='Items below minimum level'
            />
            <StatCard
              title='Expiring Soon'
              value={summary.expiringCount || expiringItems.length}
              icon={Clock}
              color='bg-slate-100 dark:bg-slate-800'
              subtitle='Within next 90 days'
            />
            <StatCard
              title='Inventory Value'
              value={`$${(summary.totalValue || 0).toLocaleString()}`}
              icon={AlertTriangle}
              color='bg-slate-100 dark:bg-slate-800'
              subtitle='Total estimated value'
            />
          </div>

          {/* Report Tabs */}
          <Tabs defaultValue='low-stock' className='space-y-6'>
            <TabsList>
              <TabsTrigger value='low-stock' className='data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900'>Low Stock Alerts</TabsTrigger>
              <TabsTrigger value='expiry' className='data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900'>Expiry Report</TabsTrigger>
            </TabsList>

            <TabsContent value='low-stock'>
              <Card>
                <CardHeader>
                  <div className='flex justify-between items-center'>
                    <div>
                      <CardTitle>Low Stock Medicines</CardTitle>
                      <CardDescription>
                        Medicines that have reached or dropped below their minimum stock level
                      </CardDescription>
                    </div>
                    <Button variant='outline' size='sm' onClick={() => handleExport('Low Stock')}>
                      <Download className='h-4 w-4 mr-2' />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Current Stock</TableHead>
                          <TableHead>Min Level</TableHead>
                          <TableHead>Deficit</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStockItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className='text-center py-8 text-slate-500 dark:text-slate-400'>
                              No low stock items found. Great job!
                            </TableCell>
                          </TableRow>
                        ) : (
                          lowStockItems.map((item) => (
                            <TableRow key={item.medicine_id}>
                              <TableCell className='font-medium'>{item.name}</TableCell>
                              <TableCell>{item.category || '-'}</TableCell>
                              <TableCell className='font-bold text-slate-900 dark:text-slate-50'>
                                {item.quantity}
                              </TableCell>
                              <TableCell>{item.min_stock_level || 10}</TableCell>
                              <TableCell className='text-slate-900 dark:text-slate-50'>
                                {Math.max(0, (item.min_stock_level || 10) - item.quantity)}
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  status={item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                                  type={item.quantity === 0 ? 'error' : 'warning'}
                                />
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

            <TabsContent value='expiry'>
              <Card>
                <CardHeader>
                  <div className='flex justify-between items-center'>
                    <div>
                      <CardTitle>Expiry Report</CardTitle>
                      <CardDescription>Medicines expiring within the next 90 days</CardDescription>
                    </div>
                    <Button variant='outline' size='sm' onClick={() => handleExport('Expiry')}>
                      <Download className='h-4 w-4 mr-2' />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine Name</TableHead>
                          <TableHead>Batch Number</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead>Days Remaining</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expiringItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className='text-center py-8 text-slate-500 dark:text-slate-400'>
                              No expiring items found within 90 days.
                            </TableCell>
                          </TableRow>
                        ) : (
                          expiringItems.map((item) => {
                            const expiryDate = new Date(item.expiry_date);
                            const today = new Date();
                            const daysRemaining = Math.ceil(
                              (expiryDate - today) / (1000 * 60 * 60 * 24)
                            );
                            const isExpired = daysRemaining < 0;

                            return (
                              <TableRow key={`${item.medicine_id}-${item.batch_number}`}>
                                <TableCell className='font-medium'>{item.name}</TableCell>
                                <TableCell>{item.batch_number || '-'}</TableCell>
                                <TableCell>{expiryDate.toLocaleDateString()}</TableCell>
                                <TableCell
                                  className={`font-medium ${
                                    isExpired ? 'text-slate-900 dark:text-slate-50' : 'text-slate-900 dark:text-slate-50'
                                  }`}
                                >
                                  {isExpired ? 'Expired' : `${daysRemaining} days`}
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                  <StatusBadge
                                    status={isExpired ? 'Expired' : 'Expiring Soon'}
                                    type={isExpired ? 'error' : 'warning'}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })
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

export default PharmacistReports;
