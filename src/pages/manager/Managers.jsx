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
import StatusBadge from '@/components/common/StatusBadge';
import { managerService } from '@/services';
import { parseError } from '@/utils/errorHandler';
import {
  UserPlus,
  ShieldCheck,
  Trash2,
  KeyRound,
  RefreshCw,
  Search,
  Clock,
  Mail,
  CheckCircle,
  XCircle,
  Users,
} from 'lucide-react';

const ManagersPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [managers, setManagers] = useState([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);

  // Verification
  const [verificationCode, setVerificationCode] = useState('');

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Manager Form
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    password: '',
    branch_id: '',
    phone: '',
    send_welcome_email: true,
  });
  const [createErrors, setCreateErrors] = useState({});

  // Branches for dropdown
  const [branches, setBranches] = useState([]);

  // Processing state
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchManagers();
    fetchBranches();
  }, []);

  const fetchManagers = async () => {
    try {
      if (loading) setError(null);
      setRefreshing(true);
      const response = await managerService.getManagers({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (response.success) {
        setManagers(response.data?.managers || []);
      } else {
        const msg = parseError(response);
        toast.error(`Failed to load pharmacy managers: ${msg}`);
        setError(msg);
      }
    } catch (err) {
      const msg = parseError(err);
      toast.error(`Failed to load pharmacy managers: ${msg}`);
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await managerService.getBranches();
      if (response.success) {
        setBranches(response.data || []);
      } else {
        const msg = parseError(response);
        toast.error(`Failed to load pharmacy branches: ${msg}`);
      }
    } catch (err) {
      const msg = parseError(err);
      toast.error(`Failed to load pharmacy branches: ${msg}`);
    }
  };

  const handleCreateChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (createErrors[name]) {
      setCreateErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateCreateForm = () => {
    const errors = {};

    if (!createForm.full_name.trim()) {
      errors.full_name = 'Full name is required';
    } else if (createForm.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }

    if (!createForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = 'Invalid email format';
    }

    if (!createForm.password) {
      errors.password = 'Password is required';
    } else if (createForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!createForm.branch_id) {
      errors.branch_id = 'Branch is required';
    }

    if (createForm.phone && !/^(09|07)\d{8}$/.test(createForm.phone.replace(/\D/g, ''))) {
      errors.phone = 'Invalid Ethiopian phone number format';
    }

    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    try {
      setProcessing(true);
      const response = await managerService.createManager(createForm);

      if (response.success) {
        toast.success('Manager account created for your pharmacy! Verification email sent.');
        const managerData = response.data;
        setSelectedManager(managerData);
        setVerificationCode('');
        setCreateModalOpen(false);
        setCreateForm({
          full_name: '',
          email: '',
          password: '',
          branch_id: '',
          phone: '',
          send_welcome_email: true,
        });
        fetchManagers();
        setVerifyModalOpen(true);
      } else {
        const msg = parseError(response);
        toast.error(`Failed to create manager for your pharmacy: ${msg}`);
      }
    } catch (err) {
      const msg = parseError(err);
      toast.error(`Failed to create manager for your pharmacy: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyManager = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }

    if (!selectedManager) {
      toast.error('No manager selected');
      return;
    }

    try {
      setProcessing(true);
      const response = await managerService.verifyManager(
        selectedManager.id,
        verificationCode
      );

      if (response.success) {
        toast.success('Manager account verified and activated for your pharmacy!');
        setVerifyModalOpen(false);
        setVerificationCode('');
        setSelectedManager(null);
        fetchManagers();
      } else {
        const msg = parseError(response);
        toast.error(`Failed to verify manager: ${msg}`);
      }
    } catch (err) {
      const msg = parseError(err);
      toast.error(`Failed to verify manager: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteManager = async () => {
    if (!selectedManager) {
      toast.error('No manager selected');
      return;
    }

    try {
      setProcessing(true);
      const response = await managerService.deleteManager(selectedManager.id);

      if (response.success) {
        toast.success('Manager account removed from your pharmacy successfully!');
        setDeleteModalOpen(false);
        setSelectedManager(null);
        fetchManagers();
      } else {
        const msg = parseError(response);
        toast.error(`Failed to delete manager: ${msg}`);
      }
    } catch (err) {
      const msg = parseError(err);
      toast.error(`Failed to delete manager: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedManager) {
      toast.error('No manager selected');
      return;
    }

    try {
      setProcessing(true);
      const response = await managerService.resetManagerPassword(selectedManager.id);

      if (response.success) {
        toast.success('Password reset email sent successfully!');
        setResetPasswordModalOpen(false);
        setSelectedManager(null);
      } else {
        const msg = parseError(response);
        toast.error(`Failed to reset password: ${msg}`);
      }
    } catch (err) {
      const msg = parseError(err);
      toast.error(`Failed to reset password: ${msg}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatistics = () => {
    const totalManagers = managers.length;
    const activeManagers = managers.filter((m) => m.is_active).length;
    const pendingManagers = managers.filter((m) => !m.is_active).length;
    const verifiedManagers = managers.filter((m) => m.email_verified).length;

    return {
      totalManagers,
      activeManagers,
      pendingManagers,
      verifiedManagers,
    };
  };

  const stats = getStatistics();

  const columns = [
    {
      key: 'full_name',
      label: 'Manager',
      render: (v, row) => (
        <div className='flex flex-col'>
          <div className='flex items-center gap-2'>
            <ShieldCheck className='h-4 w-4 text-blue-600' />
            <span className='font-medium'>{v}</span>
          </div>
          <span className='text-xs text-muted-foreground flex items-center gap-1'>
            <Mail className='h-3 w-3' /> {row.email}
          </span>
          {row.created_by_name && (
            <span className='text-xs text-muted-foreground'>
              Created by: {row.created_by_name}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'branch_name',
      label: 'Branch',
      render: (v) => (
        <Badge
          variant='outline'
          className='bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
        >
          {v || 'Not assigned'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => {
        const status = row.is_active ? 'Active' : 'Inactive';
        const type = row.is_active ? 'success' : 'danger';
        return <StatusBadge status={status} type={type} />;
      },
    },
    {
      key: 'email_verified',
      label: 'Email Verified',
      render: (v) => (
        <div className='flex items-center gap-1'>
          {v ? (
            <>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <span className='text-green-600'>Yes</span>
            </>
          ) : (
            <>
              <XCircle className='h-4 w-4 text-red-600' />
              <span className='text-red-600'>No</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
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
            onClick={() => {
              setSelectedManager(row);
              setResetPasswordModalOpen(true);
            }}
            title='Reset Password'
          >
            <KeyRound className='h-3 w-3' />
          </Button>

          <Button
            size='sm'
            variant='outline'
            className='text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700'
            onClick={() => {
              setSelectedManager(row);
              setDeleteModalOpen(true);
            }}
            title='Delete Manager'
          >
            <Trash2 className='h-3 w-3' />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950'>
      <Navigation />

      <main className='container mx-auto px-4 py-8'>
        {/* Statistics Cards */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            <Card className='bg-white/80 backdrop-blur-sm border-blue-200 dark:bg-slate-900/80 dark:border-blue-800'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-muted-foreground'>Total Managers</p>
                    <p className='text-3xl font-bold text-blue-600'>{stats.totalManagers}</p>
                    <p className='text-xs text-muted-foreground mt-1'>In your pharmacy</p>
                  </div>
                  <Users className='h-10 w-10 text-blue-600 opacity-20' />
                </div>
              </CardContent>
            </Card>

            <Card className='bg-white/80 backdrop-blur-sm border-green-200 dark:bg-slate-900/80 dark:border-green-800'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-muted-foreground'>Active</p>
                    <p className='text-3xl font-bold text-green-600'>{stats.activeManagers}</p>
                    <p className='text-xs text-muted-foreground mt-1'>Currently active</p>
                  </div>
                  <CheckCircle className='h-10 w-10 text-green-600 opacity-20' />
                </div>
              </CardContent>
            </Card>

            <Card className='bg-white/80 backdrop-blur-sm border-yellow-200 dark:bg-slate-900/80 dark:border-yellow-800'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-muted-foreground'>Pending</p>
                    <p className='text-3xl font-bold text-yellow-600'>{stats.pendingManagers}</p>
                    <p className='text-xs text-muted-foreground mt-1'>Awaiting verification</p>
                  </div>
                  <Clock className='h-10 w-10 text-yellow-600 opacity-20' />
                </div>
              </CardContent>
            </Card>

            <Card className='bg-white/80 backdrop-blur-sm border-purple-200 dark:bg-slate-900/80 dark:border-purple-800'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-muted-foreground'>Verified</p>
                    <p className='text-3xl font-bold text-purple-600'>{stats.verifiedManagers}</p>
                    <p className='text-xs text-muted-foreground mt-1'>Email verified</p>
                  </div>
                  <Mail className='h-10 w-10 text-purple-600 opacity-20' />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Card */}
          <Card className='bg-white/80 backdrop-blur-sm dark:bg-slate-900/80'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-2xl'>Pharmacy Managers</CardTitle>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Manage manager accounts for your pharmacy. Only managers within your pharmacy are visible.
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => fetchManagers()}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <UserPlus className='h-4 w-4 mr-2' />
                    Create Manager
                  </Button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className='flex gap-4 mt-4'>
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search by name or email...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchManagers()}
                    className='pl-10'
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className='px-4 py-2 border rounded-md bg-background'
                >
                  <option value='all'>All Status</option>
                  <option value='active'>Active</option>
                  <option value='inactive'>Inactive</option>
                </select>
              </div>
            </CardHeader>

            <CardContent>
              <DataTable
                data={managers}
                columns={columns}
                emptyMessage={
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <ShieldCheck className='h-16 w-16 text-muted-foreground/30 mb-4' />
                    <h3 className='text-lg font-semibold text-muted-foreground mb-2'>No Managers Found</h3>
                    <p className='text-sm text-muted-foreground mb-4 max-w-md'>
                      {searchQuery || statusFilter !== 'all'
                        ? 'No managers match your search criteria. Try adjusting your filters.'
                        : 'No managers have been created for your pharmacy yet. Click "Create Manager" to add your first manager.'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                      <Button onClick={() => setCreateModalOpen(true)} className='gap-2'>
                        <UserPlus className='h-4 w-4' />
                        Create Your First Manager
                      </Button>
                    )}
                  </div>
                }
              />
            </CardContent>
          </Card>
      </main>

      {/* Create Manager Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Create New Manager Account</DialogTitle>
            <DialogDescription>
              Create a new manager account for your pharmacy. The manager will have access to all branches within your pharmacy.
              The new manager will receive a verification email.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateManager} className='space-y-4'>
            <div>
              <Label htmlFor='full_name'>Full Name *</Label>
              <Input
                id='full_name'
                name='full_name'
                value={createForm.full_name}
                onChange={handleCreateChange}
                placeholder='Enter full name'
                className={createErrors.full_name ? 'border-red-500' : ''}
              />
              {createErrors.full_name && (
                <p className='text-sm text-red-500 mt-1'>{createErrors.full_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor='email'>Email Address *</Label>
              <Input
                id='email'
                name='email'
                type='email'
                value={createForm.email}
                onChange={handleCreateChange}
                placeholder='manager@pharmacy.com'
                className={createErrors.email ? 'border-red-500' : ''}
              />
              {createErrors.email && (
                <p className='text-sm text-red-500 mt-1'>{createErrors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor='password'>Password *</Label>
              <Input
                id='password'
                name='password'
                type='password'
                value={createForm.password}
                onChange={handleCreateChange}
                placeholder='Enter manager password'
                className={createErrors.password ? 'border-red-500' : ''}
              />
              {createErrors.password && (
                <p className='text-sm text-red-500 mt-1'>{createErrors.password}</p>
              )}
            </div>

            <div>
              <Label htmlFor='branch_id'>Branch *</Label>
              <select
                id='branch_id'
                name='branch_id'
                value={createForm.branch_id}
                onChange={handleCreateChange}
                className={`w-full px-3 py-2 border rounded-md bg-background ${
                  createErrors.branch_id ? 'border-red-500' : ''
                }`}
              >
                <option value=''>Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {createErrors.branch_id && (
                <p className='text-sm text-red-500 mt-1'>{createErrors.branch_id}</p>
              )}
              <p className='text-xs text-muted-foreground mt-1'>
                Only branches within your pharmacy are available
              </p>
            </div>

            <div>
              <Label htmlFor='phone'>Phone Number</Label>
              <Input
                id='phone'
                name='phone'
                value={createForm.phone}
                onChange={handleCreateChange}
                placeholder='0912345678'
                className={createErrors.phone ? 'border-red-500' : ''}
              />
              {createErrors.phone && (
                <p className='text-sm text-red-500 mt-1'>{createErrors.phone}</p>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='send_welcome_email'
                name='send_welcome_email'
                checked={createForm.send_welcome_email}
                onChange={handleCreateChange}
                className='w-4 h-4'
              />
              <Label htmlFor='send_welcome_email' className='cursor-pointer'>
                Send welcome email with verification link
              </Label>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={processing}>
                {processing ? 'Creating...' : 'Create Manager'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Verify Manager Modal */}
      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Verify Manager Account</DialogTitle>
            <DialogDescription>
              Enter the 6-digit verification code sent to{' '}
              <strong>{selectedManager?.email}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifyManager} className='space-y-4'>
            <div>
              <Label htmlFor='verification_code'>Verification Code</Label>
              <Input
                id='verification_code'
                type='text'
                inputMode='numeric'
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder='123456'
                className='text-center text-2xl tracking-widest'
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setVerifyModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={processing}>
                {processing ? 'Verifying...' : 'Verify Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Manager Confirmation Modal */}
      <ConfirmDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title='Delete Manager Account'
        description={`Are you sure you want to delete the manager account for ${selectedManager?.full_name}? This action cannot be undone.`}
        onConfirm={handleDeleteManager}
        confirmText='Delete'
        cancelText='Cancel'
        processing={processing}
      />

      {/* Reset Password Modal */}
      <ConfirmDialog
        open={resetPasswordModalOpen}
        onOpenChange={setResetPasswordModalOpen}
        title='Reset Manager Password'
        description={`Are you sure you want to reset the password for ${selectedManager?.full_name}? A password reset email will be sent to ${selectedManager?.email}.`}
        onConfirm={handleResetPassword}
        confirmText='Send Reset Email'
        cancelText='Cancel'
        processing={processing}
      />
    </div>
  );
};

export default ManagersPage;
