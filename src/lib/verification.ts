// Real verification logic, now via Apify's public-data scrapers
// (lib/apify.ts) instead of Meta's Graph API:
//   - UGC video: scrape the creator's own public profile for a new post
//     whose caption contains the required tag/mention.
//   - Comment / Tag a Friend: scrape the target post's public comments
//     for one authored by the connected influencer's handle — Tag a
//     Friend additionally requires an @mention in that comment.
// Neither requires an OAuth token from the brand or the creator — only
// public URLs (Brand.instagramHandle, Influencer.handle, and the task's
// targetPostUrl). This fixes a real bug in the prior Graph-API version:
// comment-reading there was scoped to the token owner's own media, so
// it could never check a comment on the BRAND's post using the
// CREATOR's token. See lib/apify.ts for why.
// Like / Share have no verification path at all here — see the
// TaskType enum comment in schema.prisma — checkVerification
// (app/collabs/actions.ts) reports those as pending manual review before
// ever calling into this file.

import type { Influencer, Task } from "@prisma/client";
import { scrapeComments, scrapeRecentPosts, profileUrlForHandle } from "@/lib/apify";

export type VerificationResult =
  | { verified: true }
  | { verified: false; reason: string };

function reasonFor(err: unknown): string {
  return err instanceof Error ? err.message : "Verification lookup failed.";
}

export async function verifyUgcPost(
  influencer: Influencer,
  task: Task
): Promise<VerificationResult> {
  if (!task.verificationTag) {
    return {
      verified: false,
      reason: "This collab has no verification tag configured.",
    };
  }

  let posts;
  try {
    posts = await scrapeRecentPosts(profileUrlForHandle(influencer.handle), 20);
  } catch (err) {
    return { verified: false, reason: reasonFor(err) };
  }

  const match = posts.find(
    (post) =>
      new Date(post.timestamp) >= task.createdAt &&
      post.caption?.toLowerCase().includes(task.verificationTag!.toLowerCase())
  );

  return match
    ? { verified: true }
    : {
        verified: false,
        reason:
          "No matching public post found yet — the creator's Instagram profile must be public for this to work.",
      };
}

/**
 * Handles both COMMENT and TAG_FRIEND tasks — same underlying check
 * (a comment from the creator on the target post), with TAG_FRIEND
 * additionally requiring at least one @mention in that comment's text.
 */
export async function verifyComment(
  influencer: Influencer,
  task: Task
): Promise<VerificationResult> {
  if (!task.targetPostUrl) {
    return {
      verified: false,
      reason: "This collab has no target post configured.",
    };
  }

  let comments;
  try {
    comments = await scrapeComments(task.targetPostUrl, 50);
  } catch (err) {
    return { verified: false, reason: reasonFor(err) };
  }

  const handle = influencer.handle.replace(/^@/, "").toLowerCase();
  const match = comments.find(
    (c) =>
      c.ownerUsername.toLowerCase() === handle && new Date(c.timestamp) >= task.createdAt
  );

  if (!match) {
    return { verified: false, reason: "No matching comment found yet." };
  }

  if (task.type === "TAG_FRIEND" && !/@[\w.]+/.test(match.text)) {
    return {
      verified: false,
      reason: "Found your comment, but it doesn't tag anyone yet — add an @mention.",
    };
  }

  return { verified: true };
}
