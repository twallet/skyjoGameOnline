export default {
  testEnvironment: "jsdom",
  transform: {},
  moduleNameMapper: {
    "^https://esm\\.sh/react@18\\?dev$": "react",
    "^https://esm\\.sh/react-dom@18/client\\?dev$": "react-dom/client",
    "^https://esm\\.sh/react@18$": "react",
    "^https://esm\\.sh/react-dom@18/client$": "react-dom/client",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"],
  testMatch: ["**/__tests__/**/*.test.js"],
  roots: ["<rootDir>"],
  testPathIgnorePatterns: ["/node_modules/", "/.vscode/", "/voxelize/"],
};
