import React, { useState } from 'react';
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
import { cashierService } from '@/services';
import { Search } from 'lucide-react';

const CashierReturns = () => {
  const [loading, setLoading] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [returnData, setReturnData] = useState(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);

  const handleViewReturn = async () => {
    if (!receiptNumber.trim()) {
      toast.error('Please enter a receipt number');
      return;
    }

    try {
      setLoading(true);
      const response = await cashierService.getReturnByReceipt(receiptNumber);

      if (response.success) {
        setReturnData(response.data);
        setReturnModalOpen(true);
      } else {
        toast.error(response.message || 'Return not found');
      }
    } catch (error) {
      toast.error('An error occurred while fetching return details');
      console.error('Error fetching return:', error);
    } finally {
      setLoading(false);
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
              <div>
                <CardTitle className='text-slate-900 dark:text-slate-50'>View Returns</CardTitle>
                <CardDescription>Enter a receipt number to view return details</CardDescription>
              </div>
              <div className='mt-4'>
                <div className='flex gap-2 max-w-md'>
                  <Input
                    placeholder='Enter receipt number...'
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleViewReturn();
                    }}
                  />
                  <Button onClick={handleViewReturn} disabled={loading}>
                    <Search className='h-4 w-4 mr-2' />
                    Search
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Return Details Modal */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Return Details</DialogTitle>
          </DialogHeader>

          {returnData && (
            <div className='space-y-4'>
              <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
                <p className='text-sm text-slate-700 dark:text-slate-300'>
                  <strong>Receipt #:</strong> {returnData.receipt_number || returnData.sale_id}
                </p>
                <p className='text-sm text-slate-700 dark:text-slate-300'>
                  <strong>Date:</strong> {new Date(returnData.created_at).toLocaleString()}
                </p>
                {returnData.customer_name && (
                  <p className='text-sm text-slate-700 dark:text-slate-300'>
                    <strong>Customer:</strong> {returnData.customer_name}
                  </p>
                )}
                <p className='text-sm text-slate-700 dark:text-slate-300'>
                  <strong>Refund Amount:</strong> ${Number(returnData.refund_amount || 0).toFixed(2)}
                </p>
                {returnData.items && returnData.items.length > 0 && (
                  <div className='mt-4'>
                    <p className='text-sm font-medium text-slate-900 dark:text-slate-50 mb-2'>Returned Items:</p>
                    {returnData.items.map((item, idx) => (
                      <div key={idx} className='text-sm text-slate-700 dark:text-slate-300 py-1 border-b last:border-0'>
                        <span>{item.medicine_name} - Qty: {item.quantity}</span>
                        {item.reason && <span className='ml-2 text-slate-500 dark:text-slate-400'>({item.reason})</span>}
                      </div>
                    ))}
                  </div>
                )}
                {returnData.status && (
                  <p className='text-sm font-medium mt-4'>
                    <strong>Status:</strong>{' '}
                    <span className={`capitalize ${
                      returnData.status === 'approved' ? 'text-green-600' :
                      returnData.status === 'pending' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {returnData.status}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setReturnModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashierReturns;
