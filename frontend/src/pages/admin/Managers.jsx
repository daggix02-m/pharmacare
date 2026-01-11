import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StatusBadge from '@/components/common/StatusBadge';
import { adminService } from '@/services';
import {
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Pencil,
  Key,
  Eye,
  Info,
  Building,
} from 'lucide-react';

const AdminManagers = () => {
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, pending, activated
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [branches, setBranches] = useState([]);

  // Details modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [branchDetails, setBranchDetails] = useState(null);
  const [fetchingBranch, setFetchingBranch] = useState(false);

  // Confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [actionType, setActionType] = useState(''); // 'activate' or 'deactivate'
  const [processing, setProcessing] = useState(false);

  // Edit/Create modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    full_name: '',
    email: '',
    phone: '',
    branch_id: '',
  });

  // Password reset modal
  const [passwordResetModalOpen, setPasswordResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchManagers();
    fetchBranches();
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
  }, [managers, searchQuery, branchFilter]);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      let response;

      // If we are on the pending tab, we might want to try the dedicated pending endpoint
      // which often contains more registration-specific data
      if (activeTab === 'pending') {
        response = await adminService.getPendingManagers();
      } else {
        response = await adminService.getManagers();
      }

      if (response?.success) {
        let managersData = [];

        if (activeTab === 'pending') {
          // Dedicated endpoint might return data directly as an array or in a 'pending' key
          managersData =
            response.data?.pending || (Array.isArray(response.data) ? response.data : []);
        } else {
          // Main endpoint returns data as { all: [...], pending: [...], activated: [...] }
          if (response.data && typeof response.data === 'object') {
            if (activeTab === 'activated') {
              managersData = response.data.activated || [];
            } else {
              managersData = response.data.all || [];
            }
          }
        }

        setManagers(managersData);
      } else {
        toast.error(response?.message || 'Failed to load managers');
      }
    } catch (error) {
      toast.error('An error occurred while loading managers');
      console.error('Error fetching managers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await adminService.getBranchesList();
      if (response?.success) {
        const branchesData = response.data?.branches || response.branches || response.data || [];
        setBranches(branchesData);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const applyFilters = () => {
    // Ensure managers is an array before filtering
    const managersArray = Array.isArray(managers) ? managers : [];
    let filtered = [...managersArray];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          (m.full_name || m.name || '')?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.email || '')?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Branch filter
    if (branchFilter !== 'all') {
      const branchId = parseInt(branchFilter);
      filtered = filtered.filter((m) => {
        const managerBranchId = m.branch_id || m.branch?.id;
        return managerBranchId === branchId;
      });
    }

    setFilteredManagers(filtered);
  };

  const handleViewDetails = async (manager) => {
    setSelectedManager(manager);
    setDetailsModalOpen(true);
    setBranchDetails(null);

    // Only fetch branch details if it's an existing branch (ID is a number)
    const branchId = manager.branch_id || manager.branch?.id;
    if (branchId && !isNaN(branchId)) {
      try {
        setFetchingBranch(true);
        const response = await adminService.getBranchById(branchId);
        if (response.success) {
          setBranchDetails(response.data);
        }
      } catch (error) {
        console.error('Error fetching branch details:', error);
      } finally {
        setFetchingBranch(false);
      }
    } else {
      // If it's a new registration, the pharmacy info should be in the manager object itself
      console.log('New registration review - using manager object data');
    }
  };

  const handleActivateClick = (manager) => {
    setSelectedManager(manager);
    setActionType('activate');
    setConfirmModalOpen(true);
  };

  const handleDeactivateClick = (manager) => {
    setSelectedManager(manager);
    setActionType('deactivate');
    setConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedManager) return;

    try {
      setProcessing(true);
      let response;

      if (actionType === 'activate') {
        response = await adminService.activateManager(selectedManager.user_id);
      } else {
        response = await adminService.deactivateManager(selectedManager.user_id);
      }

      if (response.success) {
        toast.success(
          actionType === 'activate'
            ? 'Manager activated successfully'
            : 'Manager deactivated successfully'
        );
        setConfirmModalOpen(false);
        fetchManagers();
      } else {
        toast.error(response.message || `Failed to ${actionType} manager`);
      }
    } catch (error) {
      toast.error(
        `An error occurred while ${actionType === 'activate' ? 'activating' : 'deactivating'} manager`
      );
      console.error('Error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusFromManager = (manager) => {
    if (manager.is_active) return 'Active';
    if (manager.pending_activation) return 'Pending';
    return 'Inactive';
  };

  const getPharmacyInfo = (manager, branchDetails) => {
    if (!manager) return { hasData: false };

    // Priority:
    // 1. branchDetails (from API fetch by ID)
    // 2. manager.branch (nested object)
    // 3. manager itself (for pending registrations)
    const source = branchDetails || manager.branch || manager;

    // Exhaustive list of possible keys from various versions of backend/frontend
    // Separate Pharmacy Name and Branch Name correctly
    const pharmacyName =
      branchDetails?.pharmacy_name ||
      branchDetails?.pharmacyName ||
      manager.pharmacy_name ||
      manager.pharmacyName ||
      manager.pharmacy ||
      manager.branch?.pharmacy_name ||
      'N/A';

    const branchName =
      branchDetails?.branch_name ||
      branchDetails?.branchName ||
      manager.branch_name ||
      manager.branchName ||
      // If we only have 'name' from branchDetails, it's likely the branch name
      branchDetails?.name ||
      manager.branch?.name ||
      manager.branch?.branch_name ||
      'N/A';

    const location =
      branchDetails?.location ||
      branchDetails?.branchLocation ||
      manager.branch_location ||
      manager.branchLocation ||
      manager.branch?.location ||
      manager.location ||
      manager.address ||
      manager.branch_address ||
      'N/A';

    const phone =
      branchDetails?.phone ||
      manager.branch_phone ||
      manager.branchPhone ||
      manager.phone ||
      manager.branch?.phone ||
      manager.contact_number ||
      'N/A';

    const email =
      branchDetails?.email ||
      manager.branch_email ||
      manager.branchEmail ||
      manager.branch?.email ||
      'N/A';

    const hasData =
      pharmacyName !== 'N/A' || branchName !== 'N/A' || location !== 'N/A' || phone !== 'N/A';

    return {
      pharmacyName,
      branchName,
      location,
      phone,
      email,
      hasData,
    };
  };

  const handleCreateManager = () => {
    const newFormData = {
      user_id: '',
      full_name: '',
      email: '',
      phone: '',
      branch_id: '',
    };
    console.log('[DEBUG] Creating new manager, formData:', newFormData);
    console.log('[DEBUG] formData.branch_id type:', typeof newFormData.branch_id);
    setFormData(newFormData);
    setEditModalOpen(true);
  };

  const handleEditManager = (manager) => {
    setFormData({
      user_id: manager.user_id || manager.id,
      full_name: manager.full_name || manager.name || '',
      email: manager.email || '',
      phone: manager.phone || '',
      branch_id: manager.branch_id || manager.branch?.id || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveManager = async () => {
    try {
      setProcessing(true);
      let response;

      if (formData.user_id) {
        response = await adminService.updateManager(formData.user_id, formData);
      } else {
        response = await adminService.createManager(formData);
      }

      if (response.success) {
        toast.success(
          formData.user_id ? 'Manager updated successfully' : 'Manager created successfully'
        );
        setEditModalOpen(false);
        fetchManagers();
      } else {
        toast.error(response.message || 'Failed to save manager');
      }
    } catch (error) {
      toast.error('An error occurred while saving manager');
      console.error('Error saving manager:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePasswordReset = (manager) => {
    setSelectedManager(manager);
    setNewPassword('');
    setPasswordResetModalOpen(true);
  };

  const handleConfirmPasswordReset = async () => {
    if (!selectedManager || !selectedManager.user_id || !newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    try {
      setProcessing(true);
      const response = await adminService.resetManagerPassword(selectedManager.user_id, {
        new_password: newPassword,
      });

      if (response.success) {
        toast.success('Password reset successfully');
        setPasswordResetModalOpen(false);
      } else {
        toast.error(response.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('An error occurred while resetting password');
      console.error('Error resetting password:', error);
    } finally {
      setProcessing(false);
    }
  };

  const tabs = [
    { value: 'all', label: 'All Managers' },
    { value: 'pending', label: 'Pending' },
    { value: 'activated', label: 'Activated' },
  ];

  const pharmacyInfo = getPharmacyInfo(selectedManager, branchDetails);

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
                  <CardTitle className='text-slate-900 dark:text-slate-50'>Manager Management</CardTitle>
                  <CardDescription>
                    View, review, activate, deactivate, and manage pharmacy managers
                  </CardDescription>
                </div>
                <Button onClick={handleCreateManager} className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'>
                  <Plus className='h-4 w-4 mr-2' />
                  Add Manager
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Tabs */}
              <div className='flex space-x-1 border-b mb-6'>
                {tabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.value
                        ? 'border-b-2 border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div className='flex gap-4 mb-6'>
                <div className='relative flex-1 max-w-sm'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4' />
                  <Input
                    placeholder='Search by name or email...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className='w-[200px]'>
                    <SelectValue placeholder='Filter by branch' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Branches</SelectItem>
                    {branches.map((branch, index) => {
                      const branchId = branch.branch_id || branch.id || index;
                      console.log('[DEBUG] Filter branch item:', { branch, branchId, index });
                      return (
                        <SelectItem
                          key={branchId}
                          value={branchId.toString()}
                        >
                          {branch.name || branch.branch_name || 'Unnamed Branch'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Managers Table */}
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredManagers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center py-8 text-slate-500 dark:text-slate-400'>
                          {searchQuery || branchFilter !== 'all'
                            ? 'No managers found matching your filters'
                            : 'No managers found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredManagers.map((manager) => (
                        <TableRow key={manager.user_id || manager.id}>
                          <TableCell className='font-medium'>
                            {manager.full_name || manager.name || 'N/A'}
                          </TableCell>
                          <TableCell>{manager.email || 'N/A'}</TableCell>
                          <TableCell>
                            {manager.branch_name || manager.branch?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={getStatusFromManager(manager)} />
                          </TableCell>
                          <TableCell>
                            {manager.created_at
                              ? new Date(manager.created_at).toLocaleDateString()
                              : manager.createdAt
                                ? new Date(manager.createdAt).toLocaleDateString()
                                : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className='flex gap-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => handleViewDetails(manager)}
                                title='Review Details'
                              >
                                <Eye className='h-3 w-3 mr-1' />
                                Review
                              </Button>
                              {!manager.is_active ? (
                                <Button
                                  size='sm'
                                  variant='default'
                                  onClick={() => handleActivateClick(manager)}
                                  className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
                                >
                                  <CheckCircle className='h-3 w-3 mr-1' />
                                  Activate
                                </Button>
                              ) : (
                                <Button
                                  size='sm'
                                  variant='destructive'
                                  onClick={() => handleDeactivateClick(manager)}
                                >
                                  <XCircle className='h-3 w-3 mr-1' />
                                  Deactivate
                                </Button>
                              )}
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => handleEditManager(manager)}
                              >
                                <Pencil className='h-3 w-3 mr-1' />
                                Edit
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => handlePasswordReset(manager)}
                              >
                                <Key className='h-3 w-3 mr-1' />
                                Reset
                              </Button>
                            </div>
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

      {/* Manager & Pharmacy Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Info className='h-5 w-5 text-primary' />
              Manager Details
            </DialogTitle>
            <DialogDescription>
              View manager and pharmacy information
            </DialogDescription>
          </DialogHeader>

          {selectedManager && (
            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Manager Details */}
                <Card className='border-slate-200 dark:border-slate-800'>
                  <CardHeader className='bg-slate-50 dark:bg-slate-900/50 py-3'>
                    <CardTitle className='text-sm flex items-center gap-2'>
                      <Info className='h-4 w-4' /> Manager Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-4 space-y-3'>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground uppercase'>
                        Full Name
                      </label>
                      <p className='text-sm font-semibold'>
                        {selectedManager.full_name || selectedManager.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground uppercase'>
                        Email Address
                      </label>
                      <p className='text-sm font-semibold'>{selectedManager.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground uppercase'>
                        Phone Number
                      </label>
                      <p className='text-sm'>
                        {selectedManager.phone || selectedManager.manager_phone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground uppercase'>
                        Registration Date
                      </label>
                      <p className='text-sm'>
                        {selectedManager.created_at
                          ? new Date(selectedManager.created_at).toLocaleDateString(undefined, {
                              dateStyle: 'long',
                            })
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className='text-xs font-medium text-muted-foreground uppercase'>
                        Status
                      </label>
                      <div className='mt-1'>
                        <StatusBadge status={getStatusFromManager(selectedManager)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pharmacy/Branch Details */}
                <Card className='border-slate-200 dark:border-slate-800'>
                  <CardHeader className='bg-slate-50 dark:bg-slate-900/50 py-3'>
                    <CardTitle className='text-sm flex items-center gap-2'>
                      <Building className='h-4 w-4' /> Pharmacy Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='pt-4 space-y-3'>
                    {fetchingBranch ? (
                      <div className='flex items-center justify-center py-8'>
                        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600 dark:border-slate-400'></div>
                      </div>
                    ) : !pharmacyInfo.hasData ? (
                      <div className='py-8 text-center text-muted-foreground italic text-sm border-2 border-dashed rounded-lg'>
                        <p>No pharmacy information found in this request.</p>
                        <p className='text-[10px] mt-2 opacity-50 font-mono'>
                          Check registration data for ID:{' '}
                          {selectedManager.user_id || selectedManager.id}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className='text-xs font-medium text-muted-foreground uppercase'>
                            Pharmacy Name
                          </label>
                          <p className='text-sm font-semibold text-slate-900 dark:text-slate-50'>
                            {pharmacyInfo.pharmacyName}
                          </p>
                        </div>
                        <div>
                          <label className='text-xs font-medium text-muted-foreground uppercase'>
                            Branch Name
                          </label>
                          <p className='text-sm font-semibold'>{pharmacyInfo.branchName}</p>
                        </div>
                        <div>
                          <label className='text-xs font-medium text-muted-foreground uppercase'>
                            Location
                          </label>
                          <p className='text-sm font-medium'>{pharmacyInfo.location}</p>
                        </div>
                        <div>
                          <label className='text-xs font-medium text-muted-foreground uppercase'>
                            Contact Info
                          </label>
                          <div className='flex flex-col gap-1 mt-1'>
                            <p className='text-sm flex items-center gap-2'>
                              <span className='text-muted-foreground font-medium'>Phone:</span>
                              {pharmacyInfo.phone}
                            </p>
                            <p className='text-sm flex items-center gap-2'>
                              <span className='text-muted-foreground font-medium'>Email:</span>
                              {pharmacyInfo.email}
                            </p>
                          </div>
                        </div>
                        {(branchDetails ||
                          (selectedManager.branch &&
                            typeof selectedManager.branch === 'object')) && (
                          <div className='grid grid-cols-2 gap-2 pt-2 border-t mt-2'>
                            <div className='bg-slate-50 dark:bg-slate-800 p-2 rounded text-center'>
                              <p className='text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase'>Staff</p>
                              <p className='text-lg font-bold text-slate-900 dark:text-slate-50'>
                                {branchDetails?.total_staff ||
                                  selectedManager.branch?.total_staff ||
                                  0}
                              </p>
                            </div>
                            <div className='bg-slate-50 dark:bg-slate-800 p-2 rounded text-center'>
                              <p className='text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase'>
                                Managers
                              </p>
                              <p className='text-lg font-bold text-slate-900 dark:text-slate-50'>
                                {branchDetails?.total_managers ||
                                  selectedManager.branch?.total_managers ||
                                  0}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <DialogFooter className='mt-6 gap-2'>
            <Button variant='outline' onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>
            {!selectedManager?.is_active && (
              <Button
                onClick={() => {
                  setDetailsModalOpen(false);
                  handleActivateClick(selectedManager);
                }}
                className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 gap-2'
              >
                <CheckCircle className='h-4 w-4' />
                Activate Manager
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'activate' ? 'Activate Manager' : 'Deactivate Manager'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'activate'
                ? 'Are you sure you want to activate this manager? They will gain access to their branch management features.'
                : 'Are you sure you want to deactivate this manager? They will lose access to the system.'}
            </DialogDescription>
          </DialogHeader>
          {selectedManager && (
            <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-2'>
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-4 w-4 text-slate-600 dark:text-slate-400' />
                <span className='text-sm font-medium'>Manager Details</span>
              </div>
              <p className='text-sm'>
                <span className='font-medium'>Name:</span>{' '}
                {selectedManager.full_name || selectedManager.name || 'N/A'}
              </p>
              <p className='text-sm'>
                <span className='font-medium'>Email:</span> {selectedManager.email || 'N/A'}
              </p>
              <p className='text-sm'>
                <span className='font-medium'>Branch:</span>{' '}
                {selectedManager.branch_name || selectedManager.branch?.name || 'N/A'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setConfirmModalOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={processing}
              variant={actionType === 'activate' ? 'default' : 'destructive'}
            >
              {processing
                ? 'Processing...'
                : actionType === 'activate'
                  ? 'Activate Manager'
                  : 'Deactivate Manager'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Manager Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formData.user_id ? 'Edit Manager' : 'Create New Manager'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='full_name'>Full Name</Label>
              <Input
                id='full_name'
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder='Enter full name'
              />
            </div>
            <div>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder='Enter email'
              />
            </div>
            <div>
              <Label htmlFor='phone'>Phone</Label>
              <Input
                id='phone'
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder='Enter phone number'
              />
            </div>
            <div>
              <Label htmlFor='branch'>Branch</Label>
              <Select
                value={formData.branch_id?.toString() || ''}
                onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
              >
                <SelectTrigger id='branch'>
                  <SelectValue placeholder='Select branch' />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch, index) => {
                    const branchId = branch.branch_id || branch.id || index;
                    console.log('[DEBUG] Branch item:', { branch, branchId, index });
                    return (
                      <SelectItem
                        key={branchId}
                        value={branchId.toString()}
                      >
                        {branch.name || branch.branch_name || 'Unnamed Branch'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditModalOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleSaveManager} disabled={processing}>
              {processing ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal */}
      <Dialog open={passwordResetModalOpen} onOpenChange={setPasswordResetModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Manager Password</DialogTitle>
          </DialogHeader>
          {selectedManager && (
            <div className='space-y-4'>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Reset password for{' '}
                <strong>{selectedManager.full_name || selectedManager.name}</strong>
              </p>
              <div>
                <Label htmlFor='new_password'>New Password</Label>
                <Input
                  id='new_password'
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder='Enter new password'
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setPasswordResetModalOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmPasswordReset} disabled={processing}>
              {processing ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManagers;
