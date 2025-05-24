'use client';

import { useEffect } from 'react';
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';

export default function CountryFlagPolyfill() {
  useEffect(() => {
    polyfillCountryFlagEmojis();
  }, []);

  return null;
} 