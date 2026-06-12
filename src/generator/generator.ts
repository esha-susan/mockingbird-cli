import { GoogleGenerativeAI } from "@google/generative-ai";
import { Route } from "../extractor/extractor";
import { logInfo, logSuccess, logError, logWarning } from "../utils/logger";

export interface GenerationResult {
  testCode: string;
  controllerFile: string;
  routeCount: number;
  success: boolean;
}

// Initialize the Gemini client once at module level

function createGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Please add it to your .env file."
    );
  }

  return new GoogleGenerativeAI(apiKey);
}

function buildPrompt(routes: Route[], controllerName: string): string {
  const routeDescriptions = routes
    .map(r => `  - ${r.method} ${r.path} (handler: ${r.handler})`)
    .join("\n");

  return `You are an expert Node.js testing engineer.

Generate Jest integration tests for the following Express.js API routes from the "${controllerName}" controller:

${routeDescriptions}

Requirements:
1. Use Jest as the testing framework
2. Use supertest for HTTP assertions
3. Import the Express app as: import app from "../app"
4. Each route must have at least:
   - One test for successful response (2xx status)
   - One test for error/edge case
5. Use describe blocks to group tests by route
6. Use clear, descriptive test names
7. Include realistic request bodies for POST/PUT routes
8. Test for correct status codes and response structure

Return ONLY the TypeScript test code. No explanations. No markdown code blocks. Just the raw TypeScript code starting with import statements.`;
}

function getControllerName(filePath: string): string {
  const fileName = filePath.split("/").pop() || filePath;
  return fileName.replace(".ts", "").replace(".js", "");
}

export async function generateTests(
  routes: Route[],
  controllerFile: string
): Promise<GenerationResult> {
  if (routes.length === 0) {
    logWarning(`No routes to generate tests for: ${controllerFile}`);
    return {
      testCode: "",
      controllerFile,
      routeCount: 0,
      success: false
    };
  }

  const controllerName = getControllerName(controllerFile);
  logInfo(`Generating tests for: ${controllerName} (${routes.length} routes)`);

  try {
    const genAI = createGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = buildPrompt(routes, controllerName);

    // Step 3 — call Gemini
    logInfo("  Calling Gemini AI...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    let testCode = response.text();

    // Step 4 — clean the response
    // Sometimes AI wraps code in markdown blocks despite instructions
    testCode = cleanGeneratedCode(testCode);

    if (!testCode || testCode.trim().length === 0) {
      throw new Error("Gemini returned empty response");
    }

    logSuccess(`  Generated ${testCode.split("\n").length} lines of test code`);

    return {
      testCode,
      controllerFile,
      routeCount: routes.length,
      success: true
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError(`  Failed to generate tests: ${message}`);

    return {
      testCode: "",
      controllerFile,
      routeCount: routes.length,
      success: false
    };
  }
}

export async function generateAllTests(
  routes: Route[]
): Promise<GenerationResult[]> {
  const routesByController = groupRoutesByController(routes);
  const results: GenerationResult[] = [];

  for (const [controllerFile, controllerRoutes] of routesByController) {
    const result = await generateTests(controllerRoutes, controllerFile);
    results.push(result);

    // Small delay between API calls to avoid rate limiting
    await delay(500);
  }

  return results;
}

function groupRoutesByController(routes: Route[]): Map<string, Route[]> {
  const grouped = new Map<string, Route[]>();

  for (const route of routes) {
    const existing = grouped.get(route.controllerFile) || [];
    existing.push(route);
    grouped.set(route.controllerFile, existing);
  }

  return grouped;
}

// Removes markdown code fences AI sometimes adds despite instructions
function cleanGeneratedCode(code: string): string {
  return code
    .replace(/```typescript/gi, "")
    .replace(/```ts/gi, "")
    .replace(/```/g, "")
    .trim();
}

// Simple delay utility
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}