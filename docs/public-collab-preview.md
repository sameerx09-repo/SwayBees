# Public collab preview

The homepage follows the approved shared brand/creator design. Its hero and mobile-visible navigation offer separate audience paths; creator collabs sit beneath the hero, followed by clearly labelled brand workflow and plan sections. Two rows marked Example show Create 1 UGC video and Join a campaign and complete multiple tasks. These are illustrative formats, not claimed current inventory; a separate Available collabs list displays three actual Live previews. Cards contain no repeated signup CTA; clicking any card opens creator signup. Unsupported statistics and automation claims remain removed.

The feed samples up to 24 recent Live Instagram tasks with at least one pending invitation, then selects up to six previews, preferring varied task types. The homepage displays the first three to keep the section compact. It does not expose Test tasks or create/accept an invitation for a visitor.

Each card shows a generic ask derived from the task type (comment, UGC video, share, like or tag a friend), an Instagram post label when available, a fixed brand mask, and a fixed rupee payout mask. Raw descriptions, brand records, payout amounts and task IDs are not selected or serialized into the public UI. Real values are not hidden in tooltips, attributes or CSS blur.

Instagram labels are plain text inside the signup card. Recognized Instagram post/reel shortcodes are displayed without tracking queries or fragments. Profile handles are masked; invalid/non-Instagram URLs and URLs with credentials are discarded. Missing post URLs use an appropriate brief/details placeholder. Every card navigates to `/creator/signup`, including clicks on its displayed URL text; none opens Instagram directly.

Signup remains the existing creator signup flow. Completing registration leads to the creator dashboard, where full details are available for collabs assigned through matching. The preview does not promise that a displayed invitation is available for any new visitor to accept.

The homepage is statically rendered with 60-second revalidation so guests do not wait on a database lookup for every visit. Empty or unavailable feeds show an honest signup prompt without fabricated tasks. No authentication checks or protected API behavior were relaxed.

Validation: `npx tsx scripts/test-public-collab-preview.ts` checks safe projection, rendered markup, URL sanitization, signup links, mode/availability filtering, and UGC handling. Database fixtures are rolled back. Browser checks cover masking, no external Instagram links, signup navigation, zero console errors, and layouts at desktop, tablet and mobile widths. The production build confirms one-minute homepage revalidation.

Audience-specific navigation and forms: `/login` begins with a neutral account choice, with explicit Brand log in or Creator log in headings once selected. Brand signup is labelled Create your brand account. Starter/Pro links pass an allowlisted plan through account signup to the campaign step. No campaign grouping or creator campaign-management workflow was introduced by the illustrative campaign row.

Homepage browser checks cover 1280, 768, 390 and 320-pixel widths; both audience links remain visible without horizontal overflow. Example rows are labelled separately from current availability, and the preview privacy regression test still passes.
