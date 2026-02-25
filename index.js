const express = require("express");
const { Pool } = require("pg");

const app = express();

// استخدام الرابط السري مع حماية من الانهيار
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function startServer() {
  if (!connectionString) {
    console.error("❌ ERROR: DATABASE_URL is missing in Railway Variables!");
  }

  try {
    await pool.connect();
    console.log("✅ Database Connected!");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS active_sessions (
        session_id TEXT PRIMARY KEY,
        player_id TEXT,
        last_seen BIGINT
      )
    `);

    app.get("/count", async (req, res) => {
      try {
        const r = await pool.query("SELECT COUNT(*) FROM active_sessions WHERE last_seen > $1", [Date.now() - 5000]);
        res.json({ online: Number(r.rows[0].count) });
      } catch (e) { res.status(500).json({ error: "Query Failed" }); }
    });

    app.get("/", (req, res) => res.send("Counter is Ready! 🚀"));

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Connection Error:", err.message);
    // حتى لو فشل الاتصال، خل السيرفر شغال عشان ما يعطيك 502
    app.get("/", (req, res) => res.send("DB Connection Failed, but server is live. ⚠️"));
    app.listen(process.env.PORT || 3000);
  }
}

startServer();
