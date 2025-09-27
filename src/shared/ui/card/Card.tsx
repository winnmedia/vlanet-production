import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const cardVariants = cva(
  ['rounded-xl bg-white transition-all duration-200'],
  {
    variants: {
      variant: {
        default: ['border border-secondary-200 shadow-card'],
        elevated: ['shadow-card-hover border-0'],
        outlined: ['border-2 border-secondary-200 shadow-none'],
        featured: [
          'border-2 border-primary-200 shadow-brand',
          'bg-gradient-to-br from-primary-50 to-white'
        ],
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      hover: {
        none: '',
        lift: 'hover:-translate-y-1 hover:shadow-card-hover',
        scale: 'hover:scale-[1.02]',
        glow: 'hover:shadow-brand-lg hover:border-primary-300',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hover: 'none',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * 클릭 가능한 카드로 만들기
   */
  clickable?: boolean;

  /**
   * 카드 헤더 영역
   */
  header?: React.ReactNode;

  /**
   * 카드 푸터 영역
   */
  footer?: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      hover,
      clickable = false,
      header,
      footer,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const cardClassName = cn(
      cardVariants({ variant, padding: header || footer ? 'none' : padding, hover }),
      clickable && 'cursor-pointer',
      className
    );

    return (
      <div
        ref={ref}
        className={cardClassName}
        onClick={onClick}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.(e as any);
                }
              }
            : undefined
        }
        {...props}
      >
        {/* 헤더 */}
        {header && (
          <div className="border-b border-secondary-100 px-6 py-4">
            {header}
          </div>
        )}

        {/* 본문 */}
        <div className={cn(
          (header || footer) && padding !== 'none' && {
            'p-4': padding === 'sm',
            'p-6': padding === 'md',
            'p-8': padding === 'lg',
          }
        )}>
          {children}
        </div>

        {/* 푸터 */}
        {footer && (
          <div className="border-t border-secondary-100 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

// 카드 하위 컴포넌트들
const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5 p-6',
      className
    )}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-secondary-600', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};

export default Card;