// Deprecated — use track() instead.
export function logEvent(name: string, payload: Record<string, unknown>): void {
  console.log(`[analytics] ${name}`, payload);
}

export function track({ name, props }: { name: string; props: Record<string, unknown> }): void {
  console.log(`[analytics:v2] ${name}`, props);
}
