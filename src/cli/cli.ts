import { scanProject } from "../scanner/scanner";
import { extractAllRoutes } from "../extractor/extractor";
import { generateAllTests } from "../generator/generator";
import { writeAllTestFiles } from "../writer/writer";
import { printReport } from "../reporter/reporter";

export async function runCLI(): Promise<void> {
  const startTime = Date.now();

  const scanResult = scanProject("./sample-project");

  const routes = extractAllRoutes(scanResult.controllerFiles);

  console.log("\nGenerating tests with Gemini AI...");
  const generationResults = await generateAllTests(routes);

  console.log("\nWriting test files...");
  const writeResults = await writeAllTestFiles(generationResults);

  const endTime = Date.now();

  printReport({
    scanResult,
    routes,
    generationResults,
    writeResults,
    startTime,
    endTime
  });
}