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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import AsyncWrapper from '@/components/common/AsyncWrapper';
import DatabaseErrorAlert from '@/components/common/DatabaseErrorAlert';
import { managerService } from '@/services';
import { parseError } from '@/utils/errorHandler';
import { validateEthiopianPhoneNumber, validatePrice } from '@/utils/validation';
import {
  ShoppingCart,
  Download,
  Search,
  RefreshCw,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  Receipt,
  CreditCard,
  Smartphone,
  Shield,
  Phone,
  FileText,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Printer,
  Plus,
  Minus,
  Trash2,
  Package,
  Send,
} from 'lucide-react';

// Ethiopian payment providers
const ETHIOPIAN_PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: DollarSign },
  { value: 'telebirr', label: 'Telebirr (Ethio Telecom)', icon: Smartphone },
  { value: 'cbe_birr', label: 'CBE Birr', icon: CreditCard },
  { value: 'amole', label: 'Amole (Awash Bank)', icon: Smartphone },
];

const REFUND_REASONS = [
  'Wrong product',
  'Product damaged',
  'Customer changed mind',
  'Overcharged',
  'Duplicate purchase',
  'Expired product',
  'Other',
];

const ManagerSales = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [databaseError, setDatabaseError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [refundPolicy, setRefundPolicy] = useState({ allow_refunds: true, allow_partial_refunds: true });

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: 'all',
    search: '',
    staffId: '',
    transactionType: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundPolicyModalOpen, setRefundPolicyModalOpen] = useState(false);
  const [newSaleModalOpen, setNewSaleModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  // Cart for new sales
  const [cart, setCart] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    payment_method: 'cash',
    mobile_money_provider: 'telebirr',
    phone_number: '',
    amount_paid: '',
    notes: '',
  });
  const [change, setChange] = useState(0);

  // Refund form
  const [refundForm, setRefundForm] = useState({
    refund_type: 'full',
    refund_amount: '',
    refund_reason: '',
    refund_notes: '',
  });
  const [refundPolicyForm, setRefundPolicyForm] = useState({
    allow_refunds: true,
    allow_partial_refunds: true,
    refund_days: 30,
  });

  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  // Client-side transaction logging
  const logTransaction = (transaction) => {
    try {
      const logs = JSON.parse(localStorage.getItem('pharmacare_transactions') || '[]');
      logs.unshift({
        ...transaction,
        logged_at: new Date().toISOString(),
        logged_by: JSON.parse(localStorage.getItem('user') || '{}'),
      });
      localStorage.setItem('pharmacare_transactions', JSON.stringify(logs.slice(0, 1000))); // Keep last 1000 transactions
    } catch (err) {
      console.error('Error logging transaction:', err);
    }
  };

  useEffect(() => {
    fetchSalesData();
    fetchAuditTrail();
    fetchRefundPolicy();
    fetchMedicines();
  }, [currentPage, filters.paymentMethod, filters.startDate, filters.endDate, filters.staffId, filters.transactionType]);

  useEffect(() => {
    if (medicineSearchQuery) {
      const filtered = medicines.filter(
        (med) =>
          med.name?.toLowerCase().includes(medicineSearchQuery.toLowerCase()) ||
          med.generic_name?.toLowerCase().includes(medicineSearchQuery.toLowerCase())
      );
      setFilteredMedicines(filtered);
    } else {
      setFilteredMedicines(medicines);
    }
  }, [medicineSearchQuery, medicines]);

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
      const isPostgreSQLError = err?.message?.includes('function year') ||
                                err?.message?.includes('42883') ||
                                err?.response?.data?.message?.includes('function year');
      
      if (isPostgreSQLError) {
        setDatabaseError(err);
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

  const fetchAuditTrail = async () => {
    try {
      const response = await managerService.getAuditTrail({
        page: 1,
        limit: 50,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        staff_id: filters.staffId || undefined,
        payment_method: filters.paymentMethod !== 'all' ? filters.paymentMethod : undefined,
        transaction_type: filters.transactionType !== 'all' ? filters.transactionType : undefined,
      });

      if (response.success) {
        setAuditTrail(response.data?.transactions || response.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching audit trail:', err);
    }
  };

  const fetchRefundPolicy = async () => {
    try {
      const response = await managerService.getRefundPolicy();
      if (response.success) {
        setRefundPolicy(response.data || { allow_refunds: true, allow_partial_refunds: true });
        setRefundPolicyForm(response.data || { allow_refunds: true, allow_partial_refunds: true, refund_days: 30 });
      }
    } catch (err) {
      console.error('Error fetching refund policy:', err);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await managerService.getMedicines({
        page: 1,
        limit: 100,
      });

      if (response.success) {
        // Only show medicines that are in stock and not expired
        const availableMedicines = (response.data?.medicines || response.medicines || []).filter(
          (med) => {
            const notExpired = !med.expiry_date || new Date(med.expiry_date) > new Date();
            const inStock = med.quantity_in_stock > 0;
            return notExpired && inStock;
          }
        );
        setMedicines(availableMedicines);
        setFilteredMedicines(availableMedicines);
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
    }
  };

  // Cart management functions
  const addToCart = (medicine) => {
    const existingItem = cart.find((item) => item.medicine_id === medicine.medicine_id);

    if (existingItem) {
      if (existingItem.quantity >= medicine.quantity_in_stock) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(
        cart.map((item) =>
          item.medicine_id === medicine.medicine_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          medicine_id: medicine.medicine_id,
          name: medicine.name,
          unit_price: medicine.price || medicine.unit_price,
          quantity: 1,
          maxQuantity: medicine.quantity_in_stock,
        },
      ]);
    }
    toast.success(`${medicine.name} added to cart`);
  };

  const updateCartQuantity = (medicineId, newQuantity) => {
    const item = cart.find((i) => i.medicine_id === medicineId);

    if (newQuantity < 1) {
      removeFromCart(medicineId);
      return;
    }

    if (newQuantity > item.maxQuantity) {
      toast.error('Insufficient stock');
      return;
    }

    setCart(
      cart.map((item) =>
        item.medicine_id === medicineId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (medicineId) => {
    setCart(cart.filter((item) => item.medicine_id !== medicineId));
  };

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => total + item.unit_price * item.quantity, 0);
  };

  const handleNewSale = () => {
    setNewSaleModalOpen(true);
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!customerName) {
      toast.error('Please enter customer name');
      return;
    }
    setNewSaleModalOpen(false);
    setSelectedSale({
      sale_id: null,
      customer_name: customerName,
      customer_phone: customerPhone,
      total_amount: calculateCartTotal(),
      items: cart,
      status: 'pending',
    });
    setPaymentModalOpen(true);
  };

  const resetCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setSaleNotes('');
    setMedicineSearchQuery('');
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(auditTrail, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      toast.success('Audit trail exported successfully');
    } catch (err) {
      toast.error('Failed to export audit trail');
    }
  };

  const handleViewDetails = async (sale) => {
    setSelectedSale(sale);
    setDetailsModalOpen(true);
  };

  const handleProcessPayment = async (sale) => {
    setSelectedSale(sale);
    setPaymentForm({
      payment_method: 'cash',
      mobile_money_provider: 'telebirr',
      phone_number: sale.customer_phone || '',
      amount_paid: sale.total_amount,
      notes: '',
    });
    setChange(0);
    setErrors({});
    setPaymentModalOpen(true);
  };

  const validatePaymentForm = () => {
    const newErrors = {};

    if (paymentForm.payment_method === 'telebirr' || 
        paymentForm.payment_method === 'cbe_birr' || 
        paymentForm.payment_method === 'amole') {
      const phoneValidation = validateEthiopianPhoneNumber(paymentForm.phone_number);
      if (!phoneValidation.valid) newErrors.phone_number = phoneValidation.error;
    }

    if (paymentForm.payment_method === 'cash') {
      const amountPaid = parseFloat(paymentForm.amount_paid);
      const totalAmount = parseFloat(selectedSale.total_amount);
      if (isNaN(amountPaid) || amountPaid < totalAmount) {
        newErrors.amount_paid = 'Insufficient amount paid';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentSubmit = async () => {
    if (!selectedSale || !validatePaymentForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    try {
      setProcessing(true);

      const paymentData = {
        payment_type: paymentForm.payment_method,
        payment_details: {},
        amount_paid: parseFloat(paymentForm.amount_paid) || parseFloat(selectedSale.total_amount),
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

      let response;
      if (selectedSale.sale_id) {
        // Process payment for existing sale
        response = await managerService.processPayment(selectedSale.sale_id, paymentData);
      } else {
        // Create new sale with payment
        const saleData = {
          items: selectedSale.items.map((item) => ({
            medicine_id: item.medicine_id,
            quantity: item.quantity,
          })),
          payment_type: paymentForm.payment_method,
          customer_name: selectedSale.customer_name,
          customer_phone: selectedSale.customer_phone,
        };
        response = await managerService.createSale(saleData);
      }

      if (response.success) {
        // Log transaction locally
        logTransaction({
          type: 'payment',
          sale_id: response.data?.sale_id || selectedSale.sale_id,
          amount: paymentData.amount_paid,
          payment_type: paymentForm.payment_method,
          payment_details: paymentData.payment_details,
          change: change,
        });

        toast.success(selectedSale.sale_id ? 'Payment processed successfully!' : 'Sale created successfully!');
        setPaymentModalOpen(false);
        resetCart();
        fetchSalesData();
        fetchAuditTrail();
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

  const handleRefundClick = async (sale) => {
    if (!refundPolicy.allow_refunds) {
      toast.error('Refunds are not allowed according to current policy');
      return;
    }
    setSelectedSale(sale);
    setRefundForm({
      refund_type: 'full',
      refund_amount: sale.total_amount,
      refund_reason: '',
      refund_notes: '',
    });
    setErrors({});
    setRefundModalOpen(true);
  };

  const validateRefundForm = () => {
    const newErrors = {};

    if (refundForm.refund_type === 'partial') {
      const amountValidation = validatePrice(refundForm.refund_amount);
      if (!amountValidation.valid) {
        newErrors.refund_amount = amountValidation.error;
      } else if (parseFloat(refundForm.refund_amount) > parseFloat(selectedSale.total_amount)) {
        newErrors.refund_amount = 'Refund amount cannot exceed total amount';
      } else if (parseFloat(refundForm.refund_amount) <= 0) {
        newErrors.refund_amount = 'Refund amount must be greater than 0';
      }
    }

    if (!refundForm.refund_reason) {
      newErrors.refund_reason = 'Please select a refund reason';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRefundSubmit = async () => {
    if (!selectedSale || !validateRefundForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    try {
      setProcessing(true);

      const refundData = {
        refund_type: refundForm.refund_type,
        refund_amount: refundForm.refund_type === 'full' 
          ? parseFloat(selectedSale.total_amount) 
          : parseFloat(refundForm.refund_amount),
        refund_reason: refundForm.refund_reason,
        refund_notes: refundForm.refund_notes,
      };

      const response = await managerService.processRefund(selectedSale.sale_id, refundData);

      if (response.success) {
        // Log transaction locally
        logTransaction({
          type: 'refund',
          sale_id: selectedSale.sale_id,
          refund_type: refundData.refund_type,
          refund_amount: refundData.refund_amount,
          refund_reason: refundData.refund_reason,
          refund_notes: refundData.refund_notes,
        });

        toast.success('Refund processed successfully!');
        setRefundModalOpen(false);
        fetchSalesData();
        fetchAuditTrail();
      } else {
        toast.error(response.message || 'Failed to process refund');
      }
    } catch (error) {
      toast.error('An error occurred while processing refund');
      console.error('Error processing refund:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateRefundPolicy = async () => {
    try {
      setProcessing(true);
      const response = await managerService.updateRefundPolicy(refundPolicyForm);

      if (response.success) {
        setRefundPolicy(refundPolicyForm);
        toast.success('Refund policy updated successfully!');
        setRefundPolicyModalOpen(false);
      } else {
        toast.error(response.message || 'Failed to update refund policy');
      }
    } catch (error) {
      toast.error('An error occurred while updating refund policy');
      console.error('Error updating refund policy:', error);
    } finally {
      setProcessing(false);
    }
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
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            v === 'completed' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}
        >
          {v?.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => handleViewDetails(row)}
            title='View Sale Details'
          >
            <Receipt className='h-3 w-3' />
          </Button>
          {row.status === 'pending' && (
            <Button
              size='sm'
              variant='default'
              onClick={() => handleProcessPayment(row)}
              title='Process Payment'
            >
              <DollarSign className='h-3 w-3' />
            </Button>
          )}
          {row.status === 'completed' && refundPolicy.allow_refunds && (
            <Button
              size='sm'
              variant='destructive'
              onClick={() => handleRefundClick(row)}
              title='Process Refund'
            >
              <ArrowLeft className='h-3 w-3' />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const auditTrailColumns = [
    { key: 'transaction_id', label: 'ID', render: (v) => <span className='font-mono'>#{v}</span> },
    { key: 'created_at', label: 'Date', render: (v) => new Date(v).toLocaleString() },
    { key: 'staff_name', label: 'Staff', render: (v, row) => `${v} (${row.staff_role})` },
    { key: 'sale_id', label: 'Sale ID', render: (v) => <span className='font-mono'>#{v}</span> },
    {
      key: 'transaction_type',
      label: 'Type',
      render: (v) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            v === 'payment' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {v?.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (v) => <span className='font-bold text-slate-900 dark:text-slate-50'>${Number(v).toFixed(2)}</span>,
    },
    {
      key: 'payment_method',
      label: 'Payment Method',
      render: (v) => <span className='capitalize'>{v}</span>,
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
              <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-50'>Sales & Transactions</h1>
              <p className='text-slate-600 dark:text-slate-400'>Process payments, handle refunds, and track audit trail</p>
            </div>
            <div className='flex gap-2'>
              <Button
                className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
                onClick={handleNewSale}
              >
                <Plus className='h-4 w-4 mr-2' />
                New Sale
              </Button>
              <Button variant='outline' onClick={() => setRefundPolicyModalOpen(true)}>
                <Shield className='h-4 w-4 mr-2' />
                Refund Policy
              </Button>
              <Button variant='outline' onClick={handleExport}>
                <Download className='h-4 w-4 mr-2' />
                Export Audit Trail
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

          {/* Tabs for Sales and Audit Trail */}
          <div className='border-b border-slate-200 dark:border-slate-800'>
            <div className='flex gap-4'>
              <button
                className={`pb-4 px-2 font-medium border-b-2 ${
                  filters.transactionType === 'all' || filters.transactionType === 'sales'
                    ? 'border-slate-900 dark:border-slate-50 text-slate-900 dark:text-slate-50'
                    : 'border-transparent text-slate-600 dark:text-slate-400'
                }`}
                onClick={() => setFilters({ ...filters, transactionType: 'sales' })}
              >
                Sales
              </button>
              <button
                className={`pb-4 px-2 font-medium border-b-2 ${
                  filters.transactionType === 'audit'
                    ? 'border-slate-900 dark:border-slate-50 text-slate-900 dark:text-slate-50'
                    : 'border-transparent text-slate-600 dark:text-slate-400'
                }`}
                onClick={() => setFilters({ ...filters, transactionType: 'audit' })}
              >
                Audit Trail
              </button>
            </div>
          </div>

          {/* Filters */}
          <Card className='border-slate-200 dark:border-slate-800'>
            <CardContent className='pt-6'>
              <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
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
                      {ETHIOPIAN_PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
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
                <div className='space-y-1'>
                  <Label>Staff ID</Label>
                  <Input
                    placeholder='Enter staff ID...'
                    value={filters.staffId}
                    onChange={(e) => setFilters({ ...filters, staffId: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Table */}
          {filters.transactionType !== 'audit' && (
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
          )}

          {/* Audit Trail Table */}
          {filters.transactionType === 'audit' && (
            <Card className='border-slate-200 dark:border-slate-800'>
              <CardHeader>
                <CardTitle className='flex items-center'>
                  <FileText className='h-5 w-5 mr-2' />
                  Comprehensive Audit Trail
                </CardTitle>
                <CardDescription>
                  All transactions with staff details, timestamps, and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className='pt-6'>
                <DataTable
                  columns={auditTrailColumns}
                  data={auditTrail}
                  pagination
                />
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Sale Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader className='border-b border-slate-200 dark:border-slate-800 pb-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg'>
                <Receipt className='h-5 w-5 text-white' />
              </div>
              <div>
                <DialogTitle className='text-xl'>Sale Details</DialogTitle>
                <DialogDescription>View detailed information about this sale</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedSale && (
            <div className='space-y-6 py-4'>
              {/* Sale Information Card */}
              <Card className='bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'>
                <CardContent className='pt-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <p className='text-sm text-slate-500 dark:text-slate-400 mb-1'>Sale ID</p>
                      <p className='text-lg font-semibold text-slate-900 dark:text-slate-50'>#{selectedSale.sale_id}</p>
                    </div>
                    <div>
                      <p className='text-sm text-slate-500 dark:text-slate-400 mb-1'>Date & Time</p>
                      <p className='text-base font-medium text-slate-900 dark:text-slate-50'>
                        {new Date(selectedSale.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-4 mt-4'>
                    <div>
                      <p className='text-sm text-slate-500 dark:text-slate-400 mb-1'>Customer</p>
                      <p className='text-base font-medium text-slate-900 dark:text-slate-50'>
                        {selectedSale.customer_name || 'Walk-in'}
                      </p>
                    </div>
                    <div>
                      <p className='text-sm text-slate-500 dark:text-slate-400 mb-1'>Items</p>
                      <p className='text-base font-medium text-slate-900 dark:text-slate-50'>
                        {selectedSale.item_count || 0} items
                      </p>
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-4 mt-4'>
                    <div>
                      <p className='text-sm text-slate-500 dark:text-slate-400 mb-1'>Payment Method</p>
                      <p className='text-base font-medium text-slate-900 dark:text-slate-50 capitalize'>
                        {selectedSale.payment_method || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className='text-sm text-slate-500 dark:text-slate-400 mb-1'>Total Amount</p>
                      <p className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
                        ${Number(selectedSale.total_amount || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className='mt-4 pt-4 border-t border-slate-200 dark:border-slate-800'>
                    <p className='text-sm text-slate-500 dark:text-slate-400 mb-1'>Status</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedSale.status === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {selectedSale.status?.toUpperCase()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <DialogFooter className='pt-4 gap-2 sm:gap-0'>
                <Button type='button' variant='outline' onClick={() => setDetailsModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Processing Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>Complete payment for this sale using Ethiopian payment methods</DialogDescription>
          </DialogHeader>

          {selectedSale && (
            <div className='space-y-6'>
              {/* Order Summary */}
              <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-2'>
                <div className='flex justify-between text-sm text-slate-600 dark:text-slate-400'>
                  <span>Order ID:</span>
                  <span>#{selectedSale.sale_id}</span>
                </div>
                <div className='flex justify-between text-sm text-slate-600 dark:text-slate-400'>
                  <span>Customer:</span>
                  <span className='font-medium text-slate-900 dark:text-slate-50'>
                    {selectedSale.customer_name || 'Walk-in'}
                  </span>
                </div>
                {selectedSale.customer_phone && (
                  <div className='flex justify-between text-sm text-slate-600 dark:text-slate-400'>
                    <span>Phone:</span>
                    <span>{selectedSale.customer_phone}</span>
                  </div>
                )}
                <div className='border-t pt-2 mt-2 flex justify-between items-center'>
                  <span className='font-semibold'>Total Amount:</span>
                  <span className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
                    ${parseFloat(selectedSale.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className='space-y-4'>
                <Label>Payment Method</Label>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  {ETHIOPIAN_PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    return (
                      <Button
                        key={method.value}
                        variant={paymentForm.payment_method === method.value ? 'default' : 'outline'}
                        onClick={() => setPaymentForm({ ...paymentForm, payment_method: method.value })}
                        className='flex flex-col items-center py-6 h-auto'
                      >
                        <Icon className='h-6 w-6 mb-2' />
                        <span className='text-sm'>{method.label}</span>
                      </Button>
                    );
                  })}
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

              {(paymentForm.payment_method === 'telebirr' || 
                paymentForm.payment_method === 'cbe_birr' || 
                paymentForm.payment_method === 'amole') && (
                <div className='space-y-4'>
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
                      ${parseFloat(selectedSale.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className='space-y-2'>
                <Label htmlFor='payment_notes'>Notes (Optional)</Label>
                <textarea
                  id='payment_notes'
                  className='w-full min-h-[80px] px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-50 bg-transparent'
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder='Any additional notes...'
                  maxLength={500}
                />
                <p className='text-xs text-slate-500 dark:text-slate-400 text-right'>
                  {paymentForm.notes.length}/500 characters
                </p>
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
              disabled={processing}
              className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
            >
              <CheckCircle className='h-4 w-4 mr-2' />
              {processing ? 'Processing...' : 'Complete Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              {refundPolicy.allow_refunds 
                ? 'Process a refund for this sale'
                : 'Refunds are not allowed according to current policy'}
            </DialogDescription>
          </DialogHeader>

          {selectedSale && refundPolicy.allow_refunds && (
            <div className='space-y-6'>
              {/* Sale Summary */}
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
                <div className='flex justify-between text-sm text-slate-600 dark:text-slate-400'>
                  <span>Original Amount:</span>
                  <span className='font-bold text-slate-900 dark:text-slate-50'>
                    ${parseFloat(selectedSale.total_amount).toFixed(2)}
                  </span>
                </div>
                <div className='flex justify-between text-sm text-slate-600 dark:text-slate-400'>
                  <span>Payment Method:</span>
                  <span className='capitalize'>{selectedSale.payment_method}</span>
                </div>
              </div>

              {/* Refund Type */}
              <div className='space-y-4'>
                <Label>Refund Type</Label>
                <div className='grid grid-cols-2 gap-3'>
                  <Button
                    variant={refundForm.refund_type === 'full' ? 'default' : 'outline'}
                    onClick={() => setRefundForm({ ...refundForm, refund_type: 'full', refund_amount: selectedSale.total_amount })}
                    className='flex flex-col items-center py-6 h-auto'
                  >
                    <XCircle className='h-6 w-6 mb-2' />
                    <span className='text-sm font-medium'>Full Refund</span>
                    <span className='text-xs text-slate-500 dark:text-slate-400 mt-1'>
                      ${parseFloat(selectedSale.total_amount).toFixed(2)}
                    </span>
                  </Button>
                  {refundPolicy.allow_partial_refunds && (
                    <Button
                      variant={refundForm.refund_type === 'partial' ? 'default' : 'outline'}
                      onClick={() => setRefundForm({ ...refundForm, refund_type: 'partial' })}
                      className='flex flex-col items-center py-6 h-auto'
                    >
                      <ArrowLeft className='h-6 w-6 mb-2' />
                      <span className='text-sm font-medium'>Partial Refund</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Partial Refund Amount */}
              {refundForm.refund_type === 'partial' && refundPolicy.allow_partial_refunds && (
                <div className='space-y-2'>
                  <Label htmlFor='refund_amount'>Refund Amount</Label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400'>
                      $
                    </span>
                    <Input
                      id='refund_amount'
                      type='number'
                      step='0.01'
                      className='pl-7'
                      value={refundForm.refund_amount}
                      onChange={(e) => {
                        setRefundForm({ ...refundForm, refund_amount: e.target.value });
                        if (errors.refund_amount) setErrors({ ...errors, refund_amount: '' });
                      }}
                      placeholder='0.00'
                      max={selectedSale.total_amount}
                    />
                  </div>
                  {errors.refund_amount && (
                    <p className='text-sm text-red-500'>{errors.refund_amount}</p>
                  )}
                  <p className='text-xs text-slate-500 dark:text-slate-400'>
                    Maximum refund amount: ${parseFloat(selectedSale.total_amount).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Refund Reason */}
              <div className='space-y-2'>
                <Label htmlFor='refund_reason'>Refund Reason *</Label>
                <Select
                  value={refundForm.refund_reason}
                  onValueChange={(value) => {
                    setRefundForm({ ...refundForm, refund_reason: value });
                    if (errors.refund_reason) setErrors({ ...errors, refund_reason: '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a reason' />
                  </SelectTrigger>
                  <SelectContent>
                    {REFUND_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.refund_reason && (
                  <p className='text-sm text-red-500'>{errors.refund_reason}</p>
                )}
              </div>

              {/* Refund Notes */}
              <div className='space-y-2'>
                <Label htmlFor='refund_notes'>Additional Notes (Optional)</Label>
                <textarea
                  id='refund_notes'
                  className='w-full min-h-[80px] px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-50 bg-transparent'
                  value={refundForm.refund_notes}
                  onChange={(e) => setRefundForm({ ...refundForm, refund_notes: e.target.value })}
                  placeholder='Any additional details about the refund...'
                  maxLength={500}
                />
                <p className='text-xs text-slate-500 dark:text-slate-400 text-right'>
                  {refundForm.refund_notes.length}/500 characters
                </p>
              </div>

              {/* Warning */}
              <div className='bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5' />
                  <div>
                    <p className='font-medium text-yellow-900 dark:text-yellow-200'>
                      Important: Refund Confirmation
                    </p>
                    <p className='text-sm text-yellow-800 dark:text-yellow-300 mt-1'>
                      Processing a refund will reverse the transaction and update inventory. 
                      This action cannot be undone. Please verify all details before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setRefundModalOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            {refundPolicy.allow_refunds && (
              <Button
                onClick={handleRefundSubmit}
                disabled={processing}
                variant='destructive'
              >
                <XCircle className='h-4 w-4 mr-2' />
                {processing ? 'Processing...' : 'Confirm Refund'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Policy Modal */}
      <Dialog open={refundPolicyModalOpen} onOpenChange={setRefundPolicyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Policy Settings</DialogTitle>
            <DialogDescription>
              Configure refund policies for your pharmacy
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6 py-4'>
            {/* Allow Refunds */}
            <div className='flex items-center justify-between'>
              <div>
                <Label className='text-base font-medium'>Allow Refunds</Label>
                <p className='text-sm text-slate-500 dark:text-slate-400'>
                  Enable or disable refunds for all transactions
                </p>
              </div>
              <Button
                variant={refundPolicyForm.allow_refunds ? 'default' : 'outline'}
                onClick={() => setRefundPolicyForm({ ...refundPolicyForm, allow_refunds: !refundPolicyForm.allow_refunds })}
              >
                {refundPolicyForm.allow_refunds ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {/* Allow Partial Refunds */}
            {refundPolicyForm.allow_refunds && (
              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base font-medium'>Allow Partial Refunds</Label>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>
                    Allow customers to receive partial refunds
                  </p>
                </div>
                <Button
                  variant={refundPolicyForm.allow_partial_refunds ? 'default' : 'outline'}
                  onClick={() => setRefundForm({ ...refundPolicyForm, allow_partial_refunds: !refundPolicyForm.allow_partial_refunds })}
                >
                  {refundPolicyForm.allow_partial_refunds ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            )}

            {/* Refund Days */}
            {refundPolicyForm.allow_refunds && (
              <div className='space-y-2'>
                <Label htmlFor='refund_days'>Refund Window (Days)</Label>
                <Input
                  id='refund_days'
                  type='number'
                  min='0'
                  max='365'
                  value={refundPolicyForm.refund_days}
                  onChange={(e) => setRefundPolicyForm({ ...refundPolicyForm, refund_days: parseInt(e.target.value) })}
                  placeholder='30'
                />
                <p className='text-xs text-slate-500 dark:text-slate-400'>
                  Number of days after purchase when refunds are allowed
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setRefundPolicyModalOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRefundPolicy}
              disabled={processing}
            >
              {processing ? 'Saving...' : 'Save Policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Sale Modal */}
      <Dialog open={newSaleModalOpen} onOpenChange={setNewSaleModalOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Create New Sale</DialogTitle>
            <DialogDescription>Select medicines from inventory and create a new sale</DialogDescription>
          </DialogHeader>

          <div className='space-y-6'>
            {/* Medicine Selection */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <Label className='text-base font-medium'>Select Medicines</Label>
                <div className='relative max-w-sm'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4' />
                  <Input
                    placeholder='Search medicines...'
                    value={medicineSearchQuery}
                    onChange={(e) => setMedicineSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto'>
                {filteredMedicines.length === 0 ? (
                  <div className='col-span-full text-center py-8 text-slate-500 dark:text-slate-400'>
                    {medicineSearchQuery ? 'No medicines found' : 'No medicines available'}
                  </div>
                ) : (
                  filteredMedicines.map((medicine) => (
                    <div
                      key={medicine.medicine_id}
                      className='border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer'
                      onClick={() => addToCart(medicine)}
                    >
                      <div className='flex justify-between items-start mb-2'>
                        <div>
                          <h3 className='font-medium text-slate-900 dark:text-slate-50'>{medicine.name}</h3>
                          {medicine.generic_name && (
                            <p className='text-sm text-slate-500 dark:text-slate-400'>{medicine.generic_name}</p>
                          )}
                        </div>
                        <span className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
                          ${Number(medicine.price || medicine.unit_price).toFixed(2)}
                        </span>
                      </div>

                      <div className='flex justify-between items-center text-sm text-slate-600 dark:text-slate-400 mb-3'>
                        <span>Stock: {medicine.quantity_in_stock}</span>
                        {medicine.category && <span>{medicine.category}</span>}
                      </div>

                      <Button
                        size='sm'
                        className='w-full'
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(medicine);
                        }}
                        disabled={medicine.quantity_in_stock === 0}
                      >
                        <Plus className='h-4 w-4 mr-2' />
                        Add to Cart
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart Section */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Cart */}
              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader>
                  <CardTitle className='flex items-center text-lg'>
                    <ShoppingCart className='h-5 w-5 mr-2' />
                    Cart ({cart.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <div className='text-center py-8 text-slate-500 dark:text-slate-400'>
                      <ShoppingCart className='h-12 w-12 mx-auto mb-2 text-slate-300 dark:text-slate-600' />
                      <p>Your cart is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className='space-y-3 mb-4 max-h-[300px] overflow-y-auto'>
                        {cart.map((item) => (
                          <div key={item.medicine_id} className='border rounded-lg p-3 bg-slate-50 dark:bg-slate-900/50'>
                            <div className='flex justify-between items-start mb-2'>
                              <h4 className='font-medium text-sm'>{item.name}</h4>
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() => removeFromCart(item.medicine_id)}
                              >
                                <Trash2 className='h-3 w-3 text-red-500' />
                              </Button>
                            </div>

                            <div className='flex justify-between items-center'>
                              <div className='flex items-center gap-2'>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  className='h-7 w-7 p-0'
                                  onClick={() =>
                                    updateCartQuantity(item.medicine_id, item.quantity - 1)
                                  }
                                >
                                  <Minus className='h-3 w-3' />
                                </Button>
                                <span className='w-8 text-center font-medium'>{item.quantity}</span>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  className='h-7 w-7 p-0'
                                  onClick={() =>
                                    updateCartQuantity(item.medicine_id, item.quantity + 1)
                                  }
                                >
                                  <Plus className='h-3 w-3' />
                                </Button>
                              </div>
                              <span className='font-semibold'>
                                ${(item.unit_price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className='border-t pt-4 space-y-4'>
                        <div className='flex justify-between items-center'>
                          <span className='text-lg font-semibold'>Total:</span>
                          <span className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
                            ${calculateCartTotal().toFixed(2)}
                          </span>
                        </div>

                        <Button
                          className='w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
                          size='lg'
                          onClick={handleCompleteSale}
                        >
                          <Send className='h-5 w-5 mr-2' />
                          Proceed to Payment
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader>
                  <CardTitle className='text-lg'>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='customer_name'>Customer Name *</Label>
                    <Input
                      id='customer_name'
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder='Enter customer name'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='customer_phone'>Customer Phone (Optional)</Label>
                    <Input
                      id='customer_phone'
                      type='tel'
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder='09xxxxxxxx or 07xxxxxxxx'
                    />
                    <p className='text-xs text-slate-500 dark:text-slate-400'>
                      Ethiopian phone number format (10 digits starting with 09 or 07)
                    </p>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='sale_notes'>Notes (Optional)</Label>
                    <textarea
                      id='sale_notes'
                      className='w-full min-h-[100px] px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-50 bg-transparent'
                      value={saleNotes}
                      onChange={(e) => setSaleNotes(e.target.value)}
                      placeholder='Any additional notes...'
                      maxLength={500}
                    />
                    <p className='text-xs text-slate-500 dark:text-slate-400 text-right'>
                      {saleNotes.length}/500 characters
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setNewSaleModalOpen(false);
                resetCart();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || !customerName}
              className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
            >
              <Send className='h-4 w-4 mr-2' />
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerSales;
