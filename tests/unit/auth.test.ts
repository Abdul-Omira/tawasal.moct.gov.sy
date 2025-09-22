import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuthService } from '../../server/services/authService';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword';
      const hashed = await authService.hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'testpassword';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'testpassword';
      const hashed = await authService.hashPassword(password);
      const isValid = await authService.verifyPassword(password, hashed);
      
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'testpassword';
      const wrongPassword = 'wrongpassword';
      const hashed = await authService.hashPassword(password);
      const isValid = await authService.verifyPassword(wrongPassword, hashed);
      
      expect(isValid).toBe(false);
    });
  });
});
