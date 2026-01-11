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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DataTable from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import { cashierService } from '@/services';
import { RefreshCw, Search, RotateCcw, AlertCircle } from 'lucide-react';

const CashierReturns = () => {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filteredSales, setFilteredSales] = useState([]);

  // Return Modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]); // { itemId, quantity, reason }
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = sales.filter(
        (sale) =>
          sale.sale_id?.toString().includes(searchQuery) ||
          sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales);
    }
  }, [searchQuery, sales]);

  const fetchSales = async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      // Fetch sales from the last 30 days eligible for return
      const response = await cashierService.getSalesForReturn();

      if (response.success) {
        setSales(response.data || []);
        setFilteredSales(response.data || []);
      } else {
        toast.error(response.message || 'Failed to load sales');
      }
    } catch (error) {
      toast.error('An error occurred while loading sales');
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleReturnClick = async (sale) => {
    try {
      // Fetch items for this sale
      const response = await cashierService.getSaleItems(sale.sale_id);

      if (response.success) {
        setSelectedSale({
          ...sale,
          items: response.data || [],
        });

        // Initialize return items state
        const initialReturnItems = (response.data || []).map((item) => ({
          sale_item_id: item.sale_item_id || item.id,
          medicine_id: item.medicine_id,
          medicine_name: item.medicine_name,
          unit_price: item.unit_price,
          quantity_bought: item.quantity,
          return_quantity: 0,
          selected: false,
          reason: 'Defective',
        }));

        setReturnItems(initialReturnItems);
        setReturnModalOpen(true);
      } else {
        toast.error('Failed to load sale items');
      }
    } catch (error) {
      toast.error('Error loading sale details');
      console.error('Error:', error);
    }
  };

  const handleItemToggle = (index) => {
    const newItems = [...returnItems];
    newItems[index].selected = !newItems[index].selected;

    // If selected, default return quantity to 1 (or max bought if 0)
    if (newItems[index].selected && newItems[index].return_quantity === 0) {
      newItems[index].return_quantity = 1;
    } else if (!newItems[index].selected) {
      newItems[index].return_quantity = 0;
    }

    setReturnItems(newItems);
  };

  const handleQuantityChange = (index, value) => {
    const qty = parseInt(value) || 0;
    const newItems = [...returnItems];

    // Validate quantity
    if (qty < 0) return;
    if (qty > newItems[index].quantity_bought) return;

    newItems[index].return_quantity = qty;
    if (qty > 0) newItems[index].selected = true;

    setReturnItems(newItems);
  };

  const handleReasonChange = (index, value) => {
    const newItems = [...returnItems];
    newItems[index].reason = value;
    setReturnItems(newItems);
  };

  const calculateRefundTotal = () => {
    return returnItems.reduce((total, item) => {
      if (item.selected) {
        return total + item.return_quantity * item.unit_price;
      }
      return total;
    }, 0);
  };

  const handleProcessReturn = async () => {
    const itemsToReturn = returnItems
      .filter((item) => item.selected && item.return_quantity > 0)
      .map((item) => ({
        medicine_id: item.medicine_id,
        quantity: item.return_quantity,
        reason: item.reason,
      }));

    if (itemsToReturn.length === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    try {
      setProcessing(true);
      const response = await cashierService.processReturn({
        sale_id: selectedSale.sale_id,
        items: itemsToReturn,
        refund_amount: calculateRefundTotal(),
      });

      if (response.success) {
        toast.success('Return processed successfully');
        setReturnModalOpen(false);
        fetchSales();
      } else {
        toast.error(response.message || 'Failed to process return');
      }
    } catch (error) {
      toast.error('An error occurred while processing return');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      key: 'sale_id',
      label: 'Sale ID',
      render: (value) => <span className='font-mono'>#{value}</span>,
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (value) => value || 'Walk-in',
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (value) => <span className='font-bold'>${Number(value).toFixed(2)}</span>,
    },
    {
      key: 'actions',
      label: 'Action',
      render: (value, row) => (
        <Button
          size='sm'
          variant='outline'
          onClick={() => handleReturnClick(row)}
          className='text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        >
          <RotateCcw className='h-3 w-3 mr-1' />
          Return
        </Button>
      ),
    },
  ];

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
                  <CardTitle className='text-slate-900 dark:text-slate-50'>Process Returns</CardTitle>
                  <CardDescription>Select a sale to process a return or refund</CardDescription>
                </div>
                <Button onClick={fetchSales} variant='outline' disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className='mt-4'>
                <div className='relative max-w-sm'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4' />
                  <Input
                    placeholder='Search sale ID or customer...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={filteredSales}
                searchable={false}
                pagination={true}
                itemsPerPage={10}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Return Modal */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Process Return - Sale #{selectedSale?.sale_id}</DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg flex items-start'>
              <AlertCircle className='h-5 w-5 text-slate-600 dark:text-slate-400 mr-2 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-slate-900 dark:text-slate-50'>Return Policy</p>
                <p className='text-sm text-slate-700 dark:text-slate-300 mt-1'>
                  Items can be returned within 30 days of purchase. Opened or damaged items may not
                  be eligible for full refund.
                </p>
              </div>
            </div>

            <div className='border rounded-md'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[50px]'>Select</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className='text-right'>Price</TableHead>
                    <TableHead className='text-center'>Qty Bought</TableHead>
                    <TableHead className='w-[100px]'>Return Qty</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnItems.map((item, index) => (
                    <TableRow key={index} className={item.selected ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={() => handleItemToggle(index)}
                        />
                      </TableCell>
                      <TableCell className='font-medium'>{item.medicine_name}</TableCell>
                      <TableCell className='text-right'>
                        ${Number(item.unit_price).toFixed(2)}
                      </TableCell>
                      <TableCell className='text-center'>{item.quantity_bought}</TableCell>
                      <TableCell>
                        <Input
                          type='number'
                          min='0'
                          max={item.quantity_bought}
                          value={item.return_quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          disabled={!item.selected}
                          className='h-8 w-20'
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.reason}
                          onChange={(e) => handleReasonChange(index, e.target.value)}
                          disabled={!item.selected}
                          className='h-8'
                          placeholder='Reason'
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className='flex justify-end items-center pt-4 border-t'>
              <div className='text-right'>
                <p className='text-sm text-slate-500 dark:text-slate-500'>Refund Amount</p>
                <p className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
                  ${calculateRefundTotal().toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setReturnModalOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessReturn}
              disabled={processing || calculateRefundTotal() === 0}
              className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
            >
              {processing ? 'Processing...' : 'Confirm Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashierReturns;
