import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-full transition-all active:scale-90 text-text-primary hover:bg-surface-light ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  },
);

IconButton.displayName = 'IconButton';
export default IconButton;
