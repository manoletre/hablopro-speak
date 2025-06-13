'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RefundPolicyEsRoute() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/es?dialog=refund');
  }, [router]);
  
  return null; // This page will redirect immediately
} 