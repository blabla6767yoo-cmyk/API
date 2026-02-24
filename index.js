const express = require("express");
const { Pool } = require("pg");
const { randomUUID } = require("crypto");

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
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

    setInterval(async () => {
      const limit = Date.now() - 5000;
      await pool.query("DELETE FROM active_sessions WHERE last_seen < $1", [limit]);
    }, 2000);

    app.get("/join", async (req, res) => {
      const playerId = req.query.player;
      if (!playerId) return res.sendStatus(400);
      const sessionId = randomUUID();
      await pool.query("DELETE FROM active_sessions WHERE player_id=$1", [playerId]);
      await pool.query("INSERT INTO active_sessions VALUES($1,$2,$3)", [sessionId, playerId, Date.now()]);
      res.json({ session: sessionId });
    });

    app.get("/heartbeat", async (req, res) => {
      await pool.query("UPDATE active_sessions SET last_seen=$1 WHERE session_id=$2", [Date.now(), req.query.session]);
      res.send("alive");
    });

    app.get("/count", async (req, res) => {
      const r = await pool.query("SELECT COUNT(*) FROM active_sessions WHERE last_seen > $1", [Date.now() - 5000]);
      res.json({ online: Number(r.rows[0].count) });
    });

    app.get("/", (req, res) => res.send("Server is Live! 🚀"));

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server ready on port ${PORT}`));
  } catch (err) {
    console.error("❌ Connection Error:", err);
  }
}

startServer();
