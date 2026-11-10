'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form-nextjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { MdLockOutline } from 'react-icons/md';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { BiError } from 'react-icons/bi';
import { RiMailCheckLine } from 'react-icons/ri';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FieldError } from '@/components/ui/form-field';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { ResetPasswordSchema, ResetPasswordValues } from '@/schemas/auth.schema';
import { resetPassword, forgotPassword } from '@/services/auth.service';

export const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  // Resend OTP Cooldown states
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    setResetSuccess(false);
    setResetError('');
  }, []);

  // Countdown timer logic
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

  const getPasswordStrength = (val: string) => {
    if (!val) return 0;
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 8 && /\d/.test(val)) score++;
    if (val.length >= 10 && /[!@#$%^&*(),.?":{}|<>]/.test(val)) score++;
    return Math.min(score, 3);
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isResending || !email) return;
    setIsResending(true);
    setResendMessage('');
    setResetError('');
    try {
      await forgotPassword({ email });
      // 90 seconds cooldown (1 min 30 sec)
      setCountdown(90);
      setResendMessage('A new 6-digit recovery code has been sent to your email.');
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message ??
        'Failed to resend code. Please try again.'
        : 'Failed to resend code. Please try again.';
      setResetError(message);
    } finally {
      setIsResending(false);
    }
  };

  const form = useForm({
    defaultValues: {
      email,
      otp: '',
      newPassword: '',
    } as ResetPasswordValues,

    onSubmit: async ({ value }) => {
      setResetError('');

      if (!email) {
        setResetError('Email address is missing. Please initiate password recovery again.');
        return;
      }

      try {
        await resetPassword({
          email,
          otp: value.otp,
          newPassword: value.newPassword,
        });

        setResetSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? (err.response?.data as { message?: string } | undefined)?.message ??
          'Invalid or expired verification code. Please try again.'
          : 'Failed to reset password. Please try again.';
        setResetError(message);
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
      {resetSuccess ? (
        <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800/40 p-4 text-center text-status-success">
          <RiMailCheckLine className="mx-auto text-[28px]" />
          <span className="text-sm font-semibold">Password reset successfully!</span>
          <p className="text-xs text-text-muted">
            Redirecting you to the sign in page...
          </p>
          <Button
            type="button"
            variant="link"
            className="mt-2 h-auto p-0 text-xs font-semibold text-primary cursor-pointer"
          >
            <Link href="/login">Sign In Now</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Target Email Info Text */}
          {email ? (
            <p className="text-center text-xs text-text-muted">
              Code sent to <span className="font-semibold text-text-main">{email}</span>
            </p>
          ) : (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900"
            >
              <BiError className="text-[16px] shrink-0 text-amber-700" />
              <span>No email provided in the link. Please go back to forgot password.</span>
            </div>
          )}

          {/* Error Banner */}
          {resetError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-status-error"
            >
              <BiError className="text-[16px] shrink-0" />
              <span>{resetError}</span>
            </div>
          )}

          {/* OTP Code */}
          <form.Field
            name="otp"
            validators={{
              onChange: ResetPasswordSchema.shape.otp,
              onBlur: ResetPasswordSchema.shape.otp,
            }}
          >
            {(field) => {
              const hasError =
                form.state.submissionAttempts > 0 &&
                field.state.meta.errors.length > 0;
              const rawError = field.state.meta.errors[0];
              const errorMessage = hasError
                ? typeof rawError === 'string'
                  ? rawError
                  : 'Please enter a valid 6-digit verification code.'
                : undefined;

              return (
                <FormField
                  label="Verification Code (OTP)"
                  htmlFor="reset-otp"
                  error={errorMessage}
                >
                  <div className="flex justify-center w-full">
                    <InputOTP
                      id="reset-otp"
                      maxLength={6}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(val) => field.handleChange(val)}
                      containerClassName="w-full justify-between"
                    >
                      <InputOTPGroup className="w-full justify-between gap-1.5 sm:gap-2">
                        <InputOTPSlot index={0} className="h-11 flex-1 rounded-md border text-base sm:text-lg font-semibold" />
                        <InputOTPSlot index={1} className="h-11 flex-1 rounded-md border text-base sm:text-lg font-semibold" />
                        <InputOTPSlot index={2} className="h-11 flex-1 rounded-md border text-base sm:text-lg font-semibold" />
                        <InputOTPSlot index={3} className="h-11 flex-1 rounded-md border text-base sm:text-lg font-semibold" />
                        <InputOTPSlot index={4} className="h-11 flex-1 rounded-md border text-base sm:text-lg font-semibold" />
                        <InputOTPSlot index={5} className="h-11 flex-1 rounded-md border text-base sm:text-lg font-semibold" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </FormField>
              );
            }}
          </form.Field>

          {/* New Password */}
          <form.Field
            name="newPassword"
            validators={{
              onChange: ResetPasswordSchema.shape.newPassword,
              onBlur: ResetPasswordSchema.shape.newPassword,
            }}
          >
            {(field) => {
              const hasError =
                form.state.submissionAttempts > 0 &&
                field.state.meta.errors.length > 0;

              return (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reset-new-pwd" className="text-xs font-semibold text-text-main">
                      New Password
                    </Label>
                    <form.Subscribe selector={(state) => state.values.newPassword}>
                      {(pwd) => {
                        const score = getPasswordStrength(pwd);
                        return (
                          <span className="text-[11px] text-text-muted">
                            {score === 0
                              ? 'Must be at least 8 characters'
                              : score === 1
                                ? 'Weak'
                                : score === 2
                                  ? 'Good'
                                  : 'Strong'}
                          </span>
                        );
                      }}
                    </form.Subscribe>
                  </div>
                  <div className="relative">
                    <MdLockOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px] pointer-events-none" />
                    <Input
                      id="reset-new-pwd"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="••••••••••••"
                      className="h-11 pl-10 pr-11"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1.5 inset-y-0 my-auto h-8 w-8 text-text-muted hover:text-text-main transition-colors active:translate-y-0 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FaEyeSlash className="size-4" /> : <FaEye className="size-4" />}
                    </Button>
                  </div>

                  {/* Password strength indicators */}
                  <form.Subscribe selector={(state) => state.values.newPassword}>
                    {(pwd) => {
                      const score = getPasswordStrength(pwd);
                      return (
                        <div className="flex gap-1.5 mt-1">
                          <div
                            className={`h-1 flex-1 rounded-full transition-colors ${score >= 1
                                ? score === 1
                                  ? 'bg-status-error'
                                  : score === 2
                                    ? 'bg-status-warning'
                                    : 'bg-status-success'
                                : 'bg-slate-200'
                              }`}
                          />
                          <div
                            className={`h-1 flex-1 rounded-full transition-colors ${score >= 2
                                ? score === 2
                                  ? 'bg-status-warning'
                                  : 'bg-status-success'
                                : 'bg-slate-200'
                              }`}
                          />
                          <div
                            className={`h-1 flex-1 rounded-full transition-colors ${score >= 3 ? 'bg-status-success' : 'bg-slate-200'
                              }`}
                          />
                        </div>
                      );
                    }}
                  </form.Subscribe>

                  {hasError && <FieldError error={field.state.meta.errors[0]} />}
                </div>
              );
            }}
          </form.Field>

          {/* Resend notification */}
          {resendMessage && (
            <div
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-center text-xs font-medium text-emerald-800"
            >
              <span>{resendMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <form.Subscribe selector={(state) => [state.isSubmitting]}>
            {([isSubmitting]) => (
              <Button
                type="submit"
                disabled={isSubmitting || resetSuccess || !email}
                className="mt-1 flex h-11 w-full items-center justify-center gap-2 text-sm font-medium shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            )}
          </form.Subscribe>

          {/* Resend OTP Link with countdown */}
          <div className="mt-2 text-center text-xs text-text-muted">
            Didn&apos;t receive the code?{' '}
            <button
              type="button"
              disabled={countdown > 0 || isResending || !email}
              onClick={handleResendOtp}
              className={`ml-1 font-semibold transition-colors ${countdown > 0 || isResending || !email
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

export default ResetPasswordForm;