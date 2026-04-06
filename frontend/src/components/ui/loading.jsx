import React from 'react';
import { cn } from "../../lib/utils";

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
        sizeClasses[size]
      )} />
    </div>
  );
};

// Full Page Loading State
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <LoadingSpinner size="lg" />
    <p className="text-gray-500 text-sm">{message}</p>
  </div>
);

// Table Loading Skeleton
export const TableSkeleton = ({ rows = 5, columns = 6 }) => (
  <div className="w-full">
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex gap-4 p-4 bg-gray-50 border-b">
        {Array(columns).fill(0).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array(rows).fill(0).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 p-4 border-b">
          {Array(columns).fill(0).map((_, colIdx) => (
            <div key={colIdx} className="h-4 bg-gray-100 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Card Loading Skeleton
export const CardSkeleton = () => (
  <div className="bg-white rounded-lg border p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
    <div className="space-y-3">
      <div className="h-8 bg-gray-100 rounded w-1/2" />
      <div className="h-4 bg-gray-100 rounded w-2/3" />
    </div>
  </div>
);

// Form Loading Overlay
export const FormLoadingOverlay = ({ isLoading, children }) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-lg">
        <LoadingSpinner size="md" />
      </div>
    )}
  </div>
);

// Button with Loading State
export const LoadingButton = ({ 
  isLoading, 
  loadingText = 'Please wait...', 
  children, 
  disabled,
  className = '',
  ...props 
}) => (
  <button
    disabled={disabled || isLoading}
    className={cn(
      "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors",
      "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
    {...props}
  >
    {isLoading ? (
      <>
        <LoadingSpinner size="sm" />
        <span>{loadingText}</span>
      </>
    ) : children}
  </button>
);

// Empty State Component
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action 
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    {Icon && <Icon className="w-12 h-12 text-gray-400 mb-4" />}
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    {description && <p className="text-gray-500 mb-4 max-w-sm">{description}</p>}
    {action}
  </div>
);

// Error State Component
export const ErrorState = ({ 
  title = 'Something went wrong', 
  description = 'An error occurred while loading the data.',
  onRetry 
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-4 max-w-sm">{description}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

export default LoadingSpinner;
