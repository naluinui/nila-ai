import { mcpClient } from "genkitx-mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export const githubClient = mcpClient({
  name: "github",
  version: "1.12.0",
  transport: new StreamableHTTPClientTransport(
    new URL("https://api.githubcopilot.com/mcp/"),
    {
      requestInit: {
        headers: {
          authorization: `Bearer ${
            process.env.GITHUB_PERSONAL_ACCESS_TOKEN || ""
          }`,
        },
      },
    }
  ),
});
