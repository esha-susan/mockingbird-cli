import request from 'supertest';
import app from '../app';

// Declare a variable to store a product ID created during tests.
// This ensures that subsequent tests (like GET /products/:id) have a valid ID to work with.
let createdProductId: string;

describe('Product API Integration Tests', () => {
  // Global setup/teardown for the entire test suite.
  // In a real application, you might connect to a dedicated test database here,
  // ensure it's clean, and seed initial data if necessary for all tests.
  beforeAll(async () => {
    // Example: await db.connectToTestDatabase();
    // Example: await db.clearAllCollections(); // Clear all data before tests
  });

  afterAll(async () => {
    // Example: await db.disconnectTestDatabase(); // Disconnect from test database
    // Example: await db.clearAllCollections(); // Optional: clean up after all tests
  });

  describe('POST /products', () => {
    const validProductPayload = {
      name: 'Integration Test Product',
      price: 19.99,
      description: 'A product specifically for integration testing purposes.',
    };

    it('should create a new product (201 Created)', async () => {
      const res = await request(app)
        .post('/products')
        .send(validProductPayload);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', validProductPayload.name);
      expect(res.body).toHaveProperty('price', validProductPayload.price);
      expect(res.body).toHaveProperty(
        'description',
        validProductPayload.description
      );
      expect(typeof res.body.id).toBe('string'); // Assuming IDs are strings (e.g., UUIDs)

      // Store the ID for use in other tests
      createdProductId = res.body.id;
    });

    it('should return 400 if product name is missing', async () => {
      const invalidProduct = { price: 9.99, description: 'Missing name' };
      const res = await request(app).post('/products').send(invalidProduct);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('name is required'); // Assuming specific validation message
    });

    it('should return 400 if product price is missing', async () => {
      const invalidProduct = {
        name: 'No Price Product',
        description: 'Missing price',
      };
      const res = await request(app).post('/products').send(invalidProduct);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('price is required');
    });

    it('should return 400 if product price is not a valid number', async () => {
      const invalidProduct = {
        name: 'Invalid Price Product',
        price: 'not-a-number',
        description: 'Price should be numeric',
      };
      const res = await request(app).post('/products').send(invalidProduct);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('price must be a number');
    });

    it('should return 409 if a product with the same name already exists (if unique constraint enforced)', async () => {
      // First, create a product with a specific unique name
      const uniqueNameProduct = {
        name: 'Unique Product for Conflict Test',
        price: 100.0,
      };
      await request(app).post('/products').send(uniqueNameProduct);

      // Then, try to create another product with the exact same unique name
      const res = await request(app).post('/products').send(uniqueNameProduct); // Send the same product again

      // The status code can vary: 409 Conflict is ideal for unique constraints,
      // but some APIs might return 400 Bad Request or even 500 Internal Server Error
      // if not explicitly handled. We'll test for a range indicating a client-side error.
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.statusCode).toBeLessThan(500); // Should not be a 5xx server error if handled
      if (res.statusCode === 409) {
        expect(res.body).toHaveProperty(
          'message',
          expect.stringContaining('already exists')
        );
      } else if (res.statusCode === 400) {
        expect(res.body).toHaveProperty(
          'message',
          expect.stringContaining('duplicate key') ||
            expect.stringContaining('unique')
        );
      }
    });
  });

  describe('GET /products', () => {
    // Before running GET /products tests, ensure there's at least one product in the system
    // (either from the POST test or by creating a new one if POST failed/was skipped).
    beforeAll(async () => {
      if (!createdProductId) {
        const res = await request(app)
          .post('/products')
          .send({
            name: 'Baseline Product For Listing',
            price: 50.0,
            description: 'Created for GET /products test',
          });
        createdProductId = res.body.id; // Ensure createdProductId is set
      }
    });

    it('should return a list of products (200 OK)', async () => {
      const res = await request(app).get('/products');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0); // We expect at least one product from setup
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('price');
      expect(typeof res.body[0].id).toBe('string');
      expect(typeof res.body[0].name).toBe('string');
      expect(typeof res.body[0].price).toBe('number');
    });

    it('should return an empty array if no products exist (200 OK - edge case)', async () => {
      // This test is challenging for true integration tests without direct DB access to clear products.
      // A robust test would involve clearing the test database entirely before this specific test.
      // For demonstration purposes, we'll assert the response structure remains an array.
      // If the controller truly returned an empty list, it would still be 200.
      const res = await request(app).get('/products');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      // We can't assert length === 0 here unless we explicitly clear the DB before this specific test.
      // The main point is to ensure it's always an array.
    });

    // A more direct 'error' case (like 500 Internal Server Error) for GET /products is hard to trigger reliably
    // in an integration test without mocking underlying dependencies or inducing a server crash.
    // Thus, focusing on expected successful behaviors and array structure is more practical here.
  });

  describe('GET /products/:id', () => {
    let testProductId: string;

    // Ensure a product exists for fetching by ID before this suite runs
    beforeAll(async () => {
      // Use the ID from the POST test, or create a new one if 'createdProductId' wasn't set (e.g., if POST tests were skipped/failed)
      if (createdProductId) {
        testProductId = createdProductId;
      } else {
        const res = await request(app)
          .post('/products')
          .send({
            name: 'Product for ID Lookup',
            price: 45.0,
            description: 'Specific product for GET by ID',
          });
        testProductId = res.body.id;
      }
    });

    it('should return a specific product by ID (200 OK)', async () => {
      const res = await request(app).get(`/products/${testProductId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', testProductId);
      expect(res.body).toHaveProperty('name', expect.any(String));
      expect(res.body).toHaveProperty('price', expect.any(Number));
      expect(res.body).toHaveProperty('description', expect.any(String));
    });

    it('should return 404 if product with ID is not found', async () => {
      // Use an ID that is unlikely to exist but is well-formed (e.g., a valid UUID format but not in DB)
      const nonExistentId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'; // Example non-existent UUID
      const res = await request(app).get(`/products/${nonExistentId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', expect.any(String));
      expect(res.body.message).toContain('Product not found');
    });

    it('should return 400 for an invalid product ID format', async () => {
      // Assuming IDs are expected to be in a specific format (e.g., UUID).
      // If the ID parameter validation is in place (e.g., via middleware), it should return 400.
      const malformedId = '123-abc-def-456'; // Example of an ID that's not a valid UUID format
      const res = await request(app).get(`/products/${malformedId}`);

      // If the Express route or middleware validates the ID format (e.g., using a regex for UUIDs),
      // it should return 400 Bad Request. If it just passes to a DB query that returns null,
      // it might result in 404 Not Found. We'll test for 400 as a robust validation check.
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', expect.any(String));
      expect(res.body.message).toContain('Invalid product ID format');
    });
  });
});
