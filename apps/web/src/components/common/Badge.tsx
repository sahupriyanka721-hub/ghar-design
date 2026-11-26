import React from 'react';

export interface BadgeProps {
  status?: string;
  variant?:
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'default'
    | 'neutral'
    | 'primary'
    | 'emerald'
    | 'amber'
    | 'rose'
    | 'blue'
    | 'purple';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  size = 'md',
  className = '',
  children,
}) => {
  // Extract text representation safely without throwing on null / undefined
  const rawText =
    status !== undefined && status !== null
      ? String(status)
      : typeof children === 'string' || typeof children === 'number'
      ? String(children)
      : '';

  const getBadgeStyle = () => {
    if (variant) {
      switch (variant) {
        case 'success':
        case 'emerald':
          return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'warning':
        case 'amber':
          return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'danger':
        case 'rose':
          return 'bg-rose-50 text-rose-700 border-rose-200';
        case 'info':
        case 'blue':
        case 'primary':
          return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'purple':
          return 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
        case 'default':
        case 'neutral':
        default:
          return 'bg-slate-100 text-slate-700 border-slate-200';
      }
    }

    const s = rawText.toUpperCase().trim();
    switch (s) {
      case 'QUOTATIONS_AVAILABLE':
      case 'PUBLISHED':
      case 'BOOKING_CONFIRMED':
      case 'PAYMENT_SUCCESSFUL':
      case 'CONFIRMED':
      case 'APPROVED':
      case 'ACCEPTED':
      case 'VERIFIED':
      case 'ACTIVE':
      case 'COMPLETED':
      case 'RESOLVED':
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'UNDER_ADMIN_REVIEW':
      case 'UNDER_QUOTATION_REVIEW':
      case 'AWAITING_ASSIGNMENT':
      case 'ASSIGNED':
      case 'QUOTATIONS_IN_PROGRESS':
      case 'IN_PROGRESS':
      case 'SENT':
      case 'OPEN':
        return 'bg-blue-50 text-blue-700 border-blue-200';

      case 'AWAITING_PAYMENT':
      case 'PAYMENT_PENDING':
      case 'PENDING':
      case 'CHANGES_REQUESTED':
      case 'REVISION_REQUESTED':
      case 'SCHEDULED':
      case 'UPCOMING':
      case 'DRAFT':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'SELECTED':
      case 'ARCHITECT_ACCEPTED':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';

      case 'CANCELLED':
      case 'REJECTED':
      case 'PAYMENT_FAILED':
      case 'DECLINED':
      case 'EXPIRED':
      case 'OVERDUE':
      case 'FAILED':
      case 'CLOSED':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'xs':
        return 'px-2 py-0.5 text-[10px]';
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3.5 py-1 text-sm';
      case 'md':
      default:
        return 'px-2.5 py-0.5 text-xs';
    }
  };

  const formattedText = rawText ? rawText.replace(/_/g, ' ') : '';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${getSizeStyle()} ${getBadgeStyle()} ${className}`}
    >
      {children !== undefined && children !== null && typeof children !== 'string' && typeof children !== 'number'
        ? children
        : formattedText || children || ''}
    </span>
  );
};
