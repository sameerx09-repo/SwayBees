# Creator task workflow

- Accept task: PENDING → ACCEPTED (shown as In progress). Reserves the task payout in a pending ledger entry; does not credit the wallet.
- Submit for review: ACCEPTED → SUBMITTED (shown as In review). Creator confirms completion. This action does not call Apify or approve payment.
- Backend review: /admin/tasks?status=review lists SUBMITTED and legacy VERIFYING invitations across all task sources. Admins inspect instructions, creator handles and post links, then use Approve & credit.
- Approval: SUBMITTED/VERIFYING → CREDITED (shown as Completed). Credits the reserved ledger amount and wallet atomically, once. Requires an admin session.

SUBMITTED is the persisted review status; no enum/database migration is needed. VERIFYING is retained for compatibility with existing records and also appears as In review.

Creator-facing task amounts, wallet balances and earnings use INR formatting. This change preserves stored numeric amounts; it does not perform an exchange-rate conversion or migrate historical USD-based subscription pricing. Admin ad-hoc payout inputs are labelled INR. Legacy dollar amounts embedded in task instructions are rendered with the rupee symbol.

The creator task page combines invitation reads into one joined, selected-field query and runs the profile-completeness count in parallel. Creator authentication is deduplicated within each server render with React cache (not shared across users/requests). Independent profile queries run in parallel. Loading UI supports responsive navigation; filters and sorts run locally without server requests. The development indicator is disabled; normal development compilation and remote database latency still apply.

Validation: run npx tsx scripts/test-task-workflow.ts with the app's database environment. The integration check creates temporary records inside one transaction and rolls them all back. It checks ownership, duplicate acceptance, pending funds, review-only approval, and exactly-once credit.
