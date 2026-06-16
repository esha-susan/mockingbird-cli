import request from 'supertest';
import app from '../app'; // Assuming app exports the Express application instance

// Global variables to store created user ID for chained tests
let createdUserId: string;

// Define realistic user data for creation and update
const testUser = {
  name: 'Integration Test User',
  email: 'testuser@example.com',
  password: 'Password123!',
};

const updatedUser = {
  name: 'Updated Test User',
  email: 'updateduser@example.com',
  password: 'NewPassword456!',
};

// Define an ID that is likely valid in format but non-existent
const nonExistentId = '60e9c8f0f0f0f0f0f0f0f0f0'; // Example MongoDB ObjectId format

describe('User API Integration Tests', () => {
  // Optional: Clean up test data after all tests if using a persistent database
  // afterAll(async () => {
  //   // Example: await request(app).delete(`/users/${createdUserId}`);
  //   // This depends on your database setup and how you want to manage test data.
  //   // For this exercise, we rely on the linear flow of tests.
  // });

  describe('POST /users', () => {
    it('should create a new user and return 201 Created', async () => {
      const res = await request(app).post('/users').send(testUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toEqual(testUser.name);
      expect(res.body.email).toEqual(testUser.email);
      expect(res.body).not.toHaveProperty('password'); // Password should not be returned

      createdUserId = res.body.id; // Store the ID for subsequent tests
    });

    it('should return 400 Bad Request if required fields are missing', async () => {
      const invalidUser = { email: 'missingname@example.com' }; // Missing name and password
      const res = await request(app).post('/users').send(invalidUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message'); // Expect an error message
    });

    it('should return 409 Conflict if a user with the same email already exists', async () => {
      const res = await request(app).post('/users').send(testUser); // Attempt to create the same user again

      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty(
        'message',
        'User with this email already exists'
      );
    });
  });

  describe('GET /users', () => {
    it('should return a list of all users and 200 OK', async () => {
      const res = await request(app).get('/users');

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThanOrEqual(1); // Expect at least the created user
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('email');
    });

    it('should return 400 Bad Request for invalid query parameters', async () => {
      const res = await request(app).get('/users?limit=invalid_value'); // Assuming validation for query params

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /users/:id', () => {
    it('should return a single user by ID and 200 OK', async () => {
      const res = await request(app).get(`/users/${createdUserId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', createdUserId);
      expect(res.body.name).toEqual(testUser.name);
      expect(res.body.email).toEqual(testUser.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 404 Not Found if user ID does not exist', async () => {
      const res = await request(app).get(`/users/${nonExistentId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });

    it('should return 400 Bad Request if ID is malformed/invalid', async () => {
      const invalidId = 'invalid-id-format';
      const res = await request(app).get(`/users/${invalidId}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Invalid user ID format');
    });
  });

  describe('PUT /users/:id', () => {
    it('should update an existing user and return 200 OK', async () => {
      const res = await request(app)
        .put(`/users/${createdUserId}`)
        .send(updatedUser);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', createdUserId);
      expect(res.body.name).toEqual(updatedUser.name);
      expect(res.body.email).toEqual(updatedUser.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 404 Not Found if user ID does not exist', async () => {
      const res = await request(app)
        .put(`/users/${nonExistentId}`)
        .send(updatedUser);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });

    it('should return 400 Bad Request if request body is invalid', async () => {
      const invalidUpdate = { name: '' }; // Invalid (empty) name, assuming validation
      const res = await request(app)
        .put(`/users/${createdUserId}`)
        .send(invalidUpdate);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 400 Bad Request if ID is malformed/invalid', async () => {
      const invalidId = 'invalid-id-format';
      const res = await request(app)
        .put(`/users/${invalidId}`)
        .send(updatedUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Invalid user ID format');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user and return 204 No Content', async () => {
      const res = await request(app).delete(`/users/${createdUserId}`);

      expect(res.statusCode).toEqual(204);
      expect(res.body).toEqual({}); // 204 response typically has an empty body
    });

    it('should return 404 Not Found if user ID does not exist', async () => {
      // Attempt to delete the same ID again, or another non-existent ID
      const res = await request(app).delete(`/users/${createdUserId}`); // `createdUserId` is now deleted

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });

    it('should return 400 Bad Request if ID is malformed/invalid', async () => {
      const invalidId = 'invalid-id-format';
      const res = await request(app).delete(`/users/${invalidId}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Invalid user ID format');
    });
  });
});
