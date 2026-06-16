import request from 'supertest';
import app from '../app';
import User from '../models/User'; // Assuming a Mongoose User model for cleanup
import mongoose from 'mongoose';

const TEST_USER_EMAIL = 'testuser@example.com';
const TEST_USER_PASSWORD = 'TestPassword123!';
const ANOTHER_USER_EMAIL = 'another@example.com';
const ANOTHER_USER_PASSWORD = 'AnotherPassword123!';

let agent: request.SuperTest<request.Test>;
let authToken: string | undefined;

beforeAll(async () => {
  const MONGO_URI_TEST =
    process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/jest-auth-test';
  await mongoose.connect(MONGO_URI_TEST);
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});
  agent = request.agent(app);
  authToken = undefined;
});

async function registerUser(
  email = TEST_USER_EMAIL,
  password = TEST_USER_PASSWORD
) {
  const res = await agent.post('/auth/register').send({ email, password });
  return res;
}

async function loginUser(
  email = TEST_USER_EMAIL,
  password = TEST_USER_PASSWORD
) {
  const res = await agent.post('/auth/login').send({ email, password });
  return res;
}

describe('Auth Controller Integration Tests', () => {
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await agent.post('/auth/register').send({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty(
        'message',
        'User registered successfully'
      );
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', TEST_USER_EMAIL);
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    });

    it('should return 409 if user with email already exists', async () => {
      await registerUser();

      const res = await agent.post('/auth/register').send({
        email: TEST_USER_EMAIL,
        password: ANOTHER_USER_PASSWORD,
      });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty(
        'message',
        'User with this email already exists'
      );
    });

    it('should return 400 for missing email', async () => {
      const res = await agent.post('/auth/register').send({
        password: TEST_USER_PASSWORD,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('email is required');
    });

    it('should return 400 for missing password', async () => {
      const res = await agent.post('/auth/register').send({
        email: 'no-password@example.com',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('password is required');
    });

    it('should return 400 for a weak password (assuming validation)', async () => {
      const res = await agent.post('/auth/register').send({
        email: 'weakpass@example.com',
        password: '123',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain(
        'Password must be at least 8 characters'
      );
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await registerUser();
    });

    it('should login a registered user successfully', async () => {
      const res = await agent.post('/auth/login').send({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Logged in successfully');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', TEST_USER_EMAIL);
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    });

    it('should return 401 for invalid password', async () => {
      const res = await agent.post('/auth/login').send({
        email: TEST_USER_EMAIL,
        password: 'WrongPassword!',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 401 for unregistered email', async () => {
      const res = await agent.post('/auth/login').send({
        email: 'nonexistent@example.com',
        password: TEST_USER_PASSWORD,
      });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 400 for missing email', async () => {
      const res = await agent.post('/auth/login').send({
        password: TEST_USER_PASSWORD,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('email is required');
    });

    it('should return 400 for missing password', async () => {
      const res = await agent.post('/auth/login').send({
        email: TEST_USER_EMAIL,
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('password is required');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout a logged-in user successfully (with token)', async () => {
      await registerUser(ANOTHER_USER_EMAIL, ANOTHER_USER_PASSWORD);
      const loginRes = await loginUser(
        ANOTHER_USER_EMAIL,
        ANOTHER_USER_PASSWORD
      );
      authToken = loginRes.body.token;

      const res = await agent
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Logged out successfully');
    });

    it('should logout a logged-in user successfully (with session/cookie)', async () => {
      await registerUser();
      await agent.post('/auth/login').send({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      const res = await agent.post('/auth/logout');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Logged out successfully');
    });

    it('should return 401 if not authenticated (no token/cookie)', async () => {
      const res = await agent.post('/auth/logout');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'Unauthorized');
    });

    it('should return 401 if not authenticated (invalid/expired token)', async () => {
      const res = await agent
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid.token.string');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message', 'Unauthorized');
    });
  });
});
