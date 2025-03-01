/**
 * Form Builder Platform - RTL Context
 * Provides RTL (Right-to-Left) support for Arabic language
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RTLContextType {
  isRTL: boolean;
  toggleRTL: () => void;
  direction: 'ltr' | 'rtl';
}

const RTLContext = createContext<RTLContextType | undefined>(undefined);

interface RTLProviderProps {
  children: ReactNode;
}

export const RTLProvider: React.FC<RTLProviderProps> = ({ children }) => {
  const [isRTL, setIsRTL] = useState(true); // Default to RTL for Arabic

  const toggleRTL = () => {
    setIsRTL(!isRTL);
  };

  const direction = isRTL ? 'rtl' : 'ltr';

  return (
    <RTLContext.Provider value={{ isRTL, toggleRTL, direction }}>
      {children}
    </RTLContext.Provider>
  );
};

export const useRTL = (): RTLContextType => {
  const context = useContext(RTLContext);
  if (context === undefined) {
    throw new Error('useRTL must be used within an RTLProvider');
  }
  return context;
};

export default RTLProvider;