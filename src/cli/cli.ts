import { scanProject } from "../scanner/scanner";

export function runCLI(): void {
  const result = scanProject("./sample-project");

  console.log("\n--- Scan Result ---");
  console.log("Directory:", result.scannedDirectory);
  console.log("Files found:", result.totalFound);
  result.controllerFiles.forEach(file => {
    console.log(" -", file);
  });
}