
import { AuthViews } from '@/components/auth/AuthViews';
import { SignInForm } from '@/components/auth/SignInForm';
import React from 'react';

const LoginPage = () => {
  return (
    <AuthViews
      view='login'
    />
  );
};

export default LoginPage;