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
import { pharmacistService } from '@/services';
import { validateCustomerName, validatePaymentMethod } from '@/utils/validation';
import { ShoppingCart, Plus, Minus, Trash2, Search, CheckCircle } from 'lucide-react';

const PharmacistSales = () => {
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMedicines, setFilteredMedicines] = useState([]);

  // Cart state
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);

  // Modals
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

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
            const inStock = med.quantity > 0;
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

    if (existingItem) {
      if (existingItem.quantity >= medicine.quantity) {
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
          unit_price: medicine.unit_price,
          quantity: 1,
          maxQuantity: medicine.quantity,
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

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setCheckoutModalOpen(true);
  };

  const validateCheckoutForm = () => {
    const newErrors = {};

    const nameValidation = validateCustomerName(customerName);
    if (!nameValidation.valid) newErrors.customerName = nameValidation.error;

    const paymentValidation = validatePaymentMethod(paymentMethod);
    if (!paymentValidation.valid) newErrors.paymentMethod = paymentValidation.error;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCompleteSale = async () => {
    if (!validateCheckoutForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    try {
      setProcessing(true);

      const saleData = {
        customer_name: customerName,
        payment_method: paymentMethod,
        items: cart.map((item) => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      const response = await pharmacistService.createSale(saleData);

      if (response.success) {
        toast.success('Sale completed successfully!');

        // Reset form
        setCart([]);
        setCustomerName('');
        setPaymentMethod('cash');
        setCheckoutModalOpen(false);
        setErrors({});

        // Refresh medicines to update stock
        fetchMedicines();
      } else {
        toast.error(response.message || 'Failed to complete sale');
      }
    } catch (error) {
      toast.error('An error occurred while processing sale');
      console.error('Error completing sale:', error);
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
                      filteredMedicines.map((medicine) => (
                        <div
                          key={medicine.medicine_id}
                          className='border rounded-lg p-4 hover:shadow-md transition-shadow'
                        >
                          <div className='flex justify-between items-start mb-2'>
                            <div>
                              <h3 className='font-medium text-slate-900 dark:text-slate-50'>{medicine.name}</h3>
                              {medicine.generic_name && (
                                <p className='text-sm text-slate-500 dark:text-slate-400'>{medicine.generic_name}</p>
                              )}
                            </div>
                            <span className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
                              ${Number(medicine.unit_price).toFixed(2)}
                            </span>
                          </div>

                          <div className='flex justify-between items-center text-sm text-slate-600 dark:text-slate-400 mb-3'>
                            <span>Stock: {medicine.quantity}</span>
                            {medicine.category && <span>{medicine.category}</span>}
                          </div>

                          <Button
                            size='sm'
                            className='w-full'
                            onClick={() => addToCart(medicine)}
                            disabled={medicine.quantity === 0}
                          >
                            <Plus className='h-4 w-4 mr-2' />
                            Add to Cart
                          </Button>
                        </div>
                      ))
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

                        <Button className='w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200' size='lg' onClick={handleCheckout}>
                          <CheckCircle className='h-5 w-5 mr-2' />
                          Checkout
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Sale</DialogTitle>
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

            {/* Payment Method */}
            <div className='space-y-2'>
              <Label htmlFor='payment_method'>Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder='Select payment method' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='cash'>Cash</SelectItem>
                  <SelectItem value='card'>Card</SelectItem>
                  <SelectItem value='mobile_money'>Mobile Money</SelectItem>
                  <SelectItem value='insurance'>Insurance</SelectItem>
                </SelectContent>
              </Select>
              {errors.paymentMethod && (
                <p className='text-sm text-red-500'>{errors.paymentMethod}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setCheckoutModalOpen(false);
                setErrors({});
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleCompleteSale} disabled={processing} className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'>
              {processing ? 'Processing...' : 'Complete Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PharmacistSales;
