const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Appointment API Tests', () => {
  let authToken;
  let professionalId;
  let userId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rabta_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create test user and get token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: `professional${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'Professional',
        role: 'professional'
      });

    authToken = registerResponse.body.token;
    professionalId = registerResponse.body.user._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/appointments', () => {
    it('should create a new appointment', async () => {
      const appointmentData = {
        professionalId: professionalId,
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        reason: 'General consultation',
        notes: 'First visit'
      };

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('professionalId', professionalId);
    });

    it('should not create appointment without authentication', async () => {
      const appointmentData = {
        professionalId: professionalId,
        date: new Date(Date.now() + 86400000).toISOString(),
        reason: 'General consultation'
      };

      const response = await request(app)
        .post('/api/appointments')
        .send(appointmentData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/appointments', () => {
    it('should get user appointments', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});