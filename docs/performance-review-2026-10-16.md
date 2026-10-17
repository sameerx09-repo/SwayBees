# Performance review — 16 October 2026

The review message now reads **Review under progress**. Both the submission feedback and the review-stage description use this wording; duplicate success text is suppressed once the state updates.

## Finding

The strongest measured bottleneck is database network latency multiplied by sequential reads and writes. The configured database endpoint is in **us-east-1**. From the local development machine, five warm `SELECT 1` calls took **234–236 ms** each. The first connection took **2,157 ms**, including startup/connection overhead. An actual creator-invitation query executed inside PostgreSQL in **0.056 ms**. That query is not CPU- or index-bound at the current data size.

The browser reproduced slow navigation in production mode, so hiding the development indicator alone was insufficient. Two Profile navigations took **2,910 and 2,924 ms** before the changes and **825 and 862 ms** afterwards. Local search took **21 ms before and 20 ms after**. No browser long tasks over 50 ms were observed during the sampled initial creator-page loads. All sampled page resources came from the local app origin; there was no external font or Apify request in that sample. These observations point to server/database waiting rather than a heavy creator interface.

## Changes applied

- Cache session decoding and brand/admin/creator lookups within a single React server request. This is request-scoped memoization, not shared user-data caching.
- Start creator invitation/history reads alongside the creator lookup after validating the signed session and role. Previously the page waited for the creator lookup first. Missing accounts still redirect and all writes remain owner- and state-scoped.
- Fetch creator niches, social accounts and completed-collab counts in the same joined creator query. Profile now needs that joined read and the earnings aggregate, started in parallel, instead of a creator lookup followed by four separate reads.
- Reuse the joined brand/subscription/criteria record between the settings layout and page.
- Run independent admin dashboard reads in parallel and select only the fields needed by the creator selector and collab tables.
- Replace accept's read/update/ledger-insert transaction with one parameterized PostgreSQL statement. The guarded update and pending-ledger insert are atomic. Task payout comes directly from the database; the client does not supply it. Repeated accepts cannot reserve a second payout. Creator actions no longer fetch an entire creator record before issuing the owner-scoped write.
- Add loading boundaries to brand and admin navigation. These provide immediate feedback while uncached data is fetched; they do not claim to eliminate network time.

## Production server measurements

Four sequential HTTP requests per route; warm median is the median of requests 2–4. Times cover receiving and reading the complete HTML stream, not merely receiving response headers. All figures are local measurements against the same remote database and dataset.

| Page | Before, warm median | After, warm median | Before first sample | After first sample |
|---|---:|---:|---:|---:|
| / | 10 ms | 13 ms | 82 ms | 132 ms |
| /creator/login | 8 ms | 10 ms | 14 ms | 22 ms |
| /collabs | 833 ms | 285 ms | 5229 ms | 4443 ms |
| /collabs/history | 558 ms | 286 ms | 836 ms | 549 ms |
| /collabs/profile | 834 ms | 282 ms | 2740 ms | 562 ms |
| /settings | 286 ms | 285 ms | 559 ms | 550 ms |
| /settings/collabs | 835 ms | 282 ms | 1386 ms | 542 ms |
| /admin | 847 ms | 857 ms | 2218 ms | 3015 ms |
| /admin/tasks | 852 ms | 557 ms | 843 ms | 1425 ms |
| /admin/tasks?status=review | 558 ms | 539 ms | 830 ms | 809 ms |
| /admin/insights | 1378 ms | 551 ms | 1378 ms | 1079 ms |

The brand Overview and admin dispatch page have no demonstrated warm-response improvement in these samples; their small differences are within ordinary network variability. Other admin views still have noticeable waiting time. First samples are the first request for that route in the run, not a guarantee of a fully cold server. The first authenticated request after starting the production server remained slow: **5,229 ms before and 4,443 ms after**.

Development measurements also improved for creator pages: Collabs **534 → 363 ms**, History **521 → 406 ms**, Profile **758 → 375 ms** (warm medians). Development mode adds compilation and refresh overhead; production measurements were taken separately rather than assuming those costs explain all delays.

## Browser and action measurements

| Check | Before | After |
|---|---:|---:|
| Browser Profile navigation, two samples | 2,910 / 2,924 ms | 825 / 862 ms |
| Browser Collabs navigation, two samples | 1,382 / 1,350 ms | 839 / 974 ms |
| Browser History navigation, two samples | 864 / 863 ms | 871 / 352 ms |
| Initial creator-page LCP, one cached-assets sample | 1,372 ms | 920 ms |
| Local search, one sample | 21 ms | 20 ms |
| Accept database body, two warm samples | 785 / 796 ms, 3 SQL calls | 261 / 261 ms, 1 SQL call |

Acceptance was benchmarked against the previous implementation within one rolled-back transaction. The timings exclude page refresh and public-action authentication/transaction setup, so **261 ms is not an end-to-end button-click time**. The previous public action also incurred a creator lookup and transaction begin/commit. No real creator's collabs or payouts were modified by these benchmarks.

## Remaining issues, in priority order

1. **Database/app distance and cold connections — current, high impact.** The local machine-to-US-East round trip is a lower bound that frontend changes cannot remove. Colocate the deployed application and database in an appropriate region, and measure the deployed environment before deciding on a region move. Retain connection reuse; investigate database suspension and application cold starts using deployment telemetry. This review does not establish the deployed app's region or measure its live users.
2. **Bulk external dispatch writes sequentially — campaign creation bottleneck.** `src/app/api/external/engagement/tasks/route.ts` lines 179–193 await a task insert and invitation insert for every recipient/type pair. Ten recipients with two types means 40 awaited writes, before setup queries. Batch task and invitation inserts in an atomic operation or queue large dispatches. This path was reviewed in code, not invoked against real campaigns, and does not explain ordinary creator navigation.
3. **Unbounded lists and browser payloads — scale issue.** Creator collabs/history, admin All tasks/Insights and the admin creator selector load complete datasets. The admin dispatch response is about **137 KB of uncompressed HTML/RSC** with only 202 creators; browser virtualization alone would not reduce the server payload. Add server-side pagination and search before growth makes these reads/rendered lists large. Preserve full-history earnings aggregates separately from paginated rows.
4. **Missing supporting indexes — scale preparation, not the current delay.** The inspected schema/index catalog has no composite indexes covering invitation owner/status/date or ledger owner/status. Candidate indexes should be chosen from production query plans. At 52 invitations, the measured sequential scan is 0.056 ms; adding an index now would not fix a 235 ms network round trip. No speculative database migration was applied.
5. **Development-mode expectations and action queues.** Port 5100 remains the development app with live reload. First visits after edits can compile routes. Next's client dispatches server actions sequentially, so rapid actions can queue even though each collab now has its own disabled/loading state. Production serving removes compilation overhead but does not remove database or cold-connection delays.

## Validation and scope

- Production build and TypeScript checks passed; lint passed for all changed files.
- Rollback-only workflow tests passed for ownership, duplicate acceptance, pending-ledger creation, review-only approval, and exactly-once wallet credit.
- Read-only authenticated HTTP checks covered 11 public/creator/brand/admin routes in development and production, before and after.
- Playwright browser checks covered initial paint/main-thread observations, creator navigation and local search in production mode.
- Dataset: **202 creators, 52 invitations, 47 tasks**. This is a small local sample, not a load test, mobile-device benchmark, p95/p99 claim, or deployed-site Core Web Vitals audit. No infrastructure settings, database region, or live campaign data were changed.

Repeatable local tools: `scripts/benchmark-performance.ts`, `scripts/profile-database.ts`, `scripts/benchmark-acceptance.ts`, and `scripts/test-task-workflow.ts`. The page benchmark creates short-lived session tokens in memory and only accepts a localhost server. Database profile queries are read-only; acceptance/workflow fixtures are rolled back.
