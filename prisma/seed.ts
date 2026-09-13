import { PrismaClient, Plan, TaskType, InvitationStatus, LedgerStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Demo login for every seeded account — see README for the full list.
const DEMO_PASSWORD_HASH = bcrypt.hashSync("password123", 10);

const CORE_NICHES = ["Beauty", "Wellness", "Fitness", "Fashion", "Skincare", "Makeup"];

async function main() {
  await db.walletLedgerEntry.deleteMany();
  await db.taskInvitation.deleteMany();
  await db.task.deleteMany();
  await db.audienceCriteria.deleteMany();
  await db.subscription.deleteMany();
  await db.brand.deleteMany();
  await db.influencerNiche.deleteMany();
  await db.socialAccount.deleteMany();
  await db.influencer.deleteMany();

  // Idempotent — safe alongside prisma/seed-bulk-creators.ts, which
  // upserts the full 16-niche taxonomy. This only needs the subset the
  // 5 named demo influencers below use.
  const niches = new Map<string, string>();
  for (const name of CORE_NICHES) {
    const niche = await db.niche.upsert({ where: { name }, update: {}, create: { name } });
    niches.set(name, niche.id);
  }

  const lumiere = await db.brand.create({
    data: {
      companyName: "Lumière Skincare",
      email: "hello@lumiereskincare.com",
      passwordHash: DEMO_PASSWORD_HASH,
      category: "Beauty & skincare",
      subscription: {
        create: {
          plan: Plan.PRO,
          monthlyBudget: 5000,
          spentThisCycle: 2450,
          nextBillingAt: new Date("2026-09-12"),
        },
      },
      criteria: {
        create: {
          gender: "women",
          ageMin: 30,
          ageMax: 45,
          location: "New York, LA, Chicago",
          niche: "Beauty",
        },
      },
    },
  });

  const verdant = await db.brand.create({
    data: {
      companyName: "Verdant Coffee Co.",
      email: "hello@verdantcoffee.com",
      passwordHash: DEMO_PASSWORD_HASH,
      category: "Food & beverage",
      subscription: {
        create: {
          plan: Plan.STARTER,
          monthlyBudget: 800,
          spentThisCycle: 320,
          nextBillingAt: new Date("2026-09-04"),
        },
      },
      criteria: {
        create: {
          gender: "any",
          ageMin: 22,
          ageMax: 40,
          location: "Portland, Seattle, SF",
          niche: "Wellness",
        },
      },
    },
  });

  const mia = await db.influencer.create({
    data: {
      handle: "@mia.wellness",
      email: "mia@example.com",
      passwordHash: DEMO_PASSWORD_HASH,
      followerCount: 18400,
      engagementRate: 5.2,
      instagramConnected: true,
      instagramUserId: "mock_ig_mia",
      walletBalance: 284,
      gender: "women",
      age: 32,
      location: "Los Angeles",
      niches: { create: [{ nicheId: niches.get("Wellness")! }] },
    },
  });

  // Self-declared fields are picked so Lumière's criteria (women, 30–45,
  // NY/LA/Chicago, Beauty) cleanly matches sophia.glow and priya.style
  // but not the others — real gating coverage, not everyone eligible.
  const others = [
    { handle: "@arjun.fit", email: "arjun@example.com", followerCount: 42100, engagementRate: 3.8, instagramUserId: "mock_ig_arjun", gender: "men", age: 27, location: "Chicago", nicheNames: ["Fitness"] },
    { handle: "@sophia.glow", email: "sophia@example.com", followerCount: 9800, engagementRate: 6.1, instagramUserId: "mock_ig_sophia", gender: "women", age: 31, location: "New York", nicheNames: ["Beauty", "Skincare"] },
    { handle: "@noah.creates", email: "noah@example.com", followerCount: 27600, engagementRate: 4.4, instagramUserId: "mock_ig_noah", gender: "men", age: 26, location: "Portland", nicheNames: ["Fashion"] },
    { handle: "@priya.style", email: "priya@example.com", followerCount: 15200, engagementRate: 5.7, instagramUserId: null, gender: "women", age: 34, location: "New York", nicheNames: ["Beauty", "Makeup"] },
  ];
  for (const o of others) {
    await db.influencer.create({
      data: {
        handle: o.handle,
        email: o.email,
        passwordHash: DEMO_PASSWORD_HASH,
        followerCount: o.followerCount,
        engagementRate: o.engagementRate,
        instagramConnected: o.instagramUserId !== null,
        instagramUserId: o.instagramUserId,
        gender: o.gender,
        age: o.age,
        location: o.location,
        niches: { create: o.nicheNames.map((name) => ({ nicheId: niches.get(name)! })) },
      },
    });
  }

  const ugcTask1 = await db.task.create({
    data: {
      brandId: lumiere.id,
      type: TaskType.UGC_VIDEO,
      description:
        "Create a short UGC video featuring the new Vitamin C serum. Tag @lumiereskincare in your caption.",
      payoutAmount: 40,
      verificationTag: "@lumiereskincare",
    },
  });

  const commentTask1 = await db.task.create({
    data: {
      brandId: lumiere.id,
      type: TaskType.COMMENT,
      description:
        "Comment on @noah.creates' new reel for Lumière. Faster replies pay more — up to $2 within 30 minutes.",
      payoutAmount: 2,
    },
  });

  // Mia's two pending invitations (rendered as "New invitations" on /tasks)
  await db.taskInvitation.create({
    data: { taskId: ugcTask1.id, influencerId: mia.id, status: InvitationStatus.PENDING },
  });
  await db.taskInvitation.create({
    data: { taskId: commentTask1.id, influencerId: mia.id, status: InvitationStatus.PENDING },
  });

  // Mia's active/historical tasks (rendered as "Active tasks")
  const historical = [
    { brandId: lumiere.id, type: TaskType.UGC_VIDEO, description: "UGC video — face wash", payoutAmount: 40, status: InvitationStatus.CREDITED },
    { brandId: lumiere.id, type: TaskType.COMMENT, description: "Comment on @sophia.glow", payoutAmount: 1.5, status: InvitationStatus.VERIFYING },
    { brandId: verdant.id, type: TaskType.UGC_VIDEO, description: "UGC video — serum unboxing", payoutAmount: 40, status: InvitationStatus.SUBMITTED },
    { brandId: verdant.id, type: TaskType.COMMENT, description: "Comment on @priya.style", payoutAmount: 2, status: InvitationStatus.CREDITED },
  ];

  for (const h of historical) {
    const task = await db.task.create({
      data: { brandId: h.brandId, type: h.type, description: h.description, payoutAmount: h.payoutAmount },
    });
    const invitation = await db.taskInvitation.create({
      data: { taskId: task.id, influencerId: mia.id, status: h.status, respondedAt: new Date() },
    });
    if (h.status === InvitationStatus.CREDITED) {
      await db.walletLedgerEntry.create({
        data: {
          influencerId: mia.id,
          invitationId: invitation.id,
          amount: h.payoutAmount,
          status: LedgerStatus.CREDITED,
        },
      });
    }
  }

  console.log("Seeded:", { brands: 2, influencers: 5, tasks: 6 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
