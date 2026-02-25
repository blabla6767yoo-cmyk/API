const express = require("express");
const { Pool } = require("pg");
const { randomUUID } = require("crypto");

const app = express();

// إعداد الاتصال بقاعدة البيانات
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function startServer() {
  try {
    await pool.connect();
    console.log("Connected to Database ✅");

    // 1. إنشاء الجدول تلقائياً إذا لم يكن موجوداً
    await pool.query(`
      CREATE TABLE IF NOT EXISTS active_sessions (
        session_id TEXT PRIMARY KEY,
        player_id TEXT,
        script_name TEXT,
        last_seen BIGINT
      )
    `);

    // 2. منظف البيانات التلقائي (يحذف أي شخص يغيب أكثر من 10 ثواني)
    setInterval(async () => {
      try {
        const timeout = Date.now() - 10000; 
        await pool.query("DELETE FROM active_sessions WHERE last_seen < $1", [timeout]);
      } catch (err) {
        console.error("Cleaner Error:", err);
      }
    }, 5000); // يفحص كل 5 ثواني

    // --- [ المسارات / Routes ] ---

    // مسار تسجيل الدخول (Authentication)
    app.get("/auth_v2_x9", async (req, res) => {
      try {
        const p_id = req.query.p_id;
        const s_name = req.query.s_name || "Unknown Script";
        if (!p_id) return res.sendStatus(400);

        const session_token = randomUUID();
        
        // حذف أي جلسة قديمة لنفس اللاعب ثم إضافة الجديدة
        await pool.query("DELETE FROM active_sessions WHERE player_id=$1", [p_id]);
        await pool.query(
          "INSERT INTO active_sessions (session_id, player_id, script_name, last_seen) VALUES($1, $2, $3, $4)",
          [session_token, p_id, s_name, Date.now()]
        );

        res.json({ token: session_token });
      } catch (err) {
        res.status(500).send(err.message);
      }
    });

    // مسار النبض (Heartbeat/Sync)
    app.get("/sync_data_88", async (req, res) => {
      try {
        const token = req.query.tk;
        if (!token) return res.sendStatus(400);

        const result = await pool.query(
          "UPDATE active_sessions SET last_seen=$1 WHERE session_id=$2",
          [Date.now(), token]
        );

        if (result.rowCount === 0) return res.send("expired");
        res.send("st_1");
      } catch {
        res.sendStatus(500);
      }
    });

    // رابط العداد (للسكربت فقط)
    app.get("/aWFtZG93bmdvZ29nYWdh", async (req, res) => {
      try {
        const r = await pool.query("SELECT COUNT(*) FROM active_sessions");
        res.json({ status: "success", data: { online: Number(r.rows[0].count) } });
      } catch {
        res.json({ online: 0 });
      }
    });

    // لوحة المراقبة السرية (iamtheking77)
    app.get("/iamtheking77", async (req, res) => {
      try {
        const r = await pool.query("SELECT player_id, script_name FROM active_sessions ORDER BY last_seen DESC");
        let html = `
        <html>
          <head><title>Admin Dashboard</title></head>
          <body style="background:#0a0a0a; color:#00ff00; font-family: 'Courier New', monospace; padding:30px;">
            <h1 style="border-bottom: 2px solid #00ff00; padding-bottom:10px;">[ SYSTEM_LIVE_STATS ]</h1>
            <div style="margin-top:20px;">
        `;

        if (r.rows.length === 0) {
          html += `<p style="color:#ff3333;">> NO_ACTIVE_SESSIONS_FOUND...</p>`;
        } else {
          r.rows.forEach(row => {
            html += `
              <p style="background:#1a1a1a; padding:10px; border-radius:5px; border-left: 5px solid #00ff00;">
                <b>USER_ID:</b> <span style="color:#ffffff;">${row.player_id}</span> | 
                <b>SCRIPT:</b> <span style="color:#ffff00;">${row.script_name}</span> | 
                <span style="color:#888;">[ ACTIVE ]</span>
              </p>`;
          });
        }

        html += `
            </div>
            <p style="margin-top:50px; font-size:12px; color:#444;">Last Auto-Sync: ${new Date().toLocaleTimeString()}</p>
          </body>
        </html>`;
        res.send(html);
      } catch (err) {
        res.send("Database Error: " + err.message);
      }
    });

    // المسار الرئيسي للتأكد أن السيرفر يعمل
    app.get("/", (req, res) => res.send("Server is Up and Running! 🚀"));

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

  } catch (err) {
    console.error("Startup Error:", err);
  }
}

startServer();
