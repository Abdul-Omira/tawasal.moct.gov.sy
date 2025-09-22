/**
 * Tenant Management Service
 * Handles multi-tenant architecture for form isolation and management
 */

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  settings: TenantSettings;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TenantSettings {
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  features: {
    formBuilder: boolean;
    analytics: boolean;
    customDomains: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
  };
  limits: {
    maxForms: number;
    maxSubmissions: number;
    maxStorage: number; // in MB
    maxUsers: number;
  };
  security: {
    requireAuth: boolean;
    allowedDomains: string[];
    ipWhitelist: string[];
    sessionTimeout: number; // in minutes
  };
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantForm {
  id: string;
  tenantId: string;
  formId: string;
  isPublic: boolean;
  accessLevel: 'public' | 'authenticated' | 'restricted';
  allowedUsers: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class TenantService {
  private static instance: TenantService;
  private currentTenant: Tenant | null = null;
  private tenants: Map<string, Tenant> = new Map();
  private tenantUsers: Map<string, TenantUser[]> = new Map();
  private tenantForms: Map<string, TenantForm[]> = new Map();

  private constructor() {
    this.initializeDefaultTenant();
  }

  static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  // Initialize default tenant
  private initializeDefaultTenant() {
    const defaultTenant: Tenant = {
      id: 'default-tenant',
      name: 'الوزارة الافتراضية',
      domain: 'tawasal.moct.gov.sy',
      settings: {
        branding: {
          primaryColor: '#3B82F6',
          secondaryColor: '#6B7280',
          fontFamily: 'Inter',
        },
        features: {
          formBuilder: true,
          analytics: true,
          customDomains: true,
          apiAccess: true,
          whiteLabel: false,
        },
        limits: {
          maxForms: 100,
          maxSubmissions: 10000,
          maxStorage: 1000,
          maxUsers: 50,
        },
        security: {
          requireAuth: true,
          allowedDomains: ['tawasal.moct.gov.sy'],
          ipWhitelist: [],
          sessionTimeout: 480, // 8 hours
        },
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    };

    this.tenants.set(defaultTenant.id, defaultTenant);
    this.currentTenant = defaultTenant;
  }

  // Get current tenant
  getCurrentTenant(): Tenant | null {
    return this.currentTenant;
  }

  // Set current tenant
  setCurrentTenant(tenantId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (tenant) {
      this.currentTenant = tenant;
      return true;
    }
    return false;
  }

  // Create new tenant
  createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Tenant {
    const tenant: Tenant = {
      ...tenantData,
      id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tenants.set(tenant.id, tenant);
    return tenant;
  }

  // Update tenant
  updateTenant(tenantId: string, updates: Partial<Tenant>): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    const updatedTenant = {
      ...tenant,
      ...updates,
      updatedAt: new Date(),
    };

    this.tenants.set(tenantId, updatedTenant);
    
    // Update current tenant if it's the same
    if (this.currentTenant?.id === tenantId) {
      this.currentTenant = updatedTenant;
    }

    return true;
  }

  // Delete tenant
  deleteTenant(tenantId: string): boolean {
    if (tenantId === 'default-tenant') {
      return false; // Cannot delete default tenant
    }

    const deleted = this.tenants.delete(tenantId);
    if (deleted) {
      // Clean up related data
      this.tenantUsers.delete(tenantId);
      this.tenantForms.delete(tenantId);
      
      // If current tenant was deleted, switch to default
      if (this.currentTenant?.id === tenantId) {
        this.currentTenant = this.tenants.get('default-tenant') || null;
      }
    }

    return deleted;
  }

  // Get all tenants
  getAllTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  // Get tenant by ID
  getTenantById(tenantId: string): Tenant | null {
    return this.tenants.get(tenantId) || null;
  }

  // Add user to tenant
  addUserToTenant(tenantId: string, userId: string, role: TenantUser['role'], permissions: string[] = []): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    const tenantUser: TenantUser = {
      id: `tenant_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      userId,
      role,
      permissions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const users = this.tenantUsers.get(tenantId) || [];
    users.push(tenantUser);
    this.tenantUsers.set(tenantId, users);

    return true;
  }

  // Remove user from tenant
  removeUserFromTenant(tenantId: string, userId: string): boolean {
    const users = this.tenantUsers.get(tenantId) || [];
    const filteredUsers = users.filter(user => user.userId !== userId);
    
    if (filteredUsers.length !== users.length) {
      this.tenantUsers.set(tenantId, filteredUsers);
      return true;
    }

    return false;
  }

  // Get tenant users
  getTenantUsers(tenantId: string): TenantUser[] {
    return this.tenantUsers.get(tenantId) || [];
  }

  // Check if user has access to tenant
  hasTenantAccess(tenantId: string, userId: string): boolean {
    const users = this.tenantUsers.get(tenantId) || [];
    return users.some(user => user.userId === userId);
  }

  // Get user role in tenant
  getUserRoleInTenant(tenantId: string, userId: string): TenantUser['role'] | null {
    const users = this.tenantUsers.get(tenantId) || [];
    const user = users.find(user => user.userId === userId);
    return user?.role || null;
  }

  // Add form to tenant
  addFormToTenant(tenantId: string, formId: string, accessLevel: TenantForm['accessLevel'], allowedUsers: string[] = []): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    const tenantForm: TenantForm = {
      id: `tenant_form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      formId,
      isPublic: accessLevel === 'public',
      accessLevel,
      allowedUsers,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const forms = this.tenantForms.get(tenantId) || [];
    forms.push(tenantForm);
    this.tenantForms.set(tenantId, forms);

    return true;
  }

  // Remove form from tenant
  removeFormFromTenant(tenantId: string, formId: string): boolean {
    const forms = this.tenantForms.get(tenantId) || [];
    const filteredForms = forms.filter(form => form.formId !== formId);
    
    if (filteredForms.length !== forms.length) {
      this.tenantForms.set(tenantId, filteredForms);
      return true;
    }

    return false;
  }

  // Get tenant forms
  getTenantForms(tenantId: string): TenantForm[] {
    return this.tenantForms.get(tenantId) || [];
  }

  // Check if form is accessible to user in tenant
  isFormAccessible(tenantId: string, formId: string, userId: string): boolean {
    const forms = this.tenantForms.get(tenantId) || [];
    const form = forms.find(f => f.formId === formId);
    
    if (!form) return false;

    // Public forms are accessible to everyone
    if (form.accessLevel === 'public') return true;

    // Authenticated forms require user to be logged in
    if (form.accessLevel === 'authenticated') return !!userId;

    // Restricted forms require user to be in allowed users list
    if (form.accessLevel === 'restricted') {
      return form.allowedUsers.includes(userId);
    }

    return false;
  }

  // Get tenant usage statistics
  getTenantUsage(tenantId: string): {
    formsCount: number;
    usersCount: number;
    storageUsed: number; // in MB
    submissionsCount: number;
  } {
    const forms = this.tenantForms.get(tenantId) || [];
    const users = this.tenantUsers.get(tenantId) || [];
    
    return {
      formsCount: forms.length,
      usersCount: users.length,
      storageUsed: 0, // This would be calculated from actual storage usage
      submissionsCount: 0, // This would be calculated from actual submissions
    };
  }

  // Check tenant limits
  checkTenantLimits(tenantId: string): {
    withinLimits: boolean;
    warnings: string[];
  } {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return { withinLimits: false, warnings: ['Tenant not found'] };
    }

    const usage = this.getTenantUsage(tenantId);
    const warnings: string[] = [];

    if (usage.formsCount >= tenant.settings.limits.maxForms) {
      warnings.push('Maximum forms limit reached');
    }

    if (usage.usersCount >= tenant.settings.limits.maxUsers) {
      warnings.push('Maximum users limit reached');
    }

    if (usage.storageUsed >= tenant.settings.limits.maxStorage) {
      warnings.push('Maximum storage limit reached');
    }

    if (usage.submissionsCount >= tenant.settings.limits.maxSubmissions) {
      warnings.push('Maximum submissions limit reached');
    }

    return {
      withinLimits: warnings.length === 0,
      warnings,
    };
  }

  // Export tenant data
  exportTenantData(tenantId: string): any {
    const tenant = this.tenants.get(tenantId);
    const users = this.tenantUsers.get(tenantId) || [];
    const forms = this.tenantForms.get(tenantId) || [];

    return {
      tenant,
      users,
      forms,
      exportedAt: new Date(),
    };
  }

  // Import tenant data
  importTenantData(data: any): boolean {
    try {
      if (data.tenant) {
        this.tenants.set(data.tenant.id, data.tenant);
      }

      if (data.users) {
        this.tenantUsers.set(data.tenant.id, data.users);
      }

      if (data.forms) {
        this.tenantForms.set(data.tenant.id, data.forms);
      }

      return true;
    } catch (error) {
      console.error('Error importing tenant data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const tenantService = TenantService.getInstance();

// React hook for tenant management
export const useTenant = () => {
  const service = tenantService;

  const getCurrentTenant = () => {
    return service.getCurrentTenant();
  };

  const setCurrentTenant = (tenantId: string) => {
    return service.setCurrentTenant(tenantId);
  };

  const createTenant = (tenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) => {
    return service.createTenant(tenantData);
  };

  const updateTenant = (tenantId: string, updates: Partial<Tenant>) => {
    return service.updateTenant(tenantId, updates);
  };

  const deleteTenant = (tenantId: string) => {
    return service.deleteTenant(tenantId);
  };

  const getAllTenants = () => {
    return service.getAllTenants();
  };

  const getTenantUsage = (tenantId: string) => {
    return service.getTenantUsage(tenantId);
  };

  const checkTenantLimits = (tenantId: string) => {
    return service.checkTenantLimits(tenantId);
  };

  return {
    getCurrentTenant,
    setCurrentTenant,
    createTenant,
    updateTenant,
    deleteTenant,
    getAllTenants,
    getTenantUsage,
    checkTenantLimits,
  };
};

export default tenantService;
