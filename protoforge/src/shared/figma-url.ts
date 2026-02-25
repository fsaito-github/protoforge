export type FigmaSource = {
  url: string;
  fileKey: string;
  nodeId?: string;
};

export function parseFigmaUrl(url: string): FigmaSource {
  const u = new URL(url);

  // Supported paths:
  // - /file/<fileKey>/...
  // - /design/<fileKey>/...
  // - /proto/<fileKey>/...
  // - /community/file/<fileKey>/...
  const path = u.pathname;

  const m1 = path.match(/^\/(file|design|proto)\/([^/]+)\//);
  const m2 = path.match(/^\/community\/file\/([^/]+)\//);
  const fileKey = (m1?.[2] ?? m2?.[1])?.trim();
  if (!fileKey) {
    throw new Error("Could not extract fileKey from Figma URL");
  }

  const nodeId = u.searchParams.get("node-id") ?? undefined;

  return { url, fileKey, nodeId };
}
