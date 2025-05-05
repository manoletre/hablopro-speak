import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Extend NextRequest with geo property
interface GeoRequest extends NextRequest {
  geo?: {
    country?: string;
    city?: string;
    region?: string;
  };
}

export function middleware(request: GeoRequest) {
  // In development, allow setting country via query parameter
  const url = new URL(request.url);
  const simulatedCountry = url.searchParams.get('country');
  
  // Get the country from:
  // 1. Query parameter (for testing)
  // 2. Geo headers (in production)
  // 3. Default to US if none found
  const country = simulatedCountry || request.geo?.country || 'US';
  
  // Create a response object from the request
  const response = NextResponse.next();
  
  // Set the country in a cookie
  response.cookies.set('country', country, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: false, // Allow access from client JavaScript
    sameSite: 'strict',
  });

  return response;
}

// Apply middleware to all routes
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 