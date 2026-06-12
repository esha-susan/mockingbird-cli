import { scanProject } from "../scanner/scanner";
import { extractAllRoutes } from "../extractor/extractor";
import { generateAllTests } from "../generator/generator";
import { writeAllTestFiles } from "../writer/writer";

export async function runCLI(): Promise<void> {
  const scanResult = scanProject("./sample-project");

  const routes = extractAllRoutes(scanResult.controllerFiles);

  console.log("\nGenerating tests with Gemini AI...");
  const generationResults = await generateAllTests(routes);

  console.log("\nWriting test files...");
  const writeResults = await writeAllTestFiles(generationResults);

  // Print summary
  console.log("\n--- Write Results ---");
  writeResults.forEach(result => {
    const status = result.success ? "✓" : "✗";
    console.log(`${status} ${result.outputPath} (${result.linesWritten} lines)`);
  });
}