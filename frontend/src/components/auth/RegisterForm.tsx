'use client';

import React, { useState } from 'react';
import { FieldError, FormField } from '../ui/form-field';
import { Input } from '../ui/input';
import { useForm } from '@tanstack/react-form-nextjs';
import { Label } from '../ui/label';
import { MdLockOutline, MdOutlineEmail, MdPersonOutline } from 'react-icons/md';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Button } from '../ui/button';
import Link from 'next/link';



export const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const getPasswordStrength = (val: string) => {
    if (!val) return 0;
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 8 && /\d/.test(val)) score++;
    if (val.length >= 10 && /[!@#$%^&*(),.?":{}|<>]/.test(val)) score++;
    return Math.min(score, 3);
  };

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    // validators: {
    //   onChange: RegisterSchema,
    // },
    onSubmit: async () => {
      console.log("Register Page");
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
      className="mt-5 flex flex-col gap-4"
    >
      {/* Full Name */}
      <form.Field name="name">
        {(field) => {
          const hasError =
            form.state.submissionAttempts > 0 &&
            field.state.meta.errors.length > 0;
          return (
            <FormField
              label="Full Name"
              htmlFor="reg-name"
              error={hasError ? field.state.meta.errors[0] : undefined}
            >
              <div className="relative">
                <MdPersonOutline className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px] pointer-events-none" />
                <Input
                  id="reg-name"
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="pl-10"
                />
              </div>
            </FormField>
          );
        }}
      </form.Field>

      {/* Email */}
      <form.Field name="email">
        {(field) => {
          const hasError =
            form.state.submissionAttempts > 0 &&
            field.state.meta.errors.length > 0;
          return (
            <FormField
              label="Work or Personal Email"
              htmlFor="reg-email"
              error={hasError ? field.state.meta.errors[0] : undefined}
            >
              <div className="relative">
                <MdOutlineEmail className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px] pointer-events-none" />
                <Input
                  id="reg-email"
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="sarah@work.com"
                  className="pl-10"
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
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="reg-pwd"
                  className="text-xs font-semibold text-text-main"
                >
                  Password
                </Label>
                <form.Subscribe selector={(state) => state.values.password}>
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
                <MdLockOutline className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px] pointer-events-none" />
                <Input
                  id="reg-pwd"
                  type={showPassword ? 'text' : 'password'}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="••••••••••••"
                  className="pl-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-text-muted hover:text-text-main"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </Button>
              </div>

              {/* Strength Bars */}
              <form.Subscribe selector={(state) => state.values.password}>
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


      {/* Submit CTA */}
      <form.Subscribe
        selector={(state) => [state.isSubmitting]}
      >
        {([isSubmitting]) => (
          <Button
            type="submit"
            disabled={isSubmitting || authenticated}
            className="w-full h-11 mt-1 font-medium text-sm shadow-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Create Account</span>
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </>
            )}
          </Button>
        )}
      </form.Subscribe>

      <div className="mt-2 text-center text-xs text-text-muted">
        Already have an account?{' '}
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
