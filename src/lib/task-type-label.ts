import type { TaskType } from "@prisma/client";

export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  UGC_VIDEO: "UGC VIDEO",
  COMMENT: "COMMENT",
  LIKE: "LIKE",
  SHARE: "SHARE",
  TAG_FRIEND: "TAG A FRIEND",
};
