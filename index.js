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
    const limit = Date.now() - 10000;
    await pool.query("DELETE FROM active_sessions WHERE last_seen < $1", [limit]);
  }, 2000);

  app.get("/auth_v2_x9", async (req, res) => {
    try {
      const p = req.query.p_id; 
      if (!p) return res.sendStatus(400);
      const s = randomUUID();
      await pool.query("DELETE FROM active_sessions WHERE player_id=$1", [p]);
      await pool.query("INSERT INTO active_sessions VALUES($1,$2,$3)", [s, p, Date.now()]);
      res.json({ token: s });
    } catch (err) { res.sendStatus(500); }
  });

  app.get("/sync_data_88", async (req, res) => {
    try {
      const s = req.query.tk;
      await pool.query("UPDATE active_sessions SET last_seen=$1 WHERE session_id=$2", [Date.now(), s]);
      res.send("st_1");
    } catch { res.sendStatus(500); }
  });

  app.get("/get_status_77", async (req, res) => {
    try {
      const r = await pool.query("SELECT COUNT(*) FROM active_sessions");
      res.json({ active: Number(r.rows[0].count) });
    } catch { res.json({ active: 0 }); }
  });

  app.get("/count", (req, res) => {
    res.status(403).send("Nice try! This path is disabled for security reasons.");
  });

  app.get("/ping", (req, res) => {
    res.status(404).send("Not Found");
  });

  app.get("/check_00", (req, res) => res.send("active_1"));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT);
}

startServer().catch(console.error);
