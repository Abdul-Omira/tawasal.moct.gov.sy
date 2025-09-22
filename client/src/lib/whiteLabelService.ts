import { storage } from '@/server/database/storage';

export interface WhiteLabelConfig {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  logo?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
  favicon?: {
    url: string;
    type: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    successColor: string;
    warningColor: string;
    errorColor: string;
    infoColor: string;
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    spacing: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    borderRadius: {
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
    shadows: {
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
  };
  customCSS?: string;
  customDomains: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'government' | 'corporate' | 'modern' | 'classic' | 'minimal';
  preview: string;
  config: Partial<WhiteLabelConfig['theme']>;
  isDefault: boolean;
}

export interface CustomDomain {
  id: string;
  tenantId: string;
  domain: string;
  sslEnabled: boolean;
  status: 'pending' | 'active' | 'failed' | 'expired';
  verificationToken: string;
  dnsRecords: Array<{
    type: string;
    name: string;
    value: string;
    ttl: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

class WhiteLabelService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  async getWhiteLabelConfig(tenantId?: string): Promise<WhiteLabelConfig | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/white-label/config${tenantId ? `?tenantId=${tenantId}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch white-label config');
      return await response.json();
    } catch (error) {
      console.error('Error fetching white-label config:', error);
      return null;
    }
  }

  async updateWhiteLabelConfig(config: Partial<WhiteLabelConfig>, tenantId?: string): Promise<WhiteLabelConfig | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/white-label/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, tenantId }),
      });
      if (!response.ok) throw new Error('Failed to update white-label config');
      return await response.json();
    } catch (error) {
      console.error('Error updating white-label config:', error);
      return null;
    }
  }

  async getThemeTemplates(): Promise<ThemeTemplate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/white-label/templates`);
      if (!response.ok) throw new Error('Failed to fetch theme templates');
      return await response.json();
    } catch (error) {
      console.error('Error fetching theme templates:', error);
      return [];
    }
  }

  async applyThemeTemplate(templateId: string, tenantId?: string): Promise<WhiteLabelConfig | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/white-label/templates/${templateId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });
      if (!response.ok) throw new Error('Failed to apply theme template');
      return await response.json();
    } catch (error) {
      console.error('Error applying theme template:', error);
      return null;
    }
  }

  async uploadLogo(file: File, tenantId?: string): Promise<{ url: string; alt: string } | null> {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      if (tenantId) formData.append('tenantId', tenantId);

      const response = await fetch(`${this.baseUrl}/api/white-label/upload/logo`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload logo');
      return await response.json();
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    }
  }

  async uploadFavicon(file: File, tenantId?: string): Promise<{ url: string; type: string } | null> {
    try {
      const formData = new FormData();
      formData.append('favicon', file);
      if (tenantId) formData.append('tenantId', tenantId);

      const response = await fetch(`${this.baseUrl}/api/white-label/upload/favicon`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload favicon');
      return await response.json();
    } catch (error) {
      console.error('Error uploading favicon:', error);
      return null;
    }
  }

  async getCustomDomains(tenantId?: string): Promise<CustomDomain[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/white-label/domains${tenantId ? `?tenantId=${tenantId}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch custom domains');
      return await response.json();
    } catch (error) {
      console.error('Error fetching custom domains:', error);
      return [];
    }
  }

  async addCustomDomain(domain: string, tenantId?: string): Promise<CustomDomain | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/white-label/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, tenantId }),
      });
      if (!response.ok) throw new Error('Failed to add custom domain');
      return await response.json();
    } catch (error) {
      console.error('Error adding custom domain:', error);
      return null;
    }
  }

  async verifyCustomDomain(domainId: string): Promise<{ verified: boolean; message: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/white-label/domains/${domainId}/verify`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to verify custom domain');
      return await response.json();
    } catch (error) {
      console.error('Error verifying custom domain:', error);
      return null;
    }
  }

  async deleteCustomDomain(domainId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/white-label/domains/${domainId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting custom domain:', error);
      return false;
    }
  }

  async getCustomCSS(tenantId?: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/white-label/css${tenantId ? `?tenantId=${tenantId}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch custom CSS');
      return await response.text();
    } catch (error) {
      console.error('Error fetching custom CSS:', error);
      return '';
    }
  }

  async updateCustomCSS(css: string, tenantId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/white-label/css`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: css,
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating custom CSS:', error);
      return false;
    }
  }

  async validateCustomCSS(css: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/white-label/css/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: css,
      });
      if (!response.ok) throw new Error('Failed to validate CSS');
      return await response.json();
    } catch (error) {
      console.error('Error validating CSS:', error);
      return { valid: false, errors: ['Validation failed'] };
    }
  }

  async getWhiteLabelStats(tenantId?: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/white-label/stats${tenantId ? `?tenantId=${tenantId}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch white-label stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching white-label stats:', error);
      return null;
    }
  }

  async exportWhiteLabelConfig(tenantId?: string): Promise<WhiteLabelConfig | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/white-label/export${tenantId ? `?tenantId=${tenantId}` : ''}`);
      if (!response.ok) throw new Error('Failed to export white-label config');
      return await response.json();
    } catch (error) {
      console.error('Error exporting white-label config:', error);
      return null;
    }
  }

  async importWhiteLabelConfig(config: WhiteLabelConfig, tenantId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/white-label/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, tenantId }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error importing white-label config:', error);
      return false;
    }
  }

  generateCSSVariables(config: WhiteLabelConfig): string {
    const { theme } = config;
    return `
      :root {
        --primary-color: ${theme.primaryColor};
        --secondary-color: ${theme.secondaryColor};
        --accent-color: ${theme.accentColor};
        --background-color: ${theme.backgroundColor};
        --text-color: ${theme.textColor};
        --border-color: ${theme.borderColor};
        --success-color: ${theme.successColor};
        --warning-color: ${theme.warningColor};
        --error-color: ${theme.errorColor};
        --info-color: ${theme.infoColor};
        --font-family: ${theme.fontFamily};
        --font-size-xs: ${theme.fontSize.xs};
        --font-size-sm: ${theme.fontSize.sm};
        --font-size-base: ${theme.fontSize.base};
        --font-size-lg: ${theme.fontSize.lg};
        --font-size-xl: ${theme.fontSize.xl};
        --font-size-2xl: ${theme.fontSize['2xl']};
        --font-size-3xl: ${theme.fontSize['3xl']};
        --spacing-xs: ${theme.spacing.xs};
        --spacing-sm: ${theme.spacing.sm};
        --spacing-base: ${theme.spacing.base};
        --spacing-lg: ${theme.spacing.lg};
        --spacing-xl: ${theme.spacing.xl};
        --spacing-2xl: ${theme.spacing['2xl']};
        --spacing-3xl: ${theme.spacing['3xl']};
        --border-radius-sm: ${theme.borderRadius.sm};
        --border-radius-base: ${theme.borderRadius.base};
        --border-radius-lg: ${theme.borderRadius.lg};
        --border-radius-xl: ${theme.borderRadius.xl};
        --shadow-sm: ${theme.shadows.sm};
        --shadow-base: ${theme.shadows.base};
        --shadow-lg: ${theme.shadows.lg};
        --shadow-xl: ${theme.shadows.xl};
      }
    `;
  }

  applyTheme(config: WhiteLabelConfig): void {
    // Apply CSS variables
    const cssVariables = this.generateCSSVariables(config);
    const styleElement = document.getElementById('white-label-theme') || document.createElement('style');
    styleElement.id = 'white-label-theme';
    styleElement.textContent = cssVariables;
    document.head.appendChild(styleElement);

    // Apply custom CSS
    if (config.customCSS) {
      const customStyleElement = document.getElementById('white-label-custom') || document.createElement('style');
      customStyleElement.id = 'white-label-custom';
      customStyleElement.textContent = config.customCSS;
      document.head.appendChild(customStyleElement);
    }

    // Update favicon
    if (config.favicon) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = config.favicon.url;
        favicon.type = config.favicon.type;
      } else {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = config.favicon.url;
        newFavicon.type = config.favicon.type;
        document.head.appendChild(newFavicon);
      }
    }

    // Update logo
    if (config.logo) {
      const logoElements = document.querySelectorAll('[data-logo]');
      logoElements.forEach(element => {
        if (element instanceof HTMLImageElement) {
          element.src = config.logo!.url;
          element.alt = config.logo!.alt;
          if (config.logo!.width) element.width = config.logo!.width;
          if (config.logo!.height) element.height = config.logo!.height;
        }
      });
    }
  }

  async initializeTheme(tenantId?: string): Promise<void> {
    const config = await this.getWhiteLabelConfig(tenantId);
    if (config) {
      this.applyTheme(config);
    }
  }
}

export const whiteLabelService = new WhiteLabelService();
export default whiteLabelService;
