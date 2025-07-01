'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PricingRoute() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/?section=pricing');
  }, [router]);
  
  return null; // This page will redirect immediately
} 