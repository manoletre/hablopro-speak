'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyEsRoute() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/es?dialog=privacy');
  }, [router]);
  
  return null; // This page will redirect immediately
} 