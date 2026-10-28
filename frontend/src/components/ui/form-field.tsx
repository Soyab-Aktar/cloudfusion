import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { MdErrorOutline } from 'react-icons/md';

export function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (Array.isArray(error)) {
    for (const item of error) {
      const msg = getErrorMessage(item);
      if (msg) return msg;
    }
    return null;
  }
  if (typeof error === 'string') return error;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return null;
}

export interface FieldErrorProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  error?: unknown;
}

export const FieldError = React.forwardRef<
  HTMLParagraphElement,
  FieldErrorProps
>(({ error, className, ...props }, ref) => {
  const message = getErrorMessage(error);
  if (!message) return null;

  return (
    <p
      ref={ref}
      className={cn(
        'text-status-error text-xs font-medium flex items-center gap-1 mt-1',
        className
      )}
      {...props}
    >
      <MdErrorOutline className="size-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
});
FieldError.displayName = 'FieldError';

export interface FormFieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: unknown;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  hint,
  action,
  required,
  className,
  children,
}) => {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || action) && (
        <div className="flex items-center justify-between">
          {label && (
            <Label
              htmlFor={htmlFor}
              className="text-xs font-semibold text-text-main"
            >
              {label}
              {required && <span className="text-status-error ml-0.5">*</span>}
            </Label>
          )}
          {action}
        </div>
      )}
      {children}
      {hint && !error && (
        <div className="text-[11px] text-text-muted">{hint}</div>
      )}
      <FieldError error={error} />
    </div>
  );
};
