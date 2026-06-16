import { parseRoutesFromCode } from "./extractor";

describe("parseRoutesFromCode", () => {
  it("should extract a simple GET route", () => {
    const code = `router.get("/users", getUsers);`;
    const routes = parseRoutesFromCode(code);

    expect(routes).toHaveLength(1);
    expect(routes[0]).toEqual({
      method: "GET",
      path: "/users",
      handler: "getUsers",
      controllerFile: "unknown"
    });
  });

  it("should extract multiple routes from multiple lines", () => {
    const code = `
      router.get("/users", getUsers);
      router.post("/users", createUser);
      router.delete("/users/:id", deleteUser);
    `;
    const routes = parseRoutesFromCode(code);

    expect(routes).toHaveLength(3);
    expect(routes[0].method).toBe("GET");
    expect(routes[1].method).toBe("POST");
    expect(routes[2].method).toBe("DELETE");
  });

  it("should extract routes with middleware", () => {
    const code = `router.post("/users", authMiddleware, createUser);`;
    const routes = parseRoutesFromCode(code);

    expect(routes).toHaveLength(1);
    expect(routes[0].handler).toBe("createUser");
  });

  it("should work with single, double, and backtick quotes", () => {
    const code = `
      router.get('/a', handlerA);
      router.get("/b", handlerB);
      router.get(\`/c\`, handlerC);
    `;
    const routes = parseRoutesFromCode(code);

    expect(routes).toHaveLength(3);
    expect(routes.map(r => r.path)).toEqual(["/a", "/b", "/c"]);
  });

  it("should support app.* in addition to router.*", () => {
    const code = `app.get("/health", healthCheck);`;
    const routes = parseRoutesFromCode(code);

    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBe("/health");
  });

  it("should return an empty array when no routes are present", () => {
    const code = `
      import express from "express";
      const router = express.Router();
      export default router;
    `;
    const routes = parseRoutesFromCode(code);

    expect(routes).toHaveLength(0);
  });

  it("should be case-insensitive for HTTP methods", () => {
    const code = `router.GET("/users", getUsers);`;
    const routes = parseRoutesFromCode(code);

    expect(routes).toHaveLength(1);
    expect(routes[0].method).toBe("GET");
  });
});