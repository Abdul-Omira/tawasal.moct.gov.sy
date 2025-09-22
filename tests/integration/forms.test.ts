import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../server/index';

describe('Forms API Integration', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login to get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    
    authToken = response.body.token;
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('POST /api/forms', () => {
    it('should create a new form', async () => {
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
        }
      };

      const response = await request(app)
        .post('/api/forms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(formData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Form');
    });

    it('should require authentication', async () => {
      const formData = {
        title: 'Test Form',
        description: 'A test form'
      };

      await request(app)
        .post('/api/forms')
        .send(formData)
        .expect(401);
    });
  });

  describe('GET /api/forms', () => {
    it('should return list of forms', async () => {
      const response = await request(app)
        .get('/api/forms')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
