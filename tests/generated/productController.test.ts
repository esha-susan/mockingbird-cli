import request from 'supertest';
import app from '../app'; // Assuming app is exported from '../app.ts'

// Define a type for a Product for clarity in tests
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
}

// Helper function to create a product for test setup
// This directly uses the POST /products endpoint to ensure consistency
async function createProduct(
  productData: Omit<Product, 'id'>
): Promise<Product> {
  const response = await request(app).post('/products').send(productData);
  if (response.statusCode !== 201) {
    throw new Error(
      `Failed to create product for test setup: ${response.status} - ${JSON.stringify(response.body)}`
    );
  }
  return response.body;
}

describe('Product API Integration Tests', () => {
  // In a real-world scenario, you would set up and tear down a test database here.
  // For instance, `beforeEach(async () => await db.clearAllProducts())`
  // or `beforeAll(async () => await db.connect())` and `afterAll(async () => await db.disconnect())`.
  // For this example, we'll assume a clean slate where relevant, or manage state through API calls.

  describe('GET /products', () => {
    it('should return an empty array if no products exist (edge case)', async () => {
      // This test relies on the database being empty initially or having been cleared.
      // If other tests create products and there's no global cleanup, this test might fail.
      // A robust setup would involve `beforeEach(async () => await clearDatabase())`.
      const res = await request(app).get('/products');

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toEqual([]);
    });

    it('should return a list of products (successful response)', async () => {
      // Create some products for this test
      const product1 = await createProduct({
        name: 'Test Product List 1',
        description: 'Description for list item 1',
        price: 19.99,
        stock: 100,
      });
      const product2 = await createProduct({
        name: 'Test Product List 2',
        description: 'Description for list item 2',
        price: 29.99,
        stock: 50,
      });

      const res = await request(app).get('/products');

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Using toBeGreaterThanOrEqual because other tests might have created products
      // without a full database clear between test suites.
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body).toContainEqual(
        expect.objectContaining({
          id: product1.id,
          name: product1.name,
          price: product1.price,
        })
      );
      expect(res.body).toContainEqual(
        expect.objectContaining({
          id: product2.id,
          name: product2.name,
          price: product2.price,
        })
      );
    });
  });

  describe('GET /products/:id', () => {
    let createdProduct: Product;

    // Create a product specifically for these ID tests before all tests in this describe block run
    beforeAll(async () => {
      createdProduct = await createProduct({
        name: 'Product For ID Lookup',
        description: 'Product used to test fetching by ID',
        price: 99.99,
        stock: 20,
      });
    });

    it('should return a single product by ID (successful response)', async () => {
      const res = await request(app).get(`/products/${createdProduct.id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          id: createdProduct.id,
          name: createdProduct.name,
          description: createdProduct.description,
          price: createdProduct.price,
          stock: createdProduct.stock,
        })
      );
      // Ensure no sensitive or internal fields are exposed
      expect(res.body).not.toHaveProperty('createdAt');
      expect(res.body).not.toHaveProperty('updatedAt');
    });

    it('should return 404 if product ID is not found (error case)', async () => {
      // Assuming IDs are typically UUIDs or MongoDB ObjectIDs, use a valid-looking but non-existent one
      const nonExistentId = '60a7e0c4a4f0b20015a9b7a1'; // Example MongoDB ObjectId
      const res = await request(app).get(`/products/${nonExistentId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({
        message: `Product with ID ${nonExistentId} not found`,
      });
    });

    it('should return 400 for an invalid product ID format (edge case)', async () => {
      // This tests if the API validates the ID format before querying the database.
      // For example, if IDs are expected to be UUIDs or MongoDB ObjectIDs, a malformed string should fail.
      const invalidId = 'not-a-valid-id-format-at-all';
      const res = await request(app).get(`/products/${invalidId}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(
        /Invalid product ID format|Bad Request/i
      );
    });
  });

  describe('POST /products', () => {
    it('should create a new product successfully (successful response)', async () => {
      const newProductData = {
        name: 'Brand New Product',
        description: 'A fresh item for the inventory.',
        price: 75.5,
        stock: 200,
      };

      const res = await request(app).post('/products').send(newProductData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          id: expect.any(String), // The ID should be generated by the system
          name: newProductData.name,
          description: newProductData.description,
          price: newProductData.price,
          stock: newProductData.stock,
        })
      );
      // Optionally, verify its existence by fetching it
      const fetchRes = await request(app).get(`/products/${res.body.id}`);
      expect(fetchRes.statusCode).toEqual(200);
      expect(fetchRes.body.name).toEqual(newProductData.name);
    });

    it('should return 400 for missing required fields (error case)', async () => {
      const invalidProductData = {
        // 'name' and 'price' are typically required, but are missing here
        description: 'This product is incomplete',
        stock: 50,
      };

      const res = await request(app).post('/products').send(invalidProductData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(
        /name is required|price is required|Bad Request/i
      );
    });

    it('should return 400 for invalid data types (error case)', async () => {
      const invalidProductData = {
        name: 'Product with Bad Type',
        description: 'Description for bad type product',
        price: 'not-a-number', // Price should be a number
        stock: 'also-not-a-number', // Stock should be a number
      };

      const res = await request(app).post('/products').send(invalidProductData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(
        /price must be a number|stock must be a number|Bad Request/i
      );
    });

    it('should return 409 if a product with the same unique identifier already exists (edge case)', async () => {
      // This test assumes that the 'name' field (or another field) must be unique.
      const uniqueProductName = 'Unique Product For Conflict Test';
      const productData = {
        name: uniqueProductName,
        description:
          'This product should cause a conflict on second creation attempt.',
        price: 150.0,
        stock: 30,
      };
      await createProduct(productData); // First successful creation

      // Attempt to create the same product again
      const res = await request(app).post('/products').send(productData);

      expect(res.statusCode).toEqual(409); // 409 Conflict is appropriate for resource already exists
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(
        /Product with name 'Unique Product For Conflict Test' already exists|Conflict/i
      );
    });
  });
});
