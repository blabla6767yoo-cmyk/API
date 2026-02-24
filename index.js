const express = require("express");
const { Pool } = require("pg");
const { randomUUID } = require("crypto");

const app = express();

// الربط المباشر لخدمة Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false // هذا السطر هو مفتاح الحل الحين!
});

async function startServer() {
  try {
    await pool.connect();
    console.log("✅ العداد شغال وقاعدة البيانات متصلة!");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS active_sessions (
        session_id TEXT PRIMARY KEY,
        player_id TEXT,
        last_seen BIGINT
      )
    `);

    app.get("/count", async (req, res) => {
      const r = await pool.query("SELECT COUNT(*) FROM active_sessions WHERE last_seen > $1", [Date.now() - 5000]);
      res.json({ online: Number(r.rows[0].count) });
    });

    app.get("/join", async (req, res) => {
      const sessionId = randomUUID();
      await pool.query("INSERT INTO active_sessions VALUES($1,$2,$3)", [sessionId, req.query.player, Date.now()]);
      res.json({ session: sessionId });
    });

    app.get("/heartbeat", async (req, res) => {
      await pool.query("UPDATE active_sessions SET last_seen=$1 WHERE session_id=$2", [Date.now(), req.query.session]);
      res.send("alive");
    });

    app.get("/", (req, res) => res.send("Counter is Online! 🚀"));

    app.listen(process.env.PORT || 3000);
  } catch (err) {
    console.error("❌ خطأ في الربط:", err.message);
  }
}

startServer();
