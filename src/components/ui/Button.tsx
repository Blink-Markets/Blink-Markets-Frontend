import { cn } from '../../lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'bet-a' | 'bet-b';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'md', disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled}
                className={cn(
                    'inline-flex items-center justify-center font-semibold transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
                    'active:scale-[0.98]',
                    // Size variants
                    size === 'sm' && 'text-sm px-3 py-1.5 rounded-md',
                    size === 'md' && 'text-base px-4 py-2 rounded-lg',
                    size === 'lg' && 'text-lg px-6 py-3 rounded-xl',
                    // Style variants
                    variant === 'default' &&
                    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20',
                    variant === 'outline' &&
                    'border-2 border-border bg-transparent hover:bg-accent hover:border-accent',
                    variant === 'ghost' &&
                    'bg-transparent hover:bg-accent',
                    variant === 'bet-a' &&
                    'bg-gradient-to-r from-flash-green to-flash-blue text-white hover:opacity-90 shadow-lg shadow-flash-green/30',
                    variant === 'bet-b' &&
                    'bg-gradient-to-r from-flash-orange to-flash-red text-white hover:opacity-90 shadow-lg shadow-flash-red/30',
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';
