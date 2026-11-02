import * as React from "react";
import * as ReactDOM from "react-dom";
import { createRoot, hydrateRoot } from "react-dom/client";
globalThis.React = React;
globalThis.ReactDOM = ReactDOM;
globalThis.ReactDOMClient = { createRoot, hydrateRoot };
