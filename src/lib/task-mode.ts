import { TaskMode } from "@prisma/client";

/** APIs default to Live for backwards compatibility and never infer mode from a browser cookie. */
export function parseTaskMode(value: unknown): TaskMode | null {
  if (value === undefined) return TaskMode.LIVE;
  if (value === "test") return TaskMode.TEST;
  if (value === "live") return TaskMode.LIVE;
  return null;
}
export function modeName(mode: TaskMode): "test" | "live" {
  return mode === TaskMode.TEST ? "test" : "live";
}
