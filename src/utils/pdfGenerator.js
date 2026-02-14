import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Generate PDF Receipt
 * @param {Object} receiptData - The receipt data
 */
export const generateReceiptPDF = (receiptData) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200], // Standard receipt width
  });

  // Header
  doc.setFontSize(16);
  doc.text('PHARMACARE', 40, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Quality Healthcare Solutions', 40, 22, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(5, 25, 75, 25);

  // Info - Sanitize user-controlled data
  doc.setFontSize(8);
  doc.text(`Receipt #: ${sanitizeInput(receiptData.sale_id)}`, 5, 32);
  doc.text(`Date: ${new Date(receiptData.created_at).toLocaleString()}`, 5, 37);
  doc.text(`Customer: ${sanitizeInput(receiptData.customer_name) || 'Walk-in'}`, 5, 42);

  // Items Table - Sanitize medicine_name
  const tableData = receiptData.items.map((item) => [
    sanitizeInput(item.medicine_name),
    item.quantity,
    `$${Number(item.unit_price).toFixed(2)}`,
    `$${(item.quantity * item.unit_price).toFixed(2)}`,
  ]);

  doc.autoTable({
    startY: 47,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'plain',
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fontStyle: 'bold', borderBottomWidth: 0.1 },
    margin: { left: 5, right: 5 },
  });

  const finalY = doc.lastAutoTable.finalY + 5;

  // Totals
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: $${Number(receiptData.total_amount).toFixed(2)}`, 75, finalY, {
    align: 'right',
  });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment: ${receiptData.payment_method ? receiptData.payment_method.toUpperCase() : 'N/A'}`, 5, finalY + 5);

  if (receiptData.amount_paid) {
    doc.text(`Paid: $${Number(receiptData.amount_paid).toFixed(2)}`, 5, finalY + 10);
    doc.text(
      `Change: $${(Number(receiptData.amount_paid) - Number(receiptData.total_amount)).toFixed(2)}`,
      5,
      finalY + 15
    );
  }

  // Footer
  doc.setFontSize(7);
  doc.text('Thank you for choosing PharmaCare!', 40, finalY + 25, { align: 'center' });
  doc.text('Please keep this receipt for your records.', 40, finalY + 29, { align: 'center' });

  doc.save(`receipt_${receiptData.sale_id}.pdf`);
};

export default {
  generateReceiptPDF,
};
