/**
 * One-time migration: extract base64 images from moving-sale.jsx
 * and produce public/images/items/* + scripts/seed-data.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const jsxPath = path.join(root, "moving-sale.jsx");
const imagesDir = path.join(root, "public", "images", "items");
const seedPath = path.join(__dirname, "seed-data.json");

const content = fs.readFileSync(jsxPath, "utf8");

// Parse IMAGES object keys -> data URLs
const images = {};
const imageRegex = /(\w+):\s*"(data:image\/[^;]+;base64,[^"]+)"/g;
let m;
while ((m = imageRegex.exec(content)) !== null) {
  images[m[1]] = m[2];
}

console.log(`Found ${Object.keys(images).length} images`);

fs.mkdirSync(imagesDir, { recursive: true });

const imageKeyToPath = {};
for (const [key, dataUrl] of Object.entries(images)) {
  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) continue;
  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  const filename = `${key}.${ext}`;
  const filepath = path.join(imagesDir, filename);
  fs.writeFileSync(filepath, Buffer.from(match[2], "base64"));
  imageKeyToPath[key] = `/images/items/${filename}`;
}

// Parse ITEMS array (metadata only — images resolved via IMAGES refs)
const itemsStart = content.indexOf("const ITEMS = [");
const itemsEnd = content.indexOf("];\n\nconst CARD_W");
const itemsBlock = content.slice(itemsStart, itemsEnd + 2);

const itemBlocks = itemsBlock.match(/\{[\s\S]*?\n  \},/g) ?? [];
const seedItems = [];

for (const block of itemBlocks) {
  const id = Number(block.match(/id:\s*(\d+)/)?.[1]);
  const name = block.match(/name:\s*"([^"]+)"/)?.[1];
  const price = Number(block.match(/price:\s*(\d+)/)?.[1]);
  const category = block.match(/category:\s*"([^"]+)"/)?.[1];
  const status = block.match(/status:\s*"([^"]+)"/)?.[1] ?? "available";
  const queue = Number(block.match(/queue:\s*(\d+)/)?.[1] ?? 0);
  const descMatch = block.match(/description:\s*"((?:[^"\\]|\\.)*)"/);
  const description = descMatch
    ? descMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n")
    : "";

  const imagesLine = block.match(/images:\s*\[([^\]]+)\]/);
  const imagePaths = [];
  if (imagesLine) {
    const refs = imagesLine[1].match(/IMAGES\.(\w+)/g) ?? [];
    for (const ref of refs) {
      const key = ref.replace("IMAGES.", "");
      if (imageKeyToPath[key]) imagePaths.push(imageKeyToPath[key]);
    }
  }

  if (!id || !name) continue;

  seedItems.push({
    id,
    name,
    price,
    category,
    status,
    queueCount: queue,
    description,
    imagePaths,
    sortOrder: id,
  });
}

fs.writeFileSync(seedPath, JSON.stringify(seedItems, null, 2));
console.log(`Wrote ${seedItems.length} items to ${seedPath}`);
console.log(`Images saved to ${imagesDir}`);
