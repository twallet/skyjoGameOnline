// Standard path helpers for building consistent absolute paths.
import path from "node:path";
import { fileURLToPath } from "node:url";

// Base directory derived from this config file location.
const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Absolute roots used across backend scripts and build tooling.
export const backendRoot = path.resolve(currentDir, "..");
export const projectRoot = path.resolve(backendRoot, "..");
export const staticRoot = path.join(projectRoot, "frontend");
export const sharedRoot = path.join(projectRoot, "shared");
