import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import StatusBadge from '@/components/common/StatusBadge';
import { cashierService } from '@/services';
import { validatePaymentMethod, validatePrice } from '@/utils/validation';
import { CreditCard, DollarSign, RefreshCw, Search, ArrowRight, CheckCircle } from 'lucide-react';

const CashierPayments = () => {
  const [loading, setLoading] = useState(true);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_method: 'cash',
    amount_paid: '',
  });
  const [change, setChange] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = pendingPayments.filter(
        (sale) =>
          sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sale.sale_id?.toString().includes(searchQuery)
      );
      setFilteredPayments(filtered);
    } else {
      setFilteredPayments(pendingPayments);
    }
  }, [searchQuery, pendingPayments]);

  useEffect(() => {
    if (selectedSale && paymentForm.amount_paid) {
      const amountPaid = parseFloat(paymentForm.amount_paid);
      const totalAmount = parseFloat(selectedSale.total_amount);
      if (!isNaN(amountPaid)) {
        setChange(Math.max(0, amountPaid - totalAmount));
      } else {
        setChange(0);
      }
    }
  }, [paymentForm.amount_paid, selectedSale]);

  const fetchPayments = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      const response = await cashierService.getPendingPayments();

      if (response.success) {
        setPendingPayments(response.data || []);
        setFilteredPayments(response.data || []);
      } else {
        toast.error(response.message || 'Failed to load pending payments');
      }
    } catch (error) {
      toast.error('An error occurred while loading payments');
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleProcessClick = (sale) => {
    setSelectedSale(sale);
    setPaymentForm({
      payment_method: sale.payment_method || 'cash',
      amount_paid: '',
    });
    setChange(0);
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedSale) return;

    if (paymentForm.payment_method === 'cash') {
      const amountPaid = parseFloat(paymentForm.amount_paid);
      const totalAmount = parseFloat(selectedSale.total_amount);

      if (isNaN(amountPaid) || amountPaid < totalAmount) {
        toast.error('Insufficient amount paid');
        return;
      }
    }

    try {
      setProcessing(true);
      const response = await cashierService.acceptPayment(selectedSale.sale_id, {
        payment_method: paymentForm.payment_method,
        amount_paid: parseFloat(paymentForm.amount_paid) || parseFloat(selectedSale.total_amount),
        change: change,
      });

      if (response.success) {
        toast.success('Payment processed successfully');
        setPaymentModalOpen(false);
        fetchPayments();
      } else {
        toast.error(response.message || 'Failed to process payment');
      }
    } catch (error) {
      toast.error('An error occurred while processing payment');
      console.error('Error processing payment:', error);
    } finally {
      setProcessing(false);
    }
  };

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
          <Card className='border-slate-200 dark:border-slate-800'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-slate-900 dark:text-slate-50'>Pending Payments</CardTitle>
                  <CardDescription>Process payments for completed sales</CardDescription>
                </div>
                <Button onClick={fetchPayments} variant='outline' disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className='mt-4'>
                <div className='relative max-w-sm'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4' />
                  <Input
                    placeholder='Search by customer or sale ID...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sale ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className='text-center py-8 text-slate-500 dark:text-slate-400'>
                          No pending payments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((sale) => (
                        <TableRow key={sale.sale_id}>
                          <TableCell className='font-medium'>#{sale.sale_id}</TableCell>
                          <TableCell>{sale.customer_name || 'Walk-in Customer'}</TableCell>
                          <TableCell>{sale.item_count || 0} items</TableCell>
                          <TableCell className='font-bold text-slate-900 dark:text-slate-50'>
                            ${parseFloat(sale.total_amount).toFixed(2)}
                          </TableCell>
                          <TableCell className='capitalize'>{sale.payment_method}</TableCell>
                          <TableCell>{new Date(sale.created_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <Button
                              size='sm'
                              onClick={() => handleProcessClick(sale)}
                              className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
                            >
                              <DollarSign className='h-3 w-3 mr-1' />
                              Process
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Payment Processing Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className='space-y-6'>
              <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-2'>
                <div className='flex justify-between text-sm text-slate-600 dark:text-slate-400'>
                  <span>Sale ID:</span>
                  <span>#{selectedSale.sale_id}</span>
                </div>
                <div className='flex justify-between text-sm text-slate-600 dark:text-slate-400'>
                  <span>Customer:</span>
                  <span className='font-medium text-slate-900 dark:text-slate-50'>
                    {selectedSale.customer_name || 'Walk-in'}
                  </span>
                </div>
                <div className='border-t pt-2 mt-2 flex justify-between items-center'>
                  <span className='font-semibold'>Total Amount:</span>
                  <span className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
                    ${parseFloat(selectedSale.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='payment_method'>Payment Method</Label>
                  <Select
                    value={paymentForm.payment_method}
                    onValueChange={(value) =>
                      setPaymentForm({ ...paymentForm, payment_method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='cash'>Cash</SelectItem>
                      <SelectItem value='card'>Card</SelectItem>
                      <SelectItem value='mobile_money'>Mobile Money</SelectItem>
                      <SelectItem value='insurance'>Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='amount_paid'>
                    {paymentForm.payment_method === 'cash' ? 'Amount Tendered' : 'Amount Paid'}
                  </Label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400'>
                      $
                    </span>
                    <Input
                      id='amount_paid'
                      type='number'
                      step='0.01'
                      className='pl-7'
                      value={paymentForm.amount_paid}
                      onChange={(e) =>
                        setPaymentForm({ ...paymentForm, amount_paid: e.target.value })
                      }
                      placeholder='0.00'
                    />
                  </div>
                </div>

                {paymentForm.payment_method === 'cash' && (
                  <div className='bg-slate-50 dark:bg-slate-800 p-3 rounded-md flex justify-between items-center'>
                    <span className='font-medium text-slate-900 dark:text-slate-50'>Change Due:</span>
                    <span className='text-xl font-bold text-slate-900 dark:text-slate-50'>${change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setPaymentModalOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={
                processing ||
                !paymentForm.amount_paid ||
                (paymentForm.payment_method === 'cash' && change < 0)
              }
              className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
            >
              <CheckCircle className='h-4 w-4 mr-2' />
              {processing ? 'Processing...' : 'Complete Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashierPayments;
