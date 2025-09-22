/**
 * Form Versioning Service
 * Handles form versioning system for form updates and rollbacks
 */

import { Form } from '../types/form';
import { BaseComponent } from '../types/component';

export interface FormVersion {
  id: string;
  formId: string;
  version: string; // e.g., "1.0.0", "1.1.0", "2.0.0"
  form: Form;
  components: BaseComponent[];
  changes: VersionChange[];
  createdBy: string;
  createdAt: Date;
  isPublished: boolean;
  publishedAt?: Date;
  description?: string;
}

export interface VersionChange {
  id: string;
  type: 'form' | 'component' | 'component_add' | 'component_remove' | 'component_update';
  field?: string;
  oldValue?: any;
  newValue?: any;
  componentId?: string;
  componentType?: string;
  description: string;
}

export interface VersionComparison {
  version1: FormVersion;
  version2: FormVersion;
  changes: VersionChange[];
  summary: {
    added: number;
    removed: number;
    modified: number;
  };
}

export class FormVersioningService {
  private static instance: FormVersioningService;
  private versions: Map<string, FormVersion[]> = new Map(); // formId -> versions
  private currentVersions: Map<string, string> = new Map(); // formId -> current version

  private constructor() {}

  static getInstance(): FormVersioningService {
    if (!FormVersioningService.instance) {
      FormVersioningService.instance = new FormVersioningService();
    }
    return FormVersioningService.instance;
  }

  // Create new version
  createVersion(
    formId: string,
    form: Form,
    components: BaseComponent[],
    createdBy: string,
    description?: string,
    versionType: 'major' | 'minor' | 'patch' = 'minor'
  ): FormVersion {
    const existingVersions = this.versions.get(formId) || [];
    const lastVersion = existingVersions[existingVersions.length - 1];
    
    let newVersion: string;
    if (!lastVersion) {
      newVersion = '1.0.0';
    } else {
      const [major, minor, patch] = lastVersion.version.split('.').map(Number);
      
      switch (versionType) {
        case 'major':
          newVersion = `${major + 1}.0.0`;
          break;
        case 'minor':
          newVersion = `${major}.${minor + 1}.0`;
          break;
        case 'patch':
          newVersion = `${major}.${minor}.${patch + 1}`;
          break;
        default:
          newVersion = `${major}.${minor + 1}.0`;
      }
    }

    const changes = lastVersion ? this.calculateChanges(lastVersion, form, components) : [];

    const version: FormVersion = {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      formId,
      version: newVersion,
      form: { ...form },
      components: components.map(comp => ({ ...comp })),
      changes,
      createdBy,
      createdAt: new Date(),
      isPublished: false,
      description,
    };

    existingVersions.push(version);
    this.versions.set(formId, existingVersions);
    this.currentVersions.set(formId, newVersion);

    return version;
  }

  // Get all versions for a form
  getFormVersions(formId: string): FormVersion[] {
    return this.versions.get(formId) || [];
  }

  // Get specific version
  getVersion(formId: string, version: string): FormVersion | null {
    const versions = this.versions.get(formId) || [];
    return versions.find(v => v.version === version) || null;
  }

  // Get current version
  getCurrentVersion(formId: string): FormVersion | null {
    const currentVersion = this.currentVersions.get(formId);
    if (!currentVersion) return null;
    return this.getVersion(formId, currentVersion);
  }

  // Set current version
  setCurrentVersion(formId: string, version: string): boolean {
    const versionObj = this.getVersion(formId, version);
    if (!versionObj) return false;

    this.currentVersions.set(formId, version);
    return true;
  }

  // Publish version
  publishVersion(formId: string, version: string): boolean {
    const versionObj = this.getVersion(formId, version);
    if (!versionObj) return false;

    // Unpublish all other versions
    const versions = this.versions.get(formId) || [];
    versions.forEach(v => {
      if (v.version !== version) {
        v.isPublished = false;
        v.publishedAt = undefined;
      }
    });

    // Publish this version
    versionObj.isPublished = true;
    versionObj.publishedAt = new Date();
    this.currentVersions.set(formId, version);

    this.versions.set(formId, versions);
    return true;
  }

  // Unpublish version
  unpublishVersion(formId: string, version: string): boolean {
    const versionObj = this.getVersion(formId, version);
    if (!versionObj) return false;

    versionObj.isPublished = false;
    versionObj.publishedAt = undefined;

    // If this was the current version, set to the latest version
    if (this.currentVersions.get(formId) === version) {
      const versions = this.versions.get(formId) || [];
      const latestVersion = versions[versions.length - 1];
      if (latestVersion) {
        this.currentVersions.set(formId, latestVersion.version);
      }
    }

    return true;
  }

  // Delete version
  deleteVersion(formId: string, version: string): boolean {
    const versions = this.versions.get(formId) || [];
    const versionIndex = versions.findIndex(v => v.version === version);
    
    if (versionIndex === -1) return false;

    // Cannot delete if it's the only version
    if (versions.length === 1) return false;

    // Cannot delete if it's the current version
    if (this.currentVersions.get(formId) === version) return false;

    versions.splice(versionIndex, 1);
    this.versions.set(formId, versions);
    return true;
  }

  // Compare two versions
  compareVersions(formId: string, version1: string, version2: string): VersionComparison | null {
    const v1 = this.getVersion(formId, version1);
    const v2 = this.getVersion(formId, version2);
    
    if (!v1 || !v2) return null;

    const changes = this.calculateChanges(v1, v2.form, v2.components);
    
    const summary = {
      added: changes.filter(c => c.type === 'component_add').length,
      removed: changes.filter(c => c.type === 'component_remove').length,
      modified: changes.filter(c => c.type === 'component_update' || c.type === 'form').length,
    };

    return {
      version1: v1,
      version2: v2,
      changes,
      summary,
    };
  }

  // Calculate changes between versions
  private calculateChanges(
    oldVersion: FormVersion,
    newForm: Form,
    newComponents: BaseComponent[]
  ): VersionChange[] {
    const changes: VersionChange[] = [];

    // Compare form properties
    const formFields = ['title', 'description', 'settings', 'status'] as const;
    formFields.forEach(field => {
      if (oldVersion.form[field] !== newForm[field]) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'form',
          field,
          oldValue: oldVersion.form[field],
          newValue: newForm[field],
          description: `تم تغيير ${field} من "${oldVersion.form[field]}" إلى "${newForm[field]}"`,
        });
      }
    });

    // Compare components
    const oldComponents = oldVersion.components;
    const oldComponentMap = new Map(oldComponents.map(comp => [comp.id, comp]));
    const newComponentMap = new Map(newComponents.map(comp => [comp.id, comp]));

    // Find added components
    newComponents.forEach(comp => {
      if (!oldComponentMap.has(comp.id)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'component_add',
          componentId: comp.id,
          componentType: comp.type,
          newValue: comp,
          description: `تم إضافة مكون جديد: ${comp.config.label || comp.type}`,
        });
      }
    });

    // Find removed components
    oldComponents.forEach(comp => {
      if (!newComponentMap.has(comp.id)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'component_remove',
          componentId: comp.id,
          componentType: comp.type,
          oldValue: comp,
          description: `تم حذف المكون: ${comp.config.label || comp.type}`,
        });
      }
    });

    // Find modified components
    newComponents.forEach(newComp => {
      const oldComp = oldComponentMap.get(newComp.id);
      if (oldComp) {
        const componentChanges = this.compareComponents(oldComp, newComp);
        changes.push(...componentChanges);
      }
    });

    return changes;
  }

  // Compare two components
  private compareComponents(oldComp: BaseComponent, newComp: BaseComponent): VersionChange[] {
    const changes: VersionChange[] = [];

    // Compare component properties
    const componentFields = ['type', 'config', 'validation', 'conditionalLogic', 'isRequired', 'isVisible'] as const;
    componentFields.forEach(field => {
      if (JSON.stringify(oldComp[field]) !== JSON.stringify(newComp[field])) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'component_update',
          componentId: newComp.id,
          componentType: newComp.type,
          field,
          oldValue: oldComp[field],
          newValue: newComp[field],
          description: `تم تحديث ${field} في المكون ${newComp.config.label || newComp.type}`,
        });
      }
    });

    return changes;
  }

  // Get version history
  getVersionHistory(formId: string): FormVersion[] {
    const versions = this.versions.get(formId) || [];
    return versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get published versions
  getPublishedVersions(formId: string): FormVersion[] {
    const versions = this.versions.get(formId) || [];
    return versions.filter(v => v.isPublished);
  }

  // Get version statistics
  getVersionStatistics(formId: string): {
    totalVersions: number;
    publishedVersions: number;
    currentVersion: string | null;
    lastModified: Date | null;
  } {
    const versions = this.versions.get(formId) || [];
    const publishedVersions = versions.filter(v => v.isPublished);
    const currentVersion = this.currentVersions.get(formId) || null;
    const lastModified = versions.length > 0 ? versions[versions.length - 1].createdAt : null;

    return {
      totalVersions: versions.length,
      publishedVersions: publishedVersions.length,
      currentVersion,
      lastModified,
    };
  }

  // Export version data
  exportVersionData(formId: string, version?: string): any {
    const versions = version ? [this.getVersion(formId, version)] : this.versions.get(formId) || [];
    const filteredVersions = versions.filter(Boolean);

    return {
      formId,
      versions: filteredVersions,
      exportedAt: new Date(),
    };
  }

  // Import version data
  importVersionData(data: any): boolean {
    try {
      if (data.formId && data.versions) {
        this.versions.set(data.formId, data.versions);
        
        // Set current version to the latest
        if (data.versions.length > 0) {
          const latestVersion = data.versions[data.versions.length - 1];
          this.currentVersions.set(data.formId, latestVersion.version);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing version data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const formVersioningService = FormVersioningService.getInstance();

// React hook for form versioning
export const useFormVersioning = () => {
  const service = formVersioningService;

  const createVersion = (
    formId: string,
    form: Form,
    components: BaseComponent[],
    createdBy: string,
    description?: string,
    versionType: 'major' | 'minor' | 'patch' = 'minor'
  ) => {
    return service.createVersion(formId, form, components, createdBy, description, versionType);
  };

  const getFormVersions = (formId: string) => {
    return service.getFormVersions(formId);
  };

  const getVersion = (formId: string, version: string) => {
    return service.getVersion(formId, version);
  };

  const getCurrentVersion = (formId: string) => {
    return service.getCurrentVersion(formId);
  };

  const setCurrentVersion = (formId: string, version: string) => {
    return service.setCurrentVersion(formId, version);
  };

  const publishVersion = (formId: string, version: string) => {
    return service.publishVersion(formId, version);
  };

  const unpublishVersion = (formId: string, version: string) => {
    return service.unpublishVersion(formId, version);
  };

  const deleteVersion = (formId: string, version: string) => {
    return service.deleteVersion(formId, version);
  };

  const compareVersions = (formId: string, version1: string, version2: string) => {
    return service.compareVersions(formId, version1, version2);
  };

  const getVersionHistory = (formId: string) => {
    return service.getVersionHistory(formId);
  };

  const getVersionStatistics = (formId: string) => {
    return service.getVersionStatistics(formId);
  };

  return {
    createVersion,
    getFormVersions,
    getVersion,
    getCurrentVersion,
    setCurrentVersion,
    publishVersion,
    unpublishVersion,
    deleteVersion,
    compareVersions,
    getVersionHistory,
    getVersionStatistics,
  };
};

export default formVersioningService;
