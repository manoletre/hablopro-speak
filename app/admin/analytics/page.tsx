'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function AdminAnalytics() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [analyticsUrl, setAnalyticsUrl] = useState('');

  useEffect(() => {
    // Check if user is admin by checking the specific admin UID
    if (user && user.uid === 'IlLapv9gGqY7gKlDozNtDztbdkz1') {
      setIsAdmin(true);
      
      // Set the PostHog dashboard URL with our project ID
      // This is the URL to the PostHog dashboard for this project
      const projectId = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID || '';
      setAnalyticsUrl(`https://us.posthog.com/project/${projectId}/insights`);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
        <Link href="/" className="text-amber-800 underline mt-4 inline-block">
          Go back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Daily Active Users</h2>
        <p className="mb-4">
          View your PostHog analytics dashboard to see detailed statistics about daily active users.
        </p>
        
        <a 
          href={analyticsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          Open PostHog Dashboard
        </a>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Understanding Your Analytics</h2>
        
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <h3 className="font-medium mb-2">Key Metrics</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Daily Active Users (DAU):</strong> Users who complete at least one session in a day
            </li>
            <li>
              <strong>Session Completion Rate:</strong> Percentage of started sessions that are completed
            </li>
            <li>
              <strong>Average Session Duration:</strong> How long users typically spend in conversation sessions
            </li>
            <li>
              <strong>Language Popularity:</strong> Which languages are most commonly practiced
            </li>
          </ul>
        </div>
      </div>
      
      <Link href="/admin" className="text-amber-800 underline">
        Back to Admin
      </Link>
    </div>
  );
} 