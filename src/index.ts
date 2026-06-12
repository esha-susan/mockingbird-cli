import dotenv from "dotenv";
dotenv.config();

import { runCLI } from "./cli/cli";

runCLI().catch(error => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});