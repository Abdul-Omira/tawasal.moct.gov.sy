import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Storage } from '../../server/database/storage';

describe('Storage', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = new Storage();
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('User Management', () => {
    it('should create a user', async () => {
      const userData = {
        username: 'testuser',
        password: 'testpassword',
        name: 'Test User',
        isAdmin: false
      };

      const user = await storage.createUser(userData);
      
      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.name).toBe('Test User');
      expect(user.isAdmin).toBe(false);
    });

    it('should get user by ID', async () => {
      const userData = {
        username: 'testuser',
        password: 'testpassword',
        name: 'Test User',
        isAdmin: false
      };

      const createdUser = await storage.createUser(userData);
      const retrievedUser = await storage.getUserById(createdUser.id);
      
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.username).toBe('testuser');
    });

    it('should update user', async () => {
      const userData = {
        username: 'testuser',
        password: 'testpassword',
        name: 'Test User',
        isAdmin: false
      };

      const createdUser = await storage.createUser(userData);
      const updatedUser = await storage.updateUser(createdUser.id, { name: 'Updated User' });
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('Updated User');
    });

    it('should delete user', async () => {
      const userData = {
        username: 'testuser',
        password: 'testpassword',
        name: 'Test User',
        isAdmin: false
      };

      const createdUser = await storage.createUser(userData);
      const deleted = await storage.deleteUser(createdUser.id);
      
      expect(deleted).toBe(true);
      
      const retrievedUser = await storage.getUserById(createdUser.id);
      expect(retrievedUser).toBeNull();
    });
  });

  describe('Form Management', () => {
    it('should create a form', async () => {
      const formData = {
        title: 'Test Form',
        description: 'A test form',
        components: [
          {
            id: '1',
            type: 'text',
            label: 'Name',
            required: true
          }
        ],
        settings: {
          theme: 'default',
          layout: 'single-column'
        },
        createdBy: '1'
      };

      const form = await storage.createForm(formData);
      
      expect(form).toBeDefined();
      expect(form.title).toBe('Test Form');
      expect(form.components).toHaveLength(1);
    });

    it('should get form by ID', async () => {
      const formData = {
        title: 'Test Form',
        description: 'A test form',
        components: [],
        settings: { theme: 'default' },
        createdBy: '1'
      };

      const createdForm = await storage.createForm(formData);
      const retrievedForm = await storage.getFormById(createdForm.id);
      
      expect(retrievedForm).toBeDefined();
      expect(retrievedForm?.title).toBe('Test Form');
    });

    it('should update form', async () => {
      const formData = {
        title: 'Test Form',
        description: 'A test form',
        components: [],
        settings: { theme: 'default' },
        createdBy: '1'
      };

      const createdForm = await storage.createForm(formData);
      const updatedForm = await storage.updateForm(createdForm.id, { title: 'Updated Form' });
      
      expect(updatedForm).toBeDefined();
      expect(updatedForm?.title).toBe('Updated Form');
    });

    it('should delete form', async () => {
      const formData = {
        title: 'Test Form',
        description: 'A test form',
        components: [],
        settings: { theme: 'default' },
        createdBy: '1'
      };

      const createdForm = await storage.createForm(formData);
      const deleted = await storage.deleteForm(createdForm.id);
      
      expect(deleted).toBe(true);
      
      const retrievedForm = await storage.getFormById(createdForm.id);
      expect(retrievedForm).toBeNull();
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const health = await storage.getHealth();
      
      expect(health).toBeDefined();
      expect(health.status).toBe('healthy');
      expect(health.timestamp).toBeDefined();
    });
  });
});
