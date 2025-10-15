import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  lines = 1,
}) => {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const baseClasses = 'animate-pulse bg-gray-200';

  if (variant === 'text' && lines > 1) {
    return (
      <div className={clsx('space-y-2', className)}>
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={clsx(
              baseClasses,
              variants[variant],
              index === lines - 1 ? 'w-3/4' : 'w-full'
            )}
            style={{
              height: height || '1rem',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={clsx(baseClasses, variants[variant], className)}
      style={{
        width: width || (variant === 'circular' ? '2.5rem' : '100%'),
        height: height || (variant === 'text' ? '1rem' : '2.5rem'),
      }}
    />
  );
};

export default Skeleton;