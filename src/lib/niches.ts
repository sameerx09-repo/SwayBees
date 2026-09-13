// Shared with prisma/seed-bulk-creators.ts — keep in sync, or brand
// campaigns and creator profiles drift apart on what a "niche" even is.
export const NICHES = [
  "Beauty",
  "Skincare",
  "Haircare",
  "Makeup",
  "Jewelry & Accessories",
  "Fashion",
  "Clothing & Apparel",
  "Footwear",
  "Wellness",
  "Fitness",
  "Working Women",
  "Homemaking",
  "Parenting",
  "Food & Cooking",
  "Home Decor",
  "Travel",
] as const;

export type Niche = (typeof NICHES)[number];
