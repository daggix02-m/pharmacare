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
  Pencil,
  Key,
  Eye,
  Info,
  Building2,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';

// ============================================================================
// DATA LAYER - Modular fetching with easy endpoint swap capability
// ============================================================================

/**
 * Transform manager data to pharmacy-centric structure
 * This abstraction layer allows easy swap to future /admin/pharmacies endpoint
 */
const transformManagerToPharmacy = (manager) => {
  const regData = manager.registration_data || manager.registrationData || manager.user || {};

  return {
    pharmacyId: manager.user_id || manager.id,
    pharmacyName:
      manager.pharmacy_name ||
      manager.pharmacyName ||
      manager.pharmacy ||
      regData.pharmacy_name ||
      regData.pharmacyName ||
      'N/A',
    manager: {
      id: manager.user_id || manager.id,
      name: manager.full_name || manager.name || 'N/A',
      email: manager.email || 'N/A',
      status: manager.is_active ? 'Active' : manager.pending_activation ? 'Pending' : 'Inactive',
    },
    branch: {
      id: manager.branch_id || manager.branch?.id,
      name:
        manager.branch_name ||
        manager.branchName ||
        manager.location ||
        regData.branch_name ||
        regData.branchName ||
        regData.location ||
        manager.branch?.name ||
        'N/A',
      phone:
        manager.phone ||
        manager.branch_phone ||
        manager.contact_phone ||
        regData.phone ||
        manager.branch?.phone ||
        'N/A',
      email:
        manager.branch_email ||
        manager.branchEmail ||
        regData.branch_email ||
        regData.branchEmail ||
        manager.branch?.email ||
        'N/A',
      totalStaff: manager.total_staff || manager.branch?.total_staff || 0,
      totalManagers: manager.total_managers || manager.branch?.total_managers || 0,
    },
    status: manager.is_active ? 'Active' : manager.pending_activation ? 'Pending' : 'Inactive',
    createdAt: manager.created_at || manager.createdAt,
    isActive: manager.is_active,
    isPending: manager.pending_activation,
  };
};

/**
 * Fetch pharmacies data
 * TODO: Replace with /admin/pharmacies endpoint when available
 */
const fetchPharmaciesData = async (tab = 'all') => {
  if (tab === 'pending') {
    return await adminService.getPendingManagers();
  } else if (tab === 'activated') {
    return await adminService.getActivatedManagers();
  }
  return await adminService.getManagers();
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AdminPharmacies = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, pending, activated
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [branches, setBranches] = useState([]);

  // Details modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [branchDetails, setBranchDetails] = useState(null);
  const [fetchingBranch, setFetchingBranch] = useState(false);

  // Verification modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [actionType, setActionType] = useState(''); // 'activate', 'deactivate', 'delete'
  const [processing, setProcessing] = useState(false);

  // Edit/Create modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    pharmacy_name: '',
    full_name: '',
    email: '',
    branch_id: '',
  });

  // Password reset modal
  const [passwordResetModalOpen, setPasswordResetModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    fetchPharmacies();
    fetchBranches();
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
  }, [pharmacies, searchQuery, branchFilter]);

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      const response = await fetchPharmaciesData(activeTab);

      console.log('[DEBUG] fetchPharmacies - Full API response:', response);

      if (response?.success) {
        let managersData = [];

        if (activeTab === 'pending') {
          managersData = response.data?.pending || (Array.isArray(response.data) ? response.data : []);
        } else {
          if (response.data && typeof response.data === 'object') {
            if (activeTab === 'activated') {
              managersData = response.data.activated || [];
            } else {
              managersData = response.data.all || [];
            }
          }
        }

        // Transform to pharmacy-centric structure
        const pharmaciesData = managersData.map(transformManagerToPharmacy);
        setPharmacies(pharmaciesData);
      } else {
        toast.error(response?.message || 'Failed to load pharmacies');
      }
    } catch (error) {
      toast.error('An error occurred while loading pharmacies');
      console.error('Error fetching pharmacies:', error);
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
    const pharmaciesArray = Array.isArray(pharmacies) ? pharmacies : [];
    let filtered = [...pharmaciesArray];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.pharmacyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.manager.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.manager.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Branch filter
    if (branchFilter !== 'all') {
      const branchId = parseInt(branchFilter);
      filtered = filtered.filter((p) => p.branch.id === branchId);
    }

    setFilteredPharmacies(filtered);
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleViewDetails = async (pharmacy) => {
    console.log('[DEBUG] handleViewDetails - pharmacy object:', pharmacy);
    setSelectedPharmacy(pharmacy);
    setDetailsModalOpen(true);
    setBranchDetails(null);

    // Fetch complete manager details
    const userId = pharmacy.manager.id;
    if (userId) {
      try {
        setFetchingBranch(true);
        const managerResponse = await adminService.getManagerById(userId);
        console.log('[DEBUG] getManagerById response:', managerResponse);
        if (managerResponse.success && managerResponse.data) {
          const completeManager = { ...pharmacy, ...managerResponse.data };
          setSelectedPharmacy(transformManagerToPharmacy(completeManager));
        }
      } catch (error) {
        console.error('Error fetching manager details:', error);
      }
    }

    // Fetch branch details
    const branchId = pharmacy.branch.id;
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
      setFetchingBranch(false);
    }
  };

  const handleActivateClick = (pharmacy) => {
    setSelectedManager(pharmacy.manager);
    setActionType('activate');
    setConfirmModalOpen(true);
  };

  const handleDeactivateClick = (pharmacy) => {
    setSelectedManager(pharmacy.manager);
    setActionType('deactivate');
    setConfirmModalOpen(true);
  };

  const handleDeleteClick = (pharmacy) => {
    setSelectedManager(pharmacy.manager);
    setActionType('delete');
    setConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedManager) return;

    try {
      setProcessing(true);
      let response;

      if (actionType === 'activate') {
        // Send verification code first
        response = await adminService.sendVerificationCode(selectedManager.email);

        if (response.success) {
          toast.success(`Verification code sent to ${selectedManager.email}`);
          setConfirmModalOpen(false);
          setVerificationCode('');
          setVerifyModalOpen(true);
        } else if (response.message === 'Email is already verified') {
          // If already verified, skip the code step and activate directly
          const activateResponse = await adminService.activateManager(selectedManager.id);

          if (activateResponse.success) {
            toast.success('Pharmacy activated successfully (Email already verified)');
            setConfirmModalOpen(false);
            fetchPharmacies();
          } else {
            toast.error(activateResponse.message || 'Failed to activate pharmacy');
          }
        } else {
          toast.error(response.message || 'Failed to send verification code');
        }
      } else if (actionType === 'deactivate') {
        response = await adminService.deactivateManager(selectedManager.id);

        if (response.success) {
          toast.success('Pharmacy deactivated successfully');
          setConfirmModalOpen(false);
          fetchPharmacies();
        } else {
          toast.error(response.message || 'Failed to deactivate pharmacy');
        }
      } else if (actionType === 'delete') {
        // Delete pharmacy by deactivating the associated manager
        response = await adminService.deactivateManager(selectedManager.id);

        if (response.success) {
          toast.success('Pharmacy deleted successfully (Manager deactivated)');
          setConfirmModalOpen(false);
          fetchPharmacies();
        } else {
          toast.error(response.message || 'Failed to delete pharmacy');
        }
      }
    } catch (error) {
      toast.error(
        `An error occurred while ${actionType === 'activate' ? 'activating' : actionType === 'delete' ? 'deleting' : 'deactivating'} pharmacy`
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
        // After successful code verification, finalize activation
        const activateResponse = await adminService.activateManager(selectedManager.id);

        if (activateResponse.success) {
          toast.success('Pharmacy verified and activated successfully!');
          setVerifyModalOpen(false);
          setVerificationCode('');
          fetchPharmacies();
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

  const handleEditPharmacy = (pharmacy) => {
    setFormData({
      user_id: pharmacy.manager.id,
      pharmacy_name: pharmacy.pharmacyName,
      full_name: pharmacy.manager.name,
      email: pharmacy.manager.email,
      branch_id: pharmacy.branch.id,
    });
    setEditModalOpen(true);
  };

  const handleSavePharmacy = async () => {
    try {
      setProcessing(true);
      let response;

      if (formData.user_id) {
        response = await adminService.updateManager(formData.user_id, formData);
      } else {
        toast.error('Creating new pharmacies is not allowed');
        setProcessing(false);
        return;
      }

      if (response.success) {
        toast.success('Pharmacy updated successfully');
        setEditModalOpen(false);
        fetchPharmacies();
      } else {
        toast.error(response.message || 'Failed to save pharmacy');
      }
    } catch (error) {
      toast.error('An error occurred while saving pharmacy');
      console.error('Error saving pharmacy:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePasswordReset = (pharmacy) => {
    setSelectedManager(pharmacy.manager);
    setNewPassword('');
    setPasswordResetModalOpen(true);
  };

  const handleConfirmPasswordReset = async () => {
    if (!selectedManager || !selectedManager.id || !newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    try {
      setProcessing(true);
      const response = await adminService.resetManagerPassword(selectedManager.id, {
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
    { value: 'all', label: 'All Pharmacies' },
    { value: 'pending', label: 'Pending' },
    { value: 'activated', label: 'Activated' },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

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
                  <CardTitle className='text-slate-900 dark:text-slate-50 flex items-center gap-2'>
                    <Building2 className='h-6 w-6 text-slate-600 dark:text-slate-400' />
                    Pharmacy List
                  </CardTitle>
                  <CardDescription>
                    View, manage, activate, deactivate, and delete pharmacies across the system
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
                    placeholder='Search by pharmacy name, manager name, or email...'
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
                      return (
                        <SelectItem key={branchId} value={branchId.toString()}>
                          {branch.name || branch.branch_name || 'Unnamed Branch'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Pharmacies Table */}
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pharmacy Name</TableHead>
                      <TableHead>Manager Name</TableHead>
                      <TableHead>Branch Location</TableHead>
                      <TableHead>Staff Count</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPharmacies.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className='text-center py-8 text-slate-500 dark:text-slate-400'
                        >
                          {searchQuery || branchFilter !== 'all'
                            ? 'No pharmacies found matching your filters'
                            : 'No pharmacies found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPharmacies.map((pharmacy) => (
                        <TableRow key={pharmacy.pharmacyId}>
                          <TableCell className='font-medium'>
                            {pharmacy.pharmacyName}
                          </TableCell>
                          <TableCell>{pharmacy.manager.name}</TableCell>
                          <TableCell>{pharmacy.branch.name}</TableCell>
                          <TableCell>
                            <div className='flex items-center gap-1'>
                              <Users className='h-3 w-3 text-slate-400' />
                              <span>{pharmacy.branch.totalStaff}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={pharmacy.status} />
                          </TableCell>
                          <TableCell>
                            <div className='flex gap-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => handleViewDetails(pharmacy)}
                                title='View Details'
                              >
                                <Eye className='h-3 w-3 mr-1' />
                                View
                              </Button>
                              {!pharmacy.isActive ? (
                                <Button
                                  size='sm'
                                  variant='default'
                                  onClick={() => handleActivateClick(pharmacy)}
                                  className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
                                >
                                  <CheckCircle className='h-3 w-3 mr-1' />
                                  Activate
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size='sm'
                                    variant='destructive'
                                    onClick={() => handleDeactivateClick(pharmacy)}
                                  >
                                    <XCircle className='h-3 w-3 mr-1' />
                                    Deactivate
                                  </Button>
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() => handleDeleteClick(pharmacy)}
                                    title='Delete Pharmacy'
                                  >
                                    <Trash2 className='h-3 w-3 mr-1' />
                                    Delete
                                  </Button>
                                </>
                              )}
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => handleEditPharmacy(pharmacy)}
                              >
                                <Pencil className='h-3 w-3 mr-1' />
                                Edit
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => handlePasswordReset(pharmacy)}
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

      {/* Pharmacy Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Building2 className='h-5 w-5 text-primary' />
              Pharmacy Details
            </DialogTitle>
            <DialogDescription>
              View comprehensive pharmacy, branch, staff, and manager information
            </DialogDescription>
          </DialogHeader>

          {selectedPharmacy && (
            <div className='space-y-6'>
              {/* Pharmacy Information */}
              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader className='bg-slate-50 dark:bg-slate-900/50 py-3'>
                  <CardTitle className='text-sm flex items-center gap-2'>
                    <Building2 className='h-4 w-4' /> Pharmacy Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-4 space-y-3'>
                  <div>
                    <label className='text-xs font-medium text-muted-foreground uppercase'>
                      Pharmacy Name
                    </label>
                    <p className='text-sm font-semibold text-slate-900 dark:text-slate-50'>
                      {selectedPharmacy.pharmacyName}
                    </p>
                  </div>
                  <div>
                    <label className='text-xs font-medium text-muted-foreground uppercase'>
                      Registration Date
                    </label>
                    <p className='text-sm'>
                      {selectedPharmacy.createdAt
                        ? new Date(selectedPharmacy.createdAt).toLocaleDateString(undefined, {
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
                      <StatusBadge status={selectedPharmacy.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Branch Details */}
              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader className='bg-slate-50 dark:bg-slate-900/50 py-3'>
                  <CardTitle className='text-sm flex items-center gap-2'>
                    <Info className='h-4 w-4' /> Branch Details
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-4 space-y-3'>
                  {fetchingBranch ? (
                    <div className='flex items-center justify-center py-8'>
                      <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600 dark:border-slate-400'></div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className='text-xs font-medium text-muted-foreground uppercase'>
                          Branch Location
                        </label>
                        <p className='text-sm font-semibold'>{selectedPharmacy.branch.name}</p>
                      </div>
                      <div>
                        <label className='text-xs font-medium text-muted-foreground uppercase'>
                          Contact Phone
                        </label>
                        <p className='text-sm'>
                          {selectedPharmacy.branch.phone !== 'N/A'
                            ? selectedPharmacy.branch.phone
                            : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className='text-xs font-medium text-muted-foreground uppercase'>
                          Contact Email
                        </label>
                        <p className='text-sm'>
                          {selectedPharmacy.branch.email !== 'N/A'
                            ? selectedPharmacy.branch.email
                            : 'Not provided'}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Staff Overview */}
              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader className='bg-slate-50 dark:bg-slate-900/50 py-3'>
                  <CardTitle className='text-sm flex items-center gap-2'>
                    <Users className='h-4 w-4' /> Staff Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center'>
                      <p className='text-xs text-slate-600 dark:text-slate-400 font-bold uppercase mb-2'>
                        Total Staff
                      </p>
                      <p className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
                        {selectedPharmacy.branch.totalStaff}
                      </p>
                    </div>
                    <div className='bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center'>
                      <p className='text-xs text-slate-600 dark:text-slate-400 font-bold uppercase mb-2'>
                        Total Managers
                      </p>
                      <p className='text-2xl font-bold text-slate-900 dark:text-slate-50'>
                        {selectedPharmacy.branch.totalManagers}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Manager Information */}
              <Card className='border-slate-200 dark:border-slate-800'>
                <CardHeader className='bg-slate-50 dark:bg-slate-900/50 py-3'>
                  <CardTitle className='text-sm flex items-center gap-2'>
                    <ShieldCheck className='h-4 w-4' /> Manager Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-4 space-y-3'>
                  <div>
                    <label className='text-xs font-medium text-muted-foreground uppercase'>
                      Manager Name
                    </label>
                    <p className='text-sm font-semibold text-slate-900 dark:text-slate-50'>
                      {selectedPharmacy.manager.name}
                    </p>
                  </div>
                  <div>
                    <label className='text-xs font-medium text-muted-foreground uppercase'>
                      Email Address
                    </label>
                    <p className='text-sm font-semibold'>{selectedPharmacy.manager.email}</p>
                  </div>
                  <div>
                    <label className='text-xs font-medium text-muted-foreground uppercase'>
                      Status
                    </label>
                    <div className='mt-1'>
                      <StatusBadge status={selectedPharmacy.manager.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className='mt-6 gap-2'>
            <Button variant='outline' onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>
            {!selectedPharmacy?.isActive && (
              <Button
                onClick={() => {
                  setDetailsModalOpen(false);
                  handleActivateClick(selectedPharmacy);
                }}
                className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 gap-2'
              >
                <CheckCircle className='h-4 w-4' />
                Activate Pharmacy
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
              {actionType === 'activate'
                ? 'Activate Pharmacy'
                : actionType === 'delete'
                  ? 'Delete Pharmacy'
                  : 'Deactivate Pharmacy'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'activate'
                ? 'Are you sure you want to activate this pharmacy? A unique verification code will be sent to the manager\'s registered email address, and you will need to enter it to complete the activation.'
                : actionType === 'delete'
                  ? 'Are you sure you want to delete this pharmacy? This will deactivate the associated manager and they will lose access to the system. This action cannot be undone.'
                  : 'Are you sure you want to deactivate this pharmacy? The associated manager will lose access to the system.'}
            </DialogDescription>
          </DialogHeader>
          {selectedManager && (
            <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-2'>
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-4 w-4 text-slate-600 dark:text-slate-400' />
                <span className='text-sm font-medium'>Pharmacy Details</span>
              </div>
              <p className='text-sm'>
                <span className='font-medium'>Pharmacy:</span> {selectedPharmacy?.pharmacyName || 'N/A'}
              </p>
              <p className='text-sm'>
                <span className='font-medium'>Manager:</span> {selectedManager.name}
              </p>
              <p className='text-sm'>
                <span className='font-medium'>Email:</span> {selectedManager.email}
              </p>
              <p className='text-sm'>
                <span className='font-medium'>Branch:</span> {selectedPharmacy?.branch?.name || 'N/A'}
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
              variant={
                actionType === 'activate'
                  ? 'default'
                  : actionType === 'delete'
                    ? 'destructive'
                    : 'destructive'
              }
            >
              {processing
                ? 'Processing...'
                : actionType === 'activate'
                  ? 'Activate Pharmacy'
                  : actionType === 'delete'
                    ? 'Delete Pharmacy'
                    : 'Deactivate Pharmacy'}
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
                Didn't receive the code?{' '}
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

      {/* Edit Pharmacy Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pharmacy</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='pharmacy_name'>Pharmacy/Branch</Label>
              <Select
                value={formData.branch_id?.toString() || ''}
                onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                disabled={true}
              >
                <SelectTrigger
                  id='pharmacy_name'
                  className='bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed opacity-70'
                >
                  <SelectValue placeholder='Select pharmacy/branch' />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch, index) => {
                    const branchId = branch.branch_id || branch.id || index;
                    return (
                      <SelectItem key={branchId} value={branchId.toString()}>
                        {branch.name || branch.branch_name || 'Unnamed Branch'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground mt-1'>
                Pharmacy/branch assignment cannot be changed after registration.
              </p>
            </div>
            <div>
              <Label htmlFor='full_name'>Manager Name</Label>
              <Input
                id='full_name'
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder='Enter manager name'
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
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditModalOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleSavePharmacy} disabled={processing}>
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
                Reset password for pharmacy manager{' '}
                <strong>{selectedManager.name}</strong>
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

export default AdminPharmacies;
