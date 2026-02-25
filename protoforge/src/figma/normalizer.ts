import type { DesignSpec } from "./types.ts";

// Incremental: keep it defensive and schema-light until we lock the Figma MCP responses.
export function normalizeFigmaToDesignSpec(input: unknown): DesignSpec {
  const projectName = "FigmaProject";

  return {
    projectName,
    pages: [
      {
        name: "Page1",
        frames: [
          {
            id: "frame-1",
            name: "MainFrame",
            children: [input],
          },
        ],
      },
    ],
  };
}
