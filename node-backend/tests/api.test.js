const request = require('supertest');
const app = require('../src/app');
const { generateToken } = require('../src/utils/jwtHelper');

describe('API Tests', () => {
  let authToken;
  
  beforeAll(() => {
    authToken = generateToken('test-user', 'user');
  });
  
  describe('POST /api/tasks', () => {
    it('should create a task with valid data', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskType: 'full_aggregation',
          parameters: { limit: 10 },
          priority: 'high'
        });
      
      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('taskId');
      expect(response.body.status).toBe('pending');
      expect(response.body.message).toBe('Task accepted for processing');
    });
    
    it('should reject invalid task type', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskType: 'invalid_type',
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
    
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          taskType: 'full_aggregation',
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied');
    });
    
    it('should reject invalid JWT token', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          taskType: 'full_aggregation',
        });
      
      expect(response.status).toBe(403);
    });
    
    it('should handle posts_only task type', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskType: 'posts_only',
        });
      
      expect(response.status).toBe(202);
      expect(response.body.taskId).toBeDefined();
    });
    
    it('should handle users_with_posts task type', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          taskType: 'users_with_posts',
          parameters: { userId: 1 }
        });
      
      expect(response.status).toBe(202);
    });
  });
  
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });
  });
  
  describe('GET /api-docs', () => {
    it('should return Swagger UI', async () => {
      const response = await request(app)
        .get('/api-docs');
      
      expect(response.status).toBe(301); // Redirect
    });
  });
});

afterAll(async () => {
  // Add cleanup if needed
  await new Promise(resolve => setTimeout(resolve, 500));
});