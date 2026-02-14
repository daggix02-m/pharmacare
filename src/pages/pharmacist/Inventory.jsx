import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import DataTable from '@/components/common/DataTable';
import { TableSkeleton } from '@/components/common/LoadingStates';
import {
  Dialog,
  DialogContent,
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
import ConfirmDialog from '@/components/common/ConfirmDialog';
import StatusBadge from '@/components/common/StatusBadge';
import { pharmacistService } from '@/services';
import {
  validateMedicineName,
  validateQuantity,
  validatePrice,
  validateExpiryDate,
  validateBatchNumber,
} from '@/utils/validation';
import {
  getCategoryName,
  getCategoryIdFromName,
  getCategoriesList,
} from '@/utils/categoryUtils';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  Filter,
  Warehouse,
  ClipboardList,
} from 'lucide-react';

const PharmacistInventory = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  // eslint-disable-next-line no-unused-vars
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // Form states
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
  const [restockForm, setRestockForm] = useState({
    quantity: '',
    priority: 'medium',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, categoryFilter, stockFilter]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [medicinesRes, requestsRes] = await Promise.all([
        pharmacistService.getMedicines({
          page: currentPage,
          limit: 20,
          search: searchQuery,
          category_id: categoryFilter !== 'all' ? parseInt(categoryFilter) : undefined,
          stock_status: stockFilter !== 'all' ? stockFilter : undefined,
        }),
        pharmacistService.getRestockRequests(),
      ]);

      if (medicinesRes.success) {
        setMedicines(medicinesRes.data?.medicines || medicinesRes.medicines || []);
        setTotalPages(medicinesRes.data?.totalPages || 1);
      }

      if (requestsRes.success) {
        setRestockRequests(requestsRes.data || []);
      }
    } catch (error) {
      toast.error('An error occurred while loading data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  const validateForm = () => {
    const errors = {};

    const nameValidation = validateMedicineName(formData.name);
    if (!nameValidation.valid) errors.name = nameValidation.error;

    const quantityValidation = validateQuantity(formData.quantity_in_stock);
    if (!quantityValidation.valid) errors.quantity_in_stock = quantityValidation.error;

    const priceValidation = validatePrice(formData.price);
    if (!priceValidation.valid) errors.price = priceValidation.error;

    const expiryValidation = validateExpiryDate(formData.expiry_date);
    if (!expiryValidation.valid) errors.expiry_date = expiryValidation.error;

    if (formData.barcode) {
      const batchValidation = validateBatchNumber(formData.barcode);
      if (!batchValidation.valid) errors.barcode = batchValidation.error;
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

  const handleCategoryChange = (categoryName) => {
    const categoryId = getCategoryIdFromName(categoryName);
    setFormData((prev) => ({ ...prev, category_id: categoryId }));
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
        fetchData();
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
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    try {
      setProcessing(true);
      const response = await pharmacistService.updateMedicineStock(selectedMedicine.medicine_id, {
        quantity_in_stock: formData.quantity_in_stock,
        price: formData.price,
        expiry_date: formData.expiry_date,
        barcode: formData.barcode,
      });

      if (response.success) {
        toast.success('Medicine updated successfully');
        setEditModalOpen(false);
        resetForm();
        fetchData();
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
        fetchData();
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

  const handleRestockClick = (medicine) => {
    setSelectedMedicine(medicine);
    setRestockForm({
      quantity: '',
      priority: 'medium',
      notes: '',
    });
    setFormErrors({});
    setRestockModalOpen(true);
  };

  const validateRestockForm = () => {
    const errors = {};
    const quantityValidation = validateQuantity(restockForm.quantity);
    if (!quantityValidation.valid) errors.quantity = quantityValidation.error;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitRestock = async () => {
    if (!validateRestockForm()) return;

    try {
      setProcessing(true);
      const response = await pharmacistService.requestRestock({
        medicine_id: selectedMedicine.medicine_id,
        requested_quantity: parseInt(restockForm.quantity),
        priority: restockForm.priority,
        notes: restockForm.notes,
      });

      if (response.success) {
        toast.success('Restock request submitted successfully');
        setRestockModalOpen(false);
        fetchData();
      } else {
        toast.error(response.message || 'Failed to submit request');
      }
    } catch (error) {
      toast.error('An error occurred while submitting request');
      console.error('Error submitting restock request:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRowClick = (medicine) => {
    setSelectedMedicine(medicine);
    setDetailsModalOpen(true);
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

  const getStockStatus = (medicine) => {
    const qty = medicine.quantity_in_stock ?? medicine.quantity;
    if (qty === 0) return { text: 'Out of Stock', variant: 'destructive', type: 'error' };
    if (qty <= (medicine.min_stock_level || 10)) {
      return { text: 'Low Stock', variant: 'destructive', type: 'warning' };
    }
    return { text: 'In Stock', variant: 'default', type: 'success' };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Medicine Name',
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{value}</span>
          {row.added_by_role === 'manager' && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded w-fit mt-1">
              Manager Added
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category_id',
      label: 'Category',
      render: (value) => <span>{getCategoryName(value)}</span>,
    },
    {
      key: 'quantity_in_stock',
      label: 'Stock',
      render: (value, row) => {
        const qty = row.quantity_in_stock ?? row.quantity ?? 0;
        const status = getStockStatus(row);
        return (
          <div className="flex flex-col gap-1">
            <span>{qty}</span>
            <StatusBadge status={status.text} type={status.type} />
          </div>
        );
      },
    },
    {
      key: 'price',
      label: 'Price',
      render: (value, row) => {
        const price = row.price || row.unit_price || 0;
        return `$${Number(price).toFixed(2)}`;
      },
    },
    {
      key: 'expiry_date',
      label: 'Expiry Date',
      render: (value) => {
        if (!value) return 'N/A';
        const formatted = new Date(value).toLocaleDateString();
        if (isExpired(value)) return <span className="text-red-600 font-medium">Expired - {formatted}</span>;
        if (isExpiringSoon(value)) return <span className="text-orange-600 font-medium">{formatted}</span>;
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
            variant="outline"
            className="text-blue-600 hover:text-blue-700"
            onClick={(e) => {
              e.stopPropagation();
              handleRestockClick(row);
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Restock
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

  if (loading && !refreshing) {
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
          <Tabs defaultValue="inventory" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="inventory" className="flex items-center">
                  <Warehouse className="h-4 w-4 mr-2" />
                  Inventory Management
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Restock Requests
                </TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <Button onClick={fetchData} disabled={refreshing} variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
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

            <TabsContent value="inventory" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Medicine Inventory</CardTitle>
                  <CardDescription>View, add, and manage your medicine stock</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
                    <div className="flex gap-2">
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {Object.entries(categoryMap).map(([id, name]) => (
                            <SelectItem key={id} value={id}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

                  {loading ? (
                    <TableSkeleton />
                  ) : (
                    <DataTable
                      columns={columns}
                      data={medicines}
                      searchable={false}
                      pagination={true}
                      itemsPerPage={20}
                      onRowClick={handleRowClick}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>Restock Requests History</CardTitle>
                  <CardDescription>Track the status of your restock requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Requested Qty</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Date Requested</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {restockRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                              No restock requests found
                            </TableCell>
                          </TableRow>
                        ) : (
                          restockRequests.map((request) => (
                            <TableRow key={request.request_id || request.id}>
                              <TableCell className="font-medium">
                                {request.medicine_name || 'Unknown Medicine'}
                              </TableCell>
                              <TableCell>{request.requested_quantity}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                                  {request.priority?.toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell>
                                {new Date(request.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={request.status} />
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {request.notes || '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
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
                <Label>Category</Label>
                <p className="mt-1 text-sm text-foreground">{getCategoryName(selectedMedicine.category_id)}</p>
              </div>
              <div>
                <Label>Manufacturer</Label>
                <p className="mt-1 text-sm text-foreground">{selectedMedicine.manufacturer || 'N/A'}</p>
              </div>
              <div>
                <Label>Type</Label>
                <p className="mt-1 text-sm text-foreground">{selectedMedicine.type || 'N/A'}</p>
              </div>
              <div>
                <Label>Barcode</Label>
                <p className="mt-1 text-sm text-foreground">{selectedMedicine.barcode || 'N/A'}</p>
              </div>
              <div>
                <Label>Quantity in Stock</Label>
                <p className="mt-1 text-sm text-foreground font-semibold">
                  {selectedMedicine.quantity_in_stock ?? selectedMedicine.quantity ?? 0}
                </p>
              </div>
              <div>
                <Label>Price</Label>
                <p className="mt-1 text-sm text-foreground font-semibold">
                  ${Number(selectedMedicine.price || selectedMedicine.unit_price || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <Label>Expiry Date</Label>
                <p className="mt-1 text-sm text-foreground">
                  {selectedMedicine.expiry_date ? new Date(selectedMedicine.expiry_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
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
                <Label htmlFor="category_id">Category</Label>
                <Select
                  value={getCategoryName(formData.category_id)}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger id="category_id">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryMap).map(([id, name]) => (
                      <SelectItem key={id} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  placeholder="e.g., Tablet, Capsule"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity_in_stock">Quantity in Stock *</Label>
                <Input
                  id="quantity_in_stock"
                  name="quantity_in_stock"
                  type="number"
                  value={formData.quantity_in_stock}
                  onChange={handleInputChange}
                  placeholder="e.g., 100"
                />
                {formErrors.quantity_in_stock && <p className="text-sm text-red-500">{formErrors.quantity_in_stock}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g., 25.50"
                />
                {formErrors.price && <p className="text-sm text-red-500">{formErrors.price}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  placeholder="e.g., 1234567890123"
                />
                {formErrors.barcode && <p className="text-sm text-red-500">{formErrors.barcode}</p>}
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
                {formErrors.expiry_date && <p className="text-sm text-red-500">{formErrors.expiry_date}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={processing} className="bg-slate-900 text-white hover:bg-slate-800">
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
              <div className="bg-muted p-3 rounded-md">
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
              {formErrors.price && <p className="text-sm text-red-500">{formErrors.price}</p>}
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
              {formErrors.expiry_date && <p className="text-sm text-red-500">{formErrors.expiry_date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_barcode">Barcode</Label>
              <Input
                id="edit_barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
              />
              {formErrors.barcode && <p className="text-sm text-red-500">{formErrors.barcode}</p>}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={processing} className="bg-slate-900 text-white hover:bg-slate-800">
                {processing ? 'Updating...' : 'Update Stock'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Restock Request Modal */}
      <Dialog open={restockModalOpen} onOpenChange={setRestockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Restock</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border">
              <p className="text-sm font-medium">Medicine: {selectedMedicine?.name}</p>
              <p className="text-sm text-slate-500">Current Stock: {selectedMedicine?.quantity_in_stock || selectedMedicine?.quantity} units</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restock_quantity">Requested Quantity *</Label>
              <Input
                id="restock_quantity"
                type="number"
                value={restockForm.quantity}
                onChange={(e) => setRestockForm({ ...restockForm, quantity: e.target.value })}
                placeholder="e.g., 50"
              />
              {formErrors.quantity && <p className="text-sm text-red-500">{formErrors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={restockForm.priority}
                onValueChange={(value) => setRestockForm({ ...restockForm, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={restockForm.notes}
                onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockModalOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRestock} disabled={processing} className="bg-slate-900 text-white hover:bg-slate-800">
              {processing ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
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
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
            <p className="text-sm font-medium text-red-900">Medicine: {selectedMedicine.name}</p>
            <p className="text-sm text-red-800">
              Stock: {selectedMedicine.quantity_in_stock ?? selectedMedicine.quantity ?? 0} units
            </p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
};

export default PharmacistInventory;
