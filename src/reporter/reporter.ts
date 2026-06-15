import chalk from "chalk";
import { ScanResult } from "../scanner/scanner";
import { Route } from "../extractor/extractor";
import { GenerationResult } from "../generator/generator";
import { WriteResult } from "../writer/writer";

export interface ReportData {
  scanResult: ScanResult;
  routes: Route[];
  generationResults: GenerationResult[];
  writeResults: WriteResult[];
  startTime: number;
  endTime: number;
}

export function printReport(data: ReportData): void {
  const {
    scanResult,
    routes,
    generationResults,
    writeResults,
    startTime,
    endTime
  } = data;

  const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);
  const successfulGenerations = generationResults.filter(r => r.success);
  const successfulWrites = writeResults.filter(w => w.success);
  const totalLines = writeResults.reduce((sum, w) => sum + w.linesWritten, 0);

  const divider = "═".repeat(45);

  console.log("\n" + chalk.bold.magenta(divider));
  console.log(chalk.bold.magenta("       MOCKINGBIRD GENERATION REPORT"));
  console.log(chalk.bold.magenta(divider) + "\n");

  printStat("Controllers scanned", scanResult.totalFound);
  printStat("Routes found", routes.length);
  printStat("Tests generated", successfulGenerations.length);
  printStat("Tests written", successfulWrites.length);
  printStat("Total lines generated", totalLines);
  printStat("Time taken", `${durationSeconds}s`);

  console.log("\n  " + chalk.bold("Output files:"));
  writeResults.forEach(result => {
    if (result.success) {
      console.log(`   ${chalk.green("✓")} ${result.outputPath}`);
    } else {
      console.log(`   ${chalk.red("✗")} ${result.controllerFile} (failed)`);
    }
  });

  console.log("\n" + chalk.bold.magenta(divider) + "\n");

  const failedCount = generationResults.length - successfulGenerations.length;
  if (failedCount > 0) {
    console.log(
      chalk.yellow(`⚠ ${failedCount} controller(s) failed to generate tests. Check logs above for details.\n`)
    );
  }
}

function printStat(label: string, value: string | number): void {
  const paddedLabel = label.padEnd(24);
  console.log(`  ${paddedLabel} ${chalk.cyan(String(value))}`);
}