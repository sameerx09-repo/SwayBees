import { requireApiKey } from "@/lib/api-auth";

// Named-client allowlist, separate from (and in addition to) the API
// key itself — the key proves the request is authenticated, this header
// says which known caller it claims to be. Case-sensitive exact match;
// add a client here as new integrations come online. Shared by every
// route under app/api/v1 so the check can't drift between them.
const CLIENT_NAME_HEADER = "x-client-name";
const ALLOWED_CLIENTS = new Set(["TrendCraft", "Admin"]);

export async function authenticateExternalRequest(
  request: Request
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const apiKey = await requireApiKey(request);
  if (!apiKey) {
    return { ok: false, response: Response.json({ error: "Missing or invalid API key." }, { status: 401 }) };
  }

  const clientName = request.headers.get(CLIENT_NAME_HEADER);
  if (!clientName || !ALLOWED_CLIENTS.has(clientName)) {
    return {
      ok: false,
      response: Response.json(
        { error: `${CLIENT_NAME_HEADER} header must be one of: ${Array.from(ALLOWED_CLIENTS).join(", ")}` },
        { status: 403 }
      ),
    };
  }

  return { ok: true };
}
