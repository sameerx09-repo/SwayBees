import type { InvitationStatus } from "@prisma/client";

export const INVITATION_STATUS_LABEL: Record<InvitationStatus, string> = {
  PENDING: "Awaiting response",
  ACCEPTED: "In progress",
  DECLINED: "Declined",
  SUBMITTED: "In review",
  VERIFYING: "In review",
  CREDITED: "Completed",
};

export const INVITATION_STATUS_COLOR: Record<InvitationStatus, string> = {
  CREDITED: "text-success",
  VERIFYING: "text-accent",
  SUBMITTED: "text-accent",
  ACCEPTED: "text-muted-strong",
  DECLINED: "text-muted",
  PENDING: "text-muted",
};
