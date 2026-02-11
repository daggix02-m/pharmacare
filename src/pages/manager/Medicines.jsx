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
import MedicineImportModal from '@/components/common/MedicineImportModal';
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
  CheckCircle2,
  ShoppingCart,
  Upload,
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

  // Category ID to Name mapping
  const categoryMap = {
    1: 'Pain Relief',
    2: 'Antibiotics',
    3: 'Antihistamines',
    4: 'Vitamins',
    5: 'Supplements',
    6: 'Cardiovascular',
    7: 'Respiratory',
    8: 'Gastrointestinal',
    9: 'Dermatological',
  };

  const getCategoryName = (categoryId) => {
    return categoryMap[categoryId] || 'Unknown';
  };

  // Helper function to get category ID from category name
  const getCategoryIdFromName = (categoryName) => {
    const entry = Object.entries(categoryMap).find(([id, name]) => name === categoryName);
    return entry ? parseInt(entry[0]) : '';
  };

  // Handle category selection from dropdown
  const handleCategoryChange = (categoryName) => {
    const categoryId = getCategoryIdFromName(categoryName);
    setFormData((prev) => ({ ...prev, category_id: categoryId }));
  };

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    quantity_in_stock: '',
    expiry_date: '',
    type: '',
    barcode: '',
    manufacturer: '',
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
        category_id: categoryFilter !== 'all' ? parseInt(categoryFilter) : undefined,
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
      quantity_in_stock: validateQuantity(formData.quantity_in_stock),
      price: validatePrice(formData.price),
      expiry_date: validateExpiryDate(formData.expiry_date),
    };

    Object.entries(validations).forEach(([field, result]) => {
      if (!result.valid) errors[field] = result.error;
    });

    if (formData.barcode && !validateBatchNumber(formData.barcode).valid) {
      errors.barcode = validateBatchNumber(formData.barcode).error;
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
      name: medicine.name || '',
      category_id: medicine.category_id || '',
      price: medicine.price || '',
      quantity_in_stock: medicine.quantity_in_stock || '',
      expiry_date: medicine.expiry_date ? medicine.expiry_date.split('T')[0] : '',
      type: medicine.type || '',
      barcode: medicine.barcode || '',
      manufacturer: medicine.manufacturer || '',
    });
    setEditModalOpen(true);
  };

  const handleUpdateMedicine = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setProcessing(true);
      const response = await managerService.updateMedicineStock(selectedMedicine.medicine_id, {
        quantity_in_stock: formData.quantity_in_stock,
        price: formData.price,
        expiry_date: formData.expiry_date,
        barcode: formData.barcode,
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

  const handleSellClick = (medicine) => {
    // Navigate to sales page with medicine pre-selected for sale
    // This will be handled by the Sales page's cart functionality
    toast.success(`${medicine.name} added to sales cart`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category_id: '',
      price: '',
      quantity_in_stock: '',
      expiry_date: '',
      type: '',
      barcode: '',
      manufacturer: '',
    });
    setFormErrors({});
  };

  const getStockStatus = (medicine) => {
    if (medicine.quantity_in_stock === 0) return { text: 'Out of Stock', variant: 'destructive', icon: AlertCircle };
    return { text: 'In Stock', variant: 'success', icon: CheckCircle2 };
  };

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

  const getStatistics = () => {
    const totalMedicines = medicines.length;
    const totalStock = medicines.reduce((sum, m) => sum + Number(m.quantity_in_stock), 0);
    const lowStockCount = 0; // min_stock_level field removed
    const outOfStockCount = medicines.filter(m => m.quantity_in_stock === 0).length;
    const expiringSoon = medicines.filter(m => isExpiringSoon(m.expiry_date)).length;
    const expiredCount = medicines.filter(m => isExpired(m.expiry_date)).length;
    const totalValue = medicines.reduce((sum, m) => sum + (Number(m.quantity_in_stock) * Number(m.price)), 0);

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

  const columns = [
    {
      key: 'name',
      label: 'Medicine Name',
      render: (v) => <span className="font-medium">{v}</span>,
    },
    {
      key: 'category_id',
      label: 'Category',
      render: (v) => <span>{getCategoryName(v)}</span>,
    },
    {
      key: 'quantity_in_stock',
      label: 'Stock',
      render: (v) => <span>{v}</span>,
    },
    { key: 'price', label: 'Price', render: (v) => `$${Number(v).toFixed(2)}` },
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
      key: 'type',
      label: 'Type',
    },
    {
      key: 'barcode',
      label: 'Barcode',
    },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => handleEditClick(row)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="default" onClick={() => handleSellClick(row)}>
            <ShoppingCart className="h-3 w-3" />
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
                variant="outline"
                onClick={() => setImportModalOpen(true)}
                className="shadow-sm hover:shadow-md transition-all"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
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
                        value="1"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Pain Relief
                      </TabsTrigger>
                      <TabsTrigger
                        value="2"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Antibiotics
                      </TabsTrigger>
                      <TabsTrigger
                        value="3"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Antihistamines
                      </TabsTrigger>
                      <TabsTrigger
                        value="4"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Vitamins
                      </TabsTrigger>
                      <TabsTrigger
                        value="5"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Supplements
                      </TabsTrigger>
                      <TabsTrigger
                        value="6"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Cardiovascular
                      </TabsTrigger>
                      <TabsTrigger
                        value="7"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Respiratory
                      </TabsTrigger>
                      <TabsTrigger
                        value="8"
                        className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900 data-[state=active]:shadow-md"
                      >
                        Gastrointestinal
                      </TabsTrigger>
                      <TabsTrigger
                        value="9"
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
                </CardContent>
              </Card>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</Label>
                  <Badge variant="outline" className="w-full justify-start">
                    {getCategoryName(selectedMedicine.category_id)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Manufacturer</Label>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{selectedMedicine.manufacturer || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</Label>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{selectedMedicine.type || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Barcode</Label>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{selectedMedicine.barcode || 'N/A'}</p>
                </div>
              </div>

              {/* Stock and Price */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Quantity in Stock</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{selectedMedicine.quantity_in_stock}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <CardContent className="pt-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Price</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">${Number(selectedMedicine.price).toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Expiry */}
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

                <div className="space-y-2">
                  <Label htmlFor="category_id" className="text-sm font-medium">
                    Category
                  </Label>
                  <Select
                    value={getCategoryName(formData.category_id)}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger id="category_id">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryMap).map(([id, name]) => (
                        <SelectItem key={id} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    Type
                  </Label>
                  <Input
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    placeholder="e.g., Tablet, Capsule, Syrup"
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
                  <Label htmlFor="quantity_in_stock" className="text-sm font-medium">
                    Quantity in Stock <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity_in_stock"
                    name="quantity_in_stock"
                    type="number"
                    min="0"
                    value={formData.quantity_in_stock}
                    onChange={handleInputChange}
                    placeholder="e.g., 100"
                    required
                    aria-required="true"
                    aria-invalid={!!formErrors.quantity_in_stock}
                    aria-describedby={formErrors.quantity_in_stock ? "quantity_in_stock-error" : undefined}
                    className={formErrors.quantity_in_stock ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {formErrors.quantity_in_stock && (
                    <p id="quantity_in_stock-error" className="text-sm text-red-500" role="alert">
                      {formErrors.quantity_in_stock}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">
                    Price ($) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g., 25.50"
                    required
                    aria-required="true"
                    aria-invalid={!!formErrors.price}
                    aria-describedby={formErrors.price ? "price-error" : undefined}
                    className={formErrors.price ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {formErrors.price && (
                    <p id="price-error" className="text-sm text-red-500" role="alert">
                      {formErrors.price}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode" className="text-sm font-medium">
                    Barcode
                  </Label>
                  <Input
                    id="barcode"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    placeholder="e.g., 1234567890123"
                    aria-invalid={!!formErrors.barcode}
                    aria-describedby={formErrors.barcode ? "barcode-error" : undefined}
                    className={formErrors.barcode ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {formErrors.barcode && (
                    <p id="barcode-error" className="text-sm text-red-500" role="alert">
                      {formErrors.barcode}
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
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_quantity_in_stock">Quantity in Stock *</Label>
              <Input
                id="edit_quantity_in_stock"
                name="quantity_in_stock"
                type="number"
                value={formData.quantity_in_stock}
                onChange={handleInputChange}
              />
              {formErrors.quantity_in_stock && <p className="text-sm text-red-500">{formErrors.quantity_in_stock}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_price">Price ($) *</Label>
              <Input
                id="edit_price"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
              />
              {formErrors.price && (
                <p className="text-sm text-red-500">{formErrors.price}</p>
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
              <Label htmlFor="edit_barcode">Barcode</Label>
              <Input
                id="edit_barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
              />
              {formErrors.barcode && (
                <p className="text-sm text-red-500">{formErrors.barcode}</p>
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

      {/* Import Medicines Modal */}
      <MedicineImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportSuccess={() => {
          fetchMedicines();
          toast.success('Medicines imported successfully');
        }}
      />
    </div>
  );
};

export default ManagerMedicines;
