import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DataTable from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { adminService } from '@/services';
import { Building2, MapPin, Users, Power, PowerOff, RefreshCw, Search, AlertCircle } from 'lucide-react';

const AdminBranches = () => {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getBranchesList();

      console.log('[BRANCHES PAGE] Full API Response:', JSON.stringify(response, null, 2));
      console.log('[BRANCHES PAGE] Response.success:', response.success);
      console.log('[BRANCHES PAGE] Response.data:', response.data);
      console.log('[BRANCHES PAGE] Response.branches:', response.branches);

      if (response.success) {
        // Try multiple possible data structures from backend
        let branchesData = [];

        // Structure 1: response.data.branches
        if (response.data?.branches && Array.isArray(response.data.branches)) {
          branchesData = response.data.branches;
          console.log('[BRANCHES PAGE] Using response.data.branches');
        }
        // Structure 2: response.branches
        else if (response.branches && Array.isArray(response.branches)) {
          branchesData = response.branches;
          console.log('[BRANCHES PAGE] Using response.branches');
        }
        // Structure 3: response.data is an array
        else if (Array.isArray(response.data)) {
          branchesData = response.data;
          console.log('[BRANCHES PAGE] Using response.data as array');
        }
        // Structure 4: response.data.all (similar to managers endpoint)
        else if (response.data?.all && Array.isArray(response.data.all)) {
          branchesData = response.data.all;
          console.log('[BRANCHES PAGE] Using response.data.all');
        }
        // Structure 5: response is an array (unlikely but possible)
        else if (Array.isArray(response)) {
          branchesData = response;
          console.log('[BRANCHES PAGE] Using response as array');
        }
        // Structure 6: Check for other common keys
        else if (response.data) {
          // Try to find an array in response.data
          const possibleArrays = Object.values(response.data).filter(
            val => Array.isArray(val) && val.length > 0
          );
          if (possibleArrays.length > 0) {
            branchesData = possibleArrays[0];
            console.log('[BRANCHES PAGE] Found array in response.data:', Object.keys(response.data));
          }
        }

        console.log('[BRANCHES PAGE] Extracted branchesData:', branchesData);
        console.log('[BRANCHES PAGE] branchesData length:', branchesData.length);
        console.log('[BRANCHES PAGE] First branch sample:', branchesData[0]);

        // Validate that we have the expected fields
        if (branchesData.length > 0) {
          const firstBranch = branchesData[0];
          const hasRequiredFields =
            (firstBranch.branch_id || firstBranch.id) &&
            (firstBranch.name || firstBranch.branch_name);
          
          console.log('[BRANCHES PAGE] Has required fields:', hasRequiredFields);
          console.log('[BRANCHES PAGE] Available fields:', Object.keys(firstBranch));
          
          if (!hasRequiredFields) {
            console.warn('[BRANCHES PAGE] Branch data missing required fields, attempting to map...');
            // Try to map fields if they have different names
          }
        }

        setBranches(branchesData);
      } else {
        setError(response.message || 'Failed to load branches');
        toast.error(response.message || 'Failed to load branches');
      }
    } catch (error) {
      setError('An error occurred while loading branches');
      toast.error('An error occurred while loading branches');
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.is_active !== false).length;

  const handleRowClick = (branch) => {
    setSelectedBranch(branch);
    setDetailsModalOpen(true);
  };

  const handleActivateBranch = async (branch) => {
    if (!branch.branch_id) return;

    try {
      setProcessing(true);
      const response = await adminService.activateBranch(branch.branch_id);

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
      const response = await adminService.deactivateBranch(branch.branch_id);

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
      render: (value, row) => {
        const id = value || row.id || row.branchId || 'N/A';
        return <span className='font-mono text-sm text-slate-600 dark:text-slate-400'>{id}</span>;
      },
      className: 'w-24',
    },
    {
      key: 'name',
      label: 'Branch Name',
      render: (value, row) => {
        const name = value || row.branch_name || row.branchName || 'Unnamed Branch';
        return (
          <span className='font-semibold text-slate-900 dark:text-slate-50' aria-label={`Branch name: ${name}`}>
            {name}
          </span>
        );
      },
      className: 'min-w-[200px]',
    },
    {
      key: 'location',
      label: 'Location',
      render: (value, row) => {
        const location = value || row.branch_location || row.branchLocation || row.address || 'N/A';
        return (
          <div className='flex items-center text-slate-600 dark:text-slate-400' aria-label={`Location: ${location}`}>
            <MapPin className='h-4 w-4 mr-2 text-slate-400 dark:text-slate-500 flex-shrink-0' aria-hidden='true' />
            <span className='truncate'>{location}</span>
          </div>
        );
      },
      className: 'min-w-[150px]',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => {
        const isActive = row.is_active !== false;
        return (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              isActive
                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
            aria-label={`Branch status: ${isActive ? 'Active' : 'Inactive'}`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
      className: 'w-28',
    },
  ];

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen' role='status' aria-label='Loading branches'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary' aria-hidden='true'></div>
        <span className='sr-only'>Loading branches...</span>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      <Navigation />

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8' role='main'>
        <div className='px-4 py-6 sm:px-0 space-y-6'>
          
          {/* Page Header */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
                <Building2 className='h-8 w-8 text-blue-600' aria-hidden='true' />
                Pharmacy Branches
              </h1>
              <p className='mt-2 text-gray-600'>
                View and manage all pharmacy branches in the system
              </p>
            </div>
            <Button
              onClick={fetchBranches}
              disabled={loading}
              variant='outline'
              className='self-start sm:self-auto'
              aria-label='Refresh branches list'
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} aria-hidden='true' />
              Refresh
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div
              className='bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3'
              role='alert'
              aria-live='polite'
            >
              <AlertCircle className='h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5' aria-hidden='true' />
              <div>
                <h3 className='font-semibold text-red-900 dark:text-red-100'>Error Loading Branches</h3>
                <p className='text-sm text-red-700 dark:text-red-300 mt-1'>{error}</p>
              </div>
            </div>
          )}

          {/* Summary Statistics Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <Card className='border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>Total Branches</p>
                    <p className='text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2'>{totalBranches}</p>
                  </div>
                  <div className='bg-slate-100 dark:bg-slate-800 p-3 rounded-full' aria-hidden='true'>
                    <Building2 className='h-6 w-6 text-slate-600 dark:text-slate-400' />
                  </div>
                </div>
              </CardContent>
            </Card>
 
            <Card className='border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>Active Branches</p>
                    <p className='text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2'>{activeBranches}</p>
                  </div>
                  <div className='bg-slate-100 dark:bg-slate-800 p-3 rounded-full' aria-hidden='true'>
                    <Power className='h-6 w-6 text-slate-600 dark:text-slate-400' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table Card */}
          <Card className='border-slate-200 dark:border-slate-800'>
            <CardHeader>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                  <CardTitle className='text-xl text-slate-900 dark:text-slate-50'>Branch Directory</CardTitle>
                  <CardDescription className='mt-1'>
                    Complete list of all branches with their personnel details
                  </CardDescription>
                </div>
                <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-lg'>
                  <Search className='h-4 w-4' aria-hidden='true' />
                  <span>{branches.length} branches found</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
        <DialogContent className='max-w-2xl' aria-labelledby='branch-details-title'>
          <DialogHeader>
            <DialogTitle id='branch-details-title' className='text-2xl flex items-center gap-2'>
              <Building2 className='h-6 w-6 text-slate-600 dark:text-slate-400' aria-hidden='true' />
              Branch Details
            </DialogTitle>
          </DialogHeader>
          {selectedBranch && (
            <div className='space-y-6'>
              {/* Basic Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-50'>Basic Information</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
                    <label className='text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1'>Branch ID</label>
                    <p className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
                      {selectedBranch.branch_id || selectedBranch.id || 'N/A'}
                    </p>
                  </div>
                  <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
                    <label className='text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1'>Branch Name</label>
                    <p className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
                      {selectedBranch.name || selectedBranch.branch_name || selectedBranch.branchName || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
                  <label className='text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1'>Location</label>
                  <p className='text-base text-slate-900 dark:text-slate-50 flex items-center'>
                    <MapPin className='h-5 w-5 mr-2 text-slate-400 dark:text-slate-500' aria-hidden='true' />
                    {selectedBranch.location || selectedBranch.branch_location || selectedBranch.branchLocation || selectedBranch.address || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Contact Information */}

              {/* Contact Information */}
              {(selectedBranch.phone || selectedBranch.email) && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-50'>Contact Information</h3>
                  {selectedBranch.phone && (
                    <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
                      <label className='text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1'>Phone</label>
                      <p className='text-base text-slate-900 dark:text-slate-50'>{selectedBranch.phone}</p>
                    </div>
                  )}
                  {selectedBranch.email && (
                    <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
                      <label className='text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1'>Email</label>
                      <p className='text-base text-slate-900 dark:text-slate-50'>{selectedBranch.email}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status Information */}
              <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
                <label className='text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2'>Status</label>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    selectedBranch.is_active !== false
                      ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {selectedBranch.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminBranches;
