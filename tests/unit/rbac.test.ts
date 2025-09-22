import { describe, it, expect, beforeEach } from '@jest/globals';
import { hasPermission, getUserPermissions, canAccessResource } from '../../server/middleware/rbac';
import { PERMISSIONS } from '../../server/middleware/rbac';

describe('RBAC Middleware', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    name: 'Test User',
    isAdmin: false,
    role: 'ministry_admin',
    ministryId: '1',
    permissions: [PERMISSIONS.CREATE_FORMS, PERMISSIONS.VIEW_FORMS]
  };

  describe('hasPermission', () => {
    it('should return true for user with required permission', () => {
      const result = hasPermission(mockUser, PERMISSIONS.CREATE_FORMS);
      expect(result).toBe(true);
    });

    it('should return false for user without required permission', () => {
      const result = hasPermission(mockUser, PERMISSIONS.DELETE_USERS);
      expect(result).toBe(false);
    });

    it('should return true for admin user with any permission', () => {
      const adminUser = { ...mockUser, isAdmin: true };
      const result = hasPermission(adminUser, PERMISSIONS.DELETE_USERS);
      expect(result).toBe(true);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', () => {
      const permissions = getUserPermissions(mockUser);
      expect(permissions).toContain(PERMISSIONS.CREATE_FORMS);
      expect(permissions).toContain(PERMISSIONS.VIEW_FORMS);
    });

    it('should return all permissions for admin user', () => {
      const adminUser = { ...mockUser, isAdmin: true };
      const permissions = getUserPermissions(adminUser);
      expect(permissions).toContain(PERMISSIONS.DELETE_USERS);
      expect(permissions).toContain(PERMISSIONS.MANAGE_USERS);
    });
  });

  describe('canAccessResource', () => {
    it('should allow access to own ministry resources', () => {
      const resource = { ministryId: '1' };
      const result = canAccessResource(mockUser, resource);
      expect(result).toBe(true);
    });

    it('should deny access to other ministry resources', () => {
      const resource = { ministryId: '2' };
      const result = canAccessResource(mockUser, resource);
      expect(result).toBe(false);
    });

    it('should allow admin access to any resource', () => {
      const adminUser = { ...mockUser, isAdmin: true };
      const resource = { ministryId: '2' };
      const result = canAccessResource(adminUser, resource);
      expect(result).toBe(true);
    });
  });
});
