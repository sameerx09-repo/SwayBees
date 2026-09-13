import type { InvitationStatus, Platform, TaskType } from "@prisma/client";

// Flattened one-row-per-invitation shape, built from a single query in
// admin/insights/page.tsx. Every breakdown below is computed in memory
// from this one array — at this app's scale (hundreds, not millions,
// of invitations) that's simpler and just as fast as a SQL GROUP BY,
// and it means every cut shares one exact definition of "completed."
export type InsightRow = {
  id: string;
  status: InvitationStatus;
  taskId: string;
  taskType: TaskType;
  taskPlatform: Platform;
  payoutAmount: number;
  brandId: string | null;
  brandName: string | null;
  influencerId: string;
  influencerHandle: string;
  influencerFollowerCount: number;
  influencerNiches: string[];
};

const IN_PROGRESS: InvitationStatus[] = ["ACCEPTED", "SUBMITTED", "VERIFYING"];

function pct(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);
}

export type Overview = {
  totalInvitations: number;
  distinctTasks: number;
  activeBrands: number;
  activeCreators: number;
  pending: number;
  inProgress: number;
  declined: number;
  credited: number;
  completionRate: number;
  totalCommitted: number;
  totalCredited: number;
};

export function computeOverview(rows: InsightRow[]): Overview {
  const distinctTasks = new Set(rows.map((r) => r.taskId)).size;
  const activeBrands = new Set(rows.filter((r) => r.brandId).map((r) => r.brandId)).size;
  const activeCreators = new Set(rows.map((r) => r.influencerId)).size;
  const pending = rows.filter((r) => r.status === "PENDING").length;
  const inProgress = rows.filter((r) => IN_PROGRESS.includes(r.status)).length;
  const declined = rows.filter((r) => r.status === "DECLINED").length;
  const credited = rows.filter((r) => r.status === "CREDITED").length;

  return {
    totalInvitations: rows.length,
    distinctTasks,
    activeBrands,
    activeCreators,
    pending,
    inProgress,
    declined,
    credited,
    completionRate: pct(credited, rows.length),
    totalCommitted: rows.reduce((sum, r) => sum + r.payoutAmount, 0),
    totalCredited: rows
      .filter((r) => r.status === "CREDITED")
      .reduce((sum, r) => sum + r.payoutAmount, 0),
  };
}

export type BrandBreakdown = {
  key: string;
  name: string;
  taskCount: number;
  invitationCount: number;
  credited: number;
  declined: number;
  completionRate: number;
  totalCommitted: number;
  totalCredited: number;
};

export function computeByBrand(rows: InsightRow[]): BrandBreakdown[] {
  const groups = new Map<string, InsightRow[]>();
  for (const row of rows) {
    const key = row.brandId ?? "__adhoc__";
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  return Array.from(groups.entries())
    .map(([key, group]) => {
      const credited = group.filter((r) => r.status === "CREDITED").length;
      return {
        key,
        name: key === "__adhoc__" ? "SwayFam (ad-hoc)" : group[0].brandName!,
        taskCount: new Set(group.map((r) => r.taskId)).size,
        invitationCount: group.length,
        credited,
        declined: group.filter((r) => r.status === "DECLINED").length,
        completionRate: pct(credited, group.length),
        totalCommitted: group.reduce((sum, r) => sum + r.payoutAmount, 0),
        totalCredited: group
          .filter((r) => r.status === "CREDITED")
          .reduce((sum, r) => sum + r.payoutAmount, 0),
      };
    })
    .sort((a, b) => b.totalCredited - a.totalCredited);
}

export type CreatorBreakdown = {
  id: string;
  handle: string;
  niches: string[];
  followerCount: number;
  invitationCount: number;
  credited: number;
  declined: number;
  completionRate: number;
  totalEarned: number;
};

export function computeByCreator(rows: InsightRow[]): CreatorBreakdown[] {
  const groups = new Map<string, InsightRow[]>();
  for (const row of rows) {
    const list = groups.get(row.influencerId) ?? [];
    list.push(row);
    groups.set(row.influencerId, list);
  }

  return Array.from(groups.entries())
    .map(([id, group]) => {
      const credited = group.filter((r) => r.status === "CREDITED").length;
      return {
        id,
        handle: group[0].influencerHandle,
        niches: group[0].influencerNiches,
        followerCount: group[0].influencerFollowerCount,
        invitationCount: group.length,
        credited,
        declined: group.filter((r) => r.status === "DECLINED").length,
        completionRate: pct(credited, group.length),
        // Summed from these rows' credited payouts, not the influencer's
        // actual walletBalance — the two normally agree, but at least
        // one seeded demo account (prisma/seed.ts) has a hardcoded
        // starting balance predating the real ledger system, so
        // walletBalance can run ahead of what's actually attributable
        // to tracked invitations. This column answers "what did the
        // collabs in this view pay out," not "what's in their wallet."
        totalEarned: group
          .filter((r) => r.status === "CREDITED")
          .reduce((sum, r) => sum + r.payoutAmount, 0),
      };
    })
    .sort((a, b) => b.totalEarned - a.totalEarned);
}

export type TypeBreakdown = {
  type: TaskType;
  invitationCount: number;
  credited: number;
  completionRate: number;
  totalCommitted: number;
  totalCredited: number;
};

export function computeByType(rows: InsightRow[]): TypeBreakdown[] {
  const groups = new Map<TaskType, InsightRow[]>();
  for (const row of rows) {
    const list = groups.get(row.taskType) ?? [];
    list.push(row);
    groups.set(row.taskType, list);
  }

  return Array.from(groups.entries())
    .map(([type, group]) => {
      const credited = group.filter((r) => r.status === "CREDITED").length;
      return {
        type,
        invitationCount: group.length,
        credited,
        completionRate: pct(credited, group.length),
        totalCommitted: group.reduce((sum, r) => sum + r.payoutAmount, 0),
        totalCredited: group
          .filter((r) => r.status === "CREDITED")
          .reduce((sum, r) => sum + r.payoutAmount, 0),
      };
    })
    .sort((a, b) => b.invitationCount - a.invitationCount);
}

export type PlatformBreakdown = {
  platform: Platform;
  invitationCount: number;
  credited: number;
  completionRate: number;
};

export function computeByPlatform(rows: InsightRow[]): PlatformBreakdown[] {
  const groups = new Map<Platform, InsightRow[]>();
  for (const row of rows) {
    const list = groups.get(row.taskPlatform) ?? [];
    list.push(row);
    groups.set(row.taskPlatform, list);
  }

  return Array.from(groups.entries())
    .map(([platform, group]) => {
      const credited = group.filter((r) => r.status === "CREDITED").length;
      return {
        platform,
        invitationCount: group.length,
        credited,
        completionRate: pct(credited, group.length),
      };
    })
    .sort((a, b) => b.invitationCount - a.invitationCount);
}
