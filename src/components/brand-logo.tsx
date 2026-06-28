import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  variant?: 'full' | 'mark';
  priority?: boolean;
  showLabel?: boolean;
};

export function BrandLogo({
  className,
  markClassName,
  variant = 'full',
  priority = false,
  showLabel = true,
}: BrandLogoProps) {
  const compact = variant === 'mark';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden',
          compact ? 'h-10 w-10' : 'h-10 w-36 sm:w-44',
          markClassName,
        )}
      >
        {compact ? (
          <>
            <Image
              src="/brand/icon.svg"
              alt="Brand icon"
              fill
              priority={priority}
              className="object-contain dark:hidden"
              sizes="40px"
            />
            <Image
              src="/brand/icon.svg"
              alt="Brand icon"
              fill
              priority={priority}
              className="hidden object-contain dark:block"
              sizes="40px"
            />
          </>
        ) : (
          <>
            <Image
              src="/brand/main-logo.svg"
              alt="Brand logo"
              fill
              priority={priority}
              className="object-contain dark:hidden"
              sizes="176px"
            />
            <Image
              src="/brand/secondary-logo.svg"
              alt="Brand logo"
              fill
              priority={priority}
              className="hidden object-contain dark:block"
              sizes="176px"
            />
          </>
        )}
      </div>
      {showLabel && !compact && (
        <div className="sr-only">Application branding</div>
      )}
    </div>
  );
}