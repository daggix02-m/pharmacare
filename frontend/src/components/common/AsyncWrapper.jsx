import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
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
    return (
      errorComponent || (
        <Card className='border-destructive/50 bg-destructive/5'>
          <CardContent className='flex flex-col items-center justify-center p-8 text-center'>
            <AlertCircle className='h-10 w-10 text-destructive mb-4' />
            <h3 className='text-lg font-semibold text-destructive mb-2'>Something went wrong</h3>
            <p className='text-muted-foreground mb-6 max-w-md'>{error}</p>
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
