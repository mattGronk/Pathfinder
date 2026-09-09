export type ResponseSignal = { key: string; label: string; count: number };

/** Response counts are not ability scores or career-match percentages. */
export function responseChartData(signals: ResponseSignal[], total: number) {
  if (!Number.isInteger(total) || total <= 0) return [];
  if (signals.some(s => !Number.isInteger(s.count) || s.count < 0 || s.count > total)) return [];
  if (new Set(signals.map(s => s.key)).size !== signals.length) return [];
  if (signals.reduce((sum, s) => sum + s.count, 0) > total) return [];
  return signals.filter(s => s.count > 0).map((s, index) => ({
    key: s.key, label: s.label, responses: s.count, rank: String(index + 1).padStart(2, "0"),
  }));
}
