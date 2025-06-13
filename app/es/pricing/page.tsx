'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PricingEsRoute() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/es?section=precios');
  }, [router]);
  
  return null; // This page will redirect immediately
} 