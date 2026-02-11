import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, Server, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * AsyncWrapper Component
 * Handles loading and error states for asynchronous data fetching
 */
const AsyncWrapper = ({
  loading,
  error,
  onRetry,
  children,
  loadingComponent,
  errorComponent,
  isEmpty = false,
  emptyComponent,
}) => {
  // Determine error type for better UX
  const getErrorType = (errorMsg) => {
    const lowerError = errorMsg.toLowerCase();
    if (lowerError.includes('network') || lowerError.includes('connection')) {
      return 'network';
    }
    if (lowerError.includes('not found') || lowerError.includes('404')) {
      return 'notFound';
    }
    if (lowerError.includes('server') || lowerError.includes('500')) {
      return 'server';
    }
    return 'general';
  };

  const getErrorIcon = (type) => {
    switch (type) {
      case 'network':
        return <WifiOff className='h-12 w-12 text-amber-500 mb-4' />;
      case 'notFound':
        return <SearchX className='h-12 w-12 text-blue-500 mb-4' />;
      case 'server':
        return <Server className='h-12 w-12 text-red-500 mb-4' />;
      default:
        return <AlertCircle className='h-12 w-12 text-destructive mb-4' />;
    }
  };

  const getErrorTitle = (type) => {
    switch (type) {
      case 'network':
        return 'Connection Error';
      case 'notFound':
        return 'Resource Not Found';
      case 'server':
        return 'Server Error';
      default:
        return 'Something went wrong';
    }
  };

  const getErrorSuggestion = (type) => {
    switch (type) {
      case 'network':
        return 'Please check your internet connection and try again.';
      case 'notFound':
        return 'The requested resource could not be found. It may have been moved or deleted.';
      case 'server':
        return 'Our servers are experiencing issues. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  if (loading) {
    return (
      loadingComponent || (
        <div className='flex flex-col items-center justify-center min-h-[200px] p-8'>
          <RefreshCw className='h-8 w-8 animate-spin text-primary mb-4' />
          <p className='text-muted-foreground animate-pulse'>Loading data...</p>
        </div>
      )
    );
  }

  if (error) {
    const errorType = getErrorType(error);
    const ErrorIcon = getErrorIcon(errorType);
    const errorTitle = getErrorTitle(errorType);
    const errorSuggestion = getErrorSuggestion(errorType);

    return (
      errorComponent || (
        <Card className='border-destructive/50 bg-destructive/5'>
          <CardContent className='flex flex-col items-center justify-center p-8 text-center'>
            {ErrorIcon}
            <h3 className='text-xl font-semibold text-destructive mb-2'>{errorTitle}</h3>
            <p className='text-muted-foreground mb-2 max-w-md'>{error}</p>
            <p className='text-sm text-muted-foreground/80 mb-6 max-w-md'>{errorSuggestion}</p>
            {onRetry && (
              <Button onClick={onRetry} variant='outline' className='gap-2'>
                <RefreshCw className='h-4 w-4' />
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      )
    );
  }

  if (isEmpty) {
    return (
      emptyComponent || (
        <div className='flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-muted/30'>
          <p className='text-muted-foreground'>No items found.</p>
        </div>
      )
    );
  }

  return <>{children}</>;
};

export default AsyncWrapper;
