jest.mock("prettier", () => ({
    format: async (code: string) => code
  }));

import { buildOutputPath } from "./writer";
import * as path from "path";

describe("buildOutputPath", () => {
  it("should convert a controller path to a test file path", () => {
    const result = buildOutputPath(
      "src/controllers/userController.ts",
      "tests/generated"
    );
    expect(result).toBe(path.join("tests/generated", "userController.test.ts"));
  });

  it("should handle deeply nested controller paths", () => {
    const result = buildOutputPath(
      "/home/user/project/src/controllers/authController.ts",
      "output"
    );
    expect(result).toBe(path.join("output", "authController.test.ts"));
  });

  it("should respect a custom output directory", () => {
    const result = buildOutputPath(
      "src/controllers/productController.ts",
      "my-custom-tests"
    );
    expect(result).toBe(path.join("my-custom-tests", "productController.test.ts"));
  });
});