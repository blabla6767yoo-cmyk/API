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

  app.get("/aWFtZG93bmdvZ29nYWdh", async (req, res) => {
    try {
      const r = await pool.query("SELECT COUNT(*) FROM active_sessions");
      res.json({ status: "success", data: { online: Number(r.rows[0].count) } });
    } catch {
      res.json({ online: 0 });
    }
  });

  app.get("/iamdowngogogaga", (req, res) => {
    res.status(403).send("Error 403: Unauthorized Access. Security protocol 0x99 triggered.");
  });

  app.get("/-38jwbiLl", (req, res) => {
    res.status(401).send("Nice try."); 
  });

  app.get("/count", (req, res) => {
    res.status(403).send("Forbidden.");
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT);
}

startServer().catch(console.error);
