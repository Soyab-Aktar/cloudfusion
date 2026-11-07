
'use client';

import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form-nextjs';
import Link from 'next/link';
import axios from 'axios';

import { FormField } from '../ui/form-field';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

import { FcGoogle } from 'react-icons/fc';
import { MdLockOutline, MdOutlineEmail } from 'react-icons/md';
import { FaArrowRight, FaCheck, FaEye, FaEyeSlash } from 'react-icons/fa';

import { SignInSchema, SignInValues } from '@/schemas/auth.schema';
import { initiateGoogleLogin, loginUser } from '@/services/auth.service';
import { NavigationTab } from '@/types/navigation.types';
import { useAuthContext } from '@/store/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

export interface SignInFormProps {
  onLoginSuccess: () => void;
  onNavigate?: (tab: NavigationTab) => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  onLoginSuccess,
}) => {
  const { setUser } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');


  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } as SignInValues,

    onSubmit: async ({ value }) => {
      setLoginError('');

      try {
        const res = await loginUser({
          email: value.email,
          password: value.password,
        });

        if (res.data?.user) {
          setUser(res.data?.user);
        }
        setAuthenticated(true);
        setTimeout(() => {
          onLoginSuccess();
        }, 500)
      } catch (err: unknown) {
        const message = axios.isAxiosError(err)
          ? (
            err.response?.data as
            | { message?: string }
            | undefined
          )?.message ?? 'Login failed. Please try again.'
          : 'Login failed. Please try again.';

        setLoginError(message);
      }
    },
  });

  const handleGoogleLogin = () => {
    setIsSocialSubmitting(true);
    initiateGoogleLogin('/dashboard');
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="mt-6 flex flex-col gap-4"
    >
      {/* Login error */}
      {loginError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-status-error"
        >
          <span className="material-symbols-outlined text-[16px]">
            error
          </span>
          <span>{loginError}</span>
        </div>
      )}

      {/* Email */}
      <form.Field
        name="email"
        validators={{
          onChange: SignInSchema.shape.email,
          onBlur: SignInSchema.shape.email,
        }}
      >
        {(field) => {
          const hasError =
            (field.state.meta.isTouched ||
              form.state.submissionAttempts > 0) &&
            field.state.meta.errors.length > 0;

          const errorMessage = hasError
            ? field.state.meta.errors[0]
            : undefined;

          return (
            <FormField
              label="Email address"
              htmlFor="login-email"
              error={errorMessage}
            >
              <div className="relative">
                <MdOutlineEmail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-text-muted" />

                <Input
                  id="login-email"
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    setLoginError('');
                    field.handleChange(e.target.value);
                  }}
                  aria-invalid={hasError}
                  aria-describedby={
                    hasError ? 'login-email-error' : undefined
                  }
                  placeholder="sarah@work.com"
                  className={`h-11 pl-10 pr-4 ${hasError
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                    }`}
                />
              </div>
            </FormField>
          );
        }}
      </form.Field>

      {/* Password */}
      <form.Field
        name="password"
        validators={{
          onChange: SignInSchema.shape.password,
          onBlur: SignInSchema.shape.password,
        }}
      >
        {(field) => {
          const hasError =
            (field.state.meta.isTouched ||
              form.state.submissionAttempts > 0) &&
            field.state.meta.errors.length > 0;

          const errorMessage = hasError
            ? field.state.meta.errors[0]
            : undefined;

          return (
            <FormField
              label="Password"
              htmlFor="login-password"
              action={
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:text-primary-hover"
                >
                  Forgot password?
                </Link>
              }
              error={errorMessage}
            >
              <div className="relative">
                <MdLockOutline className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-text-muted" />

                <Input
                  id="login-password"
                  name={field.name}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    setLoginError('');
                    field.handleChange(e.target.value);
                  }}
                  aria-invalid={hasError}
                  aria-describedby={
                    hasError ? 'login-password-error' : undefined
                  }
                  placeholder="••••••••••••"
                  className={`h-11 pl-10 pr-11 ${hasError
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                    }`}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-1.5 my-auto h-8 w-8 cursor-pointer text-text-muted transition-colors hover:text-text-main"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showPassword ? (
                    <FaEyeSlash className="size-4" />
                  ) : (
                    <FaEye className="size-4" />
                  )}
                </Button>
              </div>
            </FormField>
          );
        }}
      </form.Field>

      {/* Submit button */}
      <form.Subscribe
        selector={(state) => state.isSubmitting}
      >
        {(isSubmitting) => {
          const loading = isSubmitting || isSocialSubmitting;

          return (
            <Button
              type="submit"
              disabled={loading || authenticated}
              className={`mt-1 flex h-11 w-full cursor-pointer items-center justify-center gap-2 text-sm font-medium shadow-sm ${authenticated
                ? 'bg-status-success text-white hover:bg-status-success'
                : ''
                }`}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in...</span>
                </>
              ) : authenticated ? (
                <>
                  <FaCheck className="size-4" />
                  <span>Authenticated</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <FaArrowRight className="size-4" />
                </>
              )}
            </Button>
          );
        }}
      </form.Subscribe>

      {/* Divider */}
      <div className="relative my-2 flex items-center justify-center">
        <div className="h-px w-full bg-border-subtle" />
        <span className="absolute bg-surface px-3 text-xs text-text-muted">
          or continue with
        </span>
      </div>

      {/* Google login UI */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-3 border-border-subtle bg-app-bg text-xs font-semibold text-text-main shadow-xs hover:bg-slate-200 sm:text-sm"
      >
        <FcGoogle />
        <span>Continue with Google</span>
      </Button>

      {/* Register link */}
      <div className="mt-2 text-center text-xs text-text-muted">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="ml-1 text-xs font-semibold text-primary hover:text-primary-hover"
        >
          Create Account
        </Link>
      </div>
    </form>
  );
};
