import type { McpToolCaller } from "./types.ts";

// Minimal typed wrapper around the Figma MCP server tools.
// This does NOT implement the transport; it expects a tool-caller injected by the runtime (e.g., Copilot Agent Mode).
export class FigmaMcpClient {
  constructor(private readonly callTool: McpToolCaller) {}

  getFile(args: { fileKey: string }) {
    return this.callTool("get_file", args);
  }

  getNodeInfo(args: { fileKey: string; nodeId: string }) {
    return this.callTool("get_node_info", args);
  }

  getStyles(args: { fileKey: string }) {
    return this.callTool("get_styles", args);
  }

  getComponents(args: { fileKey: string }) {
    return this.callTool("get_components", args);
  }

  getImages(args: { fileKey: string; nodeIds: string[]; format?: "png" | "svg"; scale?: number }) {
    return this.callTool("get_images", args);
  }
}
