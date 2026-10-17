import { cache } from "react";
import { cookies } from "next/headers";
import { TaskMode } from "@prisma/client";
export const MODE_COOKIE = "swaybees_mode";
export const getTaskMode = cache(async function getTaskMode(): Promise<TaskMode> {
  return (await cookies()).get(MODE_COOKIE)?.value === "test" ? TaskMode.TEST : TaskMode.LIVE;
});
