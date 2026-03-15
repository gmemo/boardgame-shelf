import { type TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full rounded-xl glass-input px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none transition-colors resize-none ${className}`}
          rows={3}
          {...props}
        />
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
export default Textarea;
