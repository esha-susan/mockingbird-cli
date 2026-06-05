import { scanProject } from "../scanner/scanner";
import { extractAllRoutes } from "../extractor/extractor";

export function runCLI(): void {
  const scanResult = scanProject("./sample-project");

  const routes = extractAllRoutes(scanResult.controllerFiles);

  console.log("\n--- Extracted Routes ---");
  console.log(`Total routes found: ${routes.length}\n`);

  routes.forEach(route => {
    console.log(`${route.method.padEnd(7)} ${route.path.padEnd(25)} → ${route.handler}`);
  });
}