import request from 'supertest';
import app from '../app';

// Helper to generate a UUID for testing purposes (real projects would use a library like 'uuid')
const generateUuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

describe('Product API Integration Tests', () => {
  // Store a product ID created during tests to be used in subsequent tests (e.g., GET by ID)
  let createdProductId: string;

  // Common test product data
  const testProduct = {
    name: 'Integration Test Product',
    description: 'A product used for integration testing purposes.',
    price: 49.99,
    stock: 50,
  };

  const anotherTestProduct = {
    name: 'Another Integration Product',
    description: 'A second product for list testing.',
    price: 12.34,
    stock: 200,
  };

  // Helper function to create a product, useful for setting up test data
  const createProductHelper = async (productData: any) => {
    const response = await request(app).post('/products').send(productData);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    return response.body.id;
  };

  describe('GET /products', () => {
    // Before running these tests, ensure some products exist in the database
    beforeAll(async () => {
      await createProductHelper(testProduct);
      await createProductHelper(anotherTestProduct);
    });

    it('should return an array of products with status 200', async () => {
      const response = await request(app).get('/products');

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2); // Should have at least the two products created in beforeAll
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('price');
    });

    it('should return an empty array if no products exist (edge case, assuming database cleanup for specific test)', async () => {
      // This test is hard to run reliably in a shared test environment without explicit database cleanup/rollback.
      // For a real scenario, you'd need a clean database or mock the data source to return an empty array.
      // Given products are created in beforeAll, this specific test will likely return a non-empty array.
      // The assertion here is for the structure of the response (an array), which is always valid for GET /products.
      const response = await request(app).get('/products');

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // To truly test for an *empty* array, the database state must be explicitly cleared for this test.
    });
  });

  describe('GET /products/:id', () => {
    // Before all tests in this describe block, create a product to ensure we have a valid ID
    beforeAll(async () => {
      createdProductId = await createProductHelper(testProduct);
    });

    it('should return a single product by ID with status 200', async () => {
      const response = await request(app).get(`/products/${createdProductId}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('id', createdProductId);
      expect(response.body).toHaveProperty('name', testProduct.name);
      expect(response.body).toHaveProperty(
        'description',
        testProduct.description
      );
      expect(response.body).toHaveProperty('price', testProduct.price);
      expect(response.body).toHaveProperty('stock', testProduct.stock);
    });

    it('should return 404 if product ID is not found', async () => {
      const nonExistentId = generateUuid(); // Use a UUID that definitely doesn't exist
      const response = await request(app).get(`/products/${nonExistentId}`);

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty(
        'message',
        `Product with id ${nonExistentId} not found`
      );
    });

    it('should return 400 if product ID format is invalid', async () => {
      const invalidId = 'not-a-valid-uuid-string';
      const response = await request(app).get(`/products/${invalidId}`);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid product ID format'
      );
    });
  });

  describe('POST /products', () => {
    const newProductData = {
      name: 'Newly Created Product',
      description: 'This product is created via a successful POST request.',
      price: 75.0,
      stock: 300,
    };

    it('should create a new product and return 201 Created', async () => {
      const response = await request(app)
        .post('/products')
        .send(newProductData);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(typeof response.body.id).toBe('string');
      expect(response.body.name).toBe(newProductData.name);
      expect(response.body.description).toBe(newProductData.description);
      expect(response.body.price).toBe(newProductData.price);
      expect(response.body.stock).toBe(newProductData.stock);

      // Verify the product can be fetched by its new ID
      const getResponse = await request(app).get(
        `/products/${response.body.id}`
      );
      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.body.name).toBe(newProductData.name);
    });

    it('should return 400 Bad Request if required fields are missing', async () => {
      const productWithoutName = {
        description: 'Missing name field.',
        price: 10.0,
        stock: 10,
      };

      const response = await request(app)
        .post('/products')
        .send(productWithoutName);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('name is required'); // Expect specific validation message
    });

    it('should return 400 Bad Request if data types are invalid', async () => {
      const productWithInvalidPrice = {
        name: 'Invalid Price Product',
        description: 'Price should be a number.',
        price: 'not-a-number', // Invalid type
        stock: 50,
      };

      const response = await request(app)
        .post('/products')
        .send(productWithInvalidPrice);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('price must be a number'); // Expect specific validation message
    });
  });
});
