import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className='w-full space-y-4'>
    <div className='flex items-center justify-between py-4'>
      <Skeleton className='h-8 w-[250px]' />
      <Skeleton className='h-8 w-[100px]' />
    </div>
    <div className='rounded-md border'>
      <div className='border-b p-4'>
        <div className='flex gap-4'>
          {[...Array(cols)].map((_, i) => (
            <Skeleton key={i} className='h-4 flex-1' />
          ))}
        </div>
      </div>
      <div className='space-y-4 p-4'>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className='flex gap-4'>
            {[...Array(cols)].map((_, j) => (
              <Skeleton key={j} className='h-10 flex-1' />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className='space-y-8'>
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className='pb-2'>
            <Skeleton className='h-4 w-24' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-8 w-16 mb-2' />
            <Skeleton className='h-3 w-32' />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardHeader>
        <Skeleton className='h-6 w-48' />
      </CardHeader>
      <CardContent>
        <TableSkeleton rows={3} />
      </CardContent>
    </Card>
  </div>
);

export const FormSkeleton = () => (
  <div className='space-y-6'>
    {[...Array(4)].map((_, i) => (
      <div key={i} className='space-y-2'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-10 w-full' />
      </div>
    ))}
    <div className='flex justify-end gap-3 pt-4'>
      <Skeleton className='h-10 w-24' />
      <Skeleton className='h-10 w-32' />
    </div>
  </div>
);

export default {
  TableSkeleton,
  DashboardSkeleton,
  FormSkeleton,
};
