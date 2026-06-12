import * as fs from "fs";
import * as path from "path";
import * as prettier from "prettier";
import { GenerationResult } from "../generator/generator";
import { logInfo, logSuccess, logError, logWarning } from "../utils/logger";

export interface WriteResult {
  success: boolean;
  outputPath: string;
  controllerFile: string;
  linesWritten: number;
}

const DEFAULT_OUTPUT_DIR = "tests/generated";

export async function writeTestFile(
  generationResult: GenerationResult,
  outputDir: string = DEFAULT_OUTPUT_DIR
): Promise<WriteResult> {
  if (!generationResult.success || !generationResult.testCode) {
    logWarning(`Skipping write — no test code for: ${generationResult.controllerFile}`);
    return {
      success: false,
      outputPath: "",
      controllerFile: generationResult.controllerFile,
      linesWritten: 0
    };
  }

  const outputPath = buildOutputPath(
    generationResult.controllerFile,
    outputDir
  );

  try {
    ensureDirectoryExists(path.dirname(outputPath));

    const formattedCode = await formatCode(generationResult.testCode);

    fs.writeFileSync(outputPath, formattedCode, "utf-8");

    const linesWritten = formattedCode.split("\n").length;
    logSuccess(`Written: ${outputPath} (${linesWritten} lines)`);

    return {
      success: true,
      outputPath,
      controllerFile: generationResult.controllerFile,
      linesWritten
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError(`Failed to write file: ${message}`);

    return {
      success: false,
      outputPath,
      controllerFile: generationResult.controllerFile,
      linesWritten: 0
    };
  }
}

export async function writeAllTestFiles(
  generationResults: GenerationResult[],
  outputDir: string = DEFAULT_OUTPUT_DIR
): Promise<WriteResult[]> {
  logInfo(`Writing test files to: ${outputDir}`);

  const writeResults: WriteResult[] = [];

  for (const result of generationResults) {
    const writeResult = await writeTestFile(result, outputDir);
    writeResults.push(writeResult);
  }

  return writeResults;
}

function buildOutputPath(controllerFilePath: string, outputDir: string): string {
  const fileName = path.basename(controllerFilePath);

  const baseName = fileName.replace(".ts", "").replace(".js", "");

  const testFileName = `${baseName}.test.ts`;

  return path.join(outputDir, testFileName);
}

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logInfo(`Created directory: ${dirPath}`);
  }
}

async function formatCode(code: string): Promise<string> {
  try {
    const formatted = await prettier.format(code, {
      parser: "typescript",
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: "es5",
      printWidth: 80
    });
    return formatted;
  } catch (error) {
    logWarning("Prettier formatting failed — saving unformatted code");
    return code;
  }
}