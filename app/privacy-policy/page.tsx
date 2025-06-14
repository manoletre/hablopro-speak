import { redirect } from 'next/navigation';

export default function PrivacyPolicyRoute() {
  redirect('/?dialog=privacy');
} 