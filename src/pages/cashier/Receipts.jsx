import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { useAuth } from '@/contexts/AuthContext';
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
import { cashierService, pharmacyService } from '@/services';
import { Printer, Search } from 'lucide-react';

const CashierReceipts = () => {
  const { role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [receiptId, setReceiptId] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [pharmacyName, setPharmacyName] = useState('PharmaCare');
  const [branchInfo, setBranchInfo] = useState({ name: '', location: '', phone: '', email: '' });

  useEffect(() => {
    fetchPharmacyInfo();
  }, []);

  const handleSearchReceipt = async () => {
    if (!receiptId.trim()) {
      toast.error('Please enter a receipt ID');
      return;
    }

    try {
      setLoading(true);
      const response = await cashierService.getReceiptById(receiptId);

      if (response.success) {
        setSelectedReceipt(response.data);
        setReceiptModalOpen(true);
      } else {
        toast.error(response.message || 'Receipt not found');
      }
    } catch (error) {
      toast.error('An error occurred while fetching receipt');
      console.error('Error fetching receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPharmacyInfo = async () => {
    try {
      const response = await pharmacyService.getPharmacyAndBranchInfo(role);
      if (response.success) {
        if (response.data?.pharmacy?.name) {
          setPharmacyName(response.data.pharmacy.name);
        }
        if (response.data?.branch) {
          setBranchInfo({
            name: response.data.branch.name || '',
            location: response.data.branch.location || '',
            phone: response.data.branch.phone || '',
            email: response.data.branch.email || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching pharmacy info:', error);
    }
  };

  const handlePrint = () => {
    toast.success('Printing receipt...');
    setTimeout(() => {
      window.print();
    }, 500);
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
                <CardTitle className='text-slate-900 dark:text-slate-50'>View Receipt</CardTitle>
                <CardDescription>Enter a receipt ID to view details</CardDescription>
              </div>
              <div className='mt-4'>
                <div className='flex gap-2 max-w-md'>
                  <Input
                    placeholder='Enter receipt ID...'
                    value={receiptId}
                    onChange={(e) => setReceiptId(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSearchReceipt();
                    }}
                  />
                  <Button onClick={handleSearchReceipt} disabled={loading}>
                    <Search className='h-4 w-4 mr-2' />
                    Search
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Receipt View Modal */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
          </DialogHeader>

          {selectedReceipt && (
            <div className='border rounded-lg p-6 bg-white shadow-sm' id='printable-receipt'>
              <div className='text-center border-b pb-4 mb-4'>
                <h2 className='text-xl font-bold text-slate-900 dark:text-slate-50'>{pharmacyName}</h2>
                <p className='text-sm text-slate-600 dark:text-slate-400'>Pharmacy Management System</p>
                {branchInfo.name && (
                  <p className='text-xs text-slate-600 dark:text-slate-400 mt-1'>{branchInfo.name}</p>
                )}
                {branchInfo.location && (
                  <p className='text-xs text-slate-600 dark:text-slate-400'>{branchInfo.location}</p>
                )}
                <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>
                  {new Date(selectedReceipt.created_at).toLocaleString()}
                </p>
                <p className='text-xs text-gray-500'>Receipt #{selectedReceipt.sale_id}</p>
              </div>

              <div className='space-y-4 mb-6'>
                <div className='flex justify-between text-sm'>
                  <span className='text-slate-600 dark:text-slate-400'>Customer:</span>
                  <span className='font-medium text-slate-900 dark:text-slate-50'>
                    {selectedReceipt.customer_name || 'Walk-in Customer'}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-slate-600 dark:text-slate-400'>Payment Method:</span>
                  <span className='capitalize'>{selectedReceipt.payment_method}</span>
                </div>
              </div>

              <div className='mb-6'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b'>
                      <th className='text-left pb-2'>Item</th>
                      <th className='text-right pb-2'>Qty</th>
                      <th className='text-right pb-2'>Price</th>
                      <th className='text-right pb-2'>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReceipt.items?.map((item, idx) => (
                      <tr key={idx} className='border-b last:border-0'>
                        <td className='py-2'>{item.medicine_name}</td>
                        <td className='text-right py-2'>{item.quantity}</td>
                        <td className='text-right py-2'>${Number(item.unit_price).toFixed(2)}</td>
                        <td className='text-right py-2'>
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className='border-t pt-4 space-y-2'>
                <div className='flex justify-between items-center text-lg font-bold'>
                  <span>Total Amount</span>
                  <span>${Number(selectedReceipt.total_amount).toFixed(2)}</span>
                </div>
                {selectedReceipt.amount_paid && (
                  <>
                    <div className='flex justify-between text-sm text-slate-600 dark:text-slate-400'>
                      <span>Amount Paid</span>
                      <span>${Number(selectedReceipt.amount_paid).toFixed(2)}</span>
                    </div>
                    <div className='flex justify-between text-sm text-slate-600 dark:text-slate-400'>
                      <span>Change</span>
                      <span>
                        $
                        {(
                          Number(selectedReceipt.amount_paid) - Number(selectedReceipt.total_amount)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className='text-center mt-8 text-xs text-slate-500 dark:text-slate-500'>
                <p>Thank you for your purchase!</p>
                <p>Please retain this receipt for any returns.</p>
              </div>
            </div>
          )}

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button variant='outline' onClick={() => setReceiptModalOpen(false)}>
              Close
            </Button>
            <Button onClick={handlePrint}>
              <Printer className='h-4 w-4 mr-2' />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashierReceipts;
