import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { items, claims } from "../lib/schema";

type SeedItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  status: string;
  queueCount: number;
  description: string;
  imagePaths: string[];
  sortOrder: number;
};

async function main() {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    console.error("POSTGRES_URL is required. Copy .env.example to .env.local and set it.");
    process.exit(1);
  }

  const seedPath = path.join(__dirname, "seed-data.json");
  const seedItems: SeedItem[] = JSON.parse(fs.readFileSync(seedPath, "utf8"));

  const sql = neon(url);
  const db = drizzle(sql);

  console.log("Clearing existing data...");
  await db.delete(claims);
  await db.delete(items);

  console.log(`Seeding ${seedItems.length} items...`);
  for (const item of seedItems) {
    await db.insert(items).values({
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description,
      status: item.status,
      imagePaths: item.imagePaths,
      queueCount: item.queueCount,
      sortOrder: item.sortOrder,
    });
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
