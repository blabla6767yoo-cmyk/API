const express = require("express");
const { Pool } = require("pg");
const { randomUUID } = require("crypto");

const app = express();

// كذا الرابط صار مخفي 
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false }
});

async function startServer() {
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
      } catch (e) { res.json({ online: 0 }); }
    });

    app.get("/", (req, res) => res.send("Counter is Ready! 🚀"));

    app.listen(process.env.PORT || 3000);
  } catch (err) {
    console.log("❌ Error:", err.message);
  }
}

startServer();
