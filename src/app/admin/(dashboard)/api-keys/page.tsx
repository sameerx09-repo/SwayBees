import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { CreateApiKeyForm } from "./CreateApiKeyForm";
import { revokeApiKey } from "./actions";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const admin = await requireAdminSession();
  if (!admin) {
    redirect("/admin/login");
  }

  const keys = await db.apiKey.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">API keys</h1>
        <p className="text-sm text-muted mt-1.5 max-w-xl">
          Credentials for external systems calling{" "}
          <code className="font-mono text-[13px]">POST /api/v1/tasks</code> — e.g. a partner
          UGC-creation app dispatching engagement tasks against a brand&rsquo;s own posts. Each
          key authenticates as itself via{" "}
          <code className="font-mono text-[13px]">Authorization: Bearer &lt;key&gt;</code>; the
          brand being acted on is named per-request, not tied to the key.
        </p>
      </div>

      <CreateApiKeyForm />

      <div className="border border-border overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr] px-5.5 py-3 text-[11px] text-muted">
            <div>NAME</div>
            <div>KEY</div>
            <div>CREATED</div>
            <div>LAST USED</div>
            <div>STATUS</div>
          </div>
          {keys.length === 0 ? (
            <div className="text-sm text-muted px-5.5 py-8 text-center border-t border-border-light">
              No API keys yet — create one above to let an external app dispatch tasks.
            </div>
          ) : (
            keys.map((k) => (
              <div
                key={k.id}
                className="grid grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr] items-center px-5.5 py-3 border-t border-border-light"
              >
                <div className="text-sm font-medium">{k.name}</div>
                <div className="font-mono text-xs text-muted">{k.keyPrefix}…</div>
                <div className="text-xs text-muted-strong">{k.createdAt.toLocaleDateString("en-US")}</div>
                <div className="text-xs text-muted-strong">
                  {k.lastUsedAt ? k.lastUsedAt.toLocaleString("en-US") : "Never"}
                </div>
                <div>
                  {k.revokedAt ? (
                    <span className="text-xs text-muted">Revoked</span>
                  ) : (
                    <form action={revokeApiKey}>
                      <input type="hidden" name="id" value={k.id} />
                      <button type="submit" className="text-xs font-medium underline text-red-600">
                        Revoke
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
