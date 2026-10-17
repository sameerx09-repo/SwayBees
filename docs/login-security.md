# Login protection and password rotation

## Login rate limits

Admin, brand and creator login flows use the same database-backed limiter. Each normalized email/role can make **5 attempts in 15 minutes**; the sixth is blocked. Where a trusted IP is available, **30 attempts per IP in 15 minutes** are shared across all three roles. All submitted credential attempts count, including successful sign-ins. Successful login does not erase the counters. The fixed window expires automatically; retry messages do not reveal whether an account exists.

The additive `20261017100000_add_login_rate_limits` migration must be applied to each deployment before releasing the code (`npx prisma migrate deploy`). It has been applied to the currently configured database. Counters persist across restarts and server instances. Their identifiers use HMAC; raw email addresses and IP addresses are not stored. Old expired entries are pruned in bounded batches during login attempts. If the database or secret is unavailable, sign-in fails closed.

Vercel automatically uses its `x-vercel-forwarded-for` header ([Vercel request-header documentation](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for)). On other infrastructure, `LOGIN_TRUSTED_IP_HEADER` may name a header that your proxy **overwrites with the actual client address**; the application must not be directly reachable around that proxy. Untrusted forwarded headers are ignored. With no trusted header, including direct local development, per-account throttling remains active and IP throttling is not available. Do not use a client-supplied IP header as a workaround.

## Generate and save unique passwords

Run these commands from the app directory. Prefer rotating only accounts that still use the known demo password, rather than changing passwords for legitimate users or imported profiles.

Read-only preview (default):

```powershell
npm run security:rotate-passwords
```

Generate and apply unique passwords to demo-password accounts:

```powershell
npm run security:rotate-passwords -- --apply
```

If you intentionally need to replace the password of **every administrator, brand and creator**, preview first, then apply:

```powershell
npm run security:rotate-passwords -- --all
npm run security:rotate-passwords -- --all --apply
```

Each account gets an independently generated 43-character password containing 256 random bits, within bcrypt's input-size limit. The database stores only bcrypt hashes. Before changing the database, the tool saves a plaintext `.credentials/passwords-<timestamp>-<unique-id>.json` file containing each account's role, email and new password. This file is portable and opens in any text editor on any operating system; it requires no Windows login, encryption key or decryption tool. The directory is Git-ignored and outside public assets. Passwords are not printed in tool logs or supplied as shell arguments. On systems supporting POSIX permissions, the file is created owner-readable/writable only.

The database updates use one transaction and compare the previous hashes to avoid overwriting concurrent changes. A failed database transaction rolls back all password changes. If a plaintext credentials file already exists after a failed run, preserve it, but do not assume its passwords were applied; the tool must report successful completion. A process/network failure around commit can require checking the account state before retrying.

At the initial audit, the demo-password scope identified 1 admin, 2 brands and 105 creators. Run the preview to see the current count; accounts already rotated no longer match the default scope.

## Retrieve and store the passwords

After successful rotation, the tool prints the absolute path to the JSON file. Open that file in a text editor; each entry contains `role`, `email` and `password` in clear text. Copy those entries into your password vault. The JSON is a portable handoff, not a claim of compatibility with a specific vault's import format.

No password viewer script or Windows account is required. Once you have verified that the credentials are saved in your vault, remove the plaintext export from the computer. Keep it private until then. The database still stores only bcrypt hashes, and the application never serves the export as a web asset.

## Invalidate existing sessions after rotation

Password changes do not invalidate existing signed session tokens. Generate a new session signing secret using a password manager or `openssl rand -hex 32`, place it in `SESSION_SECRET` in the local environment and each deployed environment that needs invalidation, then restart/redeploy those app instances. Keep the generated value private. This signs out everyone using the previous secret. Do not replace only a lower-priority `.env` value if `.env.local` overrides it.

New admin seeds require an explicit `ADMIN_SEED_PASSWORD` of at least 16 characters and no more than 72 bytes; there is no default admin password and it is no longer logged. The admin seed remains additive and does not change an existing admin's password. Avoid rerunning the other legacy demo seed scripts on a protected/live database: they still create accounts using a shared demo password.

## Validation

`npm run test:login-security` checks email normalization, role-specific account limits, shared IP limits, expiry, rejection of untrusted/invalid forwarding headers, and concurrent attempts across independent database clients. Counter fixtures are rolled back/removed. It also checks unique password generation and a portable plaintext export round trip using fixture credentials only. Browser checks verify the sixth attempt is blocked on `/creator/login`, `/admin/login`, and `/login`. TypeScript, targeted lint, and production build checks pass.
