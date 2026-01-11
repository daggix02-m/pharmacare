import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DataTable from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AsyncWrapper from '@/components/common/AsyncWrapper';
import DatabaseErrorAlert from '@/components/common/DatabaseErrorAlert';
import { managerService } from '@/services';
import { parseError } from '@/utils/errorHandler';
import {
  ShoppingCart,
  Download,
  Search,
  RefreshCw,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
} from 'lucide-react';

const ManagerSales = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [databaseError, setDatabaseError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: 'all',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchSalesData();
  }, [currentPage, filters.paymentMethod, filters.startDate, filters.endDate]);

  const fetchSalesData = async () => {
    try {
      if (loading) {
        setError(null);
        setDatabaseError(null);
      }
      setRefreshing(true);

      const [salesRes, dashboardRes] = await Promise.all([
        managerService.getSales({
          page: currentPage,
          payment_method: filters.paymentMethod !== 'all' ? filters.paymentMethod : undefined,
          start_date: filters.startDate || undefined,
          end_date: filters.endDate || undefined,
        }),
        managerService.getDashboard(),
      ]);

      if (salesRes.success) {
        setSales(salesRes.data?.sales || salesRes.data || []);
      }

      if (dashboardRes.success) {
        setSummary(dashboardRes.data?.salesSummary);
      }
    } catch (err) {
      // Check for PostgreSQL year() function error
      const isPostgreSQLError = err?.message?.includes('function year') ||
                                err?.message?.includes('42883') ||
                                err?.response?.data?.message?.includes('function year');
      
      if (isPostgreSQLError) {
        setDatabaseError(err);
        console.error('PostgreSQL Error Details:', {
          error: err.message,
          endpoint: '/api/manager/dashboard/sales',
          fix: 'Replace year() with EXTRACT(YEAR FROM ...) or DATE_PART(\'year\', ...)'
        });
      } else {
        const msg = parseError(err);
        toast.error(msg);
        if (loading) setError(msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExport = () => {
    toast.success('Preparing sales export...');
    // Mock export
  };

  const columns = [
    { key: 'sale_id', label: 'ID', render: (v) => <span className='font-mono'>#{v}</span> },
    { key: 'created_at', label: 'Date', render: (v) => new Date(v).toLocaleString() },
    { key: 'customer_name', label: 'Customer', render: (v) => v || 'Walk-in' },
    { key: 'item_count', label: 'Items' },
    {
      key: 'total_amount',
      label: 'Total',
      render: (v) => <span className='font-bold text-slate-900 dark:text-slate-50'>${Number(v).toFixed(2)}</span>,
    },
    {
      key: 'payment_method',
      label: 'Payment',
      render: (v) => <span className='capitalize'>{v}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${v === 'completed' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
        >
          {v?.toUpperCase()}
        </span>
      ),
    },
  ];

  const StatCard = ({ title, value, sub, icon: Icon, color }) => (
    <Card className='border-slate-200 dark:border-slate-800'>
      <CardContent className='pt-6'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>{title}</p>
            <h3 className='text-2xl font-bold mt-1 text-slate-900 dark:text-slate-50'>{value}</h3>
            {sub && <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>{sub}</p>}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className='h-5 w-5 text-slate-600 dark:text-slate-400' />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <Navigation />
      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0 space-y-6'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-50'>Sales History</h1>
              <p className='text-slate-600 dark:text-slate-400'>Review and track branch sales performance</p>
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' onClick={handleExport}>
                <Download className='h-4 w-4 mr-2' />
                Export CSV
              </Button>
              <Button variant='outline' onClick={fetchSalesData} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <StatCard
              title="Today's Revenue"
              value={`$${summary?.today?.revenue?.toFixed(2) || '0.00'}`}
              sub={`${summary?.today?.count || 0} transactions`}
              icon={DollarSign}
              color='bg-slate-100 dark:bg-slate-800'
            />
            <StatCard
              title='Weekly Revenue'
              value={`$${summary?.thisWeek?.revenue?.toFixed(2) || '0.00'}`}
              sub={`${summary?.thisWeek?.count || 0} transactions`}
              icon={TrendingUp}
              color='bg-slate-100 dark:bg-slate-800'
            />
            <StatCard
              title='Monthly Revenue'
              value={`$${summary?.thisMonth?.revenue?.toFixed(2) || '0.00'}`}
              sub={`${summary?.thisMonth?.count || 0} transactions`}
              icon={ShoppingCart}
              color='bg-slate-100 dark:bg-slate-800'
            />
          </div>

          {/* Database Error Alert */}
          {databaseError && (
            <DatabaseErrorAlert
              error={databaseError}
              onRetry={fetchSalesData}
              isRetrying={refreshing}
              showDetails={true}
            />
          )}

          {/* Filters */}
          <Card className='border-slate-200 dark:border-slate-800'>
            <CardContent className='pt-6'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div className='space-y-1'>
                  <Label>Search</Label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
                    <Input
                      placeholder='Sale ID or Customer...'
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className='pl-9'
                    />
                  </div>
                </div>
                <div className='space-y-1'>
                  <Label>Payment Method</Label>
                  <Select
                    value={filters.paymentMethod}
                    onValueChange={(v) => setFilters({ ...filters, paymentMethod: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Methods</SelectItem>
                      <SelectItem value='cash'>Cash</SelectItem>
                      <SelectItem value='card'>Card</SelectItem>
                      <SelectItem value='insurance'>Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-1'>
                  <Label>Start Date</Label>
                  <Input
                    type='date'
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </div>
                <div className='space-y-1'>
                  <Label>End Date</Label>
                  <Input
                    type='date'
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Table */}
          <Card className='border-slate-200 dark:border-slate-800'>
            <CardContent className='pt-6'>
              <AsyncWrapper
                loading={loading}
                error={error}
                onRetry={fetchSalesData}
                isEmpty={sales.length === 0}
              >
                <DataTable
                  columns={columns}
                  data={sales.filter(
                    (s) =>
                      s.customer_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                      s.sale_id?.toString().includes(filters.search)
                  )}
                  pagination
                />
              </AsyncWrapper>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ManagerSales;
