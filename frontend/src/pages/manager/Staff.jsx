import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/common/DataTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AsyncWrapper from '@/components/common/AsyncWrapper';
import StatusBadge from '@/components/common/StatusBadge';
import { managerService } from '@/services';
import { parseError } from '@/utils/errorHandler';
import {
  UserPlus,
  CheckCircle,
  UserX,
  KeyRound,
  Search,
  Users,
  RefreshCw,
  Mail,
  Clock,
  UserCheck,
  Trash2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

const ROLES = [
  { id: 3, name: 'Pharmacist' },
  { id: 4, name: 'Cashier' },
];

const ManagerStaff = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff] = useState([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Create Staff Form
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    role_ids: [],
  });
  const [createErrors, setCreateErrors] = useState({});

  // Edit Staff Form
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    role_ids: [],
  });
  const [editErrors, setEditErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  // Verify Staff Form
  const [verificationCode, setVerificationCode] = useState('');

  // Resend Code State
  const [countdown, setCountdown] = useState(180); // 3 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    
    if (verifyModalOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }

    return () => clearInterval(timer);
  }, [verifyModalOpen, countdown]);

  const fetchStaff = async () => {
    try {
      if (loading) setError(null);
      setRefreshing(true);
      const response = await managerService.getStaff();

      if (response.success) {
        console.log('[STAFF] Raw staff data from API:', response.data);
        // Log each staff member's is_active status
        (response.data || []).forEach((staff, index) => {
          console.log(`[STAFF] Staff ${index}:`, {
            id: staff.id,
            name: staff.full_name,
            email: staff.email,
            is_active: staff.is_active,
            role_name: staff.role_name,
            role_id: staff.role_id
          });
        });
        // Show all staff members - status badge will indicate active/inactive
        const allStaff = response.data || [];
        console.log('[STAFF] Total staff count:', allStaff.length);
        setStaff(allStaff);
      } else {
        const msg = parseError(response);
        toast.error(msg);
        if (loading) setError(msg);
      }
    } catch (err) {
      const msg = parseError(err);
      toast.error(msg);
      if (loading) setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
    if (createErrors[name]) {
      setCreateErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    if (editErrors[name]) {
      setEditErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRoleToggle = (roleId) => {
    setCreateForm((prev) => {
      const newRoles = prev.role_ids.includes(roleId)
        ? prev.role_ids.filter((id) => id !== roleId)
        : [...prev.role_ids, roleId];

      if (createErrors.role_ids) {
        setCreateErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors.role_ids;
          return newErrors;
        });
      }

      return { ...prev, role_ids: newRoles };
    });
  };

  const handleEditRoleToggle = (roleId) => {
    setEditForm((prev) => {
      const newRoles = prev.role_ids.includes(roleId)
        ? prev.role_ids.filter((id) => id !== roleId)
        : [...prev.role_ids, roleId];

      if (editErrors.role_ids) {
        setEditErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors.role_ids;
          return newErrors;
        });
      }

      return { ...prev, role_ids: newRoles };
    });
  };

  const validateCreateForm = () => {
    const errors = {};
    if (!createForm.full_name.trim()) errors.full_name = 'Full name is required';
    if (!createForm.email.trim()) errors.email = 'Email is required';
    if (createForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = 'Invalid email format';
    }
    if (createForm.role_ids.length === 0) errors.role_ids = 'Select at least one role';

    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editForm.full_name.trim()) errors.full_name = 'Full name is required';
    if (!editForm.email.trim()) errors.email = 'Email is required';
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = 'Invalid email format';
    }
    if (editForm.role_ids.length === 0) errors.role_ids = 'Select at least one role';

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    try {
      setProcessing(true);
      const response = await managerService.createStaff(createForm);

      if (response.success) {
        toast.success('Staff created! Verification code sent to their email.');
        setCreateModalOpen(false);
        setCreateForm({ full_name: '', email: '', role_ids: [] });
        fetchStaff();
      } else {
        toast.error(parseError(response));
      }
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleEditClick = (staffMember) => {
    setSelectedStaff(staffMember);
    setEditForm({
      full_name: staffMember.full_name,
      email: staffMember.email,
      role_ids: staffMember.role_ids || [],
    });
    setEditErrors({});
    setEditModalOpen(true);
  };
  
  const hasFormChanged = () => {
    if (!selectedStaff) return false;
    
    const originalName = selectedStaff.full_name || '';
    const originalEmail = selectedStaff.email || '';
    const originalRoles = selectedStaff.role_ids || [];
    
    const nameChanged = editForm.full_name !== originalName;
    const emailChanged = editForm.email !== originalEmail;
    const rolesChanged =
      JSON.stringify(editForm.role_ids.sort()) !== JSON.stringify(originalRoles.sort());
    
    return nameChanged || emailChanged || rolesChanged;
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;
    
    if (!selectedStaff) {
      toast.error('No staff member selected');
      return;
    }
    
    // Check if any values have actually changed
    const hasChanged = hasFormChanged();
    console.log('[EDIT] Change detection:', {
      selectedStaff,
      editForm,
      hasChanged,
      originalName: selectedStaff.full_name,
      newName: editForm.full_name,
      originalEmail: selectedStaff.email,
      newEmail: editForm.email,
      originalRoles: selectedStaff.role_ids,
      newRoles: editForm.role_ids
    });
    
    if (!hasChanged) {
      toast.info('No changes detected. Please modify at least one field.');
      return;
    }
    
    const userId = selectedStaff.user_id || selectedStaff.id;
    if (!userId) {
      toast.error('Invalid staff member ID');
      return;
    }
    
    try {
      setProcessing(true);
      const response = await managerService.updateStaff(userId, editForm);
      
      if (response.success) {
        toast.success('Staff member updated successfully!');
        setEditModalOpen(false);
        setSelectedStaff(null);
        fetchStaff();
      } else {
        toast.error(parseError(response));
      }
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyClick = (staffMember) => {
    setSelectedStaff(staffMember);
    setVerificationCode('');
    setCountdown(180); // Reset to 3 minutes
    setCanResend(false); // Disable resend initially
    setVerifyModalOpen(true);
  };

  const handleVerifyStaff = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }

    if (!selectedStaff) {
      toast.error('No staff member selected');
      return;
    }

    const userId = selectedStaff.user_id || selectedStaff.id;
    if (!userId) {
      toast.error('Invalid staff member ID');
      return;
    }

    try {
      setProcessing(true);
      const response = await managerService.verifyStaff(userId, verificationCode);

      if (response.success) {
        toast.success('Staff account activated! Temporary password sent to their email.');
        setVerifyModalOpen(false);
        setVerificationCode('');
        setSelectedStaff(null);
        fetchStaff();
      } else {
        toast.error(parseError(response));
      }
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleResendCode = async () => {
    if (!selectedStaff) {
      toast.error('No staff member selected');
      return;
    }

    const userId = selectedStaff.user_id || selectedStaff.id;
    if (!userId) {
      toast.error('Invalid staff member ID');
      return;
    }

    try {
      setResending(true);
      const response = await managerService.resendVerificationCode(userId);

      if (response.success) {
        toast.success('New verification code sent!');
        setCountdown(180); // Reset countdown
        setCanResend(false); // Disable resend again
      } else {
        toast.error(parseError(response));
      }
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResetPassword = async () => {
    if (!selectedStaff) {
      toast.error('No staff member selected');
      return;
    }

    const userId = selectedStaff.user_id || selectedStaff.id;
    if (!userId) {
      toast.error('Invalid staff member ID');
      return;
    }

    try {
      setProcessing(true);
      const response = await managerService.resetStaffPassword(userId);

      if (response.success) {
        toast.success('Password reset email sent!');
        setResetModalOpen(false);
        setSelectedStaff(null);
      } else {
        toast.error(parseError(response));
      }
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) {
      toast.error('No staff member selected');
      return;
    }
    
    const userId = selectedStaff.user_id || selectedStaff.id;
    if (!userId) {
      toast.error('Invalid staff member ID');
      return;
    }
    
    try {
      setProcessing(true);
      const response = await managerService.deleteStaff(userId);
      console.log('[DELETE] API Response:', response);
      console.log('[DELETE] Selected staff:', selectedStaff);
      console.log('[DELETE] User ID to delete:', userId);
      
      // Check for success - handle different response formats
      // For DELETE requests, success can be indicated by:
      // 1. response.success === true
      // 2. response.status between 200-299
      // 3. response.message containing success keywords
      const isSuccess = response.success === true ||
                        (response.status >= 200 && response.status < 300) ||
                        response.message?.toLowerCase().includes('deleted') ||
                        response.message?.toLowerCase().includes('removed') ||
                        response.message?.toLowerCase().includes('success');
      
      console.log('[DELETE] Success check:', isSuccess);
      
      if (isSuccess) {
        console.log('[DELETE] Operation successful - removing from UI list');
        toast.success('Staff member deactivated successfully');
        setDeleteModalOpen(false);
        
        // Remove the deleted staff member from the UI list immediately
        // Handle both id and user_id fields for robust comparison
        const deletedStaffId = selectedStaff.id || selectedStaff.user_id;
        console.log('[DELETE] Removing staff with ID:', deletedStaffId);
        
        setStaff(prevStaff => {
          console.log('[DELETE] Current staff count before removal:', prevStaff.length);
          const filtered = prevStaff.filter(staff => {
            const staffId = staff.id || staff.user_id;
            const isMatch = staffId === deletedStaffId;
            console.log(`[DELETE] Checking staff ${staff.full_name}:`, {
              staffId: staffId,
              deletedStaffId: deletedStaffId,
              isMatch: isMatch,
              willRemove: !isMatch
            });
            return !isMatch;
          });
          console.log('[DELETE] Staff count after removal:', filtered.length);
          return filtered;
        });
        
        setSelectedStaff(null);
        
        // Then refresh to get updated data from backend
        await fetchStaff();
      } else {
        console.error('[DELETE] Operation failed:', response);
        const errorMsg = response.message || response.error || 'Failed to delete staff member';
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('[DELETE] Exception:', err);
      toast.error(parseError(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleActivateStaff = async () => {
    if (!selectedStaff) {
      toast.error('No staff member selected');
      return;
    }

    const userId = selectedStaff.user_id || selectedStaff.id;
    if (!userId) {
      toast.error('Invalid staff member ID');
      return;
    }

    try {
      setProcessing(true);
      
      // Send new verification code to staff member's email
      const response = await managerService.verifyStaff(userId, null);
      
      if (response.success) {
        toast.success('Verification code sent to staff member\'s email!');
        setActivateModalOpen(false);
        setProcessing(false);
        
        // Open verify modal
        handleVerifyClick(selectedStaff);
      } else {
        toast.error(parseError(response));
        setProcessing(false);
      }
    } catch (err) {
      toast.error(parseError(err));
      setProcessing(false);
    }
  };

  const getStatusFromStaff = (staffMember) => {
    if (staffMember.is_active) return 'Active';
    return 'Inactive';
  };

  const getStatistics = () => {
    const totalStaff = staff.length;
    const activeStaff = staff.filter(s => s.is_active).length;
    const pendingStaff = staff.filter(s => !s.is_active).length;
    const pharmacistCount = staff.filter(s => s.role_name === 'Pharmacist').length;
    const cashierCount = staff.filter(s => s.role_name === 'Cashier').length;

    return {
      totalStaff,
      activeStaff,
      pendingStaff,
      pharmacistCount,
      cashierCount
    };
  };

  const stats = getStatistics();

  const columns = [
    {
      key: 'full_name',
      label: 'Staff Member',
      render: (v, row) => (
        <div className='flex flex-col'>
          <span className='font-medium'>{v}</span>
          <span className='text-xs text-muted-foreground flex items-center gap-1'>
            <Mail className='h-3 w-3' /> {row.email}
          </span>
        </div>
      ),
    },
    {
      key: 'role_name',
      label: 'Role(s)',
      render: (v) => (
        <div className='flex flex-wrap gap-1'>
          {v ? (
            <Badge
              variant='outline'
              className='capitalize bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            >
              {v}
            </Badge>
          ) : (
            <span className='text-xs text-muted-foreground italic'>No role specified</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => {
        const status = getStatusFromStaff(row);
        let type = 'default';
        if (status === 'Active') type = 'success';
        if (status === 'Inactive') type = 'danger';
        return <StatusBadge status={status} type={type} />;
      },
    },
    {
      key: 'created_at',
      label: 'Joined Date',
      render: (v) => new Date(v).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            className='text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
            onClick={() => handleEditClick(row)}
            title='Edit Staff'
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </Button>

          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              setSelectedStaff(row);
              setResetModalOpen(true);
            }}
            title='Reset Password'
          >
            <KeyRound className='h-3 w-3' />
          </Button>

          <Button
            size='sm'
            variant='destructive'
            onClick={() => {
              setSelectedStaff(row);
              setDeleteModalOpen(true);
            }}
            title='Deactivate Staff'
          >
            <UserX className='h-3 w-3' />
          </Button>

          {!row.is_active && (
            <Button
              size='sm'
              variant='outline'
              className='text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700'
              onClick={() => {
                setSelectedStaff(row);
                setActivateModalOpen(true);
              }}
              title='Activate Staff'
            >
              <UserCheck className='h-3 w-3' />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <Navigation />
      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0 space-y-6'>
          {/* Header Section */}
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div className='space-y-1'>
              <h1 className='text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3'>
                <div className='p-2 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-md'>
                  <Users className='h-6 w-6 text-slate-600 dark:text-slate-400' />
                </div>
                Staff Management
              </h1>
              <p className='text-slate-600 dark:text-slate-400 ml-1'>Manage your pharmacy staff members and their access roles</p>
            </div>
            <div className='flex gap-2'>
              <Button variant='outline' onClick={fetchStaff} disabled={refreshing} className='shadow-sm hover:shadow-md transition-all'>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                className='bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-md hover:shadow-lg transition-all'
                onClick={() => setCreateModalOpen(true)}
              >
                <UserPlus className='h-4 w-4 mr-2' />
                Add Staff
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card className='bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-slate-600 dark:text-slate-400'>Total Staff</CardTitle>
                <Users className='h-4 w-4 text-slate-400 dark:text-slate-600' />
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-slate-900 dark:text-slate-50'>{stats.totalStaff}</div>
                <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>All team members</p>
              </CardContent>
            </Card>

            <Card className='bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-slate-600 dark:text-slate-400'>Active Staff</CardTitle>
                <UserCheck className='h-4 w-4 text-slate-400 dark:text-slate-600' />
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-slate-900 dark:text-slate-50'>{stats.activeStaff}</div>
                <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>Verified accounts</p>
              </CardContent>
            </Card>

            <Card className='bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-slate-600 dark:text-slate-400'>Pending Verification</CardTitle>
                <Clock className='h-4 w-4 text-slate-400 dark:text-slate-600' />
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-slate-900 dark:text-slate-50'>{stats.pendingStaff}</div>
                <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>Awaiting activation</p>
              </CardContent>
            </Card>

            <Card className='bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-slate-600 dark:text-slate-400'>Pharmacists</CardTitle>
                <ShieldCheck className='h-4 w-4 text-slate-400 dark:text-slate-600' />
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-slate-900 dark:text-slate-50'>{stats.pharmacistCount}</div>
                <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>{stats.cashierCount} Cashiers</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card className='shadow-md border-slate-200 dark:border-slate-800'>
            <CardHeader className='border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50'>
              <div className='flex items-center gap-2'>
                <Users className='h-5 w-5 text-slate-500' />
                <CardTitle className='text-slate-900 dark:text-slate-50'>Staff Directory</CardTitle>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              <AsyncWrapper loading={loading} error={error} onRetry={fetchStaff}>
                <DataTable columns={columns} data={staff} />
              </AsyncWrapper>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Create Staff Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader className='border-b border-slate-200 dark:border-slate-800 pb-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-slate-100 dark:bg-slate-800 rounded-lg'>
                <UserPlus className='h-5 w-5 text-slate-600 dark:text-slate-400' />
              </div>
              <div>
                <DialogTitle className='text-xl'>Add New Staff Member</DialogTitle>
                <DialogDescription>Create a new account for a staff member. They will receive a verification code via email.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleCreateStaff} className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='full_name' className='text-sm font-medium'>Full Name <span className='text-red-500'>*</span></Label>
              <Input
                id='full_name'
                name='full_name'
                value={createForm.full_name}
                onChange={handleCreateChange}
                placeholder='e.g., John Doe'
                className={createErrors.full_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {createErrors.full_name && (
                <p className='text-xs text-red-500 font-medium'>{createErrors.full_name}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email' className='text-sm font-medium'>Email Address <span className='text-red-500'>*</span></Label>
              <Input
                id='email'
                name='email'
                type='email'
                value={createForm.email}
                onChange={handleCreateChange}
                placeholder='e.g., john@example.com'
                className={createErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {createErrors.email && (
                <p className='text-xs text-red-500 font-medium'>{createErrors.email}</p>
              )}
            </div>

            <div className='space-y-3'>
              <Label className={createErrors.role_ids ? 'text-red-500 text-sm font-medium' : 'text-sm font-medium'}>
                Assigned Role(s) <span className='text-red-500'>*</span>
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                {ROLES.map((role) => (
                  <div
                    key={role.id}
                    className={`flex items-center space-x-3 space-y-0 rounded-md border p-3 cursor-pointer transition-all ${
                      createForm.role_ids.includes(role.id)
                        ? 'border-slate-600 bg-slate-100 dark:bg-slate-800 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:border-slate-600 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => handleRoleToggle(role.id)}
                  >
                    <input
                      type='checkbox'
                      checked={createForm.role_ids.includes(role.id)}
                      readOnly
                      className='h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 focus:ring-slate-500'
                    />
                    <span className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                      {role.name}
                    </span>
                  </div>
                ))}
              </div>
              {createErrors.role_ids && (
                <p className='text-xs text-red-500 font-medium'>{createErrors.role_ids}</p>
              )}
            </div>

            <DialogFooter className='pt-4 gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setCreateModalOpen(false)}
                disabled={processing}
                className='w-full sm:w-auto'
              >
                Cancel
              </Button>
              <Button type='submit' disabled={processing} className='w-full sm:w-auto bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'>
                {processing ? 'Processing...' : 'Create Staff Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader className='border-b border-slate-200 dark:border-slate-800 pb-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-slate-100 dark:bg-slate-800 rounded-lg'>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              </div>
              <div>
                <DialogTitle className='text-xl'>Edit Staff Member</DialogTitle>
                <DialogDescription>Update staff member information and roles.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleEditStaff} className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit_full_name' className='text-sm font-medium'>Full Name <span className='text-red-500'>*</span></Label>
              <Input
                id='edit_full_name'
                name='full_name'
                value={editForm.full_name}
                onChange={handleEditChange}
                placeholder='e.g., John Doe'
                className={editErrors.full_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {editErrors.full_name && (
                <p className='text-xs text-red-500 font-medium'>{editErrors.full_name}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit_email' className='text-sm font-medium'>Email Address <span className='text-red-500'>*</span></Label>
              <Input
                id='edit_email'
                name='email'
                type='email'
                value={editForm.email}
                onChange={handleEditChange}
                placeholder='e.g., john@example.com'
                className={editErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {editErrors.email && (
                <p className='text-xs text-red-500 font-medium'>{editErrors.email}</p>
              )}
            </div>

            <div className='space-y-3'>
              <Label className={editErrors.role_ids ? 'text-red-500 text-sm font-medium' : 'text-sm font-medium'}>
                Assigned Role(s) <span className='text-red-500'>*</span>
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                {ROLES.map((role) => (
                  <div
                    key={role.id}
                    className={`flex items-center space-x-3 space-y-0 rounded-md border p-3 cursor-pointer transition-all ${
                      editForm.role_ids.includes(role.id)
                        ? 'border-slate-600 bg-slate-100 dark:bg-slate-800 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:border-slate-600 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => handleEditRoleToggle(role.id)}
                  >
                    <input
                      type='checkbox'
                      checked={editForm.role_ids.includes(role.id)}
                      readOnly
                      className='h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 focus:ring-slate-500'
                    />
                    <span className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                      {role.name}
                    </span>
                  </div>
                ))}
              </div>
              {editErrors.role_ids && (
                <p className='text-xs text-red-500 font-medium'>{editErrors.role_ids}</p>
              )}
            </div>

            <DialogFooter className='pt-4 gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setEditModalOpen(false)}
                disabled={processing}
                className='w-full sm:w-auto'
              >
                Cancel
              </Button>
              <Button type='submit' disabled={processing} className='w-full sm:w-auto bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'>
                {processing ? 'Updating...' : 'Update Staff Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Verify Staff Modal */}
      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Verify Staff Account</DialogTitle>
            <DialogDescription>
              Enter 6-digit code sent to <strong>{selectedStaff?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerifyStaff} className='space-y-6 py-4'>
            <div className='space-y-4'>
              <Card className='bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'>
                <CardContent className='pt-4'>
                  <p className='text-xs text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider font-bold'>Verification for:</p>
                  <p className='font-semibold text-slate-900 dark:text-slate-50'>{selectedStaff?.full_name}</p>
                </CardContent>
              </Card>

              <div className='space-y-2 text-center'>
                <Label htmlFor='verification_code' className='text-center block'>
                  6-Digit Code
                </Label>
                <Input
                  id='verification_code'
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder='000000'
                  maxLength={6}
                  className='text-center text-3xl tracking-[1em] font-mono h-16 border-slate-300 dark:border-slate-700 focus-visible:ring-amber-500'
                />
                <div className='flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400'>
                  <Clock className='h-4 w-4' />
                  {canResend ? (
                    <Button
                      type='button'
                      variant='link'
                      className='h-auto p-0 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      onClick={handleResendCode}
                      disabled={resending}
                    >
                      {resending ? 'Sending...' : 'Resend Code'}
                    </Button>
                  ) : (
                    <span>Resend available in <span className='font-semibold text-slate-600 dark:text-slate-400'>{formatTime(countdown)}</span></span>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setVerifyModalOpen(false)}
                disabled={processing}
                className='w-full sm:w-auto'
              >
                Cancel
              </Button>
              <Button type='submit' disabled={processing || verificationCode.length !== 6} className='w-full sm:w-auto bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'>
                {processing ? 'Verifying...' : 'Complete Verification'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteStaff}
        title='Deactivate Staff Member'
        description={`Are you sure you want to deactivate ${selectedStaff?.full_name}? This will revoke their access to the system but keep their record for audit purposes.`}
        variant='danger'
        loading={processing}
      />

      {/* Reset Password Confirmation */}
      <ConfirmDialog
        open={resetModalOpen}
        onOpenChange={setResetModalOpen}
        onConfirm={handleResetPassword}
        title='Reset Staff Password'
        description={`Send a password reset link to ${selectedStaff?.full_name}? A temporary password will be emailed to ${selectedStaff?.email}.`}
        variant='default'
        loading={processing}
      />

      {/* Activate Staff Confirmation */}
      <ConfirmDialog
        open={activateModalOpen}
        onOpenChange={setActivateModalOpen}
        onConfirm={handleActivateStaff}
        title='Activate Staff Member'
        description={`Are you sure you want to activate ${selectedStaff?.full_name}? You will need to enter the 6-digit verification code sent to their email.`}
        variant='success'
        loading={processing}
      />
    </div>
  );
};

export default ManagerStaff;
