
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
