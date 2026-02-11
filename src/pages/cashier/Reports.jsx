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
  CreditCard,
  RotateCcw,
  TrendingUp,
  RefreshCw,
  DollarSign,
} from 'lucide-react';

const CashierReports = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [soldMedicines, setSoldMedicines] = useState([]);
  const [returnStats, setReturnStats] = useState({
    count: 0,
    totalRefunded: 0,
    items: [],
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      const [soldMedicinesRes, returnsRes] = await Promise.all([
        cashierService.getSoldMedicinesReport(),
        cashierService.getReturnReports(),
      ]);

      if (soldMedicinesRes.success) {
        setSoldMedicines(soldMedicinesRes.data?.medicines || soldMedicinesRes.data || []);
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
    } catch (error) {
      toast.error('Failed to load reports');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

          {/* Stats */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
            <StatCard
              title='Medicines Sold'
              value={soldMedicines.length || 0}
              icon={TrendingUp}
              color='bg-slate-100 dark:bg-slate-800'
              subtitle='Total medicines sold'
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

          <Tabs defaultValue='sold-medicines' className='space-y-6'>
            <TabsList>
              <TabsTrigger value='sold-medicines'>Sold Medicines</TabsTrigger>
              <TabsTrigger value='returns'>Returns History</TabsTrigger>
            </TabsList>

            <TabsContent value='sold-medicines'>
              <Card>
                <CardHeader>
                  <CardTitle>Sold Medicines Report</CardTitle>
                  <CardDescription>List of all medicines sold</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead className='text-right'>Quantity</TableHead>
                          <TableHead className='text-right'>Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {soldMedicines.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className='text-center py-8 text-slate-500 dark:text-slate-400'>
                              No sold medicines data available
                            </TableCell>
                          </TableRow>
                        ) : (
                          soldMedicines.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.medicine_name || item.name}</TableCell>
                              <TableCell className='text-right'>{item.quantity || item.sold_quantity}</TableCell>
                              <TableCell className='text-right font-medium'>
                                ${Number(item.revenue || item.total_amount || 0).toFixed(2)}
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

            <TabsContent value='returns'>
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Returns Report</CardTitle>
                    <CardDescription>Detailed history of processed returns</CardDescription>
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
