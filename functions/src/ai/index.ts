import { genkit, z } from "genkit/beta";
import { googleAI } from "@genkit-ai/googleai";
import { enableFirebaseTelemetry } from "@genkit-ai/firebase";

import { logger } from "genkit/logging";
import { githubClient } from "./agent/tools/github-mcp";

logger.setLogLevel("debug");
enableFirebaseTelemetry();

// Initialize the AI client with Google AI and GitHub MCP
export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLEAI_API_KEY }), githubClient],
  model: googleAI.model("gemini-2.5-flash-preview-04-17"),
});

export { z };
