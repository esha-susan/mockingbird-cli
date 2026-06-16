# 🐦 Mockingbird CLI

> AI-powered Jest test generator for Express.js backends.

Mockingbird scans your Express.js project, extracts API routes from controller files, and uses Google Gemini AI to automatically generate Jest integration tests — saving hours of manual test writing.

---

## Demo

```bash
$ mockingbird run ./my-express-project

[INFO] Scanning project at: ./my-express-project
[INFO]   Found: userController.ts
[INFO]   Found: authController.ts
[INFO]   Found: productController.ts
[SUCCESS] Found 3 controller file(s)

Generating tests with Gemini AI...
[SUCCESS] Generated 224 lines of test code
[SUCCESS] Generated 189 lines of test code
[SUCCESS] Generated 300 lines of test code

Writing test files...
[SUCCESS] Written: tests/generated/userController.test.ts
[SUCCESS] Written: tests/generated/authController.test.ts
[SUCCESS] Written: tests/generated/productController.test.ts

═══════════════════════════════════════════════
       MOCKINGBIRD GENERATION REPORT
═══════════════════════════════════════════════

  Controllers scanned     3
  Routes found            11
  Tests generated         3
  Tests written           3
  Total lines generated   713
  Time taken              18.45s

  Output files:
   ✓ tests/generated/userController.test.ts
   ✓ tests/generated/authController.test.ts
   ✓ tests/generated/productController.test.ts

═══════════════════════════════════════════════
```

---

## Features

- 🔍 **Recursive project scanning** — walks your entire project tree to find controller files
- 🧠 **AI-powered test generation** — uses Google Gemini to write realistic, meaningful Jest tests
- 📁 **Automatic file writing** — saves generated tests directly to disk, formatted with Prettier
- 📊 **Generation report** — prints a clean summary of everything generated
- ⚡ **Zero configuration** — works out of the box with standard Express.js project structures
- 🎨 **Colored terminal output** — clear, readable logs at every step

---

## Prerequisites

Before using Mockingbird, ensure your machine has:

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **Google Gemini API key** — get one free at [aistudio.google.com](https://aistudio.google.com)

Your target Express.js project should have:

- Controller files named with `Controller.ts`, `controller.ts`, `Router.ts`, or `routes.ts`
- Routes defined using `router.get/post/put/delete/patch(...)` or `app.get/post/...` syntax

---

## Installation

### Install globally from npm

```bash
npm install -g @esha_susan/mockingbird-cli
```

---

## Getting Started

### Step 1 — Install globally
```bash
npm install -g @esha_susan/mockingbird-cli
```

### Step 2 — Set up your API key
Navigate to your project directory first, then run:
```bash
cd your-express-project
mockingbird init
```
This creates or updates a `.env` file in your current directory with your Gemini API key.

> ⚠️ If your project already has a `.env` file, Mockingbird will safely **append** the key to it — your existing secrets (database passwords, JWT keys, etc.) are never touched or overwritten.

### Step 3 — Generate tests
```bash
mockingbird run .
```

That's it. Your generated test files will appear in `tests/generated/` inside your project.

---

## Commands

### `mockingbird init`
Set up your Gemini API key. Run this once before using the tool.
```bash
mockingbird init
```

### `mockingbird run <projectPath>`
Scan a project and generate Jest tests for all detected API routes.
```bash
# Scan current directory
mockingbird run .

# Scan a specific path
mockingbird run ./my-express-api

# Custom output directory
mockingbird run ./my-express-api --output ./tests/ai-generated
```

Create a `.env` file in your **Mockingbird** directory (not your target project):

```bash
GEMINI_API_KEY=your_api_key_here
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

---

## Usage

### Basic usage

```bash
mockingbird run <path-to-your-express-project>
```

### With custom output directory

```bash
mockingbird run <path-to-your-express-project> --output ./custom-tests
```

### Examples

```bash
# Scan a project in the current directory
mockingbird run .

# Scan a project at a specific path
mockingbird run ./my-express-api

# Save tests to a custom folder
mockingbird run ./my-express-api --output ./tests/ai-generated
```

### Help

```bash
mockingbird --help
mockingbird run --help
```

---

## How It Works

Mockingbird runs a 5-step pipeline:

SCAN      Recursively walks the project directory

1. Finds files matching controller naming patterns

↓
2. EXTRACT   Reads each controller file

Uses regex to find route definitions

Extracts: HTTP method, path, handler name

↓
3. GENERATE  Groups routes by controller

Sends route data to Google Gemini AI

Receives Jest + Supertest test code

↓
4. WRITE     Formats code with Prettier

Creates output directory if needed

Saves .test.ts files to disk

↓
5. REPORT    Prints a summary of everything generated

Shows file paths, line counts, timing

Each step is a separate module with a single responsibility. If any step fails, the error is caught and reported cleanly — the pipeline continues for other controllers.

---

## Project Structure
mockingbird-cli/

├── src/

│   ├── index.ts              ← Entry point, loads environment variables

│   ├── cli/

│   │   └── cli.ts            ← Commander.js CLI definition and orchestration

│   ├── scanner/

│   │   └── scanner.ts        ← Recursive directory traversal

│   ├── extractor/

│   │   └── extractor.ts      ← Regex-based route extraction

│   ├── generator/

│   │   └── generator.ts      ← Gemini AI integration

│   ├── writer/

│   │   └── writer.ts         ← File creation and Prettier formatting

│   ├── reporter/

│   │   └── reporter.ts       ← Terminal report generation

│   └── utils/

│       └── logger.ts         ← Colored terminal logging

├── package.json

├── tsconfig.json

└── README.md

---

## Running Tests

Mockingbird has a unit test suite covering its core logic:

```bash
npm test
```

Test coverage includes:
- **Scanner** — controller file detection patterns
- **Extractor** — regex route parsing across different Express patterns
- **Writer** — output path generation
- **Generator** — AI response cleaning and markdown fence removal

---

## Tech Stack

| Technology | Purpose | Why chosen |
|---|---|---|
| **TypeScript** | Primary language | Type safety catches bugs at compile time, not runtime |
| **Node.js** | Runtime | Native file system access, ideal for CLI tooling |
| **Commander.js** | CLI framework | Industry standard for Node.js CLIs, automatic help generation |
| **Google Gemini AI** | Test generation | Fast, free tier available, strong code generation capability |
| **Prettier** | Code formatting | Ensures generated tests are consistently formatted |
| **Chalk** | Terminal colors | Makes CLI output readable and professional |
| **Jest** | Test framework | Industry standard for Node.js/TypeScript testing |
| **dotenv** | Environment config | Keeps API keys out of source code |

---

## Limitations

Mockingbird works best with standard Express.js patterns. The following are known limitations:

- **Regex-based extraction** — routes defined dynamically (inside loops, conditionals, or factory functions) may not be detected
- **Express.js only** — currently supports Express route syntax (`router.get`, `app.post`, etc.)
- **Generated tests need a real app** — the generated test files assume your project exports an Express `app` object and has `jest`, `supertest`, and `@types/jest` installed
- **AI non-determinism** — Gemini may generate slightly different tests on repeated runs for the same routes

### Required dependencies in target project

Before running the generated tests in your Express project:

```bash
npm install --save-dev jest @types/jest supertest @types/supertest ts-jest
```

---

## Future Improvements

- [ ] AST-based route extraction for more complex patterns
- [ ] Support for Fastify, Koa, and Hapi frameworks
- [ ] Configurable test templates
- [ ] Watch mode — regenerate tests when controllers change
- [ ] CI/CD integration guide

---


## Author

Built by ESHA SUSAN SHAJI(https://github.com/esha-susan) as a portfolio project demonstrating:
- CLI tool development with Node.js and TypeScript
- AI API integration (Google Gemini)
- Modular software architecture
- Automated code generation
