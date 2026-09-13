import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { buildCsv, csvResponse } from "@/lib/csv";

/**
 * One row per creator with any credited earnings — handle, email, how
 * many collabs credited, what they add up to, and the creator's current
 * wallet balance. The monthly payout itself is still a manual, off-
 * platform process (no payment gateway — see WIP.md), so this is the
 * sheet an admin actually pays from rather than reading balances off
 * 100+ individual rows in the app.
 */
export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return new Response("Not signed in.", { status: 401 });
  }

  const credited = await db.taskInvitation.findMany({
    where: { status: "CREDITED" },
    include: { task: true, influencer: true },
  });

  const byCreator = new Map<
    string,
    { handle: string; email: string; walletBalance: number; count: number; total: number }
  >();

  for (const inv of credited) {
    const existing = byCreator.get(inv.influencerId);
    if (existing) {
      existing.count += 1;
      existing.total += inv.task.payoutAmount;
    } else {
      byCreator.set(inv.influencerId, {
        handle: inv.influencer.handle,
        email: inv.influencer.email,
        walletBalance: inv.influencer.walletBalance,
        count: 1,
        total: inv.task.payoutAmount,
      });
    }
  }

  const headers = [
    "Creator Handle",
    "Creator Email",
    "Credited Collabs",
    "Total Credited",
    "Current Wallet Balance",
  ];

  const rows = Array.from(byCreator.values())
    .sort((a, b) => b.total - a.total)
    .map((c) => [c.handle, c.email, c.count, c.total.toFixed(2), c.walletBalance.toFixed(2)]);

  const csv = buildCsv(headers, rows);
  const filename = `swayfam-payouts-${new Date().toISOString().slice(0, 10)}.csv`;
  return csvResponse(csv, filename);
}
