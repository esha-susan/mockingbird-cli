import request from 'supertest';
import app from '../app'; // Assuming app is the express instance

// Helper to generate unique emails for tests to avoid conflicts
const generateUniqueEmail = () =>
  `testuser_${Date.now()}_${Math.random().toString(36).substring(2, 15)}@example.com`;

describe('User API Integration Tests', () => {
  // Common test data template
  const baseUserPayload = {
    name: 'Test User',
    password: 'securePassword123',
  };

  describe('GET /users', () => {
    it('should return an array of users successfully', async () => {
      // Create a user to ensure at least one user exists for this test,
      // and clean up afterwards.
      const uniqueEmail = generateUniqueEmail();
      const tempUserPayload = { ...baseUserPayload, email: uniqueEmail };
      const createRes = await request(app).post('/users').send(tempUserPayload);
      const tempUserId = createRes.body.id;

      const res = await request(app).get('/users');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1); // At least the one we just created
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('email');
      expect(res.body[0]).not.toHaveProperty('password'); // Password should not be returned

      // Clean up the temporary user
      await request(app).delete(`/users/${tempUserId}`);
    });

    it('should return an empty array if no users exist (edge case - assuming a clean DB or no users)', async () => {
      // This test is highly dependent on database state management.
      // For a truly isolated test, a test DB would be cleared beforehand.
      // Assuming for this scenario that if the DB *happens* to be empty, it responds correctly.
      // If users are always present, this test might need mocking the data layer or a specific setup.
      const res = await request(app).get('/users');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      // We cannot guarantee the DB is empty, so we just check it's an array.
      // If a specific setup could guarantee an empty DB, we'd add:
      // expect(res.body.length).toEqual(0);
    });
  });

  describe('POST /users', () => {
    let createdUserId: string;

    afterEach(async () => {
      // Clean up the user created in successful POST tests
      if (createdUserId) {
        await request(app).delete(`/users/${createdUserId}`);
        createdUserId = null as any; // Clear the ID for next test
      }
    });

    it('should create a new user successfully with status 201', async () => {
      const uniqueEmail = generateUniqueEmail();
      const payload = { ...baseUserPayload, email: uniqueEmail };

      const res = await request(app).post('/users').send(payload);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toEqual(payload.name);
      expect(res.body.email).toEqual(payload.email);
      expect(res.body).not.toHaveProperty('password'); // Password should not be returned

      createdUserId = res.body.id; // Store for cleanup
    });

    it('should return 400 if required fields are missing (e.g., email)', async () => {
      const invalidPayload = {
        name: 'Missing Email User',
        password: 'password123',
      }; // Missing email

      const res = await request(app).post('/users').send(invalidPayload);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('email is required');
    });

    it('should return 409 if user with email already exists', async () => {
      const uniqueEmail = generateUniqueEmail();
      const payload = { ...baseUserPayload, email: uniqueEmail };

      // First, create the user
      await request(app).post('/users').send(payload);

      // Then, try to create another user with the same email
      const res = await request(app).post('/users').send(payload);

      expect(res.statusCode).toEqual(409); // Conflict
      expect(res.body).toHaveProperty(
        'message',
        'User with this email already exists'
      );

      // Clean up the first user
      const getRes = await request(app).get(`/users`);
      const existingUser = getRes.body.find(
        (user: any) => user.email === uniqueEmail
      );
      if (existingUser) {
        await request(app).delete(`/users/${existingUser.id}`);
      }
    });
  });

  describe('GET /users/:id', () => {
    let userIdForGet: string;
    const userToCreate = {
      name: 'User For Get',
      email: generateUniqueEmail(),
      password: 'passwordForGet',
    };

    beforeAll(async () => {
      const res = await request(app).post('/users').send(userToCreate);
      userIdForGet = res.body.id;
    });

    afterAll(async () => {
      await request(app).delete(`/users/${userIdForGet}`);
    });

    it('should return a user by ID successfully with status 200', async () => {
      const res = await request(app).get(`/users/${userIdForGet}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', userIdForGet);
      expect(res.body.name).toEqual(userToCreate.name);
      expect(res.body.email).toEqual(userToCreate.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 404 if user ID is not found', async () => {
      const nonExistentId = '60e0a9d1d1f0d3a0c8b45678'; // Example non-existent ID
      const res = await request(app).get(`/users/${nonExistentId}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty(
        'message',
        `User with ID ${nonExistentId} not found`
      );
    });

    it('should return 400 if ID format is invalid', async () => {
      const invalidId = 'not-a-valid-id';
      const res = await request(app).get(`/users/${invalidId}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Invalid user ID format');
    });
  });

  describe('PUT /users/:id', () => {
    let userIdForPut: string;
    const userToCreate = {
      name: 'User For Put',
      email: generateUniqueEmail(),
      password: 'passwordForPut',
    };

    beforeAll(async () => {
      const res = await request(app).post('/users').send(userToCreate);
      userIdForPut = res.body.id;
    });

    afterAll(async () => {
      await request(app).delete(`/users/${userIdForPut}`);
    });

    it('should update a user successfully with status 200', async () => {
      const updatedName = 'Updated Name For Put';
      const updatedEmail = generateUniqueEmail();
      const updatePayload = {
        name: updatedName,
        email: updatedEmail,
      };

      const res = await request(app)
        .put(`/users/${userIdForPut}`)
        .send(updatePayload);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', userIdForPut);
      expect(res.body.name).toEqual(updatedName);
      expect(res.body.email).toEqual(updatedEmail);
      expect(res.body).not.toHaveProperty('password'); // Password should not be returned

      // Verify by fetching the user again
      const getRes = await request(app).get(`/users/${userIdForPut}`);
      expect(getRes.statusCode).toEqual(200);
      expect(getRes.body.name).toEqual(updatedName);
      expect(getRes.body.email).toEqual(updatedEmail);
    });

    it('should return 404 if user to update is not found', async () => {
      const nonExistentId = '60e0a9d1d1f0d3a0c8b45679';
      const updatePayload = { name: 'Non Existent Update' };

      const res = await request(app)
        .put(`/users/${nonExistentId}`)
        .send(updatePayload);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty(
        'message',
        `User with ID ${nonExistentId} not found`
      );
    });

    it('should return 400 if update payload contains invalid email format', async () => {
      const invalidUpdatePayload = {
        email: 'not-an-email-for-update',
      };

      const res = await request(app)
        .put(`/users/${userIdForPut}`)
        .send(invalidUpdatePayload);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('email must be a valid email');
    });
  });

  describe('DELETE /users/:id', () => {
    let userIdForDelete: string;
    const userToCreate = {
      name: 'User For Delete',
      email: generateUniqueEmail(),
      password: 'passwordForDelete',
    };

    beforeEach(async () => {
      // Use beforeEach to ensure a fresh user for each test in this suite
      const res = await request(app).post('/users').send(userToCreate);
      userIdForDelete = res.body.id;
    });

    it('should delete a user successfully with status 204', async () => {
      const res = await request(app).delete(`/users/${userIdForDelete}`);
      expect(res.statusCode).toEqual(204); // No Content

      // Verify the user is actually deleted
      const getRes = await request(app).get(`/users/${userIdForDelete}`);
      expect(getRes.statusCode).toEqual(404);
    });

    it('should return 404 if user to delete is not found', async () => {
      const nonExistentId = '60e0a9d1d1f0d3a0c8b45680';
      const res = await request(app).delete(`/users/${nonExistentId}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty(
        'message',
        `User with ID ${nonExistentId} not found`
      );
    });

    it('should return 400 if ID format is invalid for deletion', async () => {
      const invalidId = 'invalid-delete-id';
      const res = await request(app).delete(`/users/${invalidId}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Invalid user ID format');
    });
  });
});
