export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const isTestEnvironment = NODE_ENV === "test";
export const PORT = Number.parseInt(process.env.PORT ?? "4000", 10);

