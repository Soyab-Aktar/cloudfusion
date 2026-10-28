
'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form-nextjs';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { MdOutlineEmail } from 'react-icons/md';
import { RiMailCheckLine } from 'react-icons/ri';

export const ForgotPasswordForm = () => {
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const form = useForm({
    defaultValues: {
      email: '',
    },

    // validators: {
    //   onChange: ForgotPasswordSchema,
    // },

    onSubmit: async ({ value }) => {
      console.log('Forgot Password Page');

      setSubmittedEmail(value.email);
      setForgotSubmitted(true);
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
      {forgotSubmitted ? (
        <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800/40 p-4 text-center text-status-success">
          <RiMailCheckLine className="mx-auto text-[28px]" />

          <span className="text-sm font-semibold">
            Password recovery email sent!
          </span>

          <p className="text-xs text-text-muted">
            If an account matches {submittedEmail || 'your email'}, you will
            receive a secure reset link shortly.
          </p>

          <Button
            type="button"
            variant="link"
            className="mt-2 h-auto p-0 text-xs font-semibold text-primary cursor-pointer"
          >
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </div>
      ) : (
        <>
          <form.Field name="email">
            {(field) => {
              const hasError =
                form.state.submissionAttempts > 0 &&
                field.state.meta.errors.length > 0;

              return (
                <FormField
                  label="Email address"
                  htmlFor="forgot-email"
                  error={
                    hasError
                      ? String(field.state.meta.errors[0])
                      : undefined
                  }
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
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="sarah@work.com"
                      className="h-11 pl-10 pr-4"
                    />
                  </div>
                </FormField>
              );
            }}
          </form.Field>

          <form.Subscribe
            selector={(state) => [state.isSubmitting]}
          >
            {([isSubmitting]) => (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 w-full items-center justify-center gap-2 text-sm font-medium shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending link...</span>
                  </>
                ) : (
                  'Send Reset Link'
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
        </>
      )}
    </form>
  );
};
