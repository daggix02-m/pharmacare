import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTable from '@/components/common/DataTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AsyncWrapper from '@/components/common/AsyncWrapper';
import { managerService } from '@/services';
import { parseError } from '@/utils/errorHandler';
import {
  validateMedicineName,
  validateQuantity,
  validatePrice,
  validateExpiryDate,
  validateBatchNumber,
} from '@/utils/validation';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
  RefreshCw,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Boxes,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const ManagerMedicines = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    category: '',
    manufacturer: '',
    dosage_form: '',
    strength: '',
    quantity: '',
    unit_price: '',
    expiry_date: '',
    batch_number: '',
    description: '',
    min_stock_level: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, [currentPage, searchQuery, categoryFilter]);

  const fetchMedicines = async () => {
    try {
      if (loading) setError(null);
      setRefreshing(true);
      const response = await managerService.getMedicines({
        page: currentPage,
        limit: 20,
        search: searchQuery,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });

      if (response.success) {
        setMedicines(response.data?.medicines || response.medicines || []);
        setTotalPages(response.data?.totalPages || 1);
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

  const validateForm = () => {
    const errors = {};
    const validations = {
      name: validateMedicineName(formData.name),
      quantity: validateQuantity(formData.quantity),
      unit_price: validatePrice(formData.unit_price),
      expiry_date: validateExpiryDate(formData.expiry_date),
    };

    Object.entries(validations).forEach(([field, result]) => {
      if (!result.valid) errors[field] = result.error;
    });

    if (formData.batch_number && !validateBatchNumber(formData.batch_number).valid) {
      errors.batch_number = validateBatchNumber(formData.batch_number).error;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setProcessing(true);
      const response = await managerService.addMedicine(formData);
      if (response.success) {
        toast.success('Medicine added successfully');
        setAddModalOpen(false);
        resetForm();
        fetchMedicines();
      } else {
        toast.error(parseError(response));
      }
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleEditClick = (medicine) => {
    setSelectedMedicine(medicine);
    setFormData({
      ...medicine,
      expiry_date: medicine.expiry_date ? medicine.expiry_date.split('T')[0] : '',
    });
    setEditModalOpen(true);
  };

  const handleUpdateMedicine = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setProcessing(true);
      const response = await managerService.updateMedicineStock(selectedMedicine.medicine_id, {
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        expiry_date: formData.expiry_date,
        batch_number: formData.batch_number,
      });
      if (response.success) {
        toast.success('Inventory updated successfully');
        setEditModalOpen(false);
        resetForm();
        fetchMedicines();
      } else {
        toast.error(parseError(response));
      }
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteClick = (medicine) => {
    setSelectedMedicine(medicine);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setProcessing(true);
      const response = await managerService.deleteMedicine(selectedMedicine.medicine_id);
      if (response.success) {
        toast.success('Medicine removed');
        setDeleteModalOpen(false);
        fetchMedicines();
      } else {
        toast.error(parseError(response));
      }
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      generic_name: '',
      category: '',
      manufacturer: '',
      dosage_form: '',
      strength: '',
      quantity: '',
      unit_price: '',
      expiry_date: '',
      batch_number: '',
      description: '',
      min_stock_level: '',
    });
    setFormErrors({});
  };

  const getStockStatus = (medicine) => {
    if (medicine.quantity === 0) return { text: 'Out of Stock', variant: 'destructive', icon: AlertCircle };
    if (medicine.quantity <= (medicine.min_stock_level || 10)) {
      return { text: 'Low Stock', variant: 'warning', icon: AlertTriangle };
    }
    return { text: 'In Stock', variant: 'success', icon: CheckCircle2 };
  };

  const getStatistics = () => {
    const totalMedicines = medicines.length;
    const totalStock = medicines.reduce((sum, m) => sum + Number(m.quantity), 0);
    const lowStockCount = medicines.filter(m => m.quantity <= (m.min_stock_level || 10)).length;
    const outOfStockCount = medicines.filter(m => m.quantity === 0).length;
    const expiringSoon = medicines.filter(m => isExpiringSoon(m.expiry_date)).length;
    const expiredCount = medicines.filter(m => isExpired(m.expiry_date)).length;
    const totalValue = medicines.reduce((sum, m) => sum + (Number(m.quantity) * Number(m.unit_price)), 0);

    return {
      totalMedicines,
      totalStock,
      lowStockCount,
      outOfStockCount,
      expiringSoon,
      expiredCount,
      totalValue
    };
  };

  const stats = getStatistics();

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const columns = [
    {
      key: 'name',
      label: 'Medicine Name',
      render: (v) => <span className="font-medium">{v}</span>,
    },
    { key: 'category', label: 'Category' },
    {
      key: 'quantity',
      label: 'Stock',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <span className={v <= (row.min_stock_level || 10) ? 'text-red-600 font-bold' : ''}>
            {v}
          </span>
          {v <= (row.min_stock_level || 10) && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      ),
    },
    { key: 'unit_price', label: 'Price', render: (v) => `$${Number(v).toFixed(2)}` },
    {
      key: 'expiry_date',
      label: 'Expiry',
      render: (v) => {
        if (!v) return 'N/A';
        const formatted = new Date(v).toLocaleDateString();
        if (isExpired(v)) {
          return <span className="text-red-600 font-medium">Expired - {formatted}</span>;
        }
        if (isExpiringSoon(v)) {
          return <span className="text-orange-600 font-medium">{formatted}</span>;
        }
        return formatted;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (v, row) => {
        const status = getStockStatus(row);
        const Icon = status.icon;
        return (
          <Badge
            variant={status.variant === 'success' ? 'default' : status.variant}
            className="gap-1.5"
          >
            <Icon className="h-3 w-3" />
            {status.text}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => handleEditClick(row)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(row)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-md">
                  <Package className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
                Medicine Inventory
              </h1>
              <p className="text-slate-600 dark:text-slate-400 ml-1">Manage stock levels, track inventory, and monitor medicine details</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchMedicines}
                disabled={refreshing}
                className="shadow-sm hover:shadow-md transition-all"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-md hover:shadow-lg transition-all"
                onClick={() => {
                  resetForm();
                  setAddModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Medicines</CardTitle>
                <Boxes className="h-4 w-4 text-slate-400 dark:text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stats.totalMedicines}</div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Active products</p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Stock</CardTitle>
                <TrendingUp className="h-4 w-4 text-slate-400 dark:text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stats.totalStock.toLocaleString()}</div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Units in inventory</p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Low Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-slate-400 dark:text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stats.lowStockCount}</div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {stats.outOfStockCount > 0 && `${stats.outOfStockCount} out of stock`}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-slate-400 dark:text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Inventory worth</p>
              </CardContent>
            </Card>
          </div>

          {/* Expiry Alerts */}
          {(stats.expiringSoon > 0 || stats.expiredCount > 0) && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                      {stats.expiredCount > 0 && `${stats.expiredCount} expired medicine${stats.expiredCount > 1 ? 's' : ''}`}
                      {stats.expiredCount > 0 && stats.expiringSoon > 0 && ' • '}
                      {stats.expiringSoon > 0 && `${stats.expiringSoon} expiring soon`}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Review these items to prevent stock loss
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <Card className="shadow-md border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-slate-500" />
                  <CardTitle className="text-slate-900 dark:text-slate-50">Inventory List</CardTitle>
                </div>
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search medicines by name, category, or manufacturer..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus-visible:ring-slate-500"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full">
                <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4">
                  <TabsList className="h-auto bg-transparent border-0 p-0">
                    <div className="flex flex-wrap gap-2 py-3">
                      <TabsTrigger
                        value="all"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        All ({stats.totalMedicines})
                      </TabsTrigger>
                      <TabsTrigger
                        value="pain-relief"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Pain Relief
                      </TabsTrigger>
                      <TabsTrigger
                        value="antibiotic"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Antibiotics
                      </TabsTrigger>
                      <TabsTrigger
                        value="antihistamine"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Antihistamines
                      </TabsTrigger>
                      <TabsTrigger
                        value="vitamin"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Vitamins
                      </TabsTrigger>
                      <TabsTrigger
                        value="supplement"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Supplements
                      </TabsTrigger>
                      <TabsTrigger
                        value="cardiovascular"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Cardiovascular
                      </TabsTrigger>
                      <TabsTrigger
                        value="respiratory"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Respiratory
                      </TabsTrigger>
                      <TabsTrigger
                        value="gastrointestinal"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Gastrointestinal
                      </TabsTrigger>
                      <TabsTrigger
                        value="dermatological"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Dermatological
                      </TabsTrigger>
                    </div>
                  </TabsList>
                </div>

                <AsyncWrapper loading={loading} error={error} onRetry={fetchMedicines}>
                  <DataTable
                    columns={columns}
                    data={medicines}
                    pagination
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    onRowClick={(row) => {
                      setSelectedMedicine(row);
                      setDetailsModalOpen(true);
                    }}
                  />
                </AsyncWrapper>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Medicine Details</DialogTitle>
                <DialogDescription>View detailed information about this medicine</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedMedicine && (
            <div className="space-y-4 py-4">
              {/* Medicine Name Card */}
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Medicine Name</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{selectedMedicine.name}</p>
                  {selectedMedicine.generic_name && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{selectedMedicine.generic_name}</p>
                  )}
                </CardContent>
              </Card>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</Label>
                  <Badge variant="outline" className="w-full justify-start">
                    {selectedMedicine.category || 'N/A'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Manufacturer</Label>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{selectedMedicine.manufacturer || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dosage Form</Label>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{selectedMedicine.dosage_form || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Strength</Label>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{selectedMedicine.strength || 'N/A'}</p>
                </div>
              </div>

              {/* Stock and Price */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Current Stock</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{selectedMedicine.quantity}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Unit Price</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">${Number(selectedMedicine.unit_price).toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Expiry and Batch */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expiry Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <p className={`text-sm font-medium ${isExpired(selectedMedicine.expiry_date) ? 'text-red-600 dark:text-red-400' : isExpiringSoon(selectedMedicine.expiry_date) ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-slate-50'}`}>
                      {selectedMedicine.expiry_date
                        ? new Date(selectedMedicine.expiry_date).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Batch Number</Label>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{selectedMedicine.batch_number || 'N/A'}</p>
                </div>
              </div>

              {/* Description */}
              {selectedMedicine.description && (
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</Label>
                  <Card className="bg-slate-50 dark:bg-slate-900/50">
                    <CardContent className="pt-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{selectedMedicine.description}</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Medicine Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Medicine</DialogTitle>
            <DialogDescription>Fill in the required fields (marked with *) to add a new medicine to the inventory.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMedicine} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Medicine Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Paracetamol 500mg"
                    required
                    aria-required="true"
                    aria-invalid={!!formErrors.name}
                    aria-describedby={formErrors.name ? "name-error" : undefined}
                    className={formErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {formErrors.name && (
                    <p id="name-error" className="text-sm text-red-500" role="alert">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="generic_name" className="text-sm font-medium">
                    Generic Name
                  </Label>
                  <Input
                    id="generic_name"
                    name="generic_name"
                    value={formData.generic_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Acetaminophen"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger id="category" aria-label="Select medicine category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pain-relief">Pain Relief</SelectItem>
                      <SelectItem value="antibiotic">Antibiotic</SelectItem>
                      <SelectItem value="antihistamine">Antihistamine</SelectItem>
                      <SelectItem value="vitamin">Vitamin</SelectItem>
                      <SelectItem value="supplement">Supplement</SelectItem>
                      <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
                      <SelectItem value="respiratory">Respiratory</SelectItem>
                      <SelectItem value="gastrointestinal">Gastrointestinal</SelectItem>
                      <SelectItem value="dermatological">Dermatological</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer" className="text-sm font-medium">
                    Manufacturer
                  </Label>
                  <Input
                    id="manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    placeholder="e.g., ABC Pharma Ltd"
                  />
                </div>
              </div>
            </div>

            {/* Dosage Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Dosage Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dosage_form" className="text-sm font-medium">
                    Dosage Form
                  </Label>
                  <Input
                    id="dosage_form"
                    name="dosage_form"
                    value={formData.dosage_form}
                    onChange={handleInputChange}
                    placeholder="e.g., Tablet, Capsule, Syrup"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strength" className="text-sm font-medium">
                    Strength
                  </Label>
                  <Input
                    id="strength"
                    name="strength"
                    value={formData.strength}
                    onChange={handleInputChange}
                    placeholder="e.g., 500mg, 10ml"
                  />
                </div>
              </div>
            </div>

            {/* Inventory Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Inventory Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="e.g., 100"
                    required
                    aria-required="true"
                    aria-invalid={!!formErrors.quantity}
                    aria-describedby={formErrors.quantity ? "quantity-error" : undefined}
                    className={formErrors.quantity ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {formErrors.quantity && (
                    <p id="quantity-error" className="text-sm text-red-500" role="alert">
                      {formErrors.quantity}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_stock_level" className="text-sm font-medium">
                    Minimum Stock Level
                  </Label>
                  <Input
                    id="min_stock_level"
                    name="min_stock_level"
                    type="number"
                    min="0"
                    value={formData.min_stock_level}
                    onChange={handleInputChange}
                    placeholder="e.g., 10"
                  />
                  <p className="text-xs text-muted-foreground">Alert when stock falls below this level</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_price" className="text-sm font-medium">
                    Unit Price ($) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="unit_price"
                    name="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={handleInputChange}
                    placeholder="e.g., 2.50"
                    required
                    aria-required="true"
                    aria-invalid={!!formErrors.unit_price}
                    aria-describedby={formErrors.unit_price ? "unit_price-error" : undefined}
                    className={formErrors.unit_price ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {formErrors.unit_price && (
                    <p id="unit_price-error" className="text-sm text-red-500" role="alert">
                      {formErrors.unit_price}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch_number" className="text-sm font-medium">
                    Batch Number
                  </Label>
                  <Input
                    id="batch_number"
                    name="batch_number"
                    value={formData.batch_number}
                    onChange={handleInputChange}
                    placeholder="e.g., BATCH-2024-001"
                    aria-invalid={!!formErrors.batch_number}
                    aria-describedby={formErrors.batch_number ? "batch_number-error" : undefined}
                    className={formErrors.batch_number ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {formErrors.batch_number && (
                    <p id="batch_number-error" className="text-sm text-red-500" role="alert">
                      {formErrors.batch_number}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry_date" className="text-sm font-medium">
                    Expiry Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="expiry_date"
                    name="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    aria-required="true"
                    aria-invalid={!!formErrors.expiry_date}
                    aria-describedby={formErrors.expiry_date ? "expiry_date-error" : undefined}
                    className={formErrors.expiry_date ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {formErrors.expiry_date && (
                    <p id="expiry_date-error" className="text-sm text-red-500" role="alert">
                      {formErrors.expiry_date}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Additional Information
              </h3>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide additional information about this medicine (usage, side effects, storage instructions, etc.)"
                  rows={4}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddModalOpen(false);
                  resetForm();
                }}
                disabled={processing}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={processing}
                className="w-full sm:w-auto bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200"
              >
                {processing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Adding Medicine...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Medicine
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Medicine Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
            <DialogDescription>Update the stock quantity, price, and expiry date for this medicine.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateMedicine} className="space-y-4">
            <div className="space-y-2">
              <Label>Medicine</Label>
              <div className="bg-muted/50 dark:bg-muted/20 p-3 rounded-md">
                <p className="font-medium">{selectedMedicine?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedMedicine?.generic_name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_quantity">Quantity *</Label>
              <Input
                id="edit_quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
              />
              {formErrors.quantity && <p className="text-sm text-red-500">{formErrors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_unit_price">Unit Price ($) *</Label>
              <Input
                id="edit_unit_price"
                name="unit_price"
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={handleInputChange}
              />
              {formErrors.unit_price && (
                <p className="text-sm text-red-500">{formErrors.unit_price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_expiry_date">Expiry Date *</Label>
              <Input
                id="edit_expiry_date"
                name="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={handleInputChange}
              />
              {formErrors.expiry_date && (
                <p className="text-sm text-red-500">{formErrors.expiry_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_batch_number">Batch Number</Label>
              <Input
                id="edit_batch_number"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleInputChange}
              />
              {formErrors.batch_number && (
                <p className="text-sm text-red-500">{formErrors.batch_number}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false);
                  resetForm();
                }}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Updating...' : 'Update Stock'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Medicine"
        description="Are you sure? This action is permanent."
        variant="danger"
        loading={processing}
      />
    </div>
  );
};

export default ManagerMedicines;
