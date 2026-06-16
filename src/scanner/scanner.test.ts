import { isControllerFile } from "./scanner";

describe("isControllerFile", () => {
  it("should return true for files ending in Controller.ts", () => {
    expect(isControllerFile("userController.ts")).toBe(true);
    expect(isControllerFile("AuthController.ts")).toBe(true);
  });

  it("should return true for files ending in Router.ts or routes.ts", () => {
    expect(isControllerFile("userRouter.ts")).toBe(true);
    expect(isControllerFile("apiRoutes.ts")).toBe(true);
  });

  it("should be case-insensitive", () => {
    expect(isControllerFile("USERCONTROLLER.TS")).toBe(true);
  });

  it("should return false for unrelated files", () => {
    expect(isControllerFile("helpers.ts")).toBe(false);
    expect(isControllerFile("index.ts")).toBe(false);
    expect(isControllerFile("logger.ts")).toBe(false);
  });

  it("should return false for non-ts files even if named similarly", () => {
    expect(isControllerFile("userController.md")).toBe(false);
  });
});