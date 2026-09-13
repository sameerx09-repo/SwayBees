import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { buildAuthorizeUrl } from "@/lib/instagram";
import { requireInfluencerSession } from "@/lib/auth";

const STATE_COOKIE = "ig_oauth_state";

function redirectWithError(request: NextRequest, message: string) {
  const url = new URL("/collabs", request.url);
  url.searchParams.set("instagram", "error");
  url.searchParams.set("instagram_error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const influencer = await requireInfluencerSession();
  if (!influencer) {
    return NextResponse.redirect(new URL("/creator/login", request.url));
  }

  const state = crypto.randomBytes(16).toString("hex");
  let authorizeUrl: string;
  try {
    authorizeUrl = buildAuthorizeUrl(state);
  } catch (err) {
    // Missing Meta App credentials — fail with a visible, explained
    // banner instead of an uncaught 500.
    return redirectWithError(
      request,
      err instanceof Error ? err.message : "Instagram isn't configured yet."
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes — plenty for the redirect round-trip
    path: "/",
  });

  return NextResponse.redirect(authorizeUrl);
}
