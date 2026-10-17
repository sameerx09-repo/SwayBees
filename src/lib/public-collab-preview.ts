import type { TaskType } from "@prisma/client";

const PUBLIC_ASK: Record<TaskType, { title: string; description: string; label: string }> = {
  COMMENT: { title: "Comment on an Instagram post", description: "Leave a thoughtful comment following the collab brief.", label: "Comment" },
  UGC_VIDEO: { title: "Create a UGC video", description: "Create an original video following the brand brief.", label: "UGC video" },
  SHARE: { title: "Share an Instagram post", description: "Share content with your audience following the collab brief.", label: "Share" },
  LIKE: { title: "Like an Instagram post", description: "Like the post specified in the collab brief.", label: "Like" },
  TAG_FRIEND: { title: "Tag a friend in a comment", description: "Tag a friend on the post specified in the collab brief.", label: "Tag a friend" },
};

/** Public post shortcodes are safe to display; profile handles and tracking parameters are withheld. */
export function publicInstagramLabel(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !["instagram.com", "www.instagram.com", "m.instagram.com"].includes(url.hostname) || url.username || url.password || url.port) return null;
    const match = url.pathname.match(/^\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)\/?$/);
    return match ? `instagram.com/${match[1]}/${match[2]}/` : "instagram.com/••••••";
  } catch { return null; }
}

export type PublicCollabPreview = {
  type: TaskType;
  title: string;
  description: string;
  label: string;
  instagramLabel: string | null;
};

/** Allowlisted projection: never pass raw task briefs, brand records, payout amounts or IDs to public UI. */
export function toPublicCollabPreview(task: { type: TaskType; targetPostUrl: string | null }): PublicCollabPreview {
  return { type: task.type, ...PUBLIC_ASK[task.type], instagramLabel: publicInstagramLabel(task.targetPostUrl) };
}
