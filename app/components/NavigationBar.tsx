'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function NavigationBar() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  
  const navItems = [
    { 
      href: '/learn', 
      label: t('home.doSessionNow'),
      isActive: pathname === '/learn' || pathname === '/'
    },
  ];

  return (
    <nav className="w-full bg-amber-50 border-b border-amber-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-amber-900 text-xl font-bold">HabloPro</span>
              <span className="text-amber-600 ml-1">Speak</span>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.isActive
                    ? 'bg-amber-100 text-amber-900'
                    : 'text-amber-800 hover:bg-amber-100 hover:text-amber-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Auth Buttons */}
          <div className="flex items-center">
            {!user ? (
              <button
                onClick={signInWithGoogle}
                className="px-4 py-2 border border-amber-800 text-amber-800 rounded-lg hover:bg-amber-800 hover:text-white transition-colors text-sm font-medium"
              >
                {t('auth.signInWithGoogle')}
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                {/* User Profile/Avatar */}
                <div className="flex items-center">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center">
                      <span className="text-amber-900 font-medium">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <span className="ml-2 text-amber-900 text-sm font-medium hidden md:block">
                    {user.displayName || 'User'}
                  </span>
                </div>
                
                {/* Sign Out Button - Desktop Only */}
                <button
                  onClick={signOut}
                  className="hidden md:block px-3 py-1 text-sm text-amber-800 hover:text-amber-900"
                >
                  {t('home.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 