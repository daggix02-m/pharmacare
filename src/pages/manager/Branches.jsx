import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DataTable from '@/components/common/DataTable';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { managerService } from '@/services';
import {
  Building2,
  MapPin,
  Users,
  Plus,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  RefreshCw,
  Package,
  ShoppingCart,
  DollarSign,
  FileText,
  Send,
} from 'lucide-react';

const ManagerBranches = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [branchRequest, setBranchRequest] = useState({
    branch_name: '',
    location: '',
    phone: '',
    email: '',
    request_notes: '',
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      if (loading) setError(null);
      setRefreshing(true);
      const response = await managerService.getBranches();
      console.log('[MANAGER BRANCHES] Response:', response);

      if (response.success) {
        // Handle various possible response structures
        let branchesData = [];
        if (Array.isArray(response.data)) {
          branchesData = response.data;
        } else if (Array.isArray(response.branches)) {
          branchesData = response.branches;
        } else if (response.data && Array.isArray(response.data.branches)) {
          branchesData = response.data.branches;
        } else {
          // Fallback: search for any array property or use the response itself if it looks like one
          const possibleArray = response.data || response;
          if (Array.isArray(possibleArray)) {
            branchesData = possibleArray;
          } else {
            // Try to find an array property in the object
            const arrayProp = Object.values(response).find(Array.isArray);
            if (arrayProp) branchesData = arrayProp;
          }
        }

        console.log('[MANAGER BRANCHES] Extracted Data:', branchesData);
        setBranches(Array.isArray(branchesData) ? branchesData : []);
      } else {
        const msg = response.message || 'Failed to load branches';
        toast.error(msg);
        setError(msg);
      }
    } catch (err) {
      const msg = 'An error occurred while loading branches';
      toast.error(msg);
      console.error('Error fetching branches:', err);
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRowClick = (branch) => {
    setSelectedBranch(branch);
    setDetailsModalOpen(true);
  };

  const handleRequestBranch = () => {
    setBranchRequest({
      branch_name: '',
      location: '',
      phone: '',
      email: '',
      request_notes: '',
    });
    setRequestModalOpen(true);
  };

  const handleSubmitBranchRequest = async () => {
    try {
      setProcessing(true);
      const response = await managerService.requestBranch(branchRequest);

      if (response.success) {
        toast.success('Branch request submitted successfully. Waiting for admin approval.');
        setRequestModalOpen(false);
        setBranchRequest({
          branch_name: '',
          location: '',
          phone: '',
          email: '',
          request_notes: '',
        });
      } else {
        toast.error(response.message || 'Failed to submit branch request');
      }
    } catch (error) {
      toast.error('An error occurred while submitting branch request');
      console.error('Error submitting branch request:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setEditModalOpen(true);
  };

  const handleDeleteBranch = (branch) => {
    setSelectedBranch(branch);
    setDeleteModalOpen(true);
  };

  const handleSaveBranch = async () => {
    if (!selectedBranch) return;

    // Ensure location matches name if we removed the location input
    const branchToSave = {
      ...selectedBranch,
      location: selectedBranch.name,
    };

    try {
      setProcessing(true);
      let response;

      if (branchToSave.branch_id) {
        response = await managerService.updateBranch(branchToSave.branch_id, branchToSave);
      } else {
        response = await managerService.createBranch(branchToSave);
      }

      if (response.success) {
        toast.success(
          selectedBranch.branch_id ? 'Branch updated successfully' : 'Branch created successfully'
        );
        setEditModalOpen(false);
        fetchBranches();
      } else {
        toast.error(response.message || 'Failed to save branch');
      }
    } catch (error) {
      toast.error('An error occurred while saving branch');
      console.error('Error saving branch:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBranch || !selectedBranch.branch_id) return;

    try {
      setProcessing(true);
      const response = await managerService.deleteBranch(selectedBranch.branch_id);

      if (response.success) {
        toast.success('Branch deleted successfully');
        setDeleteModalOpen(false);
        fetchBranches();
      } else {
        toast.error(response.message || 'Failed to delete branch');
      }
    } catch (error) {
      toast.error('An error occurred while deleting branch');
      console.error('Error deleting branch:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleActivateBranch = async (branch) => {
    if (!branch.branch_id) return;

    try {
      setProcessing(true);
      const response = await managerService.activateBranch(branch.branch_id);

      if (response.success) {
        toast.success('Branch activated successfully');
        fetchBranches();
      } else {
        toast.error(response.message || 'Failed to activate branch');
      }
    } catch (error) {
      toast.error('An error occurred while activating branch');
      console.error('Error activating branch:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeactivateBranch = async (branch) => {
    if (!branch.branch_id) return;

    try {
      setProcessing(true);
      const response = await managerService.deactivateBranch(branch.branch_id);

      if (response.success) {
        toast.success('Branch deactivated successfully');
        fetchBranches();
      } else {
        toast.error(response.message || 'Failed to deactivate branch');
      }
    } catch (error) {
      toast.error('An error occurred while deactivating branch');
      console.error('Error deactivating branch:', error);
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      key: 'branch_id',
      label: 'Branch ID',
    },
    {
      key: 'name',
      label: 'Location Name',
      render: (value) => <span className='font-medium'>{value}</span>,
    },
    {
      key: 'pharmacy_name',
      label: 'Pharmacy Name',
      render: (value, row) => (
        <span className='text-slate-600 dark:text-slate-400'>
          {row.pharmacy?.name || value || row.pharmacyName || row.pharmacy_name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'total_managers',
      label: 'Total Managers',
      render: (value) => <span className='text-center block'>{value || 0}</span>,
    },
    {
      key: 'total_staff',
      label: 'Total Staff',
      render: (value) => <span className='text-center block'>{value || 0}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => {
        const isActive = row.is_active !== false;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isActive
                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className='flex gap-2' onClick={(e) => e.stopPropagation()}>
          {row.is_active !== false ? (
            <Button
              size='sm'
              variant='outline'
              onClick={(e) => {
                e.stopPropagation();
                handleDeactivateBranch(row);
              }}
              disabled={processing}
            >
              <PowerOff className='h-3 w-3 mr-1' />
              Deactivate
            </Button>
          ) : (
            <Button
              size='sm'
              variant='outline'
              onClick={(e) => {
                e.stopPropagation();
                handleActivateBranch(row);
              }}
              disabled={processing}
              className='bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            >
              <Power className='h-3 w-3 mr-1' />
              Activate
            </Button>
          )}
          <Button
            size='sm'
            variant='outline'
            onClick={(e) => {
              e.stopPropagation();
              handleEditBranch(row);
            }}
          >
            <Pencil className='h-3 w-3 mr-1' />
            Edit
          </Button>
          <Button
            size='sm'
            variant='destructive'
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteBranch(row);
            }}
          >
            <Trash2 className='h-3 w-3 mr-1' />
            Delete
          </Button>
        </div>
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
                  <CardTitle className='text-slate-900 dark:text-slate-50'>
                    Pharmacy Branches
                  </CardTitle>
                  <CardDescription>View and manage your assigned pharmacy branches</CardDescription>
                </div>
                <div className='flex gap-2'>
                  <Button variant='outline' onClick={fetchBranches} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    onClick={handleRequestBranch}
                    className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
                  >
                    <Send className='h-4 w-4 mr-2' />
                    Request New Branch
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-4'>
                <Building2 className='h-4 w-4' />
                <span>{branches.length} branches found</span>
              </div>
              <DataTable
                columns={columns}
                data={branches}
                searchable={true}
                pagination={true}
                itemsPerPage={10}
                onRowClick={handleRowClick}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Branch Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Branch Management</DialogTitle>
          </DialogHeader>
          {selectedBranch && (
            <Tabs defaultValue='overview' className='w-full'>
              <TabsList className='grid w-full grid-cols-5'>
                <TabsTrigger value='overview'>Overview</TabsTrigger>
                <TabsTrigger value='staff'>Staff</TabsTrigger>
                <TabsTrigger value='medicines'>Medicines</TabsTrigger>
                <TabsTrigger value='sales'>Sales</TabsTrigger>
                <TabsTrigger value='revenue'>Revenue</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value='overview' className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                      Branch ID
                    </label>
                    <p className='mt-1 text-sm text-slate-900 dark:text-slate-50'>
                      {selectedBranch.branch_id}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                      Location Name
                    </label>
                    <p className='mt-1 text-sm text-slate-900 dark:text-slate-50 font-medium'>
                      {selectedBranch.name}
                    </p>
                  </div>
                  <div className='col-span-2'>
                    <label className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                      Pharmacy Name
                    </label>
                    <p className='mt-1 text-sm text-slate-900 dark:text-slate-50 font-medium'>
                      {selectedBranch.pharmacy?.name ||
                        selectedBranch.pharmacy_name ||
                        selectedBranch.pharmacyName ||
                        'N/A'}
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4 pt-4 border-t'>
                  <div className='bg-slate-50 dark:bg-slate-800 p-3 rounded-lg'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-slate-900 dark:text-slate-50'>
                        Managers
                      </span>
                      <Users className='h-4 w-4 text-slate-600 dark:text-slate-400' />
                    </div>
                    <p className='mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50'>
                      {selectedBranch.total_managers || 0}
                    </p>
                  </div>
                  <div className='bg-slate-50 dark:bg-slate-800 p-3 rounded-lg'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-slate-900 dark:text-slate-50'>
                        Staff
                      </span>
                      <Users className='h-4 w-4 text-slate-600 dark:text-slate-400' />
                    </div>
                    <p className='mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50'>
                      {selectedBranch.total_staff || 0}
                    </p>
                  </div>
                </div>

                {selectedBranch.phone && (
                  <div>
                    <label className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                      Phone
                    </label>
                    <p className='mt-1 text-sm text-slate-900 dark:text-slate-50'>
                      {selectedBranch.phone}
                    </p>
                  </div>
                )}

                {selectedBranch.email && (
                  <div>
                    <label className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                      Email
                    </label>
                    <p className='mt-1 text-sm text-slate-900 dark:text-slate-50'>
                      {selectedBranch.email}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Staff Tab */}
              <TabsContent value='staff' className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold'>Staff Management</h3>
                  <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400'>
                    <Users className='h-4 w-4' />
                    <span>{selectedBranch.total_staff || 0} staff members</span>
                  </div>
                </div>
                <div className='bg-slate-50 dark:bg-slate-800 p-6 rounded-lg text-center'>
                  <Users className='h-12 w-12 mx-auto mb-3 text-slate-400' />
                  <p className='text-sm text-slate-600 dark:text-slate-400'>
                    Staff management features coming soon
                  </p>
                  <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>
                    View, add, edit, and manage branch staff members
                  </p>
                </div>
              </TabsContent>

              {/* Medicines Tab */}
              <TabsContent value='medicines' className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold'>Medicine Inventory</h3>
                  <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400'>
                    <Package className='h-4 w-4' />
                    <span>Inventory overview</span>
                  </div>
                </div>
                <div className='bg-slate-50 dark:bg-slate-800 p-6 rounded-lg text-center'>
                  <Package className='h-12 w-12 mx-auto mb-3 text-slate-400' />
                  <p className='text-sm text-slate-600 dark:text-slate-400'>
                    Medicine inventory features coming soon
                  </p>
                  <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>
                    View stock levels, add medicines, and manage inventory
                  </p>
                </div>
              </TabsContent>

              {/* Sales Tab */}
              <TabsContent value='sales' className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold'>Sales Overview</h3>
                  <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400'>
                    <ShoppingCart className='h-4 w-4' />
                    <span>Sales data</span>
                  </div>
                </div>
                <div className='bg-slate-50 dark:bg-slate-800 p-6 rounded-lg text-center'>
                  <ShoppingCart className='h-12 w-12 mx-auto mb-3 text-slate-400' />
                  <p className='text-sm text-slate-600 dark:text-slate-400'>
                    Sales tracking features coming soon
                  </p>
                  <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>
                    View sales history, transactions, and performance metrics
                  </p>
                </div>
              </TabsContent>

              {/* Revenue Tab */}
              <TabsContent value='revenue' className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold'>Revenue Analytics</h3>
                  <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400'>
                    <DollarSign className='h-4 w-4' />
                    <span>Financial data</span>
                  </div>
                </div>
                <div className='bg-slate-50 dark:bg-slate-800 p-6 rounded-lg text-center'>
                  <DollarSign className='h-12 w-12 mx-auto mb-3 text-slate-400' />
                  <p className='text-sm text-slate-600 dark:text-slate-400'>
                    Revenue analytics features coming soon
                  </p>
                  <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>
                    View revenue trends, profit margins, and financial reports
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Request Branch Modal */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request New Branch</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='request-name'>Branch Name *</Label>
              <Input
                id='request-name'
                value={branchRequest.branch_name}
                onChange={(e) => setBranchRequest({ ...branchRequest, branch_name: e.target.value })}
                placeholder='Enter branch name'
              />
            </div>
            <div>
              <Label htmlFor='request-location'>Location *</Label>
              <Input
                id='request-location'
                value={branchRequest.location}
                onChange={(e) => setBranchRequest({ ...branchRequest, location: e.target.value })}
                placeholder='Enter branch location'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='request-phone'>Phone</Label>
                <Input
                  id='request-phone'
                  value={branchRequest.phone}
                  onChange={(e) => setBranchRequest({ ...branchRequest, phone: e.target.value })}
                  placeholder='Enter phone number'
                />
              </div>
              <div>
                <Label htmlFor='request-email'>Email</Label>
                <Input
                  id='request-email'
                  type='email'
                  value={branchRequest.email}
                  onChange={(e) => setBranchRequest({ ...branchRequest, email: e.target.value })}
                  placeholder='Enter email'
                />
              </div>
            </div>
            <div>
              <Label htmlFor='request-reason'>Reason for Request *</Label>
              <Input
                id='request-reason'
                value={branchRequest.request_notes}
                onChange={(e) => setBranchRequest({ ...branchRequest, request_notes: e.target.value })}
                placeholder='Explain why you need this branch'
              />
            </div>
            <div className='bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800'>
              <p className='text-sm text-blue-900 dark:text-blue-100'>
                <strong>Note:</strong> Your branch request will be sent to the admin for approval.
                You will be notified once the request is reviewed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRequestModalOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleSubmitBranchRequest} disabled={processing}>
              {processing ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBranch?.branch_id ? 'Edit Branch' : 'Create New Branch'}
            </DialogTitle>
          </DialogHeader>
          {selectedBranch && (
            <div className='space-y-4'>
              <div className='grid grid-cols-1 gap-4'>
                <div>
                  <Label htmlFor='name'>Location Name</Label>
                  <Input
                    id='name'
                    value={selectedBranch.name}
                    onChange={(e) => setSelectedBranch({ ...selectedBranch, name: e.target.value })}
                    placeholder='Enter location name'
                  />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='phone'>Phone</Label>
                  <Input
                    id='phone'
                    value={selectedBranch.phone || ''}
                    onChange={(e) =>
                      setSelectedBranch({ ...selectedBranch, phone: e.target.value })
                    }
                    placeholder='Enter phone number'
                  />
                </div>
                <div>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    value={selectedBranch.email || ''}
                    onChange={(e) =>
                      setSelectedBranch({ ...selectedBranch, email: e.target.value })
                    }
                    placeholder='Enter email'
                  />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='managers'>Total Managers</Label>
                  <Input
                    id='managers'
                    type='number'
                    value={selectedBranch.total_managers || 0}
                    onChange={(e) =>
                      setSelectedBranch({
                        ...selectedBranch,
                        total_managers: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder='Enter number of managers'
                  />
                </div>
                <div>
                  <Label htmlFor='staff'>Total Staff</Label>
                  <Input
                    id='staff'
                    type='number'
                    value={selectedBranch.total_staff || 0}
                    onChange={(e) =>
                      setSelectedBranch({
                        ...selectedBranch,
                        total_staff: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder='Enter number of staff'
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditModalOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleSaveBranch} disabled={processing}>
              {processing ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>
          </DialogHeader>
          {selectedBranch && (
            <div className='space-y-4'>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Are you sure you want to delete the branch <strong>{selectedBranch.name}</strong>?
                This action cannot be undone.
              </p>
              <div className='bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800'>
                <p className='text-sm font-medium text-red-900 dark:text-red-100'>
                  Branch ID: {selectedBranch.branch_id}
                </p>
                <p className='text-sm font-medium text-red-900'>
                  Location Name: {selectedBranch.name}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDeleteModalOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleConfirmDelete} disabled={processing}>
              {processing ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerBranches;
