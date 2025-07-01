'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TermsOfServiceEsRoute() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/es?dialog=terms');
  }, [router]);
  
  return null; // This page will redirect immediately
} 