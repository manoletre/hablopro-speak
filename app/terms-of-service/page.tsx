import { redirect } from 'next/navigation';

export default function TermsOfServiceRoute() {
  redirect('/?dialog=terms');
} 