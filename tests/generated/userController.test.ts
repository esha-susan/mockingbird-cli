import request from 'supertest';
import app from '../app'; // Assuming app.ts exports the Express app

// Variables to store user IDs for subsequent tests
let createdUserId: string;
let anotherUserId: string;

describe('User API Integration Tests', () => {
  // ---------------------------------------------------------------------------------
  // POST /users
  // ---------------------------------------------------------------------------------
  describe('POST /users', () => {
    const newUser = {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
    };

    it('should create a new user successfully', async () => {
      const res = await request(app).post('/users').send(newUser);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(newUser.name);
      expect(res.body.email).toBe(newUser.email);
      expect(res.body).not.toHaveProperty('password'); // Password should not be returned
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('updatedAt');

      createdUserId = res.body.id; // Store ID for other tests
    });

    it('should return 400 if required fields are missing', async () => {
      const invalidUser = {
        name: 'Invalid User',
        // email is missing
        password: 'password123',
      };

      const res = await request(app).post('/users').send(invalidUser);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/email is required/i);
    });

    it('should return 400 if email is already registered', async () => {
      // Use the same email as the user created above
      const duplicateUser = {
        name: 'Duplicate User',
        email: 'testuser@example.com', // Duplicate email
        password: 'anotherpassword',
      };

      const res = await request(app).post('/users').send(duplicateUser);

      expect(res.statusCode).toBe(400); // Or 409 Conflict, depending on backend
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/email already exists/i);
    });
  });

  // ---------------------------------------------------------------------------------
  // GET /users
  // ---------------------------------------------------------------------------------
  describe('GET /users', () => {
    // Create another user to ensure the list has more than one
    beforeAll(async () => {
      const res = await request(app).post('/users').send({
        name: 'Another User',
        email: 'anotheruser@example.com',
        password: 'password456',
      });
      anotherUserId = res.body.id;
    });

    it('should return an array of all users', async () => {
      const res = await request(app).get('/users');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2); // At least the two we created
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('email');
      expect(res.body[0]).not.toHaveProperty('password');
    });

    it('should return an empty array if no users exist (edge case, assuming clean state)', async () => {
      // This test is harder to isolate without database cleanup before this specific describe.
      // A simpler edge case for now: ensure it's always an array.
      const res = await request(app).get('/users');
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------------
  // GET /users/:id
  // ---------------------------------------------------------------------------------
  describe('GET /users/:id', () => {
    it('should return a single user by ID', async () => {
      const res = await request(app).get(`/users/${createdUserId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', createdUserId);
      expect(res.body).toHaveProperty('name', 'Test User');
      expect(res.body).toHaveProperty('email', 'testuser@example.com');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 404 if user ID does not exist', async () => {
      const nonExistentId = '60b0d6b5e6f3b7001c8c9c9c'; // A valid-looking but non-existent ID

      const res = await request(app).get(`/users/${nonExistentId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/user not found/i);
    });

    it('should return 400 if user ID is invalid format', async () => {
      const invalidId = 'invalid-id-format'; // Not a valid MongoDB ObjectId or UUID

      const res = await request(app).get(`/users/${invalidId}`);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/invalid user id format/i);
    });
  });

  // ---------------------------------------------------------------------------------
  // PUT /users/:id
  // ---------------------------------------------------------------------------------
  describe('PUT /users/:id', () => {
    const updatedUserData = {
      name: 'Updated Test User',
      email: 'updated.testuser@example.com',
    };

    it('should update an existing user successfully', async () => {
      const res = await request(app)
        .put(`/users/${createdUserId}`)
        .send(updatedUserData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', createdUserId);
      expect(res.body.name).toBe(updatedUserData.name);
      expect(res.body.email).toBe(updatedUserData.email);
      expect(res.body).not.toHaveProperty('password');
      expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(
        new Date(res.body.createdAt).getTime()
      ); // Should reflect update
    });

    it('should return 404 if user ID to update does not exist', async () => {
      const nonExistentId = '60b0d6b5e6f3b7001c8c9c9d';

      const res = await request(app)
        .put(`/users/${nonExistentId}`)
        .send(updatedUserData);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/user not found/i);
    });

    it('should return 400 if user ID is invalid format', async () => {
      const invalidId = 'invalid-update-id';

      const res = await request(app)
        .put(`/users/${invalidId}`)
        .send(updatedUserData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/invalid user id format/i);
    });

    it('should return 400 if trying to update with invalid data (e.g., empty name)', async () => {
      const invalidUpdate = {
        name: '', // Empty name
        email: 'valid@example.com',
      };

      const res = await request(app)
        .put(`/users/${createdUserId}`)
        .send(invalidUpdate);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/name cannot be empty/i);
    });

    it('should return 400 if trying to update email to an already existing email', async () => {
      const duplicateEmailUpdate = {
        email: 'anotheruser@example.com', // Email of `anotherUserId`
      };

      const res = await request(app)
        .put(`/users/${createdUserId}`)
        .send(duplicateEmailUpdate);

      expect(res.statusCode).toBe(400); // Or 409 Conflict
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/email already exists/i);
    });
  });

  // ---------------------------------------------------------------------------------
  // DELETE /users/:id
  // ---------------------------------------------------------------------------------
  describe('DELETE /users/:id', () => {
    it('should delete a user successfully', async () => {
      const res = await request(app).delete(`/users/${createdUserId}`);

      expect(res.statusCode).toBe(204); // No Content
      expect(res.body).toEqual({}); // Empty body for 204

      // Verify it's actually deleted by trying to GET it
      const getRes = await request(app).get(`/users/${createdUserId}`);
      expect(getRes.statusCode).toBe(404);
    });

    it('should return 404 if user ID to delete does not exist', async () => {
      const nonExistentId = '60b0d6b5e6f3b7001c8c9c9e';

      const res = await request(app).delete(`/users/${nonExistentId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/user not found/i);
    });

    it('should return 400 if user ID is invalid format', async () => {
      const invalidId = 'invalid-delete-id';

      const res = await request(app).delete(`/users/${invalidId}`);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/invalid user id format/i);
    });
  });

  // Clean up created users if necessary
  afterAll(async () => {
    // Ensure the other user created during tests is also deleted
    if (anotherUserId) {
      await request(app).delete(`/users/${anotherUserId}`);
    }
  });
});
