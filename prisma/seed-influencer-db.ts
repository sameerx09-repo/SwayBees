// Imports real creators from ../../InfluencerDB/*.csv (a hand-compiled
// India beauty-influencer research database — handle, bio, followers,
// engagement rate, niche; scraped from public Instagram profiles, not
// collected via this app). Additive and idempotent like
// seed-bulk-creators.ts: skips any handle/email that already exists,
// safe to re-run.
//
// The source has no gender, age, or location columns. Per an explicit
// decision (not a default silently chosen here): gender is set to
// "women" for every imported row, since this is specifically a beauty-
// influencer dataset and the matching engine's persona gate otherwise
// excludes anyone with gender unset from any gender-targeted campaign.
// age and location are left null — there's no real data to assign them
// from, and fabricating either for real, named individuals would be
// worse than leaving the gate honestly unmet until a creator logs in
// and self-declares. That means imported rows won't satisfy a brand
// campaign that also gates on age/location (e.g. Lumière's 30–45,
// NY/LA/Chicago) until then — see BUILD_STATUS.md for this run's notes.
import { readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { isUniqueConstraintError } from "../src/lib/db";

const db = new PrismaClient();

const CSV_FILES = [
  "India Beauty Influencer DB 567e4face9444a88ae04a8e8289deb58.csv",
];

// Real individuals' accounts here are never meant to be logged into —
// one shared, otherwise-unknown hash is enough to make that true
// without paying bcrypt's cost 104 times over.
const IMPORTED_PASSWORD_HASH = bcrypt.hashSync(randomUUID(), 10);

const NICHE_MAP: Record<string, string> = {
  beauty: "Beauty",
  skincare: "Skincare",
  // Not one of the app's 16 niches — folded into Beauty per decision
  // rather than extending the taxonomy for 6 rows.
  lifestyle: "Beauty",
};

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function parseCsv(raw: string): Record<string, string>[] {
  // Strip a UTF-8 BOM if present — Notion CSV exports include one.
  const text = raw.replace(/^﻿/, "");
  const lines = text.split(/\r\n|\n/).filter((l) => l.length > 0);
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((key, i) => {
      row[key] = values[i] ?? "";
    });
    return row;
  });
}

async function main() {
  const niches = new Map<string, string>();
  for (const name of new Set(Object.values(NICHE_MAP))) {
    const niche = await db.niche.upsert({ where: { name }, update: {}, create: { name } });
    niches.set(name, niche.id);
  }

  let created = 0;
  let skippedDuplicateInFile = 0;
  let skippedAlreadyExists = 0;
  const seenHandles = new Set<string>();

  for (const file of CSV_FILES) {
    const rows = parseCsv(readFileSync(join(__dirname, "..", "..", "InfluencerDB", file), "utf-8"));

    for (const row of rows) {
      const handle = row["Handle"]?.trim();
      if (!handle) continue;

      const handleKey = handle.toLowerCase();
      if (seenHandles.has(handleKey)) {
        skippedDuplicateInFile++;
        continue;
      }
      seenHandles.add(handleKey);

      const existing = await db.influencer.findUnique({ where: { handle } });
      if (existing) {
        skippedAlreadyExists++;
        continue;
      }

      const rawEmail = row["Email"]?.trim();
      const email = rawEmail || `${handle.replace(/^@/, "")}@imported.swaybees.local`;

      const nicheRaw = row["Niche"]?.trim().toLowerCase();
      const nicheName = NICHE_MAP[nicheRaw] ?? "Beauty";

      const followerCount = Number(row["Followers"]?.trim()) || 0;
      const erRaw = row["ER %"]?.trim();
      const engagementRate = erRaw ? Number(erRaw) || 0 : 0;

      try {
        const influencer = await db.influencer.create({
          data: {
            handle,
            email,
            passwordHash: IMPORTED_PASSWORD_HASH,
            followerCount,
            engagementRate,
            gender: "women",
            age: null,
            location: null,
          },
        });
        await db.influencerNiche.create({
          data: { influencerId: influencer.id, nicheId: niches.get(nicheName)! },
        });
        created++;
      } catch (err) {
        if (isUniqueConstraintError(err)) {
          // Handle check above is a pre-check, not atomic — a generated
          // placeholder email colliding with one already in use is the
          // realistic way this still fires.
          skippedAlreadyExists++;
          continue;
        }
        throw err;
      }
    }
  }

  console.log(
    `Influencer DB import: ${created} created, ${skippedDuplicateInFile} duplicate rows in file skipped, ${skippedAlreadyExists} already in DB skipped.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
