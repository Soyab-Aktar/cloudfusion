
import { AuthViews } from '@/components/auth/AuthViews';
import { Suspense } from 'react';


const ForgotPasswordPage = () => {
  return (
    <Suspense fallback={<div className="min-h-75 flex items-center justify-center">Loading...</div>}>
      <AuthViews
        view='forgot-password'
      />

    </Suspense>
  );
};

export default ForgotPasswordPage;