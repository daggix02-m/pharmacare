import * as React from 'react';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef(({ className, label, ...props }, ref) => {
  return (
    <div className='flex items-center space-x-2'>
      <input
        type='checkbox'
        className={cn(
          'h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer',
          className
        )}
        ref={ref}
        {...props}
      />
      {label && (
        <label
          htmlFor={props.id}
          className='text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
        >
          {label}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
