#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config();

import { runCLI } from "./cli/cli";

runCLI()