// Instagram API with Instagram Login (Business Login) — the 2024+ flow
// that reads a Professional (Business/Creator) account's own data without
// requiring a linked Facebook Page. Endpoint/param names verified against
// Meta's current docs as of this writing:
// https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
// https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started

const AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
const TOKEN_EXCHANGE_URL = "https://api.instagram.com/oauth/access_token";
const LONG_LIVED_TOKEN_URL = "https://graph.instagram.com/access_token";
const GRAPH_API_VERSION = "v25.0";

// instagram_business_basic: profile + media reads (followers_count,
// media_count, media list) — this OAuth connection is now only used to
// show a creator their own stats on /collabs/profile. Task verification
// (UGC posts and comments) runs through Apify's public scrapers instead
// (lib/apify.ts, lib/verification.ts) — no comment-management scope
// needed, since that path never actually worked for checking a comment
// on a post this account doesn't own.
export const INSTAGRAM_SCOPES = ["instagram_business_basic"].join(",");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Add it to .env — see .env.example. Instagram OAuth cannot run without real Meta App credentials.`
    );
  }
  return value;
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("INSTAGRAM_CLIENT_ID"),
    redirect_uri: requireEnv("INSTAGRAM_REDIRECT_URI"),
    scope: INSTAGRAM_SCOPES,
    response_type: "code",
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

type ShortLivedTokenResponse = {
  access_token: string;
  user_id: string;
  permissions?: string[];
};

export async function exchangeCodeForShortLivedToken(
  code: string
): Promise<ShortLivedTokenResponse> {
  const body = new URLSearchParams({
    client_id: requireEnv("INSTAGRAM_CLIENT_ID"),
    client_secret: requireEnv("INSTAGRAM_CLIENT_SECRET"),
    grant_type: "authorization_code",
    redirect_uri: requireEnv("INSTAGRAM_REDIRECT_URI"),
    code,
  });

  const res = await fetch(TOKEN_EXCHANGE_URL, { method: "POST", body });
  if (!res.ok) {
    throw new Error(`Instagram token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

type LongLivedTokenResponse = {
  access_token: string;
  token_type: "bearer";
  expires_in: number; // seconds, ~60 days
};

export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<LongLivedTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: requireEnv("INSTAGRAM_CLIENT_SECRET"),
    access_token: shortLivedToken,
  });

  const res = await fetch(`${LONG_LIVED_TOKEN_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Instagram long-lived token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export type InstagramProfile = {
  user_id: string;
  username: string;
  account_type: "BUSINESS" | "MEDIA_CREATOR" | string;
  followers_count: number;
  media_count: number;
};

export async function fetchInstagramProfile(
  accessToken: string
): Promise<InstagramProfile> {
  const params = new URLSearchParams({
    fields: "user_id,username,account_type,followers_count,media_count",
    access_token: accessToken,
  });

  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_API_VERSION}/me?${params.toString()}`
  );
  if (!res.ok) {
    throw new Error(`Instagram profile fetch failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
