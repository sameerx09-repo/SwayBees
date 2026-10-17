"use client";
import type { TaskMode } from "@prisma/client";


import { useState, useTransition } from "react";
import type { InvitationStatus, Platform, TaskType } from "@prisma/client";
import { TASK_TYPE_LABEL } from "@/lib/task-type-label";
import { INVITATION_STATUS_LABEL, INVITATION_STATUS_COLOR } from "@/lib/invitation-status-label";
import { formatINR } from "@/lib/currency";
import { TaskDescription, TaskPostLink } from "@/components/TaskDescription";
import { acceptInvitation, declineInvitation, submitInvitation } from "./actions";

export type CreatorTaskRow = {
  id: string; brand: string; type: TaskType; platform: Platform; description: string;
  status: InvitationStatus; payoutAmount: number; targetPostUrl: string | null;
  createdAt: string; assignedAt: string;
};

function dateLabel(value: string) {
  return new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

export function CollabsClient({ tasks, now, mode }: { tasks: CreatorTaskRow[]; now: number; mode: TaskMode }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [platform, setPlatform] = useState("ALL");
  const [period, setPeriod] = useState("ALL");
  const [sort, setSort] = useState("newest");

  const filtered = tasks.filter((t) => {
    const matchesStatus = status === "ALL" || t.status === status || (status === "SUBMITTED" && t.status === "VERIFYING");
    return matchesStatus && (type === "ALL" || t.type === type) && (platform === "ALL" || t.platform === platform)
      && (period === "ALL" || now - Date.parse(t.createdAt) <= Number(period) * 86400000)
      && `${t.brand} ${t.description}`.toLowerCase().includes(query.trim().toLowerCase());
  }).sort((a, b) => sort === "highest" ? b.payoutAmount - a.payoutAmount : sort === "lowest" ? a.payoutAmount - b.payoutAmount
    : sort === "oldest" ? Date.parse(a.createdAt) - Date.parse(b.createdAt) : Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const controlClass = "border border-border rounded-lg bg-surface px-3 py-2 text-sm";
  return <section className="flex flex-col gap-5">
    <div>
      <h1 className="text-xl font-semibold">Your Collabs</h1>
      <p className="text-sm text-muted mt-2">Accept a task to start working. When you finish, submit it for review. Our team checks your work and credits your wallet after approval.</p>
    </div>
    <div className="flex flex-wrap gap-3">
      <label className="flex flex-col gap-1 text-xs text-muted">Search<input aria-label="Search tasks" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Brand or instructions" className={controlClass} /></label>
      <label className="flex flex-col gap-1 text-xs text-muted">Status<select value={status} onChange={(e) => setStatus(e.target.value)} className={controlClass}>
        <option value="ALL">All statuses</option><option value="PENDING">New</option><option value="ACCEPTED">In progress</option><option value="SUBMITTED">In review</option><option value="CREDITED">Completed</option>
      </select></label>
      <label className="flex flex-col gap-1 text-xs text-muted">Task type<select value={type} onChange={(e) => setType(e.target.value)} className={controlClass}>
        <option value="ALL">All types</option>{Object.entries(TASK_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label className="flex flex-col gap-1 text-xs text-muted">Platform<select value={platform} onChange={(e) => setPlatform(e.target.value)} className={controlClass}>
        <option value="ALL">All platforms</option><option value="INSTAGRAM">Instagram</option><option value="TWITTER">Twitter</option><option value="REDDIT">Reddit</option>
      </select></label>
      <label className="flex flex-col gap-1 text-xs text-muted">Created<select value={period} onChange={(e) => setPeriod(e.target.value)} className={controlClass}>
        <option value="ALL">Any time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option>
      </select></label>
      <label className="flex flex-col gap-1 text-xs text-muted">Sort by<select value={sort} onChange={(e) => setSort(e.target.value)} className={controlClass}>
        <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest payout</option><option value="lowest">Lowest payout</option>
      </select></label>
      <button className="text-sm underline self-end py-2" onClick={() => { setQuery(""); setStatus("ALL"); setType("ALL"); setPlatform("ALL"); setPeriod("ALL"); setSort("newest"); }}>Reset filters</button>
    </div>
    <p className="text-xs text-muted" role="status">{filtered.length} of {tasks.length} tasks</p>
    <ul className="flex flex-col gap-3">
      {filtered.map((task) => <CollabCard key={task.id} task={task} now={now} mode={mode} />)}
    </ul>
    {filtered.length === 0 && <p className="text-sm text-muted border border-border rounded-2xl p-8 text-center">{tasks.length ? "No tasks match these filters." : "No tasks assigned yet. Check back soon."}</p>}
  </section>;
}

/** Each row owns its transition so unrelated collabs remain interactive. */
function CollabCard({ task, now, mode }: { task: CreatorTaskRow; now: number; mode: TaskMode }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");

  function runAction(action: typeof acceptInvitation, message: string) {
    startTransition(async () => {
      try {
        const result = await action(task.id);
        setFeedback(result?.error ?? message);
      } catch {
        setFeedback("Couldn't save this change. Please try again.");
      }
    });
  }
  const daysOld = Math.max(0, Math.floor((now - Date.parse(task.createdAt)) / 86400000));
  const busy = isPending;
  return <li className="border border-border rounded-2xl p-5 bg-surface flex flex-col gap-3" aria-busy={busy}>
    <div className="flex flex-wrap justify-between items-start gap-3">
      <div className="flex flex-wrap items-center gap-3"><h2 className="text-sm font-semibold">{task.brand}</h2><span className="text-xs text-muted">{TASK_TYPE_LABEL[task.type]} · {task.platform === "INSTAGRAM" ? "Instagram" : task.platform === "TWITTER" ? "Twitter" : "Reddit"}</span><span className={`text-xs font-medium ${INVITATION_STATUS_COLOR[task.status]}`}>{task.status === "PENDING" ? "New" : INVITATION_STATUS_LABEL[task.status]}</span></div>
      <span className="font-mono font-semibold">{formatINR(task.payoutAmount)}</span>
    </div>
    <p className="text-sm text-muted-strong whitespace-pre-wrap break-words"><TaskDescription text={task.description} /></p>
    <TaskPostLink url={task.targetPostUrl} platform={task.platform} />
    <div className="text-xs text-muted flex flex-wrap gap-x-5 gap-y-1"><time dateTime={task.createdAt}>Created {dateLabel(task.createdAt)} IST · {daysOld === 0 ? "Today" : `${daysOld} day${daysOld === 1 ? "" : "s"} ago`}</time><time dateTime={task.assignedAt}>Assigned {dateLabel(task.assignedAt)} IST</time></div>
    <div className="flex flex-wrap items-center gap-4">
      {task.status === "PENDING" && <><button disabled={isPending} onClick={() => runAction(acceptInvitation, "Task accepted. Complete the instructions, then submit for review.")} className="text-sm font-semibold bg-gradient-social text-white px-4 py-2 rounded-full disabled:opacity-50">{busy ? "Saving…" : "Accept task"}</button><button disabled={isPending} onClick={() => runAction(declineInvitation, "Task declined.")} className="text-sm text-muted disabled:opacity-50">Decline</button></>}
      {task.status === "ACCEPTED" && <><button disabled={isPending} onClick={() => runAction(submitInvitation, "Review under progress")} className="text-sm font-semibold bg-gradient-social text-white px-4 py-2 rounded-full disabled:opacity-50">{busy ? "Submitting…" : "Submit for review"}</button><p className="text-xs text-muted">Submit only after completing the task.</p></>}
      {(task.status === "SUBMITTED" || task.status === "VERIFYING") && <p className="text-sm text-muted">Review under progress</p>}
      {task.status === "CREDITED" && <p className="text-sm text-success">{mode === "TEST" ? "Approved — simulated earnings credited to your test balance." : "Approved — payout credited to your wallet."}</p>}
    </div>
    {feedback && !(feedback === "Review under progress" && (task.status === "SUBMITTED" || task.status === "VERIFYING")) && <p role="status" className="text-sm text-muted-strong">{feedback}</p>}
  </li>;

}
