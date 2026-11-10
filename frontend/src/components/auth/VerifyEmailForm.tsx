'use client';

import { useEffect, useState } from 'react';
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
import { useRouter, useSearchParams } from 'next/navigation';
import { VerifyEmailSchema, VerifyEmailValues } from '@/schemas/auth.schema';
import { resendVerificationOtp, verifyEmail } from '@/services/auth.service';
import axios from 'axios';
import { BiError } from 'react-icons/bi';

export const VerifyEmailForm = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const from = searchParams.get('from');

  useEffect(() => {
    setIsVerified(false);
    setVerifyError('');
  }, [])

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isResending || !email) return;
    setIsResending(true);
    setResendMessage('');
    setVerifyError('');
    try {
      await resendVerificationOtp(email);
      // Start 1 minute 30 seconds cooldown
      setCountdown(90);
      setResendMessage('A new 6-digit code has been sent to your email.');
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message ??
        'Failed to resend code. Please try again.'
        : 'Failed to resend code. Please try again.';
      setVerifyError(message);
    } finally {
      setIsResending(false);
    }
  };

  const hasSession =
    from === 'register' ||
    (typeof document !== 'undefined' && document.cookie.includes('accessToken'));


  const form = useForm({
    defaultValues: {
      otp: '',
    } as VerifyEmailValues,
    onSubmit: async ({ value }) => {
      setVerifyError('');
      if (!email) {
        setVerifyError('Email address is missing. Please register or sign in again.');
        return;
      }

      try {
        await verifyEmail({
          email,
          otp: value.otp
        })
        setIsVerified(true);
        setTimeout(() => {
          if (hasSession) {
            router.push('/dashboard');
          }
          router.refresh();
        }, 1500);
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? (err.response?.data as { message?: string } | undefined)?.message ??
          'Invalid or expired verification code.'
          : 'Failed to verify email. Please try again.';
        setVerifyError(message);
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
      {isVerified ? (
        <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800/40 p-4 text-center text-status-success">
          <RiMailCheckLine className="mx-auto text-[28px]" />
          <span className="text-sm font-semibold">Email verified successfully!</span>
          <p className="text-xs text-text-muted">
            Redirecting to your dashboard...
          </p>
          <Button
            type="button"
            variant="link"
            className="mt-2 h-auto p-0 text-xs font-semibold text-primary cursor-pointer"
          >
            <Link
              href={
                hasSession
                  ? '/dashboard'
                  : `/login?verified=true&email=${encodeURIComponent(email)}`
              }
            >
              Go to Dashboard
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Target Email Reminder */}
          {email && (
            <p className="text-center text-xs text-text-muted">
              Code sent to <span className="font-semibold text-text-main">{email}</span>
            </p>
          )}

          {/* Error Banner */}
          {verifyError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-status-error"
            >
              <span className="material-symbols-outlined text-[16px]"><BiError /></span>
              <span>{verifyError}</span>
            </div>
          )}
          <form.Field
            name="otp"
            validators={{
              onChange: VerifyEmailSchema.shape.otp,
              onBlur: VerifyEmailSchema.shape.otp,
            }}
          >
            {(field) => {
              const hasError =
                form.state.submissionAttempts > 0 &&
                field.state.meta.errors.length > 0;

              const rawError = field.state.meta.errors[0];

              const errorMessage = hasError
                ? typeof rawError === "string"
                  ? rawError
                  : rawError && typeof rawError === "object" && "message" in rawError
                    ? String(rawError.message)
                    : "Please enter a valid verification code."
                : undefined;
              return (
                <FormField
                  label="Verification Code"
                  htmlFor="verify-otp"
                  error={
                    errorMessage
                  }
                >
                  <div className="flex justify-center w-full">
                    <InputOTP
                      id="verify-otp"
                      maxLength={6}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(value) => field.handleChange(value)}
                      containerClassName="w-full justify-between"
                    >
                      <InputOTPGroup className="w-full justify-between gap-1.5 sm:gap-2">
                        <InputOTPSlot
                          index={0}
                          className="h-11 flex-1 rounded-md border text-base sm:text-lg font-semibold"
                        />
                        <InputOTPSlot
                          index={1}
                          className="h-11 flex-1 rounded-md border text-base sm:text-lg font-semibold"
                        />
                        <InputOTPSlot
                          index={2}
                          className="h-11 flex-1 rounded-md border text-base sm:text-lg font-semibold"
                        />
                        <InputOTPSlot
                          index={3}
                          className="h-11 flex-1 rounded-md border text-base sm:text-lg font-semibold"
                        />
                        <InputOTPSlot
                          index={4}
                          className="h-11 flex-1 rounded-md border text-base sm:text-lg font-semibold"
                        />
                        <InputOTPSlot
                          index={5}
                          className="h-11 flex-1 rounded-md border text-base sm:text-lg font-semibold"
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
                className="flex h-11 w-full items-center justify-center gap-2 text-sm font-medium shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>
            )}
          </form.Subscribe>

          {/* Success notification for resend */}
          {resendMessage && (
            <div
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-center text-xs font-medium text-emerald-800"
            >
              <span>{resendMessage}</span>
            </div>
          )}

          {/* Resend Action */}
          <div className="mt-2 text-center text-xs text-text-muted">
            Didn&apos;t receive the code?{' '}
            <button
              type="button"
              disabled={countdown > 0 || isResending}
              onClick={handleResendOtp}
              className={`ml-1 font-semibold transition-colors ${countdown > 0 || isResending
                  ? 'text-text-muted/60 cursor-not-allowed'
                  : 'text-primary hover:text-primary-hover cursor-pointer underline'
                }`}
            >
              {isResending
                ? 'Sending code...'
                : countdown > 0
                  ? `Resend code in ${formatTime(countdown)}`
                  : 'Resend'}
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