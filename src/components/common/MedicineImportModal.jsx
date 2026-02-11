import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Loader2,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  Info,
  Trash2,
  Check,
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { managerService } from '@/services';

const STEPS = {
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  IMPORTING: 'importing',
  RESULTS: 'results',
};

const MedicineImportModal = ({ open, onOpenChange, onImportSuccess }) => {
  const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);

  // Category mapping for validation
  const categoryMap = useMemo(() => ({
    'Pain Relief': 1,
    'Antibiotics': 2,
    'Antihistamines': 3,
    'Vitamins': 4,
    'Supplements': 5,
    'Cardiovascular': 6,
    'Respiratory': 7,
    'Gastrointestinal': 8,
    'Dermatological': 9,
  }), []);

  const categoryMapReverse = useMemo(() => Object.fromEntries(
    Object.entries(categoryMap).map(([name, id]) => [id, name])
  ), [categoryMap]);

  // Reset state when modal closes
  const handleClose = () => {
    if (isUploading) return; // Prevent closing while uploading
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setWarnings([]);
    setIsParsing(false);
    setIsUploading(false);
    setUploadProgress(0);
    setImportResult(null);
    setCurrentStep(STEPS.UPLOAD);
    onOpenChange(false);
  };

  const resetUpload = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setWarnings([]);
    setImportResult(null);
    setCurrentStep(STEPS.UPLOAD);
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv',
    ];

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    const validExtensions = ['xlsx', 'xls', 'csv'];

    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
      toast.error('Please select a valid Excel or CSV file');
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setErrors([]);
    setWarnings([]);
    setParsedData([]);
    setImportResult(null);

    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      if (fileExtension === 'csv') {
        // For CSV, we might need a different approach if xlsx.load doesn't handle it well
        // but ExcelJS usually handles CSV via csv.read
        await workbook.csv.read(new Response(arrayBuffer).body);
      } else {
        await workbook.xlsx.load(arrayBuffer);
      }

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('No worksheet found in the file');
      }

      const headers = [];
      const data = [];
      const newErrors = [];
      const newWarnings = [];

      // Get headers from first row
      worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
        let value = cell.value;
        if (typeof value === 'object' && value !== null) {
          value = value.richText ? value.richText.map(t => t.text).join('') : value.text || value.result || value.toString();
        }
        const header = value.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
        headers.push(header);
      });

      // Map common aliases
      const headerMap = {
        'name': 'name',
        'medicine_name': 'name',
        'price': 'price',
        'unit_price': 'price',
        'cost': 'price',
        'quantity_in_stock': 'quantity_in_stock',
        'quantity': 'quantity_in_stock',
        'stock': 'quantity_in_stock',
        'qty': 'quantity_in_stock',
        'in_stock': 'quantity_in_stock',
        'stock_level': 'quantity_in_stock',
        'category': 'category',
        'category_name': 'category',
        'expiry_date': 'expiry_date',
        'expiry': 'expiry_date',
        'expiration': 'expiry_date',
        'type': 'type',
        'medicine_type': 'type',
        'barcode': 'barcode',
        'manufacturer': 'manufacturer',
        'brand': 'manufacturer',
      };

      const mappedHeaders = headers.map(h => headerMap[h] || h);

      // Validate required columns
      const requiredColumns = ['name', 'price', 'quantity_in_stock'];
      const missingColumns = requiredColumns.filter(col => !mappedHeaders.includes(col));

      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ').replace(/_/g, ' ')}`);
      }

      // Parse data rows
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        const rowData = {};
        let rowErrors = [];
        let rowWarnings = [];

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const rawHeader = headers[colNumber - 1];
          const header = headerMap[rawHeader] || rawHeader;
          if (!header) return;

          let value = cell.value;

          // Convert cell value based on type
          if (typeof value === 'object' && value !== null) {
            if (value.formula) {
              value = value.result;
            } else if (value.text) {
              value = value.text;
            } else if (value instanceof Date) {
              // Handle dates correctly
              value = value.toISOString().split('T')[0];
            } else {
              value = value.result || '';
            }
          }

          if (value !== undefined && value !== null) {
            rowData[header] = value.toString().trim();
          }
        });

        // Validate required fields
        if (!rowData.name) {
          rowErrors.push('Name is required');
        }

        if (rowData.price === undefined || rowData.price === '') {
          rowErrors.push('Price is required');
        } else if (isNaN(parseFloat(rowData.price))) {
          rowErrors.push('Price must be a valid number');
        }

        if (rowData.quantity_in_stock === undefined || rowData.quantity_in_stock === '') {
          rowErrors.push('Quantity is required');
        } else if (isNaN(parseInt(rowData.quantity_in_stock))) {
          rowErrors.push('Quantity must be a valid number');
        }

        // Validate and map category
        if (rowData.category) {
          const categoryName = rowData.category.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          
          const categoryId = categoryMap[categoryName];
          if (categoryId) {
            rowData.category_id = categoryId;
          } else {
            rowWarnings.push(`Category "${rowData.category}" not recognized, using Pain Relief`);
            rowData.category_id = 1; 
          }
        } else {
          rowData.category_id = 1; 
          rowWarnings.push('No category specified, using Pain Relief');
        }

        // Validate expiry date
        if (rowData.expiry_date) {
          const parsedDate = new Date(rowData.expiry_date);
          if (isNaN(parsedDate.getTime())) {
            rowErrors.push('Invalid expiry date format');
          } else {
            rowData.expiry_date = parsedDate.toISOString().split('T')[0];
          }
        }

        rowData._rowNumber = rowNumber;

        if (rowErrors.length > 0) {
          newErrors.push({
            row: rowNumber,
            errors: rowErrors,
            data: rowData,
          });
        } else {
          data.push(rowData);
        }

        if (rowWarnings.length > 0) {
          newWarnings.push({
            row: rowNumber,
            warnings: rowWarnings,
            data: rowData,
          });
        }
      });

      setParsedData(data);
      setErrors(newErrors);
      setWarnings(newWarnings);
      setCurrentStep(STEPS.PREVIEW);

      if (newErrors.length > 0) {
        toast.error(`Found ${newErrors.length} error(s) in the file`);
      } else {
        toast.success(`Successfully parsed ${data.length} medicine(s)`);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(error.message || 'Failed to parse the file');
    } finally {
      setIsParsing(false);
    }
  }, [categoryMap]);

  // Handle file drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  // Handle drag over
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Handle file input change
  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileSelect(selectedFile);
  };

  // Handle import
  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error('No valid data to import');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentStep(STEPS.IMPORTING);

    try {
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < parsedData.length; i += batchSize) {
        batches.push(parsedData.slice(i, i + batchSize));
      }

      let totalImported = 0;
      let totalFailed = 0;
      const importErrors = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const progress = Math.round(((i + 1) / batches.length) * 100);
        setUploadProgress(progress);

        try {
          const response = await managerService.importMedicinesBatch(batch);

          if (response.success) {
            totalImported += response.data?.imported || batch.length;
            if (response.data?.failed) {
              totalFailed += response.data.failed;
            }
            if (response.data?.errors) {
              importErrors.push(...response.data.errors);
            }
          } else {
            throw new Error(response.message || 'Import failed');
          }
        } catch (error) {
          console.error('Batch import error:', error);
          totalFailed += batch.length;
          importErrors.push({
            batch: i + 1,
            error: error.message,
          });
        }
      }

      setImportResult({
        total: parsedData.length,
        imported: totalImported,
        failed: totalFailed,
        errors: importErrors,
      });

      setCurrentStep(STEPS.RESULTS);
      if (totalFailed === 0) {
        toast.success(`Successfully imported ${totalImported} medicine(s)`);
        if (onImportSuccess) onImportSuccess();
      } else {
        toast.warning(`Imported ${totalImported} medicine(s), ${totalFailed} failed`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import medicines');
      setCurrentStep(STEPS.PREVIEW); // Go back if error
    } finally {
      setIsUploading(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Medicines');

    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Quantity in Stock', key: 'quantity_in_stock', width: 20 },
      { header: 'Expiry Date', key: 'expiry_date', width: 15 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Barcode', key: 'barcode', width: 20 },
      { header: 'Manufacturer', key: 'manufacturer', width: 25 },
    ];

    const sampleData = [
      {
        name: 'Paracetamol 500mg',
        category: 'Pain Relief',
        price: '5.99',
        quantity_in_stock: '100',
        expiry_date: '2025-12-31',
        type: 'Tablet',
        barcode: '1234567890123',
        manufacturer: 'PharmaCorp',
      },
      {
        name: 'Amoxicillin 250mg',
        category: 'Antibiotics',
        price: '12.50',
        quantity_in_stock: '50',
        expiry_date: '2025-06-30',
        type: 'Capsule',
        barcode: '1234567890124',
        manufacturer: 'MediLife',
      }
    ];

    sampleData.forEach(item => worksheet.addRow(item));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'medicines_import_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    });
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="h-12 w-12 text-slate-400" />;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv') return <FileText className="h-12 w-12 text-blue-500" />;
    return <FileSpreadsheet className="h-12 w-12 text-emerald-500" />;
  };

  // UI Components for steps
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Object.values(STEPS).map((step, idx) => {
        const stepValues = Object.values(STEPS);
        const currentIndex = stepValues.indexOf(currentStep);
        const isActive = step === currentStep;
        const isCompleted = currentIndex > idx;
        
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isActive ? 'border-blue-600 bg-blue-50 text-blue-600' : 
                isCompleted ? 'border-green-600 bg-green-600 text-white' : 
                'border-slate-200 text-slate-400'
              }`}>
                {isCompleted ? <Check className="h-6 w-6" /> : <span>{idx + 1}</span>}
              </div>
              <span className={`text-[10px] mt-1 font-medium uppercase tracking-wider ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {step}
              </span>
            </div>
            {idx < stepValues.length - 1 && (
              <div className={`h-[2px] w-12 mb-5 transition-colors duration-300 ${
                currentIndex > idx ? 'bg-green-600' : 'bg-slate-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Upload className="h-6 w-6 text-blue-600" />
            Import Medicines
          </DialogTitle>
          <DialogDescription>
            Bulk import medicines into your inventory using Excel or CSV files
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <StepIndicator />

          <AnimatePresence mode="wait">
            {currentStep === STEPS.UPLOAD && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                    file
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className={`p-4 rounded-full ${file ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      {getFileIcon()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {file ? file.name : 'Choose a file or drag it here'}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {file
                          ? `Size: ${(file.size / 1024).toFixed(2)} KB`
                          : 'Supports .xlsx, .xls, and .csv files'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="file-upload"
                      disabled={isParsing}
                    />
                    <Button
                      variant={file ? 'outline' : 'default'}
                      disabled={isParsing}
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('file-upload').click();
                      }}
                    >
                      {isParsing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing File...
                        </>
                      ) : file ? (
                        'Change File'
                      ) : (
                        'Select File'
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <Card className="shadow-none border-blue-100 bg-blue-50/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-800">
                        <Download className="h-4 w-4" />
                        Download Template
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-blue-700/80 mb-4">
                        Use our standardized template to ensure your data is formatted correctly for a smooth import.
                      </p>
                      <Button onClick={downloadTemplate} size="sm" variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-100">
                        Get Excel Template
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="shadow-none border-slate-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Info className="h-4 w-4 text-slate-500" />
                        Quick Instructions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2 text-slate-600">
                      <div className="flex gap-2">
                        <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">1</div>
                        <p>Required columns: <span className="font-semibold">Name, Price, Quantity in Stock</span></p>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">2</div>
                        <p>Dates should be in <span className="font-semibold">YYYY-MM-DD</span> format.</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">3</div>
                        <p>Maximum batch size is 500 rows per file for optimal performance.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {currentStep === STEPS.PREVIEW && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Data Validation Summary</h3>
                      <p className="text-sm text-slate-500">
                        We found {parsedData.length} valid items and {errors.length} items with errors.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetUpload} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Discard & Retry
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Valid Rows</p>
                    <p className="text-2xl font-bold text-green-900">{parsedData.length}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Warnings</p>
                    <p className="text-2xl font-bold text-amber-900">{warnings.length}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <p className="text-xs font-medium text-red-700 uppercase tracking-wider">Errors</p>
                    <p className="text-2xl font-bold text-red-900">{errors.length}</p>
                  </div>
                </div>

                {errors.length > 0 && (
                  <Card className="border-red-100 shadow-none overflow-hidden">
                    <CardHeader className="bg-red-50/50 py-3">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-800">
                        <AlertCircle className="h-4 w-4" />
                        Parsing Errors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-40 overflow-y-auto divide-y divide-red-100">
                        {errors.map((error, idx) => (
                          <div key={idx} className="p-3 text-xs flex gap-3">
                            <span className="font-bold text-red-700 flex-shrink-0 w-12">Row {error.row}:</span>
                            <span className="text-red-600">{error.errors.join(', ')}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3 border-b flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Valid Data Preview</h4>
                    <Badge variant="outline" className="bg-white">{parsedData.length} records</Badge>
                  </div>
                  <div className="max-h-60 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-slate-600">Name</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-600">Category</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-600 text-right">Price</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-600 text-right">Quantity</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-600">Expiry</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedData.slice(0, 50).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2 font-medium">{row.name}</td>
                            <td className="px-4 py-2">
                              <Badge variant="secondary" className="font-normal text-[10px]">
                                {categoryMapReverse[row.category_id] || 'Pain Relief'}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-right font-mono">${parseFloat(row.price).toFixed(2)}</td>
                            <td className="px-4 py-2 text-right">{row.quantity_in_stock}</td>
                            <td className="px-4 py-2 text-slate-500">{row.expiry_date || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.length > 50 && (
                      <div className="p-3 text-center text-[10px] text-slate-400 border-t bg-slate-50/30 font-medium">
                        + {parsedData.length - 50} more items...
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === STEPS.IMPORTING && (
              <motion.div
                key="importing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 space-y-8"
              >
                <div className="relative">
                  <div className="h-32 w-32 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-2xl font-bold text-blue-600">{uploadProgress}%</span>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">Importing Data...</h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    We are processing your medicines in batches. Please keep this window open until the process is complete.
                  </p>
                </div>
                <div className="w-full max-w-md space-y-2">
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Uploading items...</span>
                    <span>{Math.round((uploadProgress / 100) * parsedData.length)} / {parsedData.length}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === STEPS.RESULTS && importResult && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="flex flex-col items-center text-center py-6">
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-4 ${
                    importResult.failed === 0 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {importResult.failed === 0 ? <CheckCircle2 className="h-10 w-10" /> : <AlertTriangle className="h-10 w-10" />}
                  </div>
                  <h3 className="text-2xl font-bold">Import Complete!</h3>
                  <p className="text-slate-500 mt-1">
                    Your data has been processed successfully.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <Card className="shadow-sm border-slate-100 overflow-hidden">
                    <div className="p-6 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                        <Check className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Successfully Imported</p>
                        <p className="text-3xl font-bold text-green-600">{importResult.imported}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="shadow-sm border-slate-100 overflow-hidden">
                    <div className="p-6 flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                        importResult.failed > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-300'
                      }`}>
                        <X className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Failed Records</p>
                        <p className={`text-3xl font-bold ${importResult.failed > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                          {importResult.failed}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {importResult.errors.length > 0 && (
                  <Card className="border-amber-100 shadow-none">
                    <CardHeader className="py-3 border-b bg-amber-50/50">
                      <CardTitle className="text-sm font-bold text-amber-800">Import Error Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-40 overflow-y-auto divide-y divide-amber-100">
                        {importResult.errors.map((err, idx) => (
                          <div key={idx} className="p-3 text-xs flex gap-3">
                            <span className="font-bold text-amber-700 flex-shrink-0">Error:</span>
                            <span className="text-amber-600">{err.error || 'Unknown error'}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="p-6 border-t bg-slate-50/50">
          <div className="flex w-full items-center justify-between">
            <div>
              {currentStep === STEPS.PREVIEW && (
                <p className="text-xs text-slate-500 italic">
                  * Only valid items will be imported. Errors must be fixed and re-uploaded.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleClose} disabled={isUploading}>
                {currentStep === STEPS.RESULTS ? 'Done' : 'Cancel'}
              </Button>
              
              {currentStep === STEPS.PREVIEW && (
                <Button 
                  onClick={handleImport} 
                  disabled={parsedData.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                >
                  Start Import
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStep === STEPS.RESULTS && (
                <Button onClick={handleClose} className="bg-slate-900 hover:bg-slate-800 text-white">
                  Close Window
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MedicineImportModal;
