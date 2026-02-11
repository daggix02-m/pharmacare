import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { pharmacistService } from '@/services';
import { validateCustomerName, validateEthiopianPhoneNumber, validatePrice } from '@/utils/validation';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Send,
  DollarSign,
  CreditCard,
  Smartphone,
  CheckCircle,
} from 'lucide-react';

// Ethiopian payment providers
const ETHIOPIAN_PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: DollarSign },
  { value: 'telebirr', label: 'Telebirr (Ethio Telecom)', icon: Smartphone },
  { value: 'cbe_birr', label: 'CBE Birr', icon: CreditCard },
  { value: 'amole', label: 'Amole (Awash Bank)', icon: Smartphone },
];

const PharmacistSales = () => {
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMedicines, setFilteredMedicines] = useState([]);

  // Cart state
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Modals
  const [handoffModalOpen, setHandoffModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    payment_method: 'cash',
    mobile_money_provider: 'telebirr',
    phone_number: '',
    amount_paid: '',
    notes: '',
  });
  const [change, setChange] = useState(0);

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

  // Payment form validation
  const validatePaymentForm = () => {
    const newErrors = {};

    if (paymentForm.payment_method === 'cash') {
      const amountPaid = parseFloat(paymentForm.amount_paid);
      const totalAmount = calculateTotal();
      if (isNaN(amountPaid) || amountPaid < totalAmount) {
        newErrors.amount_paid = 'Insufficient amount paid';
      }
    }

    if (['telebirr', 'cbe_birr', 'amole'].includes(paymentForm.payment_method)) {
      const phoneValidation = validateEthiopianPhoneNumber(paymentForm.phone_number);
      if (!phoneValidation.valid) newErrors.phone_number = phoneValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    if (!validatePaymentForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    try {
      setProcessing(true);

      const paymentData = {
        payment_method: paymentForm.payment_method,
        payment_details: {},
        amount_paid: parseFloat(paymentForm.amount_paid) || calculateTotal(),
        change: change,
        notes: paymentForm.notes,
        customer_name: customerName,
        customer_phone: customerPhone || undefined,
        items: cart.map((item) => ({
          medicine_id: item.medicine_id,
          medicine_name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      // Add payment method specific details
      if (['telebirr', 'cbe_birr', 'amole'].includes(paymentForm.payment_method)) {
        paymentData.payment_details = {
          mobile_money_provider: paymentForm.payment_method,
          phone_number: paymentForm.phone_number,
        };
      }

      const response = await pharmacistService.createSale(paymentData);

      if (response.success) {
        // Log transaction locally
        logTransaction({
          type: 'payment',
          sale_id: response.data?.sale_id,
          amount: paymentData.amount_paid,
          payment_method: paymentForm.payment_method,
          payment_details: paymentData.payment_details,
          change: change,
        });

        toast.success('Payment processed successfully!');
        setPaymentModalOpen(false);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setNotes('');
        setPaymentForm({
          payment_method: 'cash',
          mobile_money_provider: 'telebirr',
          phone_number: '',
          amount_paid: '',
          notes: '',
        });
        setChange(0);
        fetchMedicines();
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

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = medicines.filter(
        (med) =>
          med.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          med.generic_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMedicines(filtered);
    } else {
      setFilteredMedicines(medicines);
    }
  }, [searchQuery, medicines]);

  useEffect(() => {
    if (cart.length > 0 && paymentForm.amount_paid) {
      const amountPaid = parseFloat(paymentForm.amount_paid);
      const totalAmount = calculateTotal();
      if (!isNaN(amountPaid)) {
        setChange(Math.max(0, amountPaid - totalAmount));
      } else {
        setChange(0);
      }
    }
  }, [paymentForm.amount_paid, cart]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await pharmacistService.getMedicines({
        page: 1,
        limit: 100,
      });

      if (response.success) {
        // Only show medicines that are in stock and not expired
        const availableMedicines = (response.data?.medicines || response.medicines || []).filter(
          (med) => {
            const notExpired = !med.expiry_date || new Date(med.expiry_date) > new Date();
            const qty = med.quantity_in_stock ?? med.quantity;
            const inStock = qty > 0;
            return notExpired && inStock;
          }
        );
        setMedicines(availableMedicines);
        setFilteredMedicines(availableMedicines);
      } else {
        toast.error(response.message || 'Failed to load medicines');
      }
    } catch (error) {
      toast.error('An error occurred while loading medicines');
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (medicine) => {
    const existingItem = cart.find((item) => item.medicine_id === medicine.medicine_id);
    const medicineQty = medicine.quantity_in_stock ?? medicine.quantity;
    const medicinePrice = medicine.price || medicine.unit_price;

    if (existingItem) {
      if (existingItem.quantity >= medicineQty) {
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
          unit_price: medicinePrice,
          quantity: 1,
          maxQuantity: medicineQty,
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

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.unit_price * item.quantity, 0);
  };

  const handleHandoffToCashier = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setHandoffModalOpen(true);
  };

  const validateHandoffForm = () => {
    const newErrors = {};

    const nameValidation = validateCustomerName(customerName);
    if (!nameValidation.valid) newErrors.customerName = nameValidation.error;

    // Phone is optional, but if provided, validate it
    if (customerPhone) {
      const phoneValidation = validateEthiopianPhoneNumber(customerPhone);
      if (!phoneValidation.valid) newErrors.customerPhone = phoneValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCompleteHandoff = async () => {
    if (!validateHandoffForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    try {
      setProcessing(true);

      const handoffData = {
        customer_name: customerName,
        customer_phone: customerPhone || undefined,
        notes: notes || undefined,
        total_amount: calculateTotal(),
        items: cart.map((item) => ({
          medicine_id: item.medicine_id,
          medicine_name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      const response = await pharmacistService.handoffToCashier(handoffData);

      if (response.success) {
        toast.success('Order sent to cashier successfully!');

        // Reset form
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setNotes('');
        setHandoffModalOpen(false);
        setErrors({});

        // Refresh medicines to update stock
        fetchMedicines();
      } else {
        toast.error(response.message || 'Failed to send order to cashier');
      }
    } catch (error) {
      toast.error('An error occurred while sending order to cashier');
      console.error('Error completing handoff:', error);
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
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Medicine Selection */}
            <div className='lg:col-span-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Available Medicines</CardTitle>
                  <CardDescription>Select medicines to add to cart</CardDescription>

                  {/* Search Bar */}
                  <div className='mt-4'>
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4' />
                      <Input
                        placeholder='Search medicines...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='pl-10'
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto'>
                    {filteredMedicines.length === 0 ? (
                      <div className='col-span-2 text-center py-8 text-slate-500 dark:text-slate-400'>
                        {searchQuery ? 'No medicines found' : 'No medicines available'}
                      </div>
                    ) : (
                        filteredMedicines.map((medicine) => {
                          const medicineQty = medicine.quantity_in_stock ?? medicine.quantity;
                          const medicinePrice = medicine.price || medicine.unit_price;
                          return (
                            <div
                              key={medicine.medicine_id}
                              className='border rounded-lg p-4 hover:shadow-md transition-shadow'
                            >
                              <div className='flex justify-between items-start mb-2'>
                                <div>
                                  <div className="flex flex-col">
                                    <h3 className='font-medium text-slate-900 dark:text-slate-50'>{medicine.name}</h3>
                                    {medicine.added_by_role === 'manager' && (
                                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded w-fit mt-1">
                                        Manager Added
                                      </span>
                                    )}
                                  </div>
                                  {medicine.generic_name && (
                                    <p className='text-sm text-slate-500 dark:text-slate-400'>{medicine.generic_name}</p>
                                  )}
                                </div>
                                <span className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
                                  ${Number(medicinePrice).toFixed(2)}
                                </span>
                              </div>

                              <div className='flex justify-between items-center text-sm text-slate-600 dark:text-slate-400 mb-3'>
                                <span>Stock: {medicineQty}</span>
                                {medicine.category && <span>{medicine.category}</span>}
                              </div>

                              <Button
                                size='sm'
                                className='w-full'
                                onClick={() => addToCart(medicine)}
                                disabled={medicineQty === 0}
                              >
                                <Plus className='h-4 w-4 mr-2' />
                                Add to Cart
                              </Button>
                            </div>
                          );
                        })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Shopping Cart */}
            <div className='lg:col-span-1'>
              <Card className='sticky top-6'>
                <CardHeader>
                  <CardTitle className='flex items-center'>
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
                      <div className='space-y-3 mb-4 max-h-[400px] overflow-y-auto'>
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

                       <div className='border-t pt-4'>
                        <div className='flex justify-between items-center mb-4'>
                          <span className='text-lg font-semibold'>Total:</span>
                          <span className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
                            ${calculateTotal().toFixed(2)}
                          </span>
                        </div>

                        <div className='flex gap-2'>
                          <Button
                            variant='outline'
                            onClick={handleHandoffToCashier}
                            className='flex-1'
                          >
                            <Send className='h-5 w-5 mr-2' />
                            Send to Cashier
                          </Button>
                          <Button
                            className='flex-1 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
                            size='lg'
                            onClick={() => setPaymentModalOpen(true)}
                          >
                            <CheckCircle className='h-5 w-5 mr-2' />
                            Proceed to Payment
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Handoff Modal */}
      <Dialog open={handoffModalOpen} onOpenChange={setHandoffModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Order to Cashier</DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Order Summary */}
            <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
              <h4 className='font-medium mb-2'>Order Summary</h4>
              <div className='space-y-1 text-sm'>
                {cart.map((item) => (
                  <div key={item.medicine_id} className='flex justify-between'>
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className='border-t pt-2 mt-2 flex justify-between font-semibold'>
                  <span>Total</span>
                  <span className='text-slate-900 dark:text-slate-50'>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className='space-y-2'>
              <Label htmlFor='customer_name'>Customer Name *</Label>
              <Input
                id='customer_name'
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (errors.customerName) {
                    setErrors({ ...errors, customerName: '' });
                  }
                }}
                placeholder='Enter customer name'
              />
              {errors.customerName && <p className='text-sm text-red-500'>{errors.customerName}</p>}
            </div>

            {/* Customer Phone */}
            <div className='space-y-2'>
              <Label htmlFor='customer_phone'>Customer Phone (Optional)</Label>
              <Input
                id='customer_phone'
                type='tel'
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  if (errors.customerPhone) {
                    setErrors({ ...errors, customerPhone: '' });
                  }
                }}
                placeholder='09xxxxxxxx or 07xxxxxxxx'
              />
              {errors.customerPhone && <p className='text-sm text-red-500'>{errors.customerPhone}</p>}
              <p className='text-xs text-slate-500 dark:text-slate-400'>
                Ethiopian phone number format (10 digits starting with 09 or 07)
              </p>
            </div>

            {/* Notes */}
            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes for Cashier (Optional)</Label>
              <textarea
                id='notes'
                className='w-full min-h-[80px] px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-50 bg-transparent'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Any special instructions for the cashier...'
                maxLength={500}
              />
              <p className='text-xs text-slate-500 dark:text-slate-400 text-right'>
                {notes.length}/500 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setHandoffModalOpen(false);
                setErrors({});
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteHandoff}
              disabled={processing}
              className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
            >
              <Send className='h-4 w-4 mr-2' />
              {processing ? 'Sending...' : 'Send to Cashier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>Complete payment using Ethiopian payment methods</DialogDescription>
          </DialogHeader>

          <div className='space-y-6'>
            {/* Order Summary */}
            <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
              <h4 className='font-medium mb-2'>Order Summary</h4>
              <div className='space-y-1 text-sm'>
                {cart.map((item) => (
                  <div key={item.medicine_id} className='flex justify-between'>
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className='border-t pt-2 mt-2 flex justify-between font-semibold'>
                  <span>Total</span>
                  <span className='text-slate-900 dark:text-slate-50'>${calculateTotal().toFixed(2)}</span>
                </div>
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
                  {errors.amount_paid && <p className='text-sm text-red-500'>{errors.amount_paid}</p>}
                </div>

                {/* Quick Amount Buttons */}
                <div className='flex gap-2 flex-wrap'>
                  {[50, 100, 200, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant='outline'
                      size='sm'
                      onClick={() => setPaymentForm({ ...paymentForm, amount_paid: amount.toString() })}
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
                    <Smartphone className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4' />
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
                  {errors.phone_number && <p className='text-sm text-red-500'>{errors.phone_number}</p>}
                  <p className='text-xs text-slate-500 dark:text-slate-400'>
                    Ethiopian phone number format (10 digits starting with 09 or 07)
                  </p>
                </div>

                <div className='bg-slate-50 dark:bg-slate-800 p-3 rounded-md flex justify-between items-center'>
                  <span className='font-medium text-slate-900 dark:text-slate-50'>Amount:</span>
                  <span className='text-xl font-bold text-slate-900 dark:text-slate-50'>
                    ${calculateTotal().toFixed(2)}
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

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setPaymentModalOpen(false);
                setPaymentForm({
                  payment_method: 'cash',
                  mobile_money_provider: 'telebirr',
                  phone_number: '',
                  amount_paid: '',
                  notes: '',
                });
                setChange(0);
              }}
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

export default PharmacistSales;
