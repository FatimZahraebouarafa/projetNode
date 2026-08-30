process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Professional = require('../models/Professional');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 60000);

afterEach(async () => {
  await User.deleteMany({});
  await Professional.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('devrait créer un nouvel utilisateur et retourner un token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Amine',
          lastName: 'Test',
          email: 'amine@test.com',
          phone: '+212600000000',
          password: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('amine@test.com');
      expect(res.body.role).toBe('USER');
    });

    it('devrait refuser un email déjà utilisé', async () => {
      await request(app).post('/api/auth/register').send({
        firstName: 'Amine',
        lastName: 'Test',
        email: 'amine@test.com',
        phone: '+212600000000',
        password: 'password123'
      });

      const res = await request(app).post('/api/auth/register').send({
        firstName: 'Autre',
        lastName: 'Personne',
        email: 'amine@test.com',
        phone: '+212600000001',
        password: 'autremdp'
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        firstName: 'Amine',
        lastName: 'Test',
        email: 'amine@test.com',
        phone: '+212600000000',
        password: 'password123'
      });
    });

    it('devrait connecter un utilisateur avec les bons identifiants', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'amine@test.com', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('devrait refuser un mauvais mot de passe', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'amine@test.com', password: 'mauvaismdp' });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('devrait refuser un email inconnu', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inconnu@test.com', password: 'password123' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('devrait refuser l\'accès sans token', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.statusCode).toBe(401);
    });

    it('devrait retourner le profil avec un token valide', async () => {
      const registerRes = await request(app).post('/api/auth/register').send({
        firstName: 'Amine',
        lastName: 'Test',
        email: 'amine@test.com',
        phone: '+212600000000',
        password: 'password123'
      });

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${registerRes.body.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe('amine@test.com');
    });
  });
});