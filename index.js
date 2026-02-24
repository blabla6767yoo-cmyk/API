const express = require("express");
const { Pool } = require("pg");
const { randomUUID } = require("crypto");

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function startServer() {
  await pool.connect();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS active_sessions (
      session_id TEXT PRIMARY KEY,
      player_id TEXT,
      last_seen BIGINT
    )
  `);

  setInterval(async () => {
    const limit = Date.now() - 5000;
    await pool.query(
      "DELETE FROM active_sessions WHERE last_seen < $1",
      [limit]
    );
  }, 2000);

  app.get("/join", async (req, res) => {
    try {
      const playerId = req.query.player;
      if (!playerId) return res.sendStatus(400);

      const sessionId = randomUUID();
      const now = Date.now();

      await pool.query(
        "DELETE FROM active_sessions WHERE player_id=$1",
        [playerId]
      );

      await pool.query(
        "INSERT INTO active_sessions VALUES($1,$2,$3)",
        [sessionId, playerId, now]
      );

      res.json({ session: sessionId });
    } catch (err) {
      res.sendStatus(500);
    }
  });

  app.get("/heartbeat", async (req, res) => {
    try {
      const sessionId = req.query.session;
      const now = Date.now();
      await pool.query(
        "UPDATE active_sessions SET last_seen=$1 WHERE session_id=$2",
        [now, sessionId]
      );
      res.send("alive");
    } catch {
      res.sendStatus(500);
    }
  });

  app.get("/count", async (req, res) => {
    try {
      const limit = Date.now() - 5000;
      const r = await pool.query(
        "SELECT COUNT(*) FROM active_sessions WHERE last_seen > $1",
        [limit]
      );
      res.json({ online: Number(r.rows[0].count) });
    } catch {
      res.json({ online: 0 });
    }
  });

  app.get("/ping", (req, res) => {
    res.send("pong");
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT);
}

startServer().catch(err => {
  process.exit(1);
});
