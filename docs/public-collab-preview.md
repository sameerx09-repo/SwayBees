# Public collab preview

The homepage retains its brand landing-page hero, workflow illustration, how-it-works section and plan cards. A compact Available collabs section sits directly after the hero and displays three preview rows. Cards contain no repeated signup CTA; clicking any card still opens creator signup. Unsupported creator counts, verification percentages, sample campaign metrics, and automation/payout marketing claims have been removed.

The feed samples up to 24 recent Live Instagram tasks with at least one pending invitation, then selects up to six previews, preferring varied task types. The homepage displays the first three to keep the section compact. It does not expose Test tasks or create/accept an invitation for a visitor.

Each card shows a generic ask derived from the task type (comment, UGC video, share, like or tag a friend), an Instagram post label when available, a fixed brand mask, and a fixed rupee payout mask. Raw descriptions, brand records, payout amounts and task IDs are not selected or serialized into the public UI. Real values are not hidden in tooltips, attributes or CSS blur.

Instagram labels are plain text inside the signup card. Recognized Instagram post/reel shortcodes are displayed without tracking queries or fragments. Profile handles are masked; invalid/non-Instagram URLs and URLs with credentials are discarded. Missing post URLs use an appropriate brief/details placeholder. Every card navigates to `/creator/signup`, including clicks on its displayed URL text; none opens Instagram directly.

Signup remains the existing creator signup flow. Completing registration leads to the creator dashboard, where full details are available for collabs assigned through matching. The preview does not promise that a displayed invitation is available for any new visitor to accept.

The homepage is statically rendered with 60-second revalidation so guests do not wait on a database lookup for every visit. Empty or unavailable feeds show an honest signup prompt without fabricated tasks. No authentication checks or protected API behavior were relaxed.

Validation: `npx tsx scripts/test-public-collab-preview.ts` checks safe projection, rendered markup, URL sanitization, signup links, mode/availability filtering, and UGC handling. Database fixtures are rolled back. Browser checks cover masking, no external Instagram links, signup navigation, zero console errors, and layouts at desktop, tablet and mobile widths. The production build confirms one-minute homepage revalidation.
