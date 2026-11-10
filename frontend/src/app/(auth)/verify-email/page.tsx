import { AuthViews } from "@/components/auth/AuthViews";
import { Suspense } from "react";


const VerifyEmailPage = () => {
  return (
    <Suspense fallback={<div className="min-h-75 flex items-center justify-center">Loading...</div>}>
      <AuthViews view='verify-email' />
    </Suspense>
  );
};

export default VerifyEmailPage;