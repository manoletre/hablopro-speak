'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCookie } from 'cookies-next';

interface LocationContextType {
  country: string;
}

const LocationContext = createContext<LocationContextType>({
  country: 'US',
});

export const useLocation = () => useContext(LocationContext);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState('US');

  useEffect(() => {
    // Read the country from the cookie set by middleware
    const countryFromCookie = getCookie('country');
    if (countryFromCookie && typeof countryFromCookie === 'string') {
      setCountry(countryFromCookie);
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{
        country,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
} 