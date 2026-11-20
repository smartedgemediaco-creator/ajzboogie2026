import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  await sql`UPDATE events SET name = 'AJZ 2026' WHERE slug = 'ajzboogie-2026'`;
  console.log("Event name updated to AJZ 2026");
}

main().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
