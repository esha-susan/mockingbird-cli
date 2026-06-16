import request from 'supertest';
import app from '../app';

const generateUniqueEmail = () =>
  `testuser_${Date.now() + Math.random()}@example.com`;
const generateUniqueUsername = () => `testuser_${Date.now() + Math.random()}`;

let registeredUserEmail: string;
let registeredUserPassword: string;
let registeredUsername: string;
let authToken: string;

// Register a user once for use in login and logout tests
beforeAll(async () => {
  registeredUserEmail = generateUniqueEmail();
  registeredUserPassword = 'SecurePassword123!';
  registeredUsername = generateUniqueUsername();

  // Attempt to register the user; assuming success for subsequent tests
  await request(app).post('/auth/register').send({
    username: registeredUsername,
    email: registeredUserEmail,
    password: registeredUserPassword,
  });
});

describe('POST /auth/register', () => {
  it('should register a new user successfully', async () => {
    const uniqueEmail = generateUniqueEmail();
    const uniqueUsername = generateUniqueUsername();
    const res = await request(app).post('/auth/register').send({
      username: uniqueUsername,
      email: uniqueEmail,
      password: 'MySecurePassword123',
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Registration successful');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('username', uniqueUsername);
    expect(res.body.user).toHaveProperty('email', uniqueEmail);
    expect(res.body.user).not.toHaveProperty('password'); // Password should not be returned
  });

  it('should return 409 if email already exists', async () => {
    const res = await request(app).post('/auth/register').send({
      username: generateUniqueUsername(),
      email: registeredUserEmail, // Using the email from beforeAll
      password: 'AnotherPassword123',
    });

    expect(res.statusCode).toEqual(409);
    expect(res.body).toHaveProperty(
      'message',
      'User with this email already exists'
    );
  });

  it('should return 409 if username already exists', async () => {
    const res = await request(app).post('/auth/register').send({
      username: registeredUsername, // Using the username from beforeAll
      email: generateUniqueEmail(),
      password: 'AnotherPassword123',
    });

    expect(res.statusCode).toEqual(409);
    expect(res.body).toHaveProperty(
      'message',
      'User with this username already exists'
    );
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app).post('/auth/register').send({
      username: generateUniqueUsername(),
      email: generateUniqueEmail(),
      // password is missing
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Password is required');
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app).post('/auth/register').send({
      username: generateUniqueUsername(),
      email: 'invalid-email',
      password: 'MySecurePassword123',
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Invalid email format');
  });

  it('should return 400 for weak password (e.g., less than 8 characters)', async () => {
    const res = await request(app).post('/auth/register').send({
      username: generateUniqueUsername(),
      email: generateUniqueEmail(),
      password: 'weak',
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty(
      'message',
      'Password must be at least 8 characters long'
    );
  });
});

describe('POST /auth/login', () => {
  it('should log in an existing user successfully', async () => {
    const res = await request(app).post('/auth/login').send({
      email: registeredUserEmail,
      password: registeredUserPassword,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Login successful');
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('email', registeredUserEmail);
    expect(res.body.user).not.toHaveProperty('password');

    authToken = res.body.token; // Save token for logout tests
  });

  it('should return 401 for invalid credentials (wrong password)', async () => {
    const res = await request(app).post('/auth/login').send({
      email: registeredUserEmail,
      password: 'WrongPassword123!',
    });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });

  it('should return 401 for user not found (non-existent email)', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'SomePassword123!',
    });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app).post('/auth/login').send({
      email: registeredUserEmail,
      // password is missing
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Password is required');
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'invalid-email-format',
      password: 'MySecurePassword123',
    });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'Invalid email format');
  });
});

describe('POST /auth/logout', () => {
  // Ensure authToken is available before running logout tests
  beforeAll(async () => {
    if (!authToken) {
      const res = await request(app).post('/auth/login').send({
        email: registeredUserEmail,
        password: registeredUserPassword,
      });
      if (res.statusCode === 200 && res.body.token) {
        authToken = res.body.token;
      }
    }
  });

  it('should log out an authenticated user successfully', async () => {
    expect(authToken).toBeDefined();

    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app).post('/auth/logout').send();

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty(
      'message',
      'No token provided, authorization denied'
    );
  });

  it('should return 401 if an invalid/expired token is provided', async () => {
    const invalidToken = 'invalid.jwt.token';
    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${invalidToken}`)
      .send();

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Token is not valid');
  });
});
