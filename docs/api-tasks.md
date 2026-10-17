# External Task API

`POST /api/v1/tasks` — lets an authorized external system dispatch a SwayBees task (e.g. an engagement task against content it already posted) without going through the admin UI. Creators are selected automatically from the given audience criteria, using the same persona-gate + follower-tier-diversified matching logic the platform's own matching engine uses.

**Base URL:** `https://swaybees.vercel.app`

## Authentication

Two independent checks, both required on every request:

| Header | Required | Value |
|---|---|---|
| `Authorization` | Yes | `Bearer <api-key>` — issued and revocable at `/admin/api-keys`; shown in full only once, at creation |
| `X-Client-Name` | Yes | Exactly `TrendCraft` or `Admin` (case-sensitive) |
| `Content-Type` | Yes | `application/json` |

The API key proves the request is authenticated; `X-Client-Name` separately declares which known caller it claims to be. Both must pass — neither is a substitute for the other.

## Request body

| Field | Type | Required | Notes |
|---|---|---|---|
| `mode` | string | No | `"test"` or `"live"`; defaults to `"live"`. Stored on every task and returned in the response. |
| `brandId` | string | one of `brandId` / `brandEmail` | Internal brand ID |
| `brandEmail` | string | one of `brandId` / `brandEmail` | Brand's account email — resolved if `brandId` is omitted |
| `type` | string | Yes | `UGC_VIDEO` \| `COMMENT` \| `LIKE` \| `SHARE` \| `TAG_FRIEND` |
| `platform` | string | Yes | `INSTAGRAM` \| `TWITTER` \| `REDDIT` |
| `description` | string | Yes | Instructions shown to the creator |
| `payoutAmount` | number | Yes | Per-creator payout, must be > 0 |
| `maxBudget` | number | Yes | Total cap; `floor(maxBudget / payoutAmount)` = max creators invited. Must resolve to ≥ 1 |
| `targetPostUrl` | string | Required unless `type` is `UGC_VIDEO` | The post being commented/liked/shared/tagged on |
| `verificationTag` | string | Optional, `UGC_VIDEO` only | Hashtag/mention required in the caption |
| `criteria.gender` | string | No (defaults `"any"`) | `"any"` \| `"women"` \| `"men"` |
| `criteria.ageMin` | number | Yes | — |
| `criteria.ageMax` | number | Yes | Must be ≥ `ageMin` |
| `criteria.location` | string | Yes | Comma-separated cities, any-of match (e.g. `"New York, LA, Chicago"`) |
| `criteria.niche` | string | Yes | One of: `Beauty`, `Skincare`, `Haircare`, `Makeup`, `Jewelry & Accessories`, `Fashion`, `Clothing & Apparel`, `Footwear`, `Wellness`, `Fitness`, `Working Women`, `Homemaking`, `Parenting`, `Food & Cooking`, `Home Decor`, `Travel` |

## Responses

| Status | Meaning |
|---|---|
| `201` | Created — see body shape below |
| `400` | Validation error (missing/invalid field) — `{ "error": "..." }` |
| `401` | Missing or invalid `Authorization` bearer key — `{ "error": "Missing or invalid API key." }` |
| `403` | Missing/invalid `X-Client-Name` — `{ "error": "x-client-name header must be one of: TrendCraft, Admin" }` |
| `404` | No brand found for `brandId`/`brandEmail` — `{ "error": "No brand found for the given brandId/brandEmail." }` |
| `422` | Valid request, but zero creators matched the criteria — task was **not** created — `{ "error": "...", "eligiblePoolSize": 0 }` |

**201 body:**

```json
{
  "taskId": "cmutc0dsd0002uef838iz0kmh",
  "invitationsCreated": 5,
  "eligiblePoolSize": 8,
  "creators": [
    { "id": "cmtzo7509006eue2w33jlwkhu", "handle": "@priya.kitchen", "followerCount": 1187 }
  ]
}
```

## Example

```bash
curl -X POST https://swaybees.vercel.app/api/v1/tasks \
  -H "Authorization: Bearer sk_live_your_key_here" \
  -H "X-Client-Name: TrendCraft" \
  -H "Content-Type: application/json" \
  -d '{
    "brandEmail": "hello@lumiereskincare.com",
    "type": "COMMENT",
    "platform": "INSTAGRAM",
    "description": "Comment on our new serum launch post.",
    "payoutAmount": 2,
    "maxBudget": 20,
    "targetPostUrl": "https://www.instagram.com/p/example/",
    "criteria": {
      "gender": "women",
      "ageMin": 25,
      "ageMax": 40,
      "location": "New York, LA, Chicago",
      "niche": "Beauty"
    }
  }'
```

## `GET /api/v1/tasks/preview` — dry run

Estimates how many tasks (and therefore distinct influencers — one task each) a budget buys, without creating anything. Same authentication as above (`Authorization` + `X-Client-Name`).

### Query parameters

| Param | Required | Value |
|---|---|---|
| `mode` | No | `test` or `live`; defaults to `live`, returned in the preview response |
| `amount` | Yes | Total budget, positive number |
| `engagementRate` | Yes | `low` \| `medium` \| `high` — buckets creators by their real engagement rate (low: 0–2%, medium: 2–5%, high: 5%+) and scales cost-per-task accordingly (0.8×, 1.0×, 1.5× base cost) |
| `type` | Yes | One or more of `UGC`, `Engagement` (likes/comments), `Reach` (follower exposure). Repeat the param (`type=UGC&type=Reach`) or comma-separate (`type=UGC,Reach`) |

When multiple types are requested, the budget is split evenly across them, and each type's eligible pool **excludes influencers already claimed by an earlier type** in the fixed order UGC → Engagement → Reach — so the combined `totals` are real distinct counts, never double-counting a creator picked for two types in the same request.

### Response

```json
{
  "amount": 1000,
  "engagementRate": "medium",
  "types": ["UGC", "Engagement", "Reach"],
  "budgetPerType": 333.33,
  "breakdown": [
    { "type": "UGC", "costPerTask": 40, "eligiblePoolSize": 68, "maxTasksFromBudget": 8, "projectedTasks": 8, "projectedInfluencers": 8, "budgetUsed": 320 },
    { "type": "Engagement", "costPerTask": 1.5, "eligiblePoolSize": 60, "maxTasksFromBudget": 222, "projectedTasks": 60, "projectedInfluencers": 60, "budgetUsed": 90 },
    { "type": "Reach", "costPerTask": 1, "eligiblePoolSize": 0, "maxTasksFromBudget": 333, "projectedTasks": 0, "projectedInfluencers": 0, "budgetUsed": 0 }
  ],
  "totals": { "projectedTasks": 68, "projectedInfluencers": 68, "budgetUsed": 410, "budgetRemaining": 590 }
}
```

### Example

```bash
curl -G https://swaybees.vercel.app/api/v1/tasks/preview \
  -H "Authorization: Bearer sk_live_your_key_here" \
  -H "X-Client-Name: TrendCraft" \
  -d amount=1000 \
  -d engagementRate=medium \
  -d type=UGC,Engagement
```

## Managing keys

Keys are created and revoked at `/admin/api-keys` (admin login required). A key's raw value is shown exactly once, at creation — if it's lost, revoke it and issue a new one rather than trying to recover it. Revocation takes effect immediately.

## Test and Live modes

Pass `"mode": "test"` or `"mode": "live"` in task creation JSON. Omitted mode defaults to Live for existing integrations; invalid modes return 400. Creation and preview responses include the resolved lowercase `mode`. API requests use their explicit field/default, independently of the dashboard cookie.

`GET /api/v1/tasks?mode=test&limit=25` lists only Test tasks, including each task's mode and invitation statuses. Use `mode=live` for Live tasks. Authentication is the same as POST. Optional `brandId` filters a brand; `limit` accepts 1–100 (default 25). Pass the returned `nextCursor` as `cursor` for the next page. A null cursor means there are no more results.

The legacy `/api/external/engagement/tasks` and `/api/external/engagement/preview` POST endpoints also accept `mode` in JSON and return it. They retain their existing `X-API-Key` authentication. Legacy task creation also returns `taskIds`.

API credentials currently work in both modes. The historical `sk_live_` key prefix is not a mode selector: set the request field. See [Test/Live mode behavior](test-live-modes.md) for dashboard switching, simulated earnings, and payout isolation.
