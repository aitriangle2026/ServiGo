import { createContext, useContext, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

// The marketplace is country-scoped: a customer's job requests only ever
// reach providers working in the same country (see the backend's
// countryFilter util). This context is the single place the UI reads
// "which country am I operating in" from, so pages don't each re-derive it
// from the user object.
const DEFAULT_COUNTRY = 'Sri Lanka';

const CountryContext = createContext({
  selectedCountry: DEFAULT_COUNTRY,
  setSelectedCountry: () => {},
});

export function CountryProvider({ children }) {
  const { user } = useAuth();

  // Only the explicit override lives in state. The effective country is
  // derived below, so it picks up the user's saved location as soon as
  // AuthContext finishes hydrating — no effect mirroring props into state.
  const [override, setSelectedCountry] = useState(null);

  const selectedCountry =
    override || user?.preferredLocation?.country || DEFAULT_COUNTRY;

  const value = useMemo(
    () => ({ selectedCountry, setSelectedCountry }),
    [selectedCountry]
  );

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry() {
  return useContext(CountryContext);
}
