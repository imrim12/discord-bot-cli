const CHANNEL_TYPES: Record<number, string> = {
  0: "text",
  2: "voice",
  4: "category",
  5: "announcement",
  10: "thread",
  11: "thread",
  12: "thread",
  13: "stage",
  15: "forum",
  16: "media",
};

export function channelType(type: number): string {
  return CHANNEL_TYPES[type] ?? `unknown(${type})`;
}

export function timestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function truncate(str: string, max = 120): string {
  if (!str) return "";
  const oneLine = str.replace(/\n/g, " ").trim();
  return oneLine.length > max ? oneLine.slice(0, max) + "..." : oneLine;
}

export function table(
  rows: Array<Array<string | number>>,
  headers: string[]
): string {
  if (rows.length === 0) return "  (none)";
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length))
  );
  const sep = widths.map((w) => "-".repeat(w)).join("-+-");
  const fmt = (row: Array<string | number>) =>
    row.map((cell, i) => String(cell ?? "").padEnd(widths[i])).join(" | ");
  return [fmt(headers), sep, ...rows.map(fmt)].join("\n");
}
