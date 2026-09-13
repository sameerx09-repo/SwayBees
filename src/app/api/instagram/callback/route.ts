import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { requireInfluencerSession } from "@/lib/auth";
import {
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
  fetchInstagramProfile,
} from "@/lib/instagram";

const STATE_COOKIE = "ig_oauth_state";

function redirectWithStatus(
  request: NextRequest,
  status: "connected" | "error",
  message?: string
) {
  const url = new URL("/collabs", request.url);
  url.searchParams.set("instagram", status);
  if (message) url.searchParams.set("instagram_error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const influencer = await requireInfluencerSession();
  if (!influencer) {
    return NextResponse.redirect(new URL("/creator/login", request.url));
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return redirectWithStatus(request, "error", oauthError);
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithStatus(request, "error", "invalid_state");
  }

  try {
    const shortLived = await exchangeCodeForShortLivedToken(code);
    const longLived = await exchangeForLongLivedToken(shortLived.access_token);
    const profile = await fetchInstagramProfile(longLived.access_token);

    await db.influencer.update({
      where: { id: influencer.id },
      data: {
        instagramUserId: profile.user_id,
        instagramConnected: true,
        instagramAccessToken: longLived.access_token,
        instagramTokenExpires: new Date(Date.now() + longLived.expires_in * 1000),
        instagramLastSyncedAt: new Date(),
        followerCount: profile.followers_count,
      },
    });

    return redirectWithStatus(request, "connected");
  } catch (err) {
    console.error("Instagram OAuth callback failed:", err);
    return redirectWithStatus(request, "error", "token_exchange_failed");
  }
}
