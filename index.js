const express = require("express");
const { Pool } = require("pg");
const { randomUUID } = require("crypto");

const app = express();

// استخدام الربط المباشر مع تجاوز كل تعقيدات الـ SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function startServer() {
  try {
    // محاولة الاتصال
    await pool.connect();
    console.log("✅ العداد متصل وقاعدة البيانات شغالة!");

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
      } catch {
        res.json({ online: 0 });
      }
    });

    app.get("/join", async (req, res) => {
      const sessionId = randomUUID();
      const playerId = req.query.player || "unknown";
      await pool.query("INSERT INTO active_sessions VALUES($1,$2,$3)", [sessionId, playerId, Date.now()]);
      res.json({ session: sessionId });
    });

    app.get("/heartbeat", async (req, res) => {
      await pool.query("UPDATE active_sessions SET last_seen=$1 WHERE session_id=$2", [Date.now(), req.query.session]);
      res.send("alive");
    });

    app.get("/", (req, res) => res.send("Counter is Ready! 🚀"));

    // لازم نحدد المنفذ صح عشان Railway يشوفه
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ DB Error:", err.message);
    // حتى لو فشل الاتصال، خل السيرفر يشتغل عشان ما يعطيك "Failed to respond"
    app.get("/", (req, res) => res.send("DB Connecting..."));
    app.listen(process.env.PORT || 3000);
  }
}

startServer();
