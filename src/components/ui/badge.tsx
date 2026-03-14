import { X } from 'lucide-react';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'active';
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

export default function Badge({ label, variant = 'default', onRemove, onClick, className = '' }: BadgeProps) {
  const variantClasses = {
    default: 'glass-pill text-text-secondary',
    primary: 'bg-primary/20 text-primary border border-primary/30',
    active: 'bg-primary text-white',
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all ${onClick ? 'active:scale-95 cursor-pointer' : ''} ${variantClasses[variant]} ${className}`}
    >
      {label}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:text-danger transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </Component>
  );
}
