const GENERIC_LABELS = new Set([
  "",
  "asset",
  "untitled",
  "untitled asset",
  "output",
  "generated output",
  "image",
  "reference",
]);

export function suggestedStableHandle(label: string): string {
  const slug = label
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "")
    .slice(0, 28);
  const base = slug.length ? slug : "Asset";
  return `@${base}`;
}

export function isGenericAssetLabel(label: string): boolean {
  return GENERIC_LABELS.has(label.trim().toLowerCase());
}
