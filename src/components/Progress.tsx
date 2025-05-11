
import { Progress as ShadcnProgress, ProgressProps } from '@/components/ui/progress';
import React from 'react';

interface CustomProgressProps extends ProgressProps {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ShadcnProgress>,
  CustomProgressProps
>(({ className, indicatorClassName, ...props }, ref) => {
  return (
    <ShadcnProgress
      ref={ref}
      className={className}
      indicatorClassName={indicatorClassName}
      {...props}
    />
  );
});

Progress.displayName = 'Progress';

export { Progress };
