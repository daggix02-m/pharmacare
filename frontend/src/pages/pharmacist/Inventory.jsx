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
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/common/StatusBadge';
import { pharmacistService } from '@/services';
import { validateQuantity, validateRequired } from '@/utils/validation';
import { Package, AlertTriangle, History, TrendingUp, RefreshCw, Search, Plus } from 'lucide-react';

const PharmacistInventory = () => {
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Restock Form
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [restockForm, setRestockForm] = useState({
    quantity: '',
    priority: 'medium',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
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

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      const [medicinesRes, requestsRes] = await Promise.all([
        pharmacistService.getMedicines({ page: 1, limit: 100 }),
        pharmacistService.getRestockRequests(),
      ]);

      if (medicinesRes.success) {
        setMedicines(medicinesRes.data?.medicines || medicinesRes.medicines || []);
        setFilteredMedicines(medicinesRes.data?.medicines || medicinesRes.medicines || []);
      }

      if (requestsRes.success) {
        setRestockRequests(requestsRes.data || []);
      }
    } catch (error) {
      toast.error('Failed to load inventory data');
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRestockClick = (medicine) => {
    setSelectedMedicine(medicine);
    setRestockForm({
      quantity: '',
      priority: 'medium',
      notes: '',
    });
    setErrors({});
    setRestockModalOpen(true);
  };

  const validateRestockForm = () => {
    const newErrors = {};

    const quantityValidation = validateQuantity(restockForm.quantity);
    if (!quantityValidation.valid) newErrors.quantity = quantityValidation.error;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitRestock = async () => {
    if (!validateRestockForm()) return;

    try {
      setProcessing(true);
      const response = await pharmacistService.requestRestock({
        medicine_id: selectedMedicine.medicine_id,
        requested_quantity: parseInt(restockForm.quantity),
        priority: restockForm.priority,
        notes: restockForm.notes,
      });

      if (response.success) {
        toast.success('Restock request submitted successfully');
        setRestockModalOpen(false);
        fetchData(); // Refresh data to show new request
      } else {
        toast.error(response.message || 'Failed to submit request');
      }
    } catch (error) {
      toast.error('An error occurred while submitting request');
      console.error('Error submitting restock request:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStockStatus = (medicine) => {
    if (medicine.quantity === 0) return { text: 'Out of Stock', type: 'error' };
    if (medicine.quantity <= (medicine.min_stock_level || 10)) {
      return { text: 'Low Stock', type: 'warning' };
    }
    return { text: 'In Stock', type: 'success' };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800';
      case 'high':
        return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800';
      case 'medium':
        return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800';
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
          <Tabs defaultValue='inventory' className='space-y-6'>
            <div className='flex items-center justify-between'>
              <TabsList>
                <TabsTrigger value='inventory' className='data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900'>Current Inventory</TabsTrigger>
                <TabsTrigger value='requests' className='data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900'>Restock Requests</TabsTrigger>
              </TabsList>
              <Button onClick={fetchData} variant='outline' disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <TabsContent value='inventory'>
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Status</CardTitle>
                  <CardDescription>Monitor stock levels and request restocking</CardDescription>
                  <div className='mt-4'>
                    <div className='relative max-w-sm'>
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
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Current Stock</TableHead>
                          <TableHead>Min Level</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMedicines.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className='text-center py-8 text-slate-500 dark:text-slate-400'>
                              No medicines found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredMedicines.map((medicine) => {
                            const status = getStockStatus(medicine);
                            return (
                              <TableRow key={medicine.medicine_id}>
                                <TableCell className='font-medium'>{medicine.name}</TableCell>
                                <TableCell>{medicine.category || 'N/A'}</TableCell>
                                <TableCell>{medicine.quantity}</TableCell>
                                <TableCell>{medicine.min_stock_level || 10}</TableCell>
                                <TableCell>
                                  <StatusBadge status={status.text} type={status.type} />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    className='text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    onClick={() => handleRestockClick(medicine)}
                                  >
                                    <Plus className='h-3 w-3 mr-1' />
                                    Request Restock
                                  </Button>
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

            <TabsContent value='requests'>
              <Card>
                <CardHeader>
                  <CardTitle>Restock Requests History</CardTitle>
                  <CardDescription>Track the status of your restock requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Requested Qty</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Date Requested</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {restockRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className='text-center py-8 text-slate-500 dark:text-slate-400'>
                              No restock requests found
                            </TableCell>
                          </TableRow>
                        ) : (
                          restockRequests.map((request) => (
                            <TableRow key={request.request_id || request.id}>
                              <TableCell className='font-medium'>
                                {request.medicine_name || 'Unknown Medicine'}
                              </TableCell>
                              <TableCell>{request.requested_quantity}</TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                                    request.priority
                                  )}`}
                                >
                                  {request.priority?.toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell>
                                {new Date(request.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={request.status} />
                              </TableCell>
                              <TableCell className='max-w-xs truncate'>
                                {request.notes || '-'}
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

      {/* Restock Request Modal */}
      <Dialog open={restockModalOpen} onOpenChange={setRestockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Restock</DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
              <p className='text-sm font-medium text-slate-900 dark:text-slate-50'>
                Medicine: {selectedMedicine?.name}
              </p>
              <p className='text-sm text-slate-700 dark:text-slate-300'>
                Current Stock: {selectedMedicine?.quantity} units
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='quantity'>Requested Quantity *</Label>
              <Input
                id='quantity'
                type='number'
                value={restockForm.quantity}
                onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })}
                placeholder='e.g., 50'
              />
              {errors.quantity && <p className='text-sm text-red-500'>{errors.quantity}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='priority'>Priority</Label>
              <Select
                value={restockForm.priority}
                onValueChange={(value) => setRestockForm({ ...restockForm, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='low'>Low</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='urgent'>Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes (Optional)</Label>
              <Textarea
                id='notes'
                value={restockForm.notes}
                onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                placeholder='Additional details about this request...'
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setRestockModalOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitRestock} disabled={processing} className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'>
              {processing ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PharmacistInventory;
