import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { GenerateCollabsButton } from "./GenerateCollabsButton";
import { InstagramHandleForm } from "./InstagramHandleForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || session.kind !== "brand") {
    redirect("/login");
  }

  const brand = await db.brand.findUniqueOrThrow({
    where: { id: session.id },
    include: { subscription: true, criteria: true },
  });

  if (!brand.subscription || !brand.criteria) {
    redirect("/signup");
  }

  const sub = brand.subscription;
  const criteria = brand.criteria;
  const spentPct = Math.round((sub.spentThisCycle / sub.monthlyBudget) * 100);

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-xl font-semibold tracking-tight">Account settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 border border-border">
        <div className="p-6.5 flex flex-col gap-4.5 lg:border-r border-b border-border">
          <div className="text-sm text-muted">Company profile</div>
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 bg-accent-soft" />
            <div className="flex flex-col gap-0.5">
              <div className="text-sm font-semibold">{brand.companyName}</div>
              <div className="text-xs text-muted">{brand.category}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm pt-3 border-t border-border-light">
            <div className="flex justify-between">
              <span className="text-muted">Contact email</span>
              <span>{brand.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Member since</span>
              <span>
                {brand.createdAt.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <div className="pt-3 border-t border-border-light">
            <InstagramHandleForm instagramHandle={brand.instagramHandle ?? ""} />
            <p className="text-[11px] text-muted mt-2 max-w-[280px]">
              Used to find your latest public post so SwayFam can verify
              comment collabs against it — see BUILD_STATUS.md.
            </p>
          </div>
        </div>

        <div className="p-6.5 flex flex-col gap-4 border-b border-border">
          <div className="text-sm text-muted">Plan &amp; budget</div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <div className="text-sm font-semibold">
                {sub.plan === "PRO" ? "Pro Plan" : "Starter Plan"}
              </div>
              <div className="text-xs text-muted">
                {sub.plan === "PRO" ? "$100/mo" : "$30/mo"} &middot;{" "}
                {sub.plan === "PRO" ? "UGC + engagement" : "UGC only"}
              </div>
            </div>
            <a href="#" className="text-xs font-medium">
              Change plan
            </a>
          </div>
          <div className="flex flex-col gap-2 pt-3 border-t border-border-light">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Monthly budget</div>
              <div className="font-mono text-sm">
                ${sub.monthlyBudget.toLocaleString()}
              </div>
            </div>
            <div className="w-full h-[3px] bg-border">
              <div
                className="h-full bg-accent"
                style={{ width: `${Math.min(spentPct, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted">
                ${sub.spentThisCycle.toLocaleString()} spent this cycle
              </div>
              <a href="#" className="text-xs font-medium">
                Adjust budget
              </a>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border-light">
            <div className="text-[11px] text-muted max-w-[240px]">
              Collabs dispatch automatically — this runs the matching engine
              on demand since there&rsquo;s no scheduler wired up yet.
            </div>
            <GenerateCollabsButton />
          </div>
        </div>

        <div className="p-6.5 flex flex-col gap-4 lg:border-r border-b lg:border-b-0 border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted">Target audience</div>
            <a href="#" className="text-xs font-medium">
              Edit criteria
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <Row label="Platform" value={capitalize(criteria.platform.toLowerCase())} />
            <Row label="Gender" value={capitalize(criteria.gender)} />
            <Row label="Age range" value={`${criteria.ageMin}–${criteria.ageMax}`} mono />
            <Row label="Location" value={criteria.location} />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Niche</span>
              <span className="text-sm font-semibold text-accent">
                {criteria.niche}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6.5 flex flex-col gap-4">
          <div className="text-sm text-muted">Billing</div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Next billing date</span>
            <span>
              {sub.nextBillingAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Payment method</span>
            <span className="font-mono">&bull;&bull;&bull;&bull; 4242</span>
          </div>
          <div className="flex flex-col gap-2 pt-3 border-t border-border-light">
            {[
              { date: "Aug 12, 2026", amount: "$100.00", status: "Paid" },
              { date: "Jul 12, 2026", amount: "$100.00", status: "Paid" },
              { date: "Jun 12, 2026", amount: "$100.00", status: "Paid" },
            ].map((inv) => (
              <div key={inv.date} className="flex justify-between text-xs">
                <span className="text-muted-strong">{inv.date}</span>
                <span className="font-mono">{inv.amount}</span>
                <span className="text-success">{inv.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
