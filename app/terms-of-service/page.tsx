'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TermsOfServiceRoute() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/?dialog=terms');
  }, [router]);
  
  return null; // This page will redirect immediately
} 