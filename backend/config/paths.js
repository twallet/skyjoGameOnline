import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const backendRoot = path.resolve(currentDir, "..");
export const projectRoot = path.resolve(backendRoot, "..");
export const frontendRoot = path.join(projectRoot, "frontend");
export const staticRoot = frontendRoot;
