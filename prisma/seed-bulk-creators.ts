// Additive, non-destructive: only creates new rows / upserts by unique
// key. Never deletes anything — unlike seed.ts, this is safe to run
// against a database that already has real signups in it.
import { PrismaClient, Platform } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NICHES } from "../src/lib/niches";

const db = new PrismaClient();
const DEMO_PASSWORD_HASH = bcrypt.hashSync("password123", 10);

const NICHE_NAMES: string[] = [...NICHES];

// Niches an existing demo account keeps, so earlier matching-engine
// demos (Lumière → sophia.glow/priya.style) still work after the
// niche column became a relation.
const EXISTING_HANDLE_NICHES: Record<string, string[]> = {
  "@mia.wellness": ["Wellness"],
  "@arjun.fit": ["Fitness"],
  "@sophia.glow": ["Beauty", "Skincare"],
  "@noah.creates": ["Fashion"],
  "@priya.style": ["Beauty", "Makeup"],
};

const CITIES = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
  "San Antonio", "San Diego", "Dallas", "Austin", "Portland", "Seattle",
  "Denver", "Boston", "Nashville", "Atlanta", "Miami", "Minneapolis",
  "San Francisco", "Charlotte",
];

const WOMEN_FIRST_NAMES = [
  "Ava", "Mia", "Zoe", "Layla", "Chloe", "Ella", "Grace", "Riya", "Sofia",
  "Priya", "Anaya", "Nora", "Ivy", "Luna", "Maya", "Ruby", "Isla", "Aria",
  "Naomi", "Willow", "Hazel", "Freya", "Sadie", "Tara", "Nina", "Kavya",
  "Meera", "Isha", "Elena", "Camila",
];
const MEN_FIRST_NAMES = [
  "Liam", "Noah", "Ethan", "Arjun", "Kai", "Leo", "Rohan", "Mason", "Dev",
  "Owen", "Adrian", "Marcus", "Jayden", "Ravi", "Theo", "Elias", "Sam",
  "Nikhil", "Dylan", "Amir",
];

const NICHE_HANDLE_WORDS: Record<string, string[]> = {
  Beauty: ["glow", "beauty", "radiant"],
  Skincare: ["skinlove", "glowup", "dewyskin"],
  Haircare: ["hairgoals", "shinyhair", "curls"],
  Makeup: ["glam", "makeupbyme", "paintedface"],
  "Jewelry & Accessories": ["sparkle", "gems", "adorned"],
  Fashion: ["style", "styled", "thefit"],
  "Clothing & Apparel": ["closet", "wardrobe", "thelook"],
  Footwear: ["soles", "kicks", "steps"],
  Wellness: ["wellness", "mindful", "balance"],
  Fitness: ["fit", "strong", "trainhard"],
  "Working Women": ["careergirl", "bossbabe", "hustle"],
  Homemaking: ["home", "nesting", "hearth"],
  Parenting: ["momlife", "parenting", "littleones"],
  "Food & Cooking": ["kitchen", "cooks", "tastes"],
  "Home Decor": ["decor", "interiors", "spaces"],
  Travel: ["wanders", "roams", "thetraveler"],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 1): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

async function main() {
  // 1. Niche taxonomy (idempotent)
  const niches = new Map<string, string>();
  for (const name of NICHE_NAMES) {
    const niche = await db.niche.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    niches.set(name, niche.id);
  }

  // 2. Backfill niches for the existing named demo accounts
  for (const [handle, nicheNames] of Object.entries(EXISTING_HANDLE_NICHES)) {
    const influencer = await db.influencer.findUnique({ where: { handle } });
    if (!influencer) continue;
    for (const nicheName of nicheNames) {
      await db.influencerNiche.upsert({
        where: { influencerId_nicheId: { influencerId: influencer.id, nicheId: niches.get(nicheName)! } },
        update: {},
        create: { influencerId: influencer.id, nicheId: niches.get(nicheName)! },
      });
    }
  }

  // 3. Generate 100 new mock creators
  const usedHandles = new Set<string>();
  let created = 0;

  for (let i = 0; i < 100; i++) {
    const gender = Math.random() < 0.65 ? "women" : "men";
    const firstName = pick(gender === "women" ? WOMEN_FIRST_NAMES : MEN_FIRST_NAMES);
    const nicheCount = randInt(1, 3);
    const creatorNiches = pickN(NICHE_NAMES, nicheCount);
    const handleWord = pick(NICHE_HANDLE_WORDS[creatorNiches[0]] ?? ["creates"]);

    let handle = `@${firstName.toLowerCase()}.${handleWord}`;
    let suffix = 0;
    while (usedHandles.has(handle) || (await db.influencer.findUnique({ where: { handle } }))) {
      suffix++;
      handle = `@${firstName.toLowerCase()}.${handleWord}${suffix}`;
    }
    usedHandles.add(handle);

    const email = `${firstName.toLowerCase()}${i}@example.com`;
    const existingEmail = await db.influencer.findUnique({ where: { email } });
    if (existingEmail) continue;

    // Follower distribution skewed toward nano/micro, like a real
    // creator base — a few mid-tier, hardly any macro.
    const tierRoll = Math.random();
    const followerCount =
      tierRoll < 0.55 ? randInt(800, 10_000) :
      tierRoll < 0.85 ? randInt(10_000, 50_000) :
      tierRoll < 0.97 ? randInt(50_000, 300_000) :
      randInt(300_000, 900_000);

    const instagramConnected = Math.random() < 0.7;

    const influencer = await db.influencer.create({
      data: {
        handle,
        email,
        passwordHash: DEMO_PASSWORD_HASH,
        followerCount,
        engagementRate: randFloat(2, 8.5),
        instagramConnected,
        instagramUserId: instagramConnected ? `mock_ig_${firstName.toLowerCase()}${i}` : null,
        gender,
        age: randInt(19, 48),
        location: pick(CITIES),
      },
    });

    for (const nicheName of creatorNiches) {
      await db.influencerNiche.create({
        data: { influencerId: influencer.id, nicheId: niches.get(nicheName)! },
      });
    }

    if (Math.random() < 0.4) {
      await db.socialAccount.create({
        data: {
          influencerId: influencer.id,
          platform: Platform.TWITTER,
          handle: `@${firstName.toLowerCase()}${randInt(1, 999)}`,
          followerCount: randInt(500, 60_000),
          engagementRate: randFloat(1, 5),
        },
      });
    }
    if (Math.random() < 0.25) {
      await db.socialAccount.create({
        data: {
          influencerId: influencer.id,
          platform: Platform.REDDIT,
          handle: `u/${firstName.toLowerCase()}_${handleWord}${randInt(1, 999)}`,
          followerCount: randInt(200, 20_000),
          engagementRate: randFloat(1, 6),
        },
      });
    }

    created++;
  }

  console.log(`Bulk creators: ${created} new influencers created across ${NICHE_NAMES.length} niches.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
