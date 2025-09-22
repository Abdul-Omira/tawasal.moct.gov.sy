/**
 * Tenant Context Provider
 * Provides tenant information and configuration throughout the app
 * 
 * @author Syrian Ministry of Communications
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TenantBranding {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}

interface TenantSettings {
  allowPublicForms?: boolean;
  requireApproval?: boolean;
  maxFormsPerUser?: number;
  allowedFileTypes?: string[];
  maxFileSize?: number;
}

interface Tenant {
  id: string;
  name: string;
  domain?: string;
  branding?: TenantBranding;
  settings?: TenantSettings;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  setTenant: (tenant: Tenant | null) => void;
  refreshTenant: () => Promise<void>;
  isMultiTenant: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detect tenant from URL or headers
  const detectTenant = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we're in a subdomain
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      
      // Check if it's a subdomain (not www or main domain)
      if (subdomain && subdomain !== 'www' && subdomain !== 'tawasal' && subdomain !== 'moct') {
        // Try to fetch tenant by subdomain
        const response = await fetch(`/api/ministries?domain=${hostname}`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
          setTenant(result.data[0]);
          return;
        }
      }

      // Check for tenant in localStorage (for development/testing)
      const storedTenant = localStorage.getItem('currentTenant');
      if (storedTenant) {
        try {
          const parsedTenant = JSON.parse(storedTenant);
          setTenant(parsedTenant);
          return;
        } catch (e) {
          localStorage.removeItem('currentTenant');
        }
      }

      // No tenant detected - this is the main platform
      setTenant(null);
    } catch (error) {
      console.error('Error detecting tenant:', error);
      setError('فشل في تحديد الوزارة');
    } finally {
      setLoading(false);
    }
  };

  // Refresh tenant information
  const refreshTenant = async () => {
    await detectTenant();
  };

  // Set tenant and persist to localStorage
  const handleSetTenant = (newTenant: Tenant | null) => {
    setTenant(newTenant);
    if (newTenant) {
      localStorage.setItem('currentTenant', JSON.stringify(newTenant));
    } else {
      localStorage.removeItem('currentTenant');
    }
  };

  // Detect tenant on mount
  useEffect(() => {
    detectTenant();
  }, []);

  // Apply tenant branding to document
  useEffect(() => {
    if (tenant?.branding) {
      const { primaryColor, secondaryColor, fontFamily } = tenant.branding;
      
      // Apply CSS custom properties
      const root = document.documentElement;
      if (primaryColor) {
        root.style.setProperty('--tenant-primary', primaryColor);
      }
      if (secondaryColor) {
        root.style.setProperty('--tenant-secondary', secondaryColor);
      }
      if (fontFamily) {
        root.style.setProperty('--tenant-font', fontFamily);
      }
    } else {
      // Reset to default values
      const root = document.documentElement;
      root.style.removeProperty('--tenant-primary');
      root.style.removeProperty('--tenant-secondary');
      root.style.removeProperty('--tenant-font');
    }
  }, [tenant]);

  const value: TenantContextType = {
    tenant,
    loading,
    error,
    setTenant: handleSetTenant,
    refreshTenant,
    isMultiTenant: tenant !== null,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

// Hook to use tenant context
export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// Hook to get tenant-specific configuration
export const useTenantConfig = () => {
  const { tenant } = useTenant();
  
  return {
    branding: tenant?.branding || {},
    settings: tenant?.settings || {},
    isMultiTenant: tenant !== null,
    tenantId: tenant?.id,
    tenantName: tenant?.name,
  };
};

// Hook to check if feature is enabled for current tenant
export const useTenantFeature = (feature: keyof TenantSettings): boolean => {
  const { settings } = useTenantConfig();
  return settings[feature] ?? true; // Default to true if not specified
};

// Hook to get tenant-specific styling
export const useTenantStyles = () => {
  const { branding } = useTenantConfig();
  
  return {
    primaryColor: branding.primaryColor || '#3b82f6',
    secondaryColor: branding.secondaryColor || '#64748b',
    fontFamily: branding.fontFamily || 'Inter, sans-serif',
    logo: branding.logo,
  };
};
