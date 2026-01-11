import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * StatusBadge Component
 * Displays a colored badge based on status type
 *
 * @param {Object} props
 * @param {string} props.status - Status value
 * @param {string} props.type - Badge type (success, warning, error, info)
 * @param {string} props.className - Additional CSS classes
 */
export const StatusBadge = ({ status, type, className }) => {
  // Auto-detect type based on status if not provided
  const badgeType = type || detectTypeFromStatus(status);

  const variants = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <Badge
      variant='outline'
      className={cn(
        'px-2 py-1 text-xs font-medium rounded-full',
        variants[badgeType] || variants.default,
        className
      )}
    >
      {status}
    </Badge>
  );
};

/**
 * Detect badge type from status string
 * @param {string} status - Status string
 * @returns {string} Badge type
 */
function detectTypeFromStatus(status) {
  const statusLower = status?.toLowerCase() || '';

  // Success states
  if (['active', 'completed', 'normal', 'success', 'approved', 'fulfilled'].includes(statusLower)) {
    return 'success';
  }

  // Warning states
  if (
    ['pending', 'warning', 'low stock', 'expiring', 'low', 'pending verification'].includes(
      statusLower
    )
  ) {
    return 'warning';
  }

  // Error states
  if (
    ['inactive', 'error', 'expired', 'critical', 'cancelled', 'rejected', 'failed'].includes(
      statusLower
    )
  ) {
    return 'error';
  }

  // Info states
  if (['info', 'processing', 'in progress'].includes(statusLower)) {
    return 'info';
  }

  return 'default';
}

export default StatusBadge;
