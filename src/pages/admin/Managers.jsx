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
  ShieldCheck,
  RefreshCw,
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

  // Verification modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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

      console.log('[DEBUG] fetchManagers - Full API response:', response);

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

        console.log('[DEBUG] fetchManagers - Extracted managersData:', managersData);
        if (managersData.length > 0) {
          console.log('[DEBUG] fetchManagers - First manager sample:', managersData[0]);
          console.log('[DEBUG] fetchManagers - First manager keys:', Object.keys(managersData[0]));
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
    console.log('[DEBUG] handleViewDetails - manager object:', manager);
    setSelectedManager(manager);
    setDetailsModalOpen(true);
    setBranchDetails(null);

    // Try to fetch more complete manager details first
    const userId = manager.user_id || manager.id;
    if (userId) {
      try {
        setFetchingBranch(true);
        const managerResponse = await adminService.getManagerById(userId);
        console.log('[DEBUG] getManagerById response:', managerResponse);
        if (managerResponse.success && managerResponse.data) {
          // Merge the fetched data with existing manager data
          const completeManager = { ...manager, ...managerResponse.data };
          setSelectedManager(completeManager);
          console.log('[DEBUG] Updated selectedManager:', completeManager);
        }
      } catch (error) {
        console.error('Error fetching manager details:', error);
      }
    }

    // Also fetch branch details if it's an existing branch (ID is a number)
    const branchId = manager.branch_id || manager.branch?.id;
    if (branchId && !isNaN(branchId)) {
      try {
        const response = await adminService.getBranchById(branchId);
        console.log('[DEBUG] getBranchById response:', response);
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
      console.log('[DEBUG] New registration review - using manager object data');
      setFetchingBranch(false);
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
        // For activation, we now send a verification code first
        response = await adminService.sendVerificationCode(selectedManager.email);
        
        if (response.success) {
          toast.success(`Verification code sent to ${selectedManager.email}`);
          setConfirmModalOpen(false);
          setVerificationCode('');
          setVerifyModalOpen(true);
        } else if (response.message === 'Email is already verified') {
          // If already verified, skip the code step and activate directly
          const userId = selectedManager.user_id || selectedManager.id;
          const activateResponse = await adminService.activateManager(userId);
          
          if (activateResponse.success) {
            toast.success('Manager activated successfully (Email already verified)');
            setConfirmModalOpen(false);
            fetchManagers();
          } else {
            toast.error(activateResponse.message || 'Failed to activate manager');
          }
        } else {
          toast.error(response.message || 'Failed to send verification code');
        }
      } else {
        const userId = selectedManager.user_id || selectedManager.id;
        response = await adminService.deactivateManager(userId);
        
        if (response.success) {
          toast.success('Manager deactivated successfully');
          setConfirmModalOpen(false);
          fetchManagers();
        } else {
          toast.error(response.message || 'Failed to deactivate manager');
        }
      }
    } catch (error) {
      toast.error(
        `An error occurred while ${actionType === 'activate' ? 'sending verification code' : 'deactivating'} manager`
      );
      console.error('Error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }

    try {
      setIsVerifying(true);
      const response = await adminService.verifyManagerCode(selectedManager.email, verificationCode);

      if (response.success) {
        // After successful code verification, we finalize activation
        const userId = selectedManager.user_id || selectedManager.id;
        const activateResponse = await adminService.activateManager(userId);
        
        if (activateResponse.success) {
          toast.success('Manager verified and activated successfully!');
          setVerifyModalOpen(false);
          setVerificationCode('');
          fetchManagers();
        } else {
          toast.error(activateResponse.message || 'Verification succeeded but activation failed');
        }
      } else {
        toast.error(response.message || 'Invalid or expired verification code');
      }
    } catch (error) {
      toast.error('An error occurred during verification');
      console.error('Verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setProcessing(true);
      const response = await adminService.sendVerificationCode(selectedManager.email);
      if (response.success) {
        toast.success('Verification code resent successfully!');
      } else {
        toast.error(response.message || 'Failed to resend code');
      }
    } catch (error) {
      toast.error('An error occurred while resending the code');
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

    // Debug: Log the manager object to see what fields are available
    console.log('[DEBUG] getPharmacyInfo - manager:', manager);
    console.log('[DEBUG] getPharmacyInfo - branchDetails:', branchDetails);

    // Check for nested registration data or user object
    const regData = manager.registration_data || manager.registrationData || manager.user || {};

    // Priority for pharmacy name (from registration or branch details):
    // 1. Manager's registration data (pharmacy_name, pharmacyName)
    // 2. Nested registration_data object
    // 3. Branch details from API fetch
    // 4. Nested branch object
    // 5. Pharmacy object
    const pharmacyName =
      manager.pharmacy_name ||
      manager.pharmacyName ||
      manager.pharmacy ||
      regData.pharmacy_name ||
      regData.pharmacyName ||
      branchDetails?.pharmacy_name ||
      branchDetails?.pharmacyName ||
      branchDetails?.pharmacy?.name ||
      manager.branch?.pharmacy_name ||
      manager.branch?.pharmacyName ||
      manager.branch?.pharmacy?.name ||
      manager.pharmacy?.name ||
      'N/A';

    // Priority for branch/location name:
    // 1. Manager's registration data (branch_name, branchName, location)
    // 2. Nested registration_data object
    // 3. Branch details from API fetch
    // 4. Nested branch object
    const branchName =
      manager.branch_name ||
      manager.branchName ||
      manager.location ||
      regData.branch_name ||
      regData.branchName ||
      regData.location ||
      branchDetails?.branch_name ||
      branchDetails?.branchName ||
      branchDetails?.name ||
      branchDetails?.location ||
      manager.branch?.name ||
      manager.branch?.branch_name ||
      manager.branch?.branchName ||
      manager.branch?.location ||
      'N/A';

    // Priority for phone:
    // 1. Manager's phone from registration (goes to branch)
    // 2. Nested registration_data object
    // 3. Explicit branch_phone field
    // 4. Branch details phone
    // 5. Nested branch object phone
    const phone =
      manager.phone ||
      manager.branch_phone ||
      manager.branchPhone ||
      manager.contact_phone ||
      regData.phone ||
      regData.branch_phone ||
      branchDetails?.phone ||
      manager.branch?.phone ||
      manager.contact_number ||
      'N/A';

    // Priority for email:
    // 1. Branch email from registration
    // 2. Nested registration_data object
    // 3. Branch details email
    // 4. Nested branch object email
    const email =
      manager.branch_email ||
      manager.branchEmail ||
      regData.branch_email ||
      regData.branchEmail ||
      branchDetails?.email ||
      manager.branch?.email ||
      'N/A';

    console.log('[DEBUG] getPharmacyInfo - result:', { pharmacyName, branchName, phone, email });

    const hasData = pharmacyName !== 'N/A' || branchName !== 'N/A' || phone !== 'N/A';

    return {
      pharmacyName,
      branchName,
      phone,
      email,
      hasData,
    };
  };

  const handleEditManager = (manager) => {
    setFormData({
      user_id: manager.user_id || manager.id,
      full_name: manager.full_name || manager.name || '',
      email: manager.email || '',
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
        // Creation logic removed as per requirements
        toast.error('Creating new managers is not allowed');
        setProcessing(false);
        return;
      }

      if (response.success) {
        toast.success('Manager updated successfully');
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
                  <CardTitle className='text-slate-900 dark:text-slate-50'>
                    Manager Management
                  </CardTitle>
                  <CardDescription>
                    View, review, activate, deactivate, and manage pharmacy managers
                  </CardDescription>
                </div>
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
                        <SelectItem key={branchId} value={branchId.toString()}>
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
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredManagers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className='text-center py-8 text-slate-500 dark:text-slate-400'
                        >
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
                            {manager.branch_name ||
                              manager.branchName ||
                              manager.location ||
                              manager.branch?.name ||
                              'N/A'}
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
            <DialogDescription>View manager and pharmacy information</DialogDescription>
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
                            Location Name
                          </label>
                          <p className='text-sm font-semibold'>{pharmacyInfo.branchName}</p>
                        </div>
                        <div>
                          <label className='text-xs font-medium text-muted-foreground uppercase'>
                            Contact Info
                          </label>
                          <div className='flex flex-col gap-1 mt-1'>
                            <p className='text-sm flex items-center gap-2'>
                              <span className='text-muted-foreground font-medium'>Phone:</span>
                              {pharmacyInfo.phone !== 'N/A' ? pharmacyInfo.phone : 'Not provided'}
                            </p>
                            <p className='text-sm flex items-center gap-2'>
                              <span className='text-muted-foreground font-medium'>Email:</span>
                              {pharmacyInfo.email !== 'N/A' ? pharmacyInfo.email : 'Not provided'}
                            </p>
                          </div>
                        </div>
                        {(branchDetails ||
                          (selectedManager.branch &&
                            typeof selectedManager.branch === 'object')) && (
                          <div className='grid grid-cols-2 gap-2 pt-2 border-t mt-2'>
                            <div className='bg-slate-50 dark:bg-slate-800 p-2 rounded text-center'>
                              <p className='text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase'>
                                Staff
                              </p>
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
                ? 'Are you sure you want to activate this manager? A unique verification code will be sent to their registered email address, and you will need to enter it to complete the activation.'
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
                <span className='font-medium'>Pharmacy:</span>{' '}
                {selectedManager.pharmacy_name ||
                  selectedManager.pharmacyName ||
                  selectedManager.pharmacy ||
                  selectedManager.branch?.pharmacy_name ||
                  'N/A'}
              </p>
              <p className='text-sm'>
                <span className='font-medium'>Location:</span>{' '}
                {selectedManager.branch_name ||
                  selectedManager.branchName ||
                  selectedManager.location ||
                  selectedManager.branch?.name ||
                  'N/A'}
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

      {/* Verification Modal */}
      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent className='sm:max-w-[450px]'>
          <DialogHeader className='border-b border-slate-200 dark:border-slate-800 pb-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
                <ShieldCheck className='h-5 w-5 text-blue-600 dark:text-blue-400' />
              </div>
              <div>
                <DialogTitle className='text-xl'>Verify Activation</DialogTitle>
                <DialogDescription>
                  Enter the 6-digit code sent to{' '}
                  <span className='font-semibold text-slate-900 dark:text-slate-100'>
                    {selectedManager?.email}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleVerifyCode} className='space-y-6 py-4'>
            <div className='space-y-4'>
              <div className='space-y-3'>
                <Label
                  htmlFor='verification_code'
                  className='text-sm font-medium text-center block'
                >
                  Enter 6-Digit Verification Code
                </Label>
                <Input
                  id='verification_code'
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder='000000'
                  maxLength={6}
                  className='text-center text-3xl tracking-[0.5em] font-mono h-16 border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500'
                  autoComplete='off'
                />
              </div>

              {/* Resend Helper */}
              <p className='text-xs text-center text-slate-500 dark:text-slate-400'>
                Didn&apos;t receive the code?{' '}
                <button
                  type='button'
                  onClick={handleResendCode}
                  disabled={processing || isVerifying}
                  className='text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline'
                >
                  {processing ? 'Sending...' : 'Resend Code'}
                </button>
              </p>
            </div>

            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setVerifyModalOpen(false);
                  setVerificationCode('');
                }}
                disabled={isVerifying}
                className='w-full sm:w-auto'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isVerifying || verificationCode.length !== 6}
                className='w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white'
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className='h-4 w-4 mr-2' />
                    Verify & Activate
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
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
              <Label htmlFor='branch'>Location Name (Read Only)</Label>
              <Select
                value={formData.branch_id?.toString() || ''}
                onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                disabled={true}
              >
                <SelectTrigger
                  id='branch'
                  className='bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed opacity-70'
                >
                  <SelectValue placeholder='Select branch' />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch, index) => {
                    const branchId = branch.branch_id || branch.id || index;
                    // console.log('[DEBUG] Branch item:', { branch, branchId, index });
                    return (
                      <SelectItem key={branchId} value={branchId.toString()}>
                        {branch.name || branch.branch_name || 'Unnamed Branch'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground mt-1'>
                Manager assignment to branches cannot be changed after registration.
              </p>
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
