// Verification via Apify's Instagram scraper actors — reads PUBLIC
// post/profile data directly by URL, no OAuth token from either the
// brand or the creator required. This replaces the Graph-API-token
// approach that used to live in lib/verification.ts, which had two real
// problems: (1) comment-reading is scoped to the token owner's own
// media, so it could never check a comment on the BRAND's post using
// the CREATOR's token, and (2) UGC verification required a live,
// non-expired creator token, which blocks on Meta App Review.
//
// Actor docs (verified live, not assumed from training data):
// https://apify.com/apify/instagram-comment-scraper
// https://apify.com/apify/instagram-scraper
// API reference: https://docs.apify.com/api/v2/act-run-sync-get-dataset-items-post

const COMMENT_SCRAPER_ACTOR = "apify~instagram-comment-scraper";
const PROFILE_SCRAPER_ACTOR = "apify~instagram-scraper";
const RUN_TIMEOUT_SECONDS = 60;

function requireApifyToken(): string {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error(
      "APIFY_API_TOKEN is not set. Add it to .env — see .env.example. Verification cannot run without an Apify API token."
    );
  }
  return token;
}

async function runActor<T>(actorId: string, input: Record<string, unknown>): Promise<T[]> {
  const token = requireApifyToken();
  const url = `https://api.apify.com/v2/actors/${actorId}/run-sync-get-dataset-items?timeout=${RUN_TIMEOUT_SECONDS}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`Apify actor ${actorId} failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export type ApifyComment = {
  id: string;
  text: string;
  ownerUsername: string;
  timestamp: string;
};

/** Comments on a single public Instagram post/reel, given its full URL. */
export async function scrapeComments(postUrl: string, limit = 50): Promise<ApifyComment[]> {
  return runActor<ApifyComment>(COMMENT_SCRAPER_ACTOR, {
    directUrls: [postUrl],
    resultsLimit: limit,
  });
}

export type ApifyPost = {
  caption: string;
  url: string;
  timestamp: string;
  ownerUsername: string;
};

/** Recent posts on a single public Instagram profile, given its full URL. */
export async function scrapeRecentPosts(profileUrl: string, limit = 20): Promise<ApifyPost[]> {
  return runActor<ApifyPost>(PROFILE_SCRAPER_ACTOR, {
    resultsType: "posts",
    directUrls: [profileUrl],
    resultsLimit: limit,
  });
}

export function profileUrlForHandle(handle: string): string {
  return `https://www.instagram.com/${handle.replace(/^@/, "")}/`;
}
