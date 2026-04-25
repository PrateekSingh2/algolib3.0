import React, { createContext, useContext, useState } from 'react';

type CookieContextType = {
  openCookieConsent: () => void;
  isCookieConsentOpen: boolean;
  setIsCookieConsentOpen: (open: boolean) => void;
  showCustomize: boolean;
  setShowCustomize: (show: boolean) => void;
};

const CookieContext = createContext<CookieContextType | null>(null);

export const CookieProvider = ({ children }: { children: React.ReactNode }) => {
  const [isCookieConsentOpen, setIsCookieConsentOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  const openCookieConsent = () => {
    setIsCookieConsentOpen(true);
    setShowCustomize(true);
  };

  return (
    <CookieContext.Provider value={{ openCookieConsent, isCookieConsentOpen, setIsCookieConsentOpen, showCustomize, setShowCustomize }}>
      {children}
    </CookieContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieContext);
  if (!context) throw new Error("useCookieConsent must be used within CookieProvider");
  return context;
};
