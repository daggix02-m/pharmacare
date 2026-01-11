import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { pharmacistService } from '@/services';
import {
  validateMedicineName,
  validateQuantity,
  validatePrice,
  validateExpiryDate,
  validateBatchNumber,
  validateNotes,
  validateRequired,
} from '@/utils/validation';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
  RefreshCw,
  Info,
  Filter,
} from 'lucide-react';

const PharmacistMedicines = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
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
  }, [currentPage, searchQuery, categoryFilter, stockFilter]);

  const fetchMedicines = async () => {
    try {
      setRefreshing(true);
      const response = await pharmacistService.getMedicines({
        page: currentPage,
        limit: 20,
        search: searchQuery,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        stock_status: stockFilter !== 'all' ? stockFilter : undefined,
      });

      if (response.success) {
        setMedicines(response.data?.medicines || response.medicines || []);
        setTotalPages(response.data?.totalPages || 1);
      } else {
        toast.error(response.message || 'Failed to load medicines');
      }
    } catch (error) {
      toast.error('An error occurred while loading medicines');
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const validateForm = () => {
    const errors = {};

    const nameValidation = validateMedicineName(formData.name);
    if (!nameValidation.valid) errors.name = nameValidation.error;

    const quantityValidation = validateQuantity(formData.quantity);
    if (!quantityValidation.valid) errors.quantity = quantityValidation.error;

    const priceValidation = validatePrice(formData.unit_price);
    if (!priceValidation.valid) errors.unit_price = priceValidation.error;

    const expiryValidation = validateExpiryDate(formData.expiry_date);
    if (!expiryValidation.valid) errors.expiry_date = expiryValidation.error;

    if (formData.batch_number) {
      const batchValidation = validateBatchNumber(formData.batch_number);
      if (!batchValidation.valid) errors.batch_number = batchValidation.error;
    }

    if (formData.description) {
      const notesValidation = validateNotes(formData.description, 500);
      if (!notesValidation.valid) errors.description = notesValidation.error;
    }

    if (formData.min_stock_level) {
      const minStockValidation = validateQuantity(formData.min_stock_level, 'Minimum stock level');
      if (!minStockValidation.valid) errors.min_stock_level = minStockValidation.error;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
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
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    try {
      setProcessing(true);
      const response = await pharmacistService.addMedicine(formData);

      if (response.success) {
        toast.success('Medicine added successfully');
        setAddModalOpen(false);
        resetForm();
        fetchMedicines();
      } else {
        toast.error(response.message || 'Failed to add medicine');
      }
    } catch (error) {
      toast.error('An error occurred while adding medicine');
      console.error('Error adding medicine:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditClick = (medicine) => {
    setSelectedMedicine(medicine);
    setFormData({
      name: medicine.name || '',
      generic_name: medicine.generic_name || '',
      category: medicine.category || '',
      manufacturer: medicine.manufacturer || '',
      dosage_form: medicine.dosage_form || '',
      strength: medicine.strength || '',
      quantity: medicine.quantity || '',
      unit_price: medicine.unit_price || '',
      expiry_date: medicine.expiry_date ? medicine.expiry_date.split('T')[0] : '',
      batch_number: medicine.batch_number || '',
      description: medicine.description || '',
      min_stock_level: medicine.min_stock_level || '',
    });
    setEditModalOpen(true);
  };

  const handleUpdateMedicine = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    try {
      setProcessing(true);
      const response = await pharmacistService.updateMedicineStock(selectedMedicine.medicine_id, {
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        expiry_date: formData.expiry_date,
        batch_number: formData.batch_number,
      });

      if (response.success) {
        toast.success('Medicine updated successfully');
        setEditModalOpen(false);
        resetForm();
        fetchMedicines();
      } else {
        toast.error(response.message || 'Failed to update medicine');
      }
    } catch (error) {
      toast.error('An error occurred while updating medicine');
      console.error('Error updating medicine:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteClick = (medicine) => {
    setSelectedMedicine(medicine);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMedicine) return;

    try {
      setProcessing(true);
      const response = await pharmacistService.deleteMedicine(selectedMedicine.medicine_id);

      if (response.success) {
        toast.success('Medicine deleted successfully');
        setDeleteModalOpen(false);
        setSelectedMedicine(null);
        fetchMedicines();
      } else {
        toast.error(response.message || 'Failed to delete medicine');
      }
    } catch (error) {
      toast.error('An error occurred while deleting medicine');
      console.error('Error deleting medicine:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRowClick = (medicine) => {
    setSelectedMedicine(medicine);
    setDetailsModalOpen(true);
  };

  const getStockStatus = (medicine) => {
    if (medicine.quantity === 0) return { text: 'Out of Stock', variant: 'destructive' };
    if (medicine.quantity <= (medicine.min_stock_level || 10)) {
      return { text: 'Low Stock', variant: 'destructive' };
    }
    return { text: 'In Stock', variant: 'default' };
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

  const columns = [
    {
      key: 'name',
      label: 'Medicine Name',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'generic_name',
      label: 'Generic Name',
    },
    {
      key: 'category',
      label: 'Category',
    },
    {
      key: 'quantity',
      label: 'Stock',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          {value <= (row.min_stock_level || 10) && (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          )}
        </div>
      ),
    },
    {
      key: 'unit_price',
      label: 'Price',
      render: (value) => `$${Number(value).toFixed(2)}`,
    },
    {
      key: 'expiry_date',
      label: 'Expiry Date',
      render: (value) => {
        if (!value) return 'N/A';
        const formatted = new Date(value).toLocaleDateString();
        if (isExpired(value)) {
          return <span className="text-red-600 font-medium">Expired - {formatted}</span>;
        }
        if (isExpiringSoon(value)) {
          return <span className="text-orange-600 font-medium">{formatted}</span>;
        }
        return formatted;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => {
        const status = getStockStatus(row);
        return <Badge variant={status.variant}>{status.text}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(row);
            }}
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2 text-slate-600 dark:text-slate-400" />
                    Medicine Inventory
                  </CardTitle>
                  <CardAction>
                    <div className="flex gap-2">
                      <Button onClick={fetchMedicines} disabled={refreshing} variant="outline">
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200"
                        onClick={() => {
                          resetForm();
                          setAddModalOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Medicine
                      </Button>
                    </div>
                  </CardAction>
                </CardHeader>
                <CardDescription className="px-0">Manage your medicine stock and inventory</CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <TabsList>
                  <TabsTrigger value="all" className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900">All</TabsTrigger>
                  <TabsTrigger value="pain-relief" className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900">Pain Relief</TabsTrigger>
                  <TabsTrigger value="antibiotic" className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900">Antibiotics</TabsTrigger>
                  <TabsTrigger value="antihistamine" className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900">Antihistamines</TabsTrigger>
                  <TabsTrigger value="vitamin" className="data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-100 data-[state=active]:text-white dark:data-[state=active]:text-slate-900">Vitamins</TabsTrigger>
                </TabsList>

                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <CardContent className="px-0">
              <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search medicines..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <DataTable
                columns={columns}
                data={medicines}
                searchable={false}
                pagination={true}
                itemsPerPage={20}
                onRowClick={handleRowClick}
              />
            </CardContent>
          </Tabs>
        </div>
      </main>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Medicine Details</DialogTitle>
          </DialogHeader>
          {selectedMedicine && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Medicine Name</Label>
                <p className="mt-1 text-sm text-foreground font-medium">{selectedMedicine.name}</p>
              </div>
              <div>
                <Label>Generic Name</Label>
                <p className="mt-1 text-sm text-foreground">
                  {selectedMedicine.generic_name || 'N/A'}
                </p>
              </div>
              <div>
                <Label>Category</Label>
                <p className="mt-1 text-sm text-foreground">{selectedMedicine.category || 'N/A'}</p>
              </div>
              <div>
                <Label>Manufacturer</Label>
                <p className="mt-1 text-sm text-foreground">
                  {selectedMedicine.manufacturer || 'N/A'}
                </p>
              </div>
              <div>
                <Label>Dosage Form</Label>
                <p className="mt-1 text-sm text-foreground">
                  {selectedMedicine.dosage_form || 'N/A'}
                </p>
              </div>
              <div>
                <Label>Strength</Label>
                <p className="mt-1 text-sm text-foreground">{selectedMedicine.strength || 'N/A'}</p>
              </div>
              <div>
                <Label>Current Stock</Label>
                <p className="mt-1 text-sm text-foreground font-semibold">
                  {selectedMedicine.quantity}
                </p>
              </div>
              <div>
                <Label>Unit Price</Label>
                <p className="mt-1 text-sm text-foreground font-semibold">
                  ${Number(selectedMedicine.unit_price).toFixed(2)}
                </p>
              </div>
              <div>
                <Label>Expiry Date</Label>
                <p className="mt-1 text-sm text-foreground">
                  {selectedMedicine.expiry_date
                    ? new Date(selectedMedicine.expiry_date).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <Label>Batch Number</Label>
                <p className="mt-1 text-sm text-foreground">
                  {selectedMedicine.batch_number || 'N/A'}
                </p>
              </div>
              {selectedMedicine.description && (
                <div className="col-span-2">
                  <Label>Description</Label>
                  <p className="mt-1 text-sm text-foreground">{selectedMedicine.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Medicine Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Medicine</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMedicine} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Medicine Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Paracetamol"
                />
                {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="generic_name">Generic Name</Label>
                <Input
                  id="generic_name"
                  name="generic_name"
                  value={formData.generic_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Acetaminophen"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pain-relief">Pain Relief</SelectItem>
                    <SelectItem value="antibiotic">Antibiotic</SelectItem>
                    <SelectItem value="antihistamine">Antihistamine</SelectItem>
                    <SelectItem value="vitamin">Vitamin</SelectItem>
                    <SelectItem value="supplement">Supplement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC Pharma"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage_form">Dosage Form</Label>
                <Input
                  id="dosage_form"
                  name="dosage_form"
                  value={formData.dosage_form}
                  onChange={handleInputChange}
                  placeholder="e.g., Tablet, Capsule"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="strength">Strength</Label>
                <Input
                  id="strength"
                  name="strength"
                  value={formData.strength}
                  onChange={handleInputChange}
                  placeholder="e.g., 500mg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="e.g., 100"
                />
                {formErrors.quantity && <p className="text-sm text-red-500">{formErrors.quantity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price">Unit Price ($) *</Label>
                <Input
                  id="unit_price"
                  name="unit_price"
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={handleInputChange}
                  placeholder="e.g., 2.50"
                />
                {formErrors.unit_price && (
                  <p className="text-sm text-red-500">{formErrors.unit_price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date *</Label>
                <Input
                  id="expiry_date"
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
                <Label htmlFor="batch_number">Batch Number</Label>
                <Input
                  id="batch_number"
                  name="batch_number"
                  value={formData.batch_number}
                  onChange={handleInputChange}
                  placeholder="e.g., BATCH-2024-001"
                />
                {formErrors.batch_number && (
                  <p className="text-sm text-red-500">{formErrors.batch_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                <Input
                  id="min_stock_level"
                  name="min_stock_level"
                  type="number"
                  value={formData.min_stock_level}
                  onChange={handleInputChange}
                  placeholder="e.g., 10"
                />
                {formErrors.min_stock_level && (
                  <p className="text-sm text-red-500">{formErrors.min_stock_level}</p>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Additional information about medicine"
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {formErrors.description && (
                  <p className="text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddModalOpen(false);
                  resetForm();
                }}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={processing} className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200">
                {processing ? 'Adding...' : 'Add Medicine'}
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
              <Button type="submit" disabled={processing} className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200">
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
        description="Are you sure you want to delete this medicine? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={processing}
      >
        {selectedMedicine && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm font-medium text-red-900 dark:text-red-200">Medicine: {selectedMedicine.name}</p>
            <p className="text-sm text-red-800 dark:text-red-300">Stock: {selectedMedicine.quantity} units</p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
};

export default PharmacistMedicines;
