'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RecommendRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/destinations');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center page-bg-pattern">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p style={{ color: 'var(--text-muted)' }}>Redirecting to Destinations...</p>
      </div>
    </div>
  );
}
