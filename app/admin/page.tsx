'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function AdminIndex() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin by checking the specific admin UID
    if (user && user.uid === 'IlLapv9gGqY7gKlDozNtDztbdkz1') {
      setIsAdmin(true);
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
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-amber-100">
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          <p className="mb-4">View user activity, session statistics, and more.</p>
          <Link 
            href="/admin/analytics" 
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors inline-block"
          >
            View Analytics
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-amber-100">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <p className="mb-4">Manage users, roles, and permissions.</p>
          <Link 
            href="/admin/users" 
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors inline-block"
          >
            Manage Users
          </Link>
        </div>
      </div>
      
      <div className="mt-8">
        <Link href="/" className="text-amber-800 underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
} 