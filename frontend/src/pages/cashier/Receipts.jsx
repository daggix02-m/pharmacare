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
import { Label } from '@/components/ui/label';
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
import { cashierService, pharmacyService } from '@/services';
import { validateEmail } from '@/utils/validation';
import { Printer, Mail, Eye, Search, RefreshCw, FileText } from 'lucide-react';

const CashierReceipts = () => {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pharmacyName, setPharmacyName] = useState('PharmaCare');
  const [branchInfo, setBranchInfo] = useState({ name: '', location: '', phone: '', email: '' });

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchReceipts();
    fetchPharmacyInfo();
  }, [currentPage, searchQuery]);

  const fetchReceipts = async () => {
    try {
      setRefreshing(true);
      const response = await cashierService.getReceipts({
        page: currentPage,
        limit: 20,
        // Backend handles search across ID and customer name
        search: searchQuery || undefined,
      });

      if (response.success) {
        setReceipts(response.data?.receipts || response.receipts || []);
        setTotalPages(response.data?.totalPages || 1);
      } else {
        toast.error(response.message || 'Failed to load receipts');
      }
    } catch (error) {
      toast.error('An error occurred while loading receipts');
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const handleViewReceipt = async (receipt) => {
    try {
      // Fetch full details if needed
      const response = await cashierService.getReceiptById(receipt.sale_id);
      if (response.success) {
        setSelectedReceipt(response.data);
        setReceiptModalOpen(true);
      } else {
        toast.error('Failed to load receipt details');
      }
    } catch (error) {
      toast.error('Error loading receipt details');
    }
  };

  const handlePrint = () => {
    // Mock print functionality
    toast.success('Printing receipt...');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleEmailClick = (receipt) => {
    setSelectedReceipt(receipt);
    setEmailAddress(''); // Reset email or pre-fill from customer data if available
    setEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    const emailValidation = validateEmail(emailAddress);
    if (!emailValidation.valid) {
      toast.error(emailValidation.error);
      return;
    }

    try {
      setSendingEmail(true);
      const response = await cashierService.emailReceipt(selectedReceipt.sale_id, {
        email: emailAddress,
        include_details: true,
      });

      if (response.success) {
        toast.success(`Receipt sent to ${emailAddress}`);
        setEmailModalOpen(false);
      } else {
        toast.error(response.message || 'Failed to send email');
      }
    } catch (error) {
      toast.error('An error occurred while sending email');
    } finally {
      setSendingEmail(false);
    }
  };

  const columns = [
    {
      key: 'sale_id',
      label: 'Receipt #',
      render: (value) => <span className='font-mono'>#{value}</span>,
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (value) => new Date(value).toLocaleString(),
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (value) => value || 'Walk-in Customer',
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (value) => <span className='font-bold'>${Number(value).toFixed(2)}</span>,
    },
    {
      key: 'payment_method',
      label: 'Payment',
      render: (value) => <span className='capitalize'>{value}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={(e) => {
              e.stopPropagation();
              handleViewReceipt(row);
            }}
          >
            <Eye className='h-3 w-3 mr-1' />
            View
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={(e) => {
              e.stopPropagation();
              handleEmailClick(row);
            }}
          >
            <Mail className='h-3 w-3 mr-1' />
            Email
          </Button>
        </div>
      ),
    },
  ];

  if (loading && !refreshing) {
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
                  <CardTitle className='text-slate-900 dark:text-slate-50'>Sales Receipts</CardTitle>
                  <CardDescription>View, print, and email past receipts</CardDescription>
                </div>
                <Button onClick={fetchReceipts} variant='outline' disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className='mt-4'>
                <div className='relative max-w-sm'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4' />
                  <Input
                    placeholder='Search receipt # or customer...'
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className='pl-10'
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={receipts}
                searchable={false}
                pagination={true}
                itemsPerPage={20}
                onRowClick={handleViewReceipt}
              />
            </CardContent>
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
            <div className='flex gap-2 w-full sm:w-auto'>
              <Button variant='secondary' onClick={() => handleEmailClick(selectedReceipt)}>
                <Mail className='h-4 w-4 mr-2' />
                Email
              </Button>
              <Button onClick={handlePrint}>
                <Printer className='h-4 w-4 mr-2' />
                Print
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>Email Receipt</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email Address</Label>
              <Input
                id='email'
                type='email'
                placeholder='customer@example.com'
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setEmailModalOpen(false)}
              disabled={sendingEmail}
            >
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail}>
              {sendingEmail ? 'Sending...' : 'Send Receipt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashierReceipts;
