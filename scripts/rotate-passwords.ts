import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { saveCredentialExport, generateAccountPassword } from "./lib/credential-vault";
loadEnvConfig(process.cwd());
const db = new PrismaClient();

type Account = { role: "admin" | "brand" | "influencer"; id: string; email: string; passwordHash: string };
async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !["--apply", "--all"].includes(arg))) throw new Error("Use --apply to rotate; add --all only to rotate every account.");
  const [admins, brands, creators] = await Promise.all([
    db.admin.findMany({ select: { id: true, email: true, passwordHash: true } }),
    db.brand.findMany({ select: { id: true, email: true, passwordHash: true } }),
    db.influencer.findMany({ select: { id: true, email: true, passwordHash: true } }),
  ]);
  const accounts: Account[] = [...admins.map(a => ({ ...a, role: "admin" as const })), ...brands.map(a => ({ ...a, role: "brand" as const })), ...creators.map(a => ({ ...a, role: "influencer" as const }))];
  const matches = new Map<string, boolean>();
  const selected: Account[] = [];
  for (const account of accounts) {
    if (!args.includes("--all") && !matches.has(account.passwordHash)) matches.set(account.passwordHash, await bcrypt.compare("password123", account.passwordHash));
    if (args.includes("--all") || matches.get(account.passwordHash)) selected.push(account);
  }
  const counts = Object.fromEntries(["admin", "brand", "influencer"].map(role => [role, selected.filter(a => a.role === role).length]));
  console.log(JSON.stringify({ mode: args.includes("--apply") ? "apply" : "dry-run", scope: args.includes("--all") ? "all accounts" : "known demo password only", accounts: counts }));
  if (!args.includes("--apply")) { console.log("No passwords changed. Use --apply to generate unique passwords and save a plaintext credentials file before updating the database."); return; }
  if (!selected.length) { console.log("No matching accounts; nothing changed."); return; }
  const records: Array<{ account: Account; password: string; newHash: string }> = [];
  for (const account of selected) {
    const password = generateAccountPassword();
    records.push({ account, password, newHash: await bcrypt.hash(password, 10) });
  }
  const vault = saveCredentialExport(records.map(r => ({ role: r.account.role, email: r.account.email, password: r.password })));
  console.log(`Plaintext credentials saved: ${vault}`);
  await db.$transaction(async tx => {
    for (const record of records) {
      const where = { id: record.account.id, passwordHash: record.account.passwordHash };
      const data = { passwordHash: record.newHash };
      const result = record.account.role === "admin" ? await tx.admin.updateMany({ where, data })
        : record.account.role === "brand" ? await tx.brand.updateMany({ where, data }) : await tx.influencer.updateMany({ where, data });
      if (result.count !== 1) throw new Error("An account changed during rotation; the transaction was rolled back.");
    }
  }, { timeout: 120000 });
  console.log("Passwords changed successfully. The plaintext file contains the new credentials; passwords were not logged.");
  console.log("Existing sessions remain valid: rotate SESSION_SECRET in each running deployment and restart/redeploy to sign everyone out.");
  console.log("Open the JSON file on any operating system, save the credentials in your vault, then remove the plaintext copy when finished.");
}
main().catch(() => { console.error("Password rotation did not complete. Credentials are never printed. If a credentials file was saved, retain it for recovery; any failed database transaction was rolled back."); process.exitCode = 1; }).finally(() => db.$disconnect());
