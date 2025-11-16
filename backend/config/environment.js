// Resolves current mode, defaulting to development for local runs.
export const NODE_ENV = process.env.NODE_ENV ?? "development";
// Convenience flag to avoid string comparisons throughout the codebase.
export const isTestEnvironment = NODE_ENV === "test";
// Normalizes the server port, ensuring a numeric value with fallback.
export const PORT = Number.parseInt(process.env.PORT ?? "4000", 10);
