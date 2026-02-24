'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to main page
export default function ProcessorPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return null;
}
