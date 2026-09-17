import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';

const app = new Hono();

// Serve static HTML dari folder public/
app.get('*', serveStatic({ root: './' }));

// API: Ambil senarai clients & extract JSON
app.get('/api/clients', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        client_id,
        entity_name,
        entity_type,
        status,
        COALESCE(
          json_extract(company_meta, '$.revenue'), 
          json_extract(company_meta, '$.hasil'), 
          json_extract(company_meta, '$.financials.revenue'),
          0
        ) AS revenue,
        COALESCE(
          json_extract(company_meta, '$.expenses'), 
          json_extract(company_meta, '$.belanja'), 
          json_extract(company_meta, '$.financials.expenses'),
          0
        ) AS expenses
      FROM client_entries
      ORDER BY created_at DESC
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// API: Simpan entry baru ke D1
app.post('/api/clients', async (c) => {
  try {
    const body = await c.req.json();
    const clientId = 'ent-' + Math.floor(1000 + Math.random() * 9000);
    const meta = JSON.stringify({ revenue: body.revenue, expenses: body.expenses, fy: body.fy });

    await c.env.DB.prepare(`
      INSERT INTO client_entries (client_id, entity_name, entity_type, status, company_meta)
      VALUES (?, ?, 'ENTERPRISE', 'Draft', ?)
    `).bind(clientId, body.entity_name, meta).run();

    return c.json({ success: true, client_id: clientId });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
