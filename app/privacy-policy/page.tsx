'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyRoute() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/?dialog=privacy');
  }, [router]);
  
  return null; // This page will redirect immediately
} 