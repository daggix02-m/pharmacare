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
import { validateEthiopianPhoneNumber, validatePrice } from '@/utils/validation';
import {
  RefreshCw,
  Search,
  CheckCircle,
  DollarSign,
  Clock,
  CreditCard,
  Smartphone,
  Shield,
  Phone,
  FileText,
} from 'lucide-react';

const CashierPayments = () => {
  const [loading, setLoading] = useState(true);
  const [pendingHandoffs, setPendingHandoffs] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedHandoff, setSelectedHandoff] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_method: 'cash',
    mobile_money_provider: 'telebirr',
    card_provider: 'cbe',
    phone_number: '',
    amount_paid: '',
    notes: '',
  });
  const [change, setChange] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  // Ethiopian payment providers
  const mobileMoneyProviders = [
    { value: 'telebirr', label: 'Telebirr (Ethio Telecom)', icon: '📡' },
    { value: 'cbe_birr', label: 'CBE Birr', icon: '🏦' },
    { value: 'mpesa', label: 'M-Pesa', icon: '💰' },
    { value: 'amole', label: 'Amole (Awash Bank)', icon: '🏦' },
    { value: 'birrpay', label: 'BirrPay', icon: '💳' },
  ];

  const cardProviders = [
    { value: 'cbe', label: 'CBE (Commercial Bank of Ethiopia)' },
    { value: 'awash', label: 'Awash Bank' },
    { value: 'dashen', label: 'Dashen Bank' },
    { value: 'abyssinia', label: 'Bank of Abyssinia' },
    { value: 'wegagen', label: 'Wegagen Bank' },
    { value: 'nib', label: 'NIB International Bank' },
    { value: 'united', label: 'United Bank' },
    { value: 'bunna', label: 'Bunna International Bank' },
    { value: 'coop', label: 'Cooperative Bank of Oromia' },
    { value: 'berhan', label: 'Berhan International Bank' },
  ];

  useEffect(() => {
    fetchPendingPayments();
    fetchPaymentHistory();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = paymentHistory.filter(
        (payment) =>
          payment.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.sale_id?.toString().includes(searchQuery)
      );
      setFilteredHistory(filtered);
    } else {
      setFilteredHistory(paymentHistory);
    }
  }, [searchQuery, paymentHistory]);

  useEffect(() => {
    if (selectedHandoff && paymentForm.amount_paid) {
      const amountPaid = parseFloat(paymentForm.amount_paid);
      const totalAmount = parseFloat(selectedHandoff.total_amount);
      if (!isNaN(amountPaid)) {
        setChange(Math.max(0, amountPaid - totalAmount));
      } else {
        setChange(0);
      }
    }
  }, [paymentForm.amount_paid, selectedHandoff]);

  const fetchPendingPayments = async () => {
    try {
      setRefreshing(true);
      const response = await cashierService.getNotifications();

      if (response.success) {
        // Handle different response structures
        const data = response.data;
        let handoffs = [];
        if (Array.isArray(data)) {
          handoffs = data;
        } else if (data?.handoffs && Array.isArray(data.handoffs)) {
          handoffs = data.handoffs;
        } else if (data?.pending && Array.isArray(data.pending)) {
          handoffs = data.pending;
        } else if (data?.notifications && Array.isArray(data.notifications)) {
          handoffs = data.notifications;
        }
        setPendingHandoffs(handoffs);
      } else {
        toast.error(response.message || 'Failed to load pending payments');
      }
    } catch (error) {
      toast.error('An error occurred while loading pending payments');
      console.error('Error fetching pending payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await cashierService.getNotifications();

      if (response.success) {
        setPaymentHistory(response.data?.payments || response.payments || []);
        setFilteredHistory(response.data?.payments || response.payments || []);
      } else {
        toast.error(response.message || 'Failed to load payment history');
      }
    } catch (error) {
      toast.error('An error occurred while loading payment history');
      console.error('Error fetching payment history:', error);
    }
  };

  const handleProcessClick = (handoff) => {
    setSelectedHandoff(handoff);
    setPaymentForm({
      payment_method: 'cash',
      mobile_money_provider: 'telebirr',
      card_provider: 'cbe',
      phone_number: handoff.customer_phone || '',
      amount_paid: handoff.total_amount,
      notes: '',
    });
    setChange(0);
    setErrors({});
    setPaymentModalOpen(true);
  };

  const validatePaymentForm = () => {
    const newErrors = {};

    // Validate amount for cash payments
    if (paymentForm.payment_method === 'cash') {
      const amountPaid = parseFloat(paymentForm.amount_paid);
      const totalAmount = parseFloat(selectedHandoff.total_amount);
      if (isNaN(amountPaid) || amountPaid < totalAmount) {
        newErrors.amount_paid = 'Insufficient amount paid';
      }
    }

    // Validate phone number for mobile money payments
    if (['telebirr', 'cbe_birr', 'amole'].includes(paymentForm.payment_method)) {
      const phoneValidation = validateEthiopianPhoneNumber(paymentForm.phone_number);
      if (!phoneValidation.valid) newErrors.phone_number = phoneValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Client-side transaction logging
  const logTransaction = (transaction) => {
    try {
      const logs = JSON.parse(localStorage.getItem('cashier_transactions') || '[]');
      logs.unshift({
        ...transaction,
        logged_at: new Date().toISOString(),
        logged_by: JSON.parse(localStorage.getItem('user') || '{}'),
      });
      localStorage.setItem('cashier_transactions', JSON.stringify(logs.slice(0, 1000))); // Keep last 1000 transactions
    } catch (err) {
      console.error('Error logging transaction:', err);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedHandoff) return;

    if (!validatePaymentForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    try {
      setProcessing(true);

      const paymentData = {
        payment_method: paymentForm.payment_method,
        payment_details: {},
        amount_paid: parseFloat(paymentForm.amount_paid) || parseFloat(selectedHandoff.total_amount),
        change: change,
        notes: paymentForm.notes,
      };

      // Add payment method specific details
      if (['telebirr', 'cbe_birr', 'amole'].includes(paymentForm.payment_method)) {
        paymentData.payment_details = {
          mobile_money_provider: paymentForm.payment_method,
          phone_number: paymentForm.phone_number,
        };
      }

      const response = await cashierService.acceptPayment(selectedHandoff.sale_id, paymentData);

      if (response.success) {
        // Log transaction locally
        logTransaction({
          type: 'payment',
          sale_id: selectedHandoff.sale_id,
          amount: paymentData.amount_paid,
          payment_method: paymentForm.payment_method,
          payment_details: paymentData.payment_details,
          change: change,
        });

        toast.success('Payment completed successfully!');
        setPaymentModalOpen(false);
        fetchPendingPayments();
        fetchPaymentHistory();
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

  const getPriorityColor = (createdAt) => {
    const minutes = (new Date() - new Date(createdAt)) / 60000;
    if (minutes > 10) return 'text-red-600 dark:text-red-400';
    if (minutes > 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getPriorityLabel = (createdAt) => {
    const minutes = (new Date() - new Date(createdAt)) / 60000;
    if (minutes > 10) return 'High';
    if (minutes > 5) return 'Medium';
    return 'Low';
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
        <div className='px-4 py-6 sm:px-0 space-y-6'>
          {/* Pending Handoffs Section */}
          <Card className='border-slate-200 dark:border-slate-800'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-slate-900 dark:text-slate-50 flex items-center'>
                    <Clock className='h-5 w-5 mr-2' />
                    Pending Handoffs
                  </CardTitle>
                  <CardDescription>Orders from pharmacists waiting for payment</CardDescription>
                </div>
                <Button onClick={fetchPendingPayments} variant='outline' disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingHandoffs.length === 0 ? (
                <div className='text-center py-8 text-slate-500 dark:text-slate-400'>
                  <Clock className='h-12 w-12 mx-auto mb-2 text-slate-300 dark:text-slate-600' />
                  <p>No pending handoffs</p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {pendingHandoffs.map((handoff) => (
                    <div
                      key={handoff.handoff_id}
                      className='border rounded-lg p-4 bg-white dark:bg-slate-900/50 hover:shadow-md transition-shadow'
                    >
                      <div className='flex justify-between items-start mb-3'>
                        <div>
                          <h3 className='font-semibold text-slate-900 dark:text-slate-50'>
                            Order #{handoff.sale_id}
                          </h3>
                          <p className='text-sm text-slate-600 dark:text-slate-400'>
                            {handoff.customer_name || 'Walk-in Customer'}
                          </p>
                        </div>
                        <div className={`text-xs font-medium ${getPriorityColor(handoff.created_at)}`}>
                          Priority: {getPriorityLabel(handoff.created_at)}
                        </div>
                      </div>

                      <div className='space-y-2 text-sm mb-4'>
                        <div className='flex justify-between'>
                          <span className='text-slate-600 dark:text-slate-400'>From:</span>
                          <span className='font-medium'>{handoff.pharmacist_name}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-slate-600 dark:text-slate-400'>Items:</span>
                          <span className='font-medium'>{handoff.items_count} items</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-slate-600 dark:text-slate-400'>Total:</span>
                          <span className='font-bold text-slate-900 dark:text-slate-50'>
                            ${parseFloat(handoff.total_amount).toFixed(2)}
                          </span>
                        </div>
                        {handoff.notes && (
                          <div className='bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs text-yellow-800 dark:text-yellow-200'>
                            <span className='font-medium'>Note:</span> {handoff.notes}
                          </div>
                        )}
                      </div>

                      <Button
                        className='w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
                        onClick={() => handleProcessClick(handoff)}
                      >
                        <DollarSign className='h-4 w-4 mr-2' />
                        Process Payment
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History Section */}
          <Card className='border-slate-200 dark:border-slate-800'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-slate-900 dark:text-slate-50 flex items-center'>
                    <FileText className='h-5 w-5 mr-2' />
                    Payment History
                  </CardTitle>
                  <CardDescription>View all completed payments</CardDescription>
                </div>
                <Button onClick={fetchPaymentHistory} variant='outline' disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className='mt-4'>
                <div className='relative max-w-sm'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4' />
                  <Input
                    placeholder='Search by customer or receipt #...'
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
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center py-8 text-slate-500 dark:text-slate-400'>
                          No payment history found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.map((payment) => (
                        <TableRow key={payment.sale_id}>
                          <TableCell className='font-medium'>#{payment.sale_id}</TableCell>
                          <TableCell>{payment.customer_name || 'Walk-in Customer'}</TableCell>
                          <TableCell className='capitalize'>
                            {payment.payment_method === 'mobile_money' && payment.payment_details?.mobile_money_provider
                              ? `${payment.payment_details.mobile_money_provider.replace('_', ' ')}`
                              : payment.payment_method}
                          </TableCell>
                          <TableCell className='font-bold text-slate-900 dark:text-slate-50'>
                            ${parseFloat(payment.total_amount).toFixed(2)}
                          </TableCell>
                          <TableCell>{new Date(payment.created_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <StatusBadge status='completed' />
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
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>

          {selectedHandoff && (
            <div className='space-y-6'>
              {/* Order Summary */}
              <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-2'>
                <div className='flex justify-between text-sm text-slate-600 dark:text-slate-400'>
                  <span>Order ID:</span>
                  <span>#{selectedHandoff.sale_id}</span>
                </div>
                <div className='flex justify-between text-sm text-slate-600 dark:text-slate-400'>
                  <span>Customer:</span>
                  <span className='font-medium text-slate-900 dark:text-slate-50'>
                    {selectedHandoff.customer_name || 'Walk-in'}
                  </span>
                </div>
                {selectedHandoff.customer_phone && (
                  <div className='flex justify-between text-sm text-slate-600 dark:text-slate-400'>
                    <span>Phone:</span>
                    <span>{selectedHandoff.customer_phone}</span>
                  </div>
                )}
                {selectedHandoff.notes && (
                  <div className='flex justify-between text-sm text-slate-600 dark:text-slate-400'>
                    <span>Notes:</span>
                    <span>{selectedHandoff.notes}</span>
                  </div>
                )}
                <div className='border-t pt-2 mt-2 flex justify-between items-center'>
                  <span className='font-semibold'>Total Amount:</span>
                  <span className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
                    ${parseFloat(selectedHandoff.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className='space-y-4'>
                <Label>Payment Method</Label>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  <Button
                    variant={paymentForm.payment_method === 'cash' ? 'default' : 'outline'}
                    onClick={() =>
                      setPaymentForm({ ...paymentForm, payment_method: 'cash' })
                    }
                    className='flex flex-col items-center py-6 h-auto'
                  >
                    <DollarSign className='h-6 w-6 mb-2' />
                    <span className='text-sm'>Cash</span>
                  </Button>
                  <Button
                    variant={paymentForm.payment_method === 'card' ? 'default' : 'outline'}
                    onClick={() =>
                      setPaymentForm({ ...paymentForm, payment_method: 'card' })
                    }
                    className='flex flex-col items-center py-6 h-auto'
                  >
                    <CreditCard className='h-6 w-6 mb-2' />
                    <span className='text-sm'>Card</span>
                  </Button>
                  <Button
                    variant={paymentForm.payment_method === 'mobile_money' ? 'default' : 'outline'}
                    onClick={() =>
                      setPaymentForm({ ...paymentForm, payment_method: 'mobile_money' })
                    }
                    className='flex flex-col items-center py-6 h-auto'
                  >
                    <Smartphone className='h-6 w-6 mb-2' />
                    <span className='text-sm'>Mobile Money</span>
                  </Button>
                  <Button
                    variant={paymentForm.payment_method === 'insurance' ? 'default' : 'outline'}
                    onClick={() =>
                      setPaymentForm({ ...paymentForm, payment_method: 'insurance' })
                    }
                    className='flex flex-col items-center py-6 h-auto'
                  >
                    <Shield className='h-6 w-6 mb-2' />
                    <span className='text-sm'>Insurance</span>
                  </Button>
                </div>
              </div>

              {/* Payment Method Specific Fields */}
              {paymentForm.payment_method === 'cash' && (
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='amount_paid'>Amount Tendered</Label>
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
                        onChange={(e) => {
                          setPaymentForm({ ...paymentForm, amount_paid: e.target.value });
                          if (errors.amount_paid) setErrors({ ...errors, amount_paid: '' });
                        }}
                        placeholder='0.00'
                      />
                    </div>
                    {errors.amount_paid && (
                      <p className='text-sm text-red-500'>{errors.amount_paid}</p>
                    )}
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className='flex gap-2 flex-wrap'>
                    {[50, 100, 200, 500].map((amount) => (
                      <Button
                        key={amount}
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setPaymentForm({ ...paymentForm, amount_paid: amount.toString() })
                        }
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>

                  <div className='bg-slate-50 dark:bg-slate-800 p-3 rounded-md flex justify-between items-center'>
                    <span className='font-medium text-slate-900 dark:text-slate-50'>Change Due:</span>
                    <span className='text-xl font-bold text-slate-900 dark:text-slate-50'>
                      ${change.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {paymentForm.payment_method === 'card' && (
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='card_provider'>Card Provider</Label>
                    <Select
                      value={paymentForm.card_provider}
                      onValueChange={(value) =>
                        setPaymentForm({ ...paymentForm, card_provider: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cardProviders.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='bg-slate-50 dark:bg-slate-800 p-3 rounded-md flex justify-between items-center'>
                    <span className='font-medium text-slate-900 dark:text-slate-50'>Amount:</span>
                    <span className='text-xl font-bold text-slate-900 dark:text-slate-50'>
                      ${parseFloat(selectedHandoff.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {paymentForm.payment_method === 'mobile_money' && (
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='mobile_money_provider'>Mobile Money Provider</Label>
                    <Select
                      value={paymentForm.mobile_money_provider}
                      onValueChange={(value) =>
                        setPaymentForm({ ...paymentForm, mobile_money_provider: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mobileMoneyProviders.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            <span className='mr-2'>{provider.icon}</span>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='phone_number'>Phone Number</Label>
                    <div className='relative'>
                      <Phone className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4' />
                      <Input
                        id='phone_number'
                        type='tel'
                        className='pl-10'
                        value={paymentForm.phone_number}
                        onChange={(e) => {
                          setPaymentForm({ ...paymentForm, phone_number: e.target.value });
                          if (errors.phone_number) setErrors({ ...errors, phone_number: '' });
                        }}
                        placeholder='09xxxxxxxx or 07xxxxxxxx'
                      />
                    </div>
                    {errors.phone_number && (
                      <p className='text-sm text-red-500'>{errors.phone_number}</p>
                    )}
                    <p className='text-xs text-slate-500 dark:text-slate-400'>
                      Ethiopian phone number format (10 digits starting with 09 or 07)
                    </p>
                  </div>

                  <div className='bg-slate-50 dark:bg-slate-800 p-3 rounded-md flex justify-between items-center'>
                    <span className='font-medium text-slate-900 dark:text-slate-50'>Amount:</span>
                    <span className='text-xl font-bold text-slate-900 dark:text-slate-50'>
                      ${parseFloat(selectedHandoff.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {paymentForm.payment_method === 'insurance' && (
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='insurance_company'>Insurance Company</Label>
                    <Input
                      id='insurance_company'
                      placeholder='Enter insurance company name'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='policy_number'>Policy Number</Label>
                    <Input
                      id='policy_number'
                      placeholder='Enter policy number'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='approval_code'>Approval Code (if required)</Label>
                    <Input id='approval_code' placeholder='Enter approval code' />
                  </div>
                  <div className='bg-slate-50 dark:bg-slate-800 p-3 rounded-md flex justify-between items-center'>
                    <span className='font-medium text-slate-900 dark:text-slate-50'>Amount:</span>
                    <span className='text-xl font-bold text-slate-900 dark:text-slate-50'>
                      ${parseFloat(selectedHandoff.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
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
              disabled={processing}
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
