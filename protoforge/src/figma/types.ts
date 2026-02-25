export type DesignTokenColors = Record<string, string>;

export type DesignSpec = {
  projectName: string;
  pages: Array<{
    name: string;
    frames: Array<{
      id: string;
      name: string;
      children: Array<unknown>;
    }>;
  }>;
  tokens?: {
    colors?: DesignTokenColors;
  };
};

export type McpToolCaller = (toolName: string, args: unknown) => Promise<unknown>;
