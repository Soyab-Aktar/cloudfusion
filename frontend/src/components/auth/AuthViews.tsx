'use client';

import React from 'react';
import { SignInForm } from './SignInForm';
import { BsFillCloudsFill } from 'react-icons/bs';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import VerifyEmailForm from './VerifyEmailForm';



export interface AuthViewsProps {
  view: 'login' | 'register' | 'forgot-password' | 'verify-email';
}

export const AuthViews: React.FC<AuthViewsProps> = ({
  view
}) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center p-4 sm:p-6 md:p-8">
      {/* Decorative ambient background glows */}
      <div className="relative w-full max-w-[480px]">
        <div className="absolute -top-14 -left-12 w-64 h-64 bg-primary-subtle opacity-70 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-10 w-64 h-64 bg-surface-container opacity-80 rounded-full blur-3xl pointer-events-none" />

        {/* Card Surface */}
        <div className="relative w-full bg-surface rounded-2xl shadow-xl border border-border-subtle p-6 sm:p-8 transition-all">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center">
            <button
              className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm mb-4 hover:bg-primary-hover transition-colors cursor-pointer"
            >
              <BsFillCloudsFill className="material-symbols-outlined text-[28px]" />
            </button>

            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xl font-bold text-text-main tracking-tight">
                CloudFusion
              </span>
            </div>

            {view === 'login' && (
              <>
                <h1 className="text-2xl font-bold text-text-main mt-1 mb-1">
                  Welcome back
                </h1>
                <p className="text-xs sm:text-sm text-text-muted max-w-[320px]">
                  Sign in to access and manage your unified cloud files.
                </p>
              </>
            )}

            {view === 'register' && (
              <>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-primary text-xs font-semibold my-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                  <span>Unified Multi-Cloud Sync</span>
                </div>
                <h1 className="text-2xl font-bold text-text-main mt-1 mb-1">
                  Create your account
                </h1>
                <p className="text-xs sm:text-sm text-text-muted max-w-sm">
                  Start unifying your Google Drive, Dropbox, and OneDrive in minutes.
                </p>
              </>
            )}

            {view === 'forgot-password' && (
              <>
                <h1 className="text-2xl font-bold text-text-main mt-1 mb-1">
                  Reset Password
                </h1>
                <p className="text-xs sm:text-sm text-text-muted max-w-[320px]">
                  Enter your email address and we will send you a password recovery link.
                </p>
              </>
            )}

            {view === 'verify-email' && (
              <>
                <h1 className="text-2xl font-bold text-text-main mt-1 mb-1">
                  Verify Email
                </h1>
                <p className="text-xs sm:text-sm text-text-muted max-w-[320px]">
                  We've sent a 6-digit verification code to your email address. Enter the code below to verify your email and get started with CloudFusion.
                </p>
              </>
            )
            }
          </div>

          {/* Form views */}
          {view === 'login' && (
            <SignInForm

            />
          )}

          {view === 'register' && (
            <RegisterForm

            />
          )}

          {view === 'forgot-password' && (
            <ForgotPasswordForm />
          )}

          {view === 'verify-email' && (
            <VerifyEmailForm />
          )}

          {/* Trust Footnote */}
          <div className="mt-6 flex items-center justify-center gap-2 text-text-muted text-xs">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span>256-bit encrypted • Zero-knowledge architecture</span>
          </div>
        </div>
      </div>
    </div>
  );
};
