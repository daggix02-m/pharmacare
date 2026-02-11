import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

/**
 * Reusable Confirmation Dialog Component
 * @param {boolean} open - Whether the dialog is open
 * @param {function} onOpenChange - Function to call when dialog open state changes
 * @param {function} onConfirm - Function to call when user confirms
 * @param {function} onCancel - Function to call when user cancels
 * @param {string} title - Dialog title
 * @param {string} description - Dialog description
 * @param {string} confirmText - Text for confirm button
 * @param {string} cancelText - Text for cancel button
 * @param {string} variant - Dialog variant (default, danger, warning, info, success)
 * @param {boolean} loading - Whether the confirm action is loading
 * @param {React.ReactNode} children - Additional content to display
 */
export const ConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  children,
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <XCircle className='h-6 w-6 text-red-600' />;
      case 'warning':
        return <AlertTriangle className='h-6 w-6 text-yellow-600' />;
      case 'success':
        return <CheckCircle className='h-6 w-6 text-green-600' />;
      case 'info':
        return <Info className='h-6 w-6 text-blue-600' />;
      default:
        return <Info className='h-6 w-6 text-gray-600' />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'destructive';
      case 'warning':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className='flex items-center gap-3'>
            {getIcon()}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children && <div className='py-4'>{children}</div>}

        <DialogFooter>
          <Button variant='outline' onClick={handleCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={getConfirmButtonVariant()} onClick={handleConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
