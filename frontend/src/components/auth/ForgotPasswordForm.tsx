'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form-nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { MdOutlineEmail } from 'react-icons/md';
import { BiError } from 'react-icons/bi';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { ForgotPasswordSchema, ForgotPasswordValues } from '@/schemas/auth.schema';
import { forgotPassword } from '@/services/auth.service';

export const ForgotPasswordForm = () => {
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      email: '',
    } as ForgotPasswordValues,

    onSubmit: async ({ value }) => {
      setForgotPasswordError('');
      try {
        const res = await forgotPassword({
          email: value.email,
        });

        if (res.success) {
          router.push(`/reset-password?email=${encodeURIComponent(value.email)}`);
        }
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? (err.response?.data as { message?: string } | undefined)?.message ??
          'Failed to send password recovery OTP. Please try again.'
          : 'Failed to send password recovery OTP. Please try again.';
        setForgotPasswordError(message);
      }
    },
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="mt-6 flex flex-col gap-4"
    >
      {/* Error banner */}
      {forgotPasswordError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-status-error"
        >
          <BiError className="text-[16px] shrink-0" />
          <span>{forgotPasswordError}</span>
        </div>
      )}

      {/* Email input with TanStack Form validation */}
      <form.Field
        name="email"
        validators={{
          onChange: ForgotPasswordSchema.shape.email,
          onBlur: ForgotPasswordSchema.shape.email,
        }}
      >
        {(field) => {
          const hasError =
            (field.state.meta.isTouched || form.state.submissionAttempts > 0) &&
            field.state.meta.errors.length > 0;

          return (
            <FormField
              label="Email address"
              htmlFor="forgot-email"
              error={hasError ? String(field.state.meta.errors[0]) : undefined}
            >
              <div className="relative">
                <MdOutlineEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px] pointer-events-none" />

                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    setForgotPasswordError('');
                    field.handleChange(e.target.value);
                  }}
                  placeholder="sarah@work.com"
                  className={`h-11 pl-10 pr-4 ${hasError ? 'border-red-500 focus-visible:ring-red-500' : ''
                    }`}
                />
              </div>
            </FormField>
          );
        }}
      </form.Field>

      {/* Submit button */}
      <form.Subscribe selector={(state) => [state.isSubmitting]}>
        {([isSubmitting]) => (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center gap-2 text-sm font-medium shadow-sm cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending OTP...</span>
              </>
            ) : (
              'Send OTP'
            )}
          </Button>
        )}
      </form.Subscribe>

      <div className="mt-2 text-center text-xs text-text-muted">
        Remember your password?{' '}
        <Link
          href="/login"
          className="ml-1 text-xs font-semibold text-primary hover:text-primary-hover"
        >
          Sign In
        </Link>
      </div>
    </form>
  );
};