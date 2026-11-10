
import { AuthViews } from '@/components/auth/AuthViews';
import { Suspense } from 'react';

const LoginPage = () => {
  return (
    <Suspense fallback={<div className="min-h-75 flex items-center justify-center">Loading...</div>}>
      <AuthViews view="login" />
    </Suspense>
  );
};

export default LoginPage;