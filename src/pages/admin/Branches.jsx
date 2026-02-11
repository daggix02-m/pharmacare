import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DataTable from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { adminService } from '@/services';
import {
  Building2,
  MapPin,
  Users,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  AlertCircle,
  UserCog,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

/**
 * Transform manager data to pharmacy-centric structure
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

const AdminBranches = () => {
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [pharmacyBranches, setPharmacyBranches] = useState([]);
  const [pharmacyStaff, setPharmacyStaff] = useState([]);

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Log authentication status
      const accessToken = localStorage.getItem('accessToken');
      const userRole = localStorage.getItem('userRole');
      const userId = localStorage.getItem('userId');
      console.log('[PHARMACY PAGE] Authentication Status:', {
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length,
        userRole,
        userId,
      });

      const response = await adminService.getManagers();

      console.log('[PHARMACY PAGE] Full API Response:', JSON.stringify(response, null, 2));
      console.log('[PHARMACY PAGE] Response.success:', response.success);
      console.log('[PHARMACY PAGE] Response.data:', response.data);

      if (response.success) {
        let managersData = [];

        if (response.data && typeof response.data === 'object') {
          managersData = response.data.all || [];
        }

        // Transform to pharmacy-centric structure
        const pharmaciesData = managersData.map(transformManagerToPharmacy);
        console.log('[PHARMACY PAGE] Transformed pharmacies:', pharmaciesData);
        setPharmacies(pharmaciesData);
      } else {
        setError(response.message || 'Failed to load pharmacies');
        toast.error(response.message || 'Failed to load pharmacies');
      }
    } catch (error) {
      setError('An error occurred while loading pharmacies');
      toast.error('An error occurred while loading pharmacies');
      console.error('[PHARMACY PAGE] Error fetching pharmacies:', error);
      console.error('[PHARMACY PAGE] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const totalPharmacies = pharmacies.length;
  const activePharmacies = pharmacies.filter((p) => p.isActive).length;
  const totalBranches = pharmacies.reduce((sum, p) => sum + (p.branch.id ? 1 : 0), 0);
  const totalStaff = pharmacies.reduce((sum, p) => sum + (p.branch.totalStaff || 0), 0);

  const handleRowClick = async (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setDetailsModalOpen(true);
    setFetchingDetails(true);
    setPharmacyBranches([]);
    setPharmacyStaff([]);

    try {
      // Fetch branches for this pharmacy
      const branchesResponse = await adminService.getBranchesList();
      if (branchesResponse.success) {
        const allBranches = branchesResponse.data?.branches || branchesResponse.branches || [];
        // Filter branches that belong to this pharmacy
        const pharmacyBranches = allBranches.filter(
          (b) => b.pharmacy_id === pharmacy.pharmacyId || b.pharmacy?.id === pharmacy.pharmacyId
        );
        setPharmacyBranches(pharmacyBranches);
      }

      // Fetch staff for this pharmacy (using manager details)
      const managerResponse = await adminService.getManagerById(pharmacy.manager.id);
      if (managerResponse.success && managerResponse.data) {
        // Extract staff information from manager data
        const staffData = managerResponse.data.staff || managerResponse.data.employees || [];
        setPharmacyStaff(Array.isArray(staffData) ? staffData : []);
      }
    } catch (error) {
      console.error('Error fetching pharmacy details:', error);
      toast.error('Failed to load pharmacy details');
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleActivatePharmacy = async (pharmacy) => {
    if (!pharmacy.manager.id) return;

    try {
      setProcessing(true);
      const response = await adminService.activateManager(pharmacy.manager.id);

      if (response.success) {
        toast.success('Pharmacy activated successfully');
        fetchPharmacies();
      } else {
        toast.error(response.message || 'Failed to activate pharmacy');
      }
    } catch (error) {
      toast.error('An error occurred while activating pharmacy');
      console.error('Error activating pharmacy:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeactivatePharmacy = async (pharmacy) => {
    if (!pharmacy.manager.id) return;

    try {
      setProcessing(true);
      const response = await adminService.deactivateManager(pharmacy.manager.id);

      if (response.success) {
        toast.success('Pharmacy deactivated successfully');
        fetchPharmacies();
      } else {
        toast.error(response.message || 'Failed to deactivate pharmacy');
      }
    } catch (error) {
      toast.error('An error occurred while deactivating pharmacy');
      console.error('Error deactivating pharmacy:', error);
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      key: 'pharmacyId',
      label: 'Pharmacy ID',
      render: (value, row) => {
        const id = value || row.id || row.pharmacyId || 'N/A';
        return <span className='font-mono text-sm text-slate-600 dark:text-slate-400'>{id}</span>;
      },
      className: 'w-24',
    },
    {
      key: 'pharmacyName',
      label: 'Pharmacy Name',
      render: (value, row) => {
        const name = value || row.pharmacy_name || row.pharmacyName || 'Unnamed Pharmacy';
        return (
          <div className='flex items-center text-slate-900 dark:text-slate-50 font-semibold'>
            <Building2 className='h-4 w-4 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0' />
            <span className='truncate' aria-label={`Pharmacy name: ${name}`}>
              {name}
            </span>
          </div>
        );
      },
      className: 'min-w-[200px]',
    },
    {
      key: 'managerName',
      label: 'Manager',
      render: (value, row) => {
        const managerName = row.manager?.name || row.full_name || row.name || 'N/A';
        return (
          <div className='flex items-center text-slate-700 dark:text-slate-300'>
            <UserCog className='h-4 w-4 mr-2 text-slate-400 dark:text-slate-500 flex-shrink-0' />
            <span className='truncate'>{managerName}</span>
          </div>
        );
      },
      className: 'min-w-[180px]',
    },
    {
      key: 'branchName',
      label: 'Branch',
      render: (value, row) => {
        const branchName = row.branch?.name || row.branch_name || row.branchName || 'N/A';
        return (
          <div className='flex items-center text-slate-700 dark:text-slate-300'>
            <MapPin className='h-4 w-4 mr-2 text-slate-400 dark:text-slate-500 flex-shrink-0' />
            <span className='truncate'>{branchName}</span>
          </div>
        );
      },
      className: 'min-w-[180px]',
    },
    {
      key: 'totalStaff',
      label: 'Staff Count',
      render: (value, row) => {
        const staffCount = row.branch?.totalStaff || row.total_staff || 0;
        return (
          <div className='flex items-center text-slate-700 dark:text-slate-300'>
            <Users className='h-4 w-4 mr-2 text-slate-400 dark:text-slate-500 flex-shrink-0' />
            <span>{staffCount}</span>
          </div>
        );
      },
      className: 'w-28',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => {
        const isActive = row.isActive;
        const isPending = row.isPending;
        return (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : isPending
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
            aria-label={`Pharmacy status: ${isActive ? 'Active' : isPending ? 'Pending' : 'Inactive'}`}
          >
            {isActive ? 'Active' : isPending ? 'Pending' : 'Inactive'}
          </span>
        );
      },
      className: 'w-28',
    },
  ];

  if (loading) {
    return (
      <div
        className='flex items-center justify-center min-h-screen'
        role='status'
        aria-label='Loading pharmacies'
      >
        <div
          className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'
          aria-hidden='true'
        ></div>
        <span className='sr-only'>Loading pharmacies...</span>
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
                Pharmacy Management
              </h1>
              <p className='mt-2 text-gray-600'>
                View and manage all pharmacies, their branches, and staff
              </p>
            </div>
            <Button
              onClick={fetchPharmacies}
              disabled={loading}
              variant='outline'
              className='self-start sm:self-auto'
              aria-label='Refresh pharmacies list'
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                aria-hidden='true'
              />
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
              <AlertCircle
                className='h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5'
                aria-hidden='true'
              />
              <div>
                <h3 className='font-semibold text-red-900 dark:text-red-100'>
                  Error Loading Pharmacies
                </h3>
                <p className='text-sm text-red-700 dark:text-red-300 mt-1'>{error}</p>
              </div>
            </div>
          )}

          {/* Summary Statistics Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <Card className='border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                      Total Pharmacies
                    </p>
                    <p className='text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2'>
                      {totalPharmacies}
                    </p>
                  </div>
                  <div
                    className='bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full'
                    aria-hidden='true'
                  >
                    <Building2 className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                      Active Pharmacies
                    </p>
                    <p className='text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2'>
                      {activePharmacies}
                    </p>
                  </div>
                  <div
                    className='bg-green-100 dark:bg-green-900/30 p-3 rounded-full'
                    aria-hidden='true'
                  >
                    <Power className='h-6 w-6 text-green-600 dark:text-green-400' />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                      Total Staff
                    </p>
                    <p className='text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2'>
                      {totalStaff}
                    </p>
                  </div>
                  <div
                    className='bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full'
                    aria-hidden='true'
                  >
                    <Users className='h-6 w-6 text-purple-600 dark:text-purple-400' />
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
                  <CardTitle className='text-xl text-slate-900 dark:text-slate-50'>
                    Pharmacy Directory
                  </CardTitle>
                  <CardDescription className='mt-1'>
                    Complete list of all pharmacies with their branches and staff details
                  </CardDescription>
                </div>
                <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-lg'>
                  <Search className='h-4 w-4' aria-hidden='true' />
                  <span>{pharmacies.length} pharmacies found</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={pharmacies}
                searchable={true}
                pagination={true}
                itemsPerPage={10}
                onRowClick={handleRowClick}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Pharmacy Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto' aria-labelledby='pharmacy-details-title'>
          <DialogHeader>
            <DialogTitle id='pharmacy-details-title' className='text-2xl flex items-center gap-2'>
              <Building2
                className='h-6 w-6 text-blue-600 dark:text-blue-400'
                aria-hidden='true'
              />
              Pharmacy Details
            </DialogTitle>
          </DialogHeader>
          {selectedPharmacy && (
            <div className='space-y-6'>
              {/* Basic Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2'>
                  <Briefcase className='h-5 w-5' />
                  Basic Information
                </h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
                    <label className='text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1'>
                      Pharmacy ID
                    </label>
                    <p className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
                      {selectedPharmacy.pharmacyId || 'N/A'}
                    </p>
                  </div>
                  <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
                    <label className='text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1'>
                      Pharmacy Name
                    </label>
                    <p className='text-lg font-semibold text-slate-900 dark:text-slate-50'>
                      {selectedPharmacy.pharmacyName || 'N/A'}
                    </p>
                  </div>
                  <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
                    <label className='text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1'>
                      Manager Name
                    </label>
                    <p className='text-base text-slate-900 dark:text-slate-50'>
                      {selectedPharmacy.manager?.name || 'N/A'}
                    </p>
                  </div>
                  <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
                    <label className='text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1'>
                      Manager Email
                    </label>
                    <p className='text-base text-slate-900 dark:text-slate-50'>
                      {selectedPharmacy.manager?.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg'>
                <label className='text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2'>
                  Status
                </label>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    selectedPharmacy.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : selectedPharmacy.isPending
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {selectedPharmacy.isActive ? 'Active' : selectedPharmacy.isPending ? 'Pending' : 'Inactive'}
                </span>
              </div>

              {/* Branches Section */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2'>
                  <MapPin className='h-5 w-5' />
                  Branches ({pharmacyBranches.length})
                </h3>
                {fetchingDetails ? (
                  <div className='flex items-center justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                  </div>
                ) : pharmacyBranches.length > 0 ? (
                  <div className='space-y-3'>
                    {pharmacyBranches.map((branch) => (
                      <div
                        key={branch.branch_id || branch.id}
                        className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-2'>
                              <MapPin className='h-4 w-4 text-slate-500' />
                              <span className='font-semibold text-slate-900 dark:text-slate-50'>
                                {branch.name || branch.branch_name || branch.branchName || 'Unnamed Branch'}
                              </span>
                            </div>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm'>
                              <div>
                                <span className='text-slate-600 dark:text-slate-400'>ID: </span>
                                <span className='text-slate-900 dark:text-slate-50 font-mono'>
                                  {branch.branch_id || branch.id || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className='text-slate-600 dark:text-slate-400'>Phone: </span>
                                <span className='text-slate-900 dark:text-slate-50'>
                                  {branch.phone || branch.branch_phone || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className='text-slate-600 dark:text-slate-400'>Email: </span>
                                <span className='text-slate-900 dark:text-slate-50'>
                                  {branch.email || branch.branch_email || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className='text-slate-600 dark:text-slate-400'>Status: </span>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                    branch.is_active !== false
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  }`}
                                >
                                  {branch.is_active !== false ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg text-center'>
                    <MapPin className='h-12 w-12 text-slate-400 mx-auto mb-2' />
                    <p className='text-slate-600 dark:text-slate-400'>No branches found for this pharmacy</p>
                  </div>
                )}
              </div>

              {/* Staff Section */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  Staff ({pharmacyStaff.length})
                </h3>
                {fetchingDetails ? (
                  <div className='flex items-center justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                  </div>
                ) : pharmacyStaff.length > 0 ? (
                  <div className='space-y-3'>
                    {pharmacyStaff.map((staff, index) => (
                      <div
                        key={staff.id || staff.user_id || index}
                        className='bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-2'>
                              <UserCog className='h-4 w-4 text-slate-500' />
                              <span className='font-semibold text-slate-900 dark:text-slate-50'>
                                {staff.full_name || staff.name || 'Unnamed Staff'}
                              </span>
                            </div>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm'>
                              <div>
                                <span className='text-slate-600 dark:text-slate-400'>ID: </span>
                                <span className='text-slate-900 dark:text-slate-50 font-mono'>
                                  {staff.user_id || staff.id || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className='text-slate-600 dark:text-slate-400'>Email: </span>
                                <span className='text-slate-900 dark:text-slate-50'>
                                  {staff.email || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className='text-slate-600 dark:text-slate-400'>Role: </span>
                                <span className='text-slate-900 dark:text-slate-50'>
                                  {staff.role || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className='text-slate-600 dark:text-slate-400'>Status: </span>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                    staff.is_active
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  }`}
                                >
                                  {staff.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg text-center'>
                    <Users className='h-12 w-12 text-slate-400 mx-auto mb-2' />
                    <p className='text-slate-600 dark:text-slate-400'>No staff found for this pharmacy</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className='flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800'>
                {selectedPharmacy.isActive ? (
                  <Button
                    onClick={() => handleDeactivatePharmacy(selectedPharmacy)}
                    disabled={processing}
                    variant='destructive'
                    className='flex-1'
                  >
                    <PowerOff className='h-4 w-4 mr-2' />
                    Deactivate Pharmacy
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleActivatePharmacy(selectedPharmacy)}
                    disabled={processing}
                    variant='default'
                    className='flex-1'
                  >
                    <Power className='h-4 w-4 mr-2' />
                    Activate Pharmacy
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBranches;
