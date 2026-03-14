import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl bg-surface px-4 py-3 text-sm text-text-primary border border-border placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors ${className}`}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
