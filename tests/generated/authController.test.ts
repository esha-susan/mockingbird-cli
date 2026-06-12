import request from 'supertest';
import app from '../app'; // Adjust path as needed for your project structure

// Helper to generate a unique email for each test run to avoid conflicts
const generateUniqueEmail = () =>
  `testuser_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@example.com`;

describe('Auth Controller', () => {
  // Note: For a real application, you might want to set up and tear down a dedicated test database
  // in beforeAll/afterAll hooks or use a transaction-based approach for tests.
  // For this example, we rely on unique emails to prevent conflicts between tests.

  describe('POST /auth/register', () => {
    const password = 'SecurePassword123!';

    it('should register a new user successfully and return 201', async () => {
      const email = generateUniqueEmail();
      const res = await request(app)
        .post('/auth/register')
        .send({ email, password });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty(
        'message',
        'User registered successfully'
      );
      expect(res.body).toHaveProperty('userId');
      expect(typeof res.body.userId).toBe('string');
    });

    it('should return 409 if an email already exists', async () => {
      const email = generateUniqueEmail();
      // First, register the user
      await request(app).post('/auth/register').send({ email, password });

      // Try to register again with the same email
      const res = await request(app)
        .post('/auth/register')
        .send({ email, password });

      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty(
        'message',
        'User with this email already exists'
      );
    });

    it('should return 400 if password is too weak (example validation)', async () => {
      const email = generateUniqueEmail();
      const weakPassword = '123'; // Assuming a validation rule for password strength

      const res = await request(app)
        .post('/auth/register')
        .send({ email, password: weakPassword });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.'
      );
    });

    it('should return 400 if email is missing from the request body', async () => {
      const res = await request(app).post('/auth/register').send({ password }); // Missing email

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Email is required');
    });
  });

  describe('POST /auth/login', () => {
    const userEmail = generateUniqueEmail();
    const userPassword = 'LoginPassword123!';
    let storedAuthToken: string;

    beforeAll(async () => {
      // Register a user once before all login tests to have a user to log in with
      await request(app)
        .post('/auth/register')
        .send({ email: userEmail, password: userPassword });
    });

    it('should login a registered user successfully and return 200 with a token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: userEmail, password: userPassword });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Login successful');
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      storedAuthToken = res.body.token; // Store token for potential future tests (e.g., protected routes)
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: userEmail, password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 401 for a non-existent email', async () => {
      const nonExistentEmail = generateUniqueEmail();
      const res = await request(app)
        .post('/auth/login')
        .send({ email: nonExistentEmail, password: userPassword });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 400 if email is missing from the request body', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ password: userPassword }); // Missing email

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Email is required');
    });
  });

  describe('POST /auth/logout', () => {
    let loggedInUserEmail: string;
    let loggedInUserPassword: string;
    let validAuthToken: string;

    beforeEach(async () => {
      // Register and login a new user for each logout test to ensure a fresh, valid token
      loggedInUserEmail = generateUniqueEmail();
      loggedInUserPassword = 'LogoutUserPass123!';

      await request(app)
        .post('/auth/register')
        .send({ email: loggedInUserEmail, password: loggedInUserPassword });

      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: loggedInUserEmail, password: loggedInUserPassword });

      validAuthToken = loginRes.body.token;
    });

    it('should log out a user successfully with a valid token and return 200', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validAuthToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Logout successful');
      // In a real scenario, you might then try to access a protected route with 'validAuthToken'
      // to assert that it has been invalidated and returns 401/403.
    });

    it('should return 401 if no authorization token is provided', async () => {
      const res = await request(app).post('/auth/logout'); // No Authorization header set

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty(
        'message',
        'Authorization token required'
      );
    });

    it('should return 401 if an invalid or malformed token is provided', async () => {
      const invalidToken = 'Bearer thisisnotarealtoken';
      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', invalidToken);

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid or expired token');
    });
  });
});
