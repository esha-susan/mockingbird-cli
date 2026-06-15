import { Command } from "commander";
import { scanProject } from "../scanner/scanner";
import { extractAllRoutes } from "../extractor/extractor";
import { generateAllTests } from "../generator/generator";
import { writeAllTestFiles } from "../writer/writer";
import { printReport } from "../reporter/reporter";
import { logError, logHeader } from "../utils/logger";

export function runCLI(): void {
  const program = new Command();

  program
    .name("mockingbird")
    .description("AI-powered Jest test generator for Express.js APIs")
    .version("1.0.0");

  program
    .command("run")
    .description("Scan a project and generate Jest tests for its API routes")
    .argument("<projectPath>", "path to the Express.js project to scan")
    .option("-o, --output <dir>", "output directory for generated tests", "tests/generated")
    .action(async (projectPath: string, options: { output: string }) => {
      await handleRunCommand(projectPath, options.output);
    });

  program.parse(process.argv);
}

async function handleRunCommand(projectPath: string, outputDir: string): Promise<void> {
  const startTime = Date.now();

  try {
    logHeader("MOCKINGBIRD — AI Test Generator");

    const scanResult = scanProject(projectPath);

    if (scanResult.totalFound === 0) {
      logError("No controller files found. Nothing to generate.");
      process.exit(1);
    }

    const routes = extractAllRoutes(scanResult.controllerFiles);

    if (routes.length === 0) {
      logError("No routes found in any controller file.");
      process.exit(1);
    }

    console.log("\nGenerating tests with Gemini AI...");
    const generationResults = await generateAllTests(routes);

    
    console.log("\nWriting test files...");
    const writeResults = await writeAllTestFiles(generationResults, outputDir);

    const endTime = Date.now();

    printReport({
      scanResult,
      routes,
      generationResults,
      writeResults,
      startTime,
      endTime
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    logError(`Fatal error: ${message}`);
    process.exit(1);
  }
}