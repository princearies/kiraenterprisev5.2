import { Hono } from 'hono';

const app = new Hono();

// GET /api/journal-entries - Dapatkan entri jurnal untuk syarikat tertentu
app.get('/journal-entries', async (c) => {
  try {
    const companyCode = c.req.query('company_code') || c.req.query('clientId');
    const year = c.req.query('year');
    
    if (!companyCode) {
      return c.json({ success: false, error: 'company_code is required' }, 400);
    }
    
    let query = 'SELECT id, company_id, client_id, date, description, lines FROM journal_entries WHERE company_id = ? OR client_id = ?';
    const params = [companyCode, companyCode];
    
    if (year) {
      query += ' AND date LIKE ?';
      params.push(`${year}%`);
    }
    query += ' ORDER BY date ASC';
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    
    const formatted = (results || []).map(r => ({
      id: r.id,
      company_code: r.company_id,
      date: r.date,
      description: r.description,
      lines: typeof r.lines === 'string' ? JSON.parse(r.lines || '[]') : (r.lines || [])
    }));
    
    return c.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/journal-entries
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || `je-${body.company_code || body.clientId}-${Date.now()}`;
    const companyCode = body.company_code || body.clientId;

    await c.env.DB.prepare(
      'INSERT INTO journal_entries (id, company_id, client_id, date, description, lines) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, companyCode, companyCode, body.date || '', body.description || '', JSON.stringify(body.lines || [])).run();

    return c.json({ success: true, id });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT /api/journal-entries/:id
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    await c.env.DB.prepare(
      'UPDATE journal_entries SET date = ?, description = ?, lines = ? WHERE id = ?'
    ).bind(body.date || '', body.description || '', JSON.stringify(body.lines || []), id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/journal-entries/:id/reverse
app.post('/:id/reverse', async (c) => {
  try {
    const id = c.req.param('id');

    const original = await c.env.DB.prepare('SELECT * FROM journal_entries WHERE id = ?').bind(id).first();
    if (!original) {
      return c.json({ error: 'Entry not found' }, 404);
    }

    const lines = typeof original.lines === 'string' ? JSON.parse(original.lines) : original.lines;
    const reversedLines = lines.map(line => ({
      ...line,
      debit: line.credit || 0,
      credit: line.debit || 0
    }));

    const newId = `je-rev-${Date.now()}`;
    await c.env.DB.prepare(
      'INSERT INTO journal_entries (id, company_id, client_id, date, description, lines) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(newId, original.company_id, original.client_id, new Date().toISOString().split('T')[0], `[REVERSAL] ${original.description}`, JSON.stringify(reversedLines)).run();

    return c.json({ success: true, reversal_id: newId });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export { app as journalEntries };
