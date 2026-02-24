'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to main page with compare tab
export default function ComparePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return null;
}
