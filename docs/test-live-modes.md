# Test and Live modes

Use the **Mode** selector in the creator, brand, or admin header. The choice is saved in an HTTP-only browser cookie and is retained when navigating between these dashboards. It changes this browser's view, not a global setting for every user.

- Live shows only Live collabs, history, completed counts, earnings, review queues and insights.
- Test shows only Test equivalents, with a visible Test banner and separate simulated test balance.
- Admin dispatch and brand task generation create tasks in the selected mode.
- Actions are scoped by task mode on the server. A stale Live form cannot accept, decline, submit, or approve a Test task, and vice versa.
- Test approval credits only `testWalletBalance`. Live approval credits only `walletBalance`. Profile/history earnings and counts filter by the invitation's task mode.
- Verification CSV exports follow the selected mode and include a Mode column. Live payout CSV exports always exclude Test tasks; payout exports are unavailable in Test mode.
- Test brand task generation skips Apify target-post discovery. Creator actions and manual review do not automatically publish social content in either mode.

Accounts, profile settings, subscriptions and API credentials are shared between modes. Test/Live separation applies to tasks, task-derived statistics and earnings, not duplicate user identities. The legacy engagement integration uses a separate synthetic brand identity for Test requests so Test campaign setup cannot overwrite its Live synthetic brand configuration.

## API contract

| Endpoint | Mode input | Default | Successful response |
|---|---|---|---|
| POST /api/v1/tasks | JSON `mode`: `test` or `live` | live | `mode`, `taskId`, invitation count and creator summary |
| GET /api/v1/tasks | Query `mode=test` or `mode=live` | live | `mode`, mode-filtered `tasks`, `nextCursor`; each task includes its mode |
| GET /api/v1/tasks/preview | Query `mode=test` or `mode=live` | live | Resolved `mode` and dry-run estimates |
| POST /api/external/engagement/tasks | JSON `mode`: `test` or `live` | live | `mode`, `taskIds`, existing dispatch summary |
| POST /api/external/engagement/preview | JSON `mode`: `test` or `live` | live | `mode`, `plan` |

Input is lowercase and validated. Explicit null, booleans, unknown strings and uppercase values are rejected with 400. Dashboard cookies never override API mode. API authentication remains required in both modes; Test is not an authentication bypass.

API task listing accepts optional `brandId`, `limit` (1–100, default 25), and `cursor`. Task identities and mode are immutable in this release; no endpoint promotes a Test task into Live.

## Existing data and rollout

Migration `20261016170000_add_task_modes` adds Task.mode with a Live default and a zero-initialized test balance. Existing tasks remain Live, and existing wallet balances are preserved. Historical tasks have not been guessed or reclassified as Test. New Test tasks can be created through the admin header's selected mode or an explicit API mode field.

The migration also adds mode/date and brand/mode indexes. Mode-aware matching recency looks only at previous invitations from the same mode so Test assignments do not penalize Live creator selection.

## Validation

- `npx tsx scripts/test-task-workflow.ts`: rollback-only checks for wrong-owner/wrong-mode actions, duplicate accepts, pending-ledger creation, review-only approval, exactly-once credit, and separate Test/Live balances and earnings.
- With the app running on localhost:5100, `npx tsx scripts/test-task-modes.ts`: authenticated API creation/listing/previews, default Live behavior even with a Test browser cookie, invalid inputs, creator/brand/admin/CSV filtering, and blocked Test payouts. It creates unique temporary fixture accounts, a niche and an API credential, and removes all fixture records afterwards. Real creators are excluded by unique fixture criteria. Legacy integration checks run when its integration key is configured.
