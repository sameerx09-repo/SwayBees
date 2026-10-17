// Stub auth for the trendCraft "Drive Engagement" integration — a single
// shared-secret header, explicitly NOT real Brand auth per instruction
// ("let's only put header value, we will integrate auth later"). None of
// the existing session helpers (lib/auth.ts) fit a server-to-server caller
// with no cookie, so this is intentionally separate rather than forced
// into requireBrandSession's shape.
export function checkIntegrationKey(req: Request): boolean {
  const key = process.env.TRENDCRAFT_INTEGRATION_KEY;
  if (!key) return false; // misconfigured server — never silently allow
  return req.headers.get("x-api-key") === key;
}
