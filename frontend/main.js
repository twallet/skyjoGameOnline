/**
 * React library import from CDN (production mode)
 */
import React from "https://esm.sh/react@18";
/**
 * React DOM client API for creating root and rendering
 */
import { createRoot } from "https://esm.sh/react-dom@18/client";

/**
 * Main application component
 */
import { App } from "./components/App.js";

/**
 * Get the root DOM element where the React app will be mounted
 * @type {HTMLElement}
 */
const container = document.getElementById("root");
/**
 * Create a React root instance for concurrent rendering
 * @type {import('react-dom/client').Root}
 */
const root = createRoot(container);

/**
 * Render the App component into the root element
 */
root.render(React.createElement(App));
