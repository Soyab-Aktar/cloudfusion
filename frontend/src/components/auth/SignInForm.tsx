'use client';

import { useForm } from "@tanstack/react-form-nextjs";
import { FormField } from "../ui/form-field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { MdLockOutline, MdOutlineEmail } from "react-icons/md";
import { FaArrowRight, FaCheck, FaEye, FaEyeSlash } from "react-icons/fa";




export const SignInForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const form = useForm({
    defaultValues: {
      email: 'sarah@work.com',
      password: 'password123',
      rememberMe: true,
    },
    // validators: {
    //   onChange: SignInSchema,
    // },
    onSubmit: async () => {
      console.log("SignIn form")
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

      {/* Email */}
      <form.Field name="email">
        {(field) => {
          const hasError =
            form.state.submissionAttempts > 0 &&
            field.state.meta.errors.length > 0;
          return (
            <FormField
              label="Email address"
              htmlFor="login-email"
              error={hasError ? field.state.meta.errors[0] : undefined}
            >
              <div className="relative">
                <MdOutlineEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px] pointer-events-none" />
                <Input
                  id="login-email"
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

      {/* Password */}
      <form.Field name="password">
        {(field) => {
          const hasError =
            form.state.submissionAttempts > 0 &&
            field.state.meta.errors.length > 0;
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
              error={hasError ? field.state.meta.errors[0] : undefined}
            >
              <div className="relative">
                <MdLockOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px] pointer-events-none" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
                  className="absolute right-1.5 inset-y-0 my-auto h-8 w-8 text-text-muted hover:text-text-main transition-colors active:translate-y-0 active:not-aria-[haspopup]:translate-y-0 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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

      {/* Submit CTA */}
      <form.Subscribe
        selector={(state) => [state.isSubmitting]}
      >
        {([isSubmitting]) => {
          const loading = isSubmitting || isSocialSubmitting;
          return (
            <Button
              type="submit"
              disabled={loading || authenticated}
              className={`w-full h-11 mt-1 font-medium text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer ${authenticated
                ? 'bg-status-success hover:bg-status-success text-white'
                : ''
                }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        <div className="w-full h-px bg-border-subtle" />
        <span className="absolute bg-surface px-3 text-xs text-text-muted">
          or continue with
        </span>
      </div>

      {/* Social Login */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 bg-app-bg hover:bg-slate-200 text-text-main text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 border-border-subtle shadow-xs cursor-pointer"
      >
        <FcGoogle />
        <span>Continue with Google</span>
      </Button>

      {/* Bottom Nav Link */}
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
