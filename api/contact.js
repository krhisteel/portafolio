// api/contact.js — función serverless de Vercel.
// POST: guarda un mensaje del formulario en Neon (Postgres) y envía copia al correo.
// GET:  lista los mensajes guardados (para el panel admin).
// DELETE: elimina un mensaje por id.

const { neon } = require('@neondatabase/serverless');

const EMAIL = 'oyanederaileen77@gmail.com';

function db() {
  return process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'POST') {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: 'faltan campos' });
    }
    const entry = {
      id: 'msg_' + Date.now(),
      name: String(name).slice(0, 120),
      email: String(email).slice(0, 160),
      message: String(message).slice(0, 4000),
      date: new Date().toISOString()
    };

    // 1) guardar en la base de datos (Neon)
    let stored = false;
    const sql = db();
    if (sql) {
      try {
        await sql`INSERT INTO mensajes (id, name, email, message, date)
                  VALUES (${entry.id}, ${entry.name}, ${entry.email}, ${entry.message}, ${entry.date})`;
        stored = true;
      } catch (e) { /* el correo aún puede funcionar */ }
    }

    // 2) copia al correo vía FormSubmit (gratis, sin cuenta;
    //    la primera vez llega un correo de activación a la bandeja)
    let emailed = false;
    try {
      const r = await fetch('https://formsubmit.co/ajax/' + EMAIL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Referer: (process.env.VERCEL_PROJECT_PRODUCTION_URL || 'portafolio-kohl-phi-39.vercel.app') + '/'
        },
        body: JSON.stringify({
          name: entry.name,
          email: entry.email,
          message: entry.message,
          _subject: 'Nuevo mensaje desde tu portafolio',
          _template: 'table',
          _captcha: 'false'
        })
      });
      emailed = r.ok;
    } catch (e) { /* el mensaje queda al menos en la base */ }

    return res.json({ ok: true, stored, emailed });
  }

  if (req.method === 'GET') {
    const sql = db();
    if (!sql) return res.json({ ok: true, messages: [] });
    try {
      const rows = await sql`SELECT id, name, email, message, date
                              FROM mensajes ORDER BY date DESC LIMIT 100`;
      const messages = rows.map((r) => ({
        ...r,
        date: r.date instanceof Date ? r.date.toISOString() : r.date
      }));
      return res.json({ ok: true, messages });
    } catch (e) {
      return res.status(500).json({ ok: false, error: 'no se pudo leer la base' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    const sql = db();
    if (!id || !sql) return res.status(400).json({ ok: false });
    try {
      await sql`DELETE FROM mensajes WHERE id = ${String(id).slice(0, 64)}`;
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false });
    }
  }

  return res.status(405).end();
}
