import React from "https://esm.sh/react@18?dev";
import { createRoot } from "https://esm.sh/react-dom@18/client?dev";

import { App } from "./components/App.js";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(React.createElement(App));
