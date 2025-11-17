#!/usr/bin/env node
/**
 * Checks if node_modules exists and contains required dependencies.
 * If not, runs npm install automatically.
 */
import { existsSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");
const nodeModulesPath = join(projectRoot, "node_modules");
const jestPath = join(nodeModulesPath, "jest");

// Check if node_modules and jest exist
if (!existsSync(nodeModulesPath) || !existsSync(jestPath)) {
  console.log("Dependencies not found. Running npm install...");
  try {
    execSync("npm install", {
      cwd: projectRoot,
      stdio: "inherit",
    });
    console.log("Dependencies installed successfully.");
  } catch (error) {
    console.error("Failed to install dependencies:", error.message);
    process.exit(1);
  }
} else {
  console.log("Dependencies are already installed.");
}
