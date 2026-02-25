const express = require("express");
const { Pool } = require("pg");
const { randomUUID } = require("crypto");

const app = express(); // التعرّف لازم يكون هنا فوق

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function startServer() {
  await pool.connect();

  // تأكد إن كل الـ app.get موجودة داخل هذه الدالة
  app.get("/auth_v2_x9", async (req, res) => {
    try {
      const p = req.query.p_id;
      const s_name = req.query.s_name || "Unknown";
      if (!p) return res.sendStatus(400);
      const s = randomUUID();
      await pool.query("DELETE FROM active_sessions WHERE player_id=$1", [p]);
      await pool.query("INSERT INTO active_sessions (session_id, player_id, script_name, last_seen) VALUES($1,$2,$3,$4)", [s, p, s_name, Date.now()]);
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
    } catch { res.json({ online: 0 }); }
  });

  app.get("/iamtheking77", async (req, res) => {
    try {
        const r = await pool.query("SELECT player_id, script_name FROM active_sessions");
        let html = `<body style="background:#000;color:#0f0;font-family:monospace;"><h1>Live Stats</h1>`;
        r.rows.forEach(row => {
            html += `<p>ID: ${row.player_id} | Script: ${row.script_name}</p>`;
        });
        res.send(html + "</body>");
    } catch { res.send("Error"); }
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log("Server running on port " + PORT));
}

startServer().catch(console.error);
