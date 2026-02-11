import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Users,
  RefreshCw,
  Mail,
  Clock,
  UserCheck,
  ShieldCheck,
  Trash2,
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
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Verification
  const [verificationCode, setVerificationCode] = useState('');

  // Create Staff Staff Form
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    role_ids: [],
    temporary_password: '',
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

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      if (loading) setError(null);
      setRefreshing(true);
      const response = await managerService.getStaff();

      if (response.success) {
        console.log('[STAFF] Raw staff data from API:', response.data);
        const allStaff = response.data || [];
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
    if (!createForm.temporary_password) {
      errors.temporary_password = 'Temporary password is required';
    } else if (createForm.temporary_password.length < 6) {
      errors.temporary_password = 'Password must be at least 6 characters';
    }
    if (createForm.role_ids.length === 0) errors.role_ids = 'Select at least one role';

    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors = {};
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
        toast.success('Staff member created! Verification code sent to their email.');
        const staffMember = response.data || {
          full_name: createForm.full_name,
          email: createForm.email,
          id: response.data?.id || response.data?.user_id,
        };
        setSelectedStaff(staffMember);
        setVerificationCode('');
        setCreateModalOpen(false);
        setCreateForm({ full_name: '', email: '', role_ids: [], temporary_password: '' });
        fetchStaff();
        setVerifyModalOpen(true);
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
      role_ids: staffMember.role_ids || [],
    });
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    if (!selectedStaff) {
      toast.error('No staff member selected');
      return;
    }

    const userId = selectedStaff.user_id || selectedStaff.id;
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

  const handleResetPassword = async () => {
    if (!selectedStaff) {
      toast.error('No staff member selected');
      return;
    }

    const userId = selectedStaff.user_id || selectedStaff.id;
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
    console.log('[VERIFY] Selected staff data:', selectedStaff);
    console.log('[VERIFY] Extracted userId:', userId);
    console.log('[VERIFY] Verification code:', verificationCode);
    console.log('[VERIFY] Email:', selectedStaff.email);
    try {
      setProcessing(true);
      const response = await managerService.verifyStaff(userId, verificationCode, selectedStaff.email);

      if (response.success) {
        toast.success('Staff account activated successfully!');
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

  const handleActivateStaff = async () => {
    if (!selectedStaff) {
      toast.error('No staff member selected');
      return;
    }

    const userId = selectedStaff.user_id || selectedStaff.id;

    console.log('[ACTIVATE] Selected staff data:', selectedStaff);
    console.log('[ACTIVATE] Extracted userId:', userId);

    try {
      setProcessing(true);
      // Directly activate the staff member without sending verification code
      // Once staff is verified, activation should be direct
      console.log('[ACTIVATE] Calling activateStaff with userId:', userId);
      const activateResponse = await managerService.activateStaff(userId);
      if (activateResponse.success) {
        toast.success('Staff member activated successfully!');
        setActivateModalOpen(false);
        fetchStaff();
      } else {
        toast.error(parseError(activateResponse));
      }
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleDeactivateStaff = async () => {
    if (!selectedStaff) {
      toast.error('No staff member selected');
      return;
    }

    const userId = selectedStaff.user_id || selectedStaff.id;
    try {
      setProcessing(true);
      const response = await managerService.deactivateStaff(userId);

      if (response.success) {
        toast.success('Staff member deactivated successfully!');
        setDeactivateModalOpen(false);
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

  const handleDeleteStaff = async () => {
    if (!selectedStaff) {
      toast.error('No staff member selected');
      return;
    }

    const userId = selectedStaff.user_id || selectedStaff.id;
    try {
      setProcessing(true);
      const response = await managerService.deleteStaff(userId);

      if (response.success) {
        toast.success('Staff member deleted successfully!');
        setDeleteModalOpen(false);
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

  const getStatusFromStaff = (staffMember) => {
    if (staffMember.is_active) return 'Active';
    return 'Inactive';
  };

  const getStatistics = () => {
    const totalStaff = staff.length;
    const activeStaff = staff.filter((s) => s.is_active).length;
    const pendingStaff = staff.filter((s) => !s.is_active).length;
    const pharmacistCount = staff.filter((s) => s.role_name === 'Pharmacist').length;
    const cashierCount = staff.filter((s) => s.role_name === 'Cashier').length;

    return {
      totalStaff,
      activeStaff,
      pendingStaff,
      pharmacistCount,
      cashierCount,
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
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='12'
              height='12'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z' />
            </svg>
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

          {row.is_active ? (
            <Button
              size='sm'
              variant='outline'
              className='text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700'
              onClick={() => {
                setSelectedStaff(row);
                setDeactivateModalOpen(true);
              }}
              title='Deactivate Staff'
            >
              <UserX className='h-3 w-3' />
            </Button>
          ) : (
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

          <Button
            size='sm'
            variant='outline'
            className='text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700'
            onClick={() => {
              setSelectedStaff(row);
              setDeleteModalOpen(true);
            }}
            title='Delete Staff'
          >
            <Trash2 className='h-3 w-3' />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
      <Navigation />
      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0 space-y-6'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div className='space-y-1'>
              <h1 className='text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3'>
                <div className='p-2 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-md'>
                  <Users className='h-6 w-6 text-slate-600 dark:text-slate-400' />
                </div>
                Staff Management
              </h1>
              <p className='text-slate-600 dark:text-slate-400 ml-1'>
                Manage your pharmacy staff members and their access roles
              </p>
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={fetchStaff}
                disabled={refreshing}
                className='shadow-sm hover:shadow-md transition-all'
              >
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

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card className='bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                  Total Staff
                </CardTitle>
                <Users className='h-4 w-4 text-slate-400 dark:text-slate-600' />
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-slate-900 dark:text-slate-50'>
                  {stats.totalStaff}
                </div>
                <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>All team members</p>
              </CardContent>
            </Card>

            <Card className='bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                  Active Staff
                </CardTitle>
                <UserCheck className='h-4 w-4 text-slate-400 dark:text-slate-600' />
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-slate-900 dark:text-slate-50'>
                  {stats.activeStaff}
                </div>
                <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>Verified accounts</p>
              </CardContent>
            </Card>

            <Card className='bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                  Pending Verification
                </CardTitle>
                <Clock className='h-4 w-4 text-slate-400 dark:text-slate-600' />
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-slate-900 dark:text-slate-50'>
                  {stats.pendingStaff}
                </div>
                <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>
                  Awaiting activation
                </p>
              </CardContent>
            </Card>

            <Card className='bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                  Pharmacists
                </CardTitle>
                <ShieldCheck className='h-4 w-4 text-slate-400 dark:text-slate-600' />
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-slate-900 dark:text-slate-50'>
                  {stats.pharmacistCount}
                </div>
                <p className='text-xs text-slate-500 dark:text-slate-500 mt-1'>
                  {stats.cashierCount} Cashiers
                </p>
              </CardContent>
            </Card>
          </div>

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

      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader className='border-b border-slate-200 dark:border-slate-800 pb-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-slate-100 dark:bg-slate-800 rounded-lg'>
                <UserPlus className='h-5 w-5 text-slate-600 dark:text-slate-400' />
              </div>
              <div>
                <DialogTitle className='text-xl'>Add New Staff Member</DialogTitle>
                <DialogDescription>
                  Create a new account for a staff member. They will be able to log in once
                  activated.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleCreateStaff} className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='full_name' className='text-sm font-medium'>
                Full Name <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='full_name'
                name='full_name'
                value={createForm.full_name}
                onChange={handleCreateChange}
                placeholder='e.g., John Doe'
                className={
                  createErrors.full_name ? 'border-red-500 focus-visible:ring-red-500' : ''
                }
              />
              {createErrors.full_name && (
                <p className='text-xs text-red-500 font-medium'>{createErrors.full_name}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email' className='text-sm font-medium'>
                Email Address <span className='text-red-500'>*</span>
              </Label>
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

            <div className='space-y-2'>
              <Label htmlFor='temporary_password' className='text-sm font-medium'>
                Temporary Password <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='temporary_password'
                name='temporary_password'
                type='password'
                value={createForm.temporary_password}
                onChange={handleCreateChange}
                placeholder='e.g., TempPass123'
                className={createErrors.temporary_password ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {createErrors.temporary_password && (
                <p className='text-xs text-red-500 font-medium'>{createErrors.temporary_password}</p>
              )}
            </div>

            <div className='space-y-3'>
              <Label
                className={
                  createErrors.role_ids ? 'text-red-500 text-sm font-medium' : 'text-sm font-medium'
                }
              >
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
                    <span className='text-sm font-medium leading-none'>
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
              <Button
                type='submit'
                disabled={processing}
                className='w-full sm:w-auto bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200'
              >
                {processing ? 'Processing...' : 'Create Staff Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader className='border-b border-slate-200 dark:border-slate-800 pb-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-slate-100 dark:bg-slate-800 rounded-lg'>
                <RefreshCw className='h-5 w-5 text-slate-600 dark:text-slate-400' />
              </div>
              <div>
                <DialogTitle className='text-xl'>Edit Staff Role</DialogTitle>
                <DialogDescription>Update staff member role assignment.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleEditStaff} className='space-y-4 py-4'>
            <div className='space-y-3'>
              <Label className='text-sm font-medium'>
                Staff Member
              </Label>
              <div className='p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg'>
                <p className='font-medium text-slate-900 dark:text-slate-50'>
                  {selectedStaff?.full_name}
                </p>
                <p className='text-xs text-slate-500 dark:text-slate-400'>
                  {selectedStaff?.email}
                </p>
              </div>
            </div>
            <div className='space-y-3'>
              <Label className='text-sm font-medium'>
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
                    <span className='text-sm font-medium leading-none'>
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
              <Button type='button' variant='outline' onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button type='submit' disabled={processing}>Update Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deactivateModalOpen}
        onOpenChange={setDeactivateModalOpen}
        onConfirm={handleDeactivateStaff}
        title='Deactivate Staff Member'
        description={`Are you sure you want to deactivate ${selectedStaff?.full_name}?`}
        variant='danger'
        loading={processing}
      />

      <ConfirmDialog
        open={resetModalOpen}
        onOpenChange={setResetModalOpen}
        onConfirm={handleResetPassword}
        title='Reset Staff Password'
        description={`Send a password reset link to ${selectedStaff?.full_name}?`}
        variant='default'
        loading={processing}
      />

      <ConfirmDialog
        open={activateModalOpen}
        onOpenChange={setActivateModalOpen}
        onConfirm={handleActivateStaff}
        title='Activate Staff Member'
        description={`Are you sure you want to activate ${selectedStaff?.full_name}? A 6-digit verification code will be sent to ${selectedStaff?.email}.`}
        variant='success'
        loading={processing}
      />

      <ConfirmDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteStaff}
        title='Delete Staff Member'
        description={`Are you sure you want to delete ${selectedStaff?.full_name}? This action cannot be undone.`}
        variant='danger'
        loading={processing}
      />

      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent className='sm:max-w-[450px]'>
          <DialogHeader className='border-b border-slate-200 dark:border-slate-800 pb-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
                <ShieldCheck className='h-5 w-5 text-blue-600 dark:text-blue-400' />
              </div>
              <div>
                <DialogTitle className='text-xl'>Verify Staff Account</DialogTitle>
                <DialogDescription>
                  Enter the code sent to <span className='font-semibold'>{selectedStaff?.email}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleVerifyStaff} className='space-y-6 py-4'>
            <div className='space-y-4'>
              <div className='space-y-3'>
                <Label htmlFor='verification_code' className='text-sm font-medium text-center block'>
                  Enter 6-Digit Verification Code
                </Label>
                <Input
                  id='verification_code'
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder='000000'
                  maxLength={6}
                  className='text-center text-3xl tracking-[0.5em] font-mono h-16'
                  autoComplete='off'
                />
              </div>
              <p className='text-xs text-center text-slate-500'>
                Didn&apos;t receive the code?{' '}
                <button
                  type='button'
                  onClick={handleActivateStaff}
                  disabled={processing}
                  className='text-blue-600 hover:underline font-medium'
                >
                  Resend Code
                </button>
              </p>
            </div>
            <DialogFooter className='gap-2 sm:gap-0'>
              <Button type='button' variant='outline' onClick={() => setVerifyModalOpen(false)}>Cancel</Button>
              <Button type='submit' disabled={processing || verificationCode.length !== 6}>
                {processing ? 'Verifying...' : 'Activate Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerStaff;
