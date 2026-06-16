import * as fs from "fs";
import * as path from "path";
import inquirer from "inquirer";
import { logSuccess, logInfo, logError } from "../utils/logger";

export async function runInit(): Promise<void> {
  console.log("\n🐦 Welcome to Mockingbird CLI!\n");

  logInfo("To generate tests, you need a free Google Gemini API key.");
  logInfo("Get one at: https://aistudio.google.com\n");

  const answers = await inquirer.prompt([
    {
      type: "password",
      name: "apiKey",
      message: "Enter your Gemini API key:",
      mask: "*",
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return "API key cannot be empty";
        }
        
        return true;
      }
    }
  ]);

  const envPath = path.resolve(process.cwd(), ".env");
  const envContent = `GEMINI_API_KEY=${answers.apiKey.trim()}\n`;

  try {
    if (fs.existsSync(envPath)) {
      // Read existing .env content
      const existingContent = fs.readFileSync(envPath, "utf-8");

      if (existingContent.includes("GEMINI_API_KEY")) {
        // Key already exists — ask before overwriting just that line
        const overwrite = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirm",
            message: "GEMINI_API_KEY already exists in .env. Update it?",
            default: false
          }
        ]);

        if (!overwrite.confirm) {
          logInfo("Keeping existing GEMINI_API_KEY. Setup cancelled.");
          return;
        }

        // Replace just the GEMINI_API_KEY line, leave everything else untouched
        const updatedContent = existingContent.replace(
          /GEMINI_API_KEY=.*/,
          `GEMINI_API_KEY=${answers.apiKey.trim()}`
        );
        fs.writeFileSync(envPath, updatedContent, "utf-8");

      } else {
        // .env exists but no GEMINI_API_KEY — safely append it
        fs.appendFileSync(envPath, `\nGEMINI_API_KEY=${answers.apiKey.trim()}\n`, "utf-8");
      }

    } else {
      // No .env exists — create a fresh one
      fs.writeFileSync(envPath, envContent, "utf-8");
    }

    logSuccess("\n.env updated successfully!");
    logSuccess("You're all set. Run: mockingbird run <path-to-your-project>");

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError(`Failed to update .env file: ${message}`);
  }
}