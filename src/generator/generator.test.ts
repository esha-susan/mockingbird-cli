import { cleanGeneratedCode } from "./generator";

describe("cleanGeneratedCode", () => {
  it("should remove ```typescript code fences", () => {
    const input = "```typescript\nconst x = 1;\n```";
    const result = cleanGeneratedCode(input);
    expect(result).toBe("const x = 1;");
  });

  it("should remove ```ts code fences", () => {
    const input = "```ts\nconst x = 1;\n```";
    const result = cleanGeneratedCode(input);
    expect(result).toBe("const x = 1;");
  });

  it("should remove plain ``` fences", () => {
    const input = "```\nconst x = 1;\n```";
    const result = cleanGeneratedCode(input);
    expect(result).toBe("const x = 1;");
  });

  it("should trim leading and trailing whitespace", () => {
    const input = "   \n  const x = 1;  \n  ";
    const result = cleanGeneratedCode(input);
    expect(result).toBe("const x = 1;");
  });

  it("should leave already-clean code unchanged", () => {
    const input = "const x = 1;\nconst y = 2;";
    const result = cleanGeneratedCode(input);
    expect(result).toBe(input);
  });
});