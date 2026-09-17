import { Hono } from 'hono';

const app = new Hono();

// GET /api/companies - Senaraikan semua syarikat
app.get('/companies', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT client_id, company_meta FROM client_entries').all();
    const companies = (results || []).map(r => {
      let meta = {};
      try { meta = JSON.parse(r.company_meta || '{}'); } catch (e) {}
      return { company_code: r.client_id, ...meta };
    });
    return c.json({ success: true, count: companies.length, data: companies });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export { app as companies };
