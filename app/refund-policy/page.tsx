'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RefundPolicyRoute() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/?dialog=refund');
  }, [router]);
  
  return null; // This page will redirect immediately
} 