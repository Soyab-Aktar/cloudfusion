'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form-nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { RiMailCheckLine } from 'react-icons/ri';

export const VerifyEmailForm = () => {
  const [isVerified, setIsVerified] = useState(false);

  const form = useForm({
    defaultValues: {
      otp: '',
    },
    // validators: {
    //   onChange: VerifyEmailSchema,
    // },
    onSubmit: async ({ value }) => {
      console.log('Verify Email OTP:', value.otp);
      setIsVerified(true);
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
      {isVerified ? (
        <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-status-success">
          <RiMailCheckLine className="material-symbols-outlined mx-auto text-[28px]" />
          <span className="text-sm font-semibold">
            Email verified successfully!
          </span>
          <p className="text-xs text-text-muted">
            Your email has been confirmed. You can now access your account.
          </p>
          <Button
            type="button"
            variant="link"
            className="mt-2 h-auto p-0 text-xs font-semibold text-primary"
          >
            <Link href="/login">Continue to Sign In</Link>
          </Button>
        </div>
      ) : (
        <>
          <form.Field name="otp">
            {(field) => {
              const hasError =
                form.state.submissionAttempts > 0 &&
                field.state.meta.errors.length > 0;

              return (
                <FormField
                  label="Verification Code"
                  htmlFor="verify-otp"
                  error={
                    hasError ? String(field.state.meta.errors[0]) : undefined
                  }
                >
                  <div className="flex justify-center">
                    <InputOTP
                      id="verify-otp"
                      maxLength={6}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(value) => field.handleChange(value)}
                      containerClassName="w-full justify-between"
                    >
                      <InputOTPGroup className="w-full justify-between gap-2">
                        <InputOTPSlot
                          index={0}
                          className="h-11 flex-1 rounded-md border"
                        />
                        <InputOTPSlot
                          index={1}
                          className="h-11 flex-1 rounded-md border"
                        />
                        <InputOTPSlot
                          index={2}
                          className="h-11 flex-1 rounded-md border"
                        />
                        <InputOTPSlot
                          index={3}
                          className="h-11 flex-1 rounded-md border"
                        />
                        <InputOTPSlot
                          index={4}
                          className="h-11 flex-1 rounded-md border"
                        />
                        <InputOTPSlot
                          index={5}
                          className="h-11 flex-1 rounded-md border"
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </FormField>
              );
            }}
          </form.Field>

          <form.Subscribe selector={(state) => [state.isSubmitting]}>
            {([isSubmitting]) => (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 w-full items-center justify-center gap-2 text-sm font-medium shadow-sm"
              >
                {isSubmitting ? 'Verifying...' : 'Verify Email'}
              </Button>
            )}
          </form.Subscribe>

          <div className="mt-2 text-center text-xs text-text-muted">
            Didn&apos;t receive the code?{' '}
            <button
              type="button"
              onClick={() => console.log('Resend OTP triggered')}
              className="ml-1 text-xs font-semibold text-primary hover:text-primary-hover"
            >
              Resend
            </button>
          </div>

          <div className="text-center text-xs text-text-muted">
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

export default VerifyEmailForm;