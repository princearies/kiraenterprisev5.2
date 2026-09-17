export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    try {
      // 1. GET /api/companies
      if (path === '/api/companies' && method === 'GET') {
        const { results } = await env.DB.prepare('SELECT client_id, company_meta FROM client_entries').all();
        const companies = (results || []).map(r => {
          let meta = {};
          try { meta = JSON.parse(r.company_meta || '{}'); } catch (e) {}
          return { company_code: r.client_id, ...meta };
        });
        return new Response(JSON.stringify(companies), { headers });
      }

      // 2. GET /api/journal-entries?company_code=ENT-001&year=2025
      if (path === '/api/journal-entries' && method === 'GET') {
        const companyCode = url.searchParams.get('company_code') || url.searchParams.get('clientId');
        const year = url.searchParams.get('year');

        let query = 'SELECT id, company_id, date, description, lines FROM journal_entries WHERE company_id = ? OR client_id = ?';
        const params = [companyCode, companyCode];

        if (year) {
          query += ' AND date LIKE ?';
          params.push(`${year}%`);
        }
        query += ' ORDER BY date ASC';

        const { results } = await env.DB.prepare(query).bind(...params).all();
        const formatted = (results || []).map(r => ({
          id: r.id,
          company_code: r.company_id,
          date: r.date,
          description: r.description,
          lines: typeof r.lines === 'string' ? JSON.parse(r.lines || '[]') : (r.lines || [])
        }));

        return new Response(JSON.stringify(formatted), { headers });
      }

      // 3. POST /api/journal-entries
      if (path === '/api/journal-entries' && method === 'POST') {
        const body = await request.json();
        const id = body.id || `je-${body.company_code || body.clientId}-${Date.now()}`;
        const companyCode = body.company_code || body.clientId;

        await env.DB.prepare(
          'INSERT INTO journal_entries (id, company_id, client_id, date, description, lines) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(id, companyCode, companyCode, body.date || '', body.description || '', JSON.stringify(body.lines || [])).run();

        return new Response(JSON.stringify({ success: true, id }), { headers });
      }

      // 4. PUT /api/journal-entries/:id
      if (path.startsWith('/api/journal-entries/') && method === 'PUT') {
        const id = path.split('/')[3];
        const body = await request.json();

        await env.DB.prepare(
          'UPDATE journal_entries SET date = ?, description = ?, lines = ? WHERE id = ?'
        ).bind(body.date || '', body.description || '', JSON.stringify(body.lines || []), id).run();

        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // 5. POST /api/journal-entries/:id/reverse
      if (path.startsWith('/api/journal-entries/') && path.endsWith('/reverse') && method === 'POST') {
        const parts = path.split('/');
        const originalId = parts[3];

        const original = await env.DB.prepare('SELECT * FROM journal_entries WHERE id = ?').bind(originalId).first();
        if (!original) {
          return new Response(JSON.stringify({ error: 'Entry not found' }), { status: 404, headers });
        }

        const lines = typeof original.lines === 'string' ? JSON.parse(original.lines) : original.lines;
        const reversedLines = lines.map(line => ({
          ...line,
          debit: line.credit || 0,
          credit: line.debit || 0
        }));

        const newId = `je-rev-${Date.now()}`;
        await env.DB.prepare(
          'INSERT INTO journal_entries (id, company_id, client_id, date, description, lines) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(newId, original.company_id, original.client_id, new Date().toISOString().split('T')[0], `[REVERSAL] ${original.description}`, JSON.stringify(reversedLines)).run();

        return new Response(JSON.stringify({ success: true, reversal_id: newId }), { headers });
      }

      // 6. GET /api/reports/trial-balance
      if (path === '/api/reports/trial-balance' && method === 'GET') {
        const companyCode = url.searchParams.get('company_code');
        const { results } = await env.DB.prepare('SELECT lines FROM journal_entries WHERE company_id = ? OR client_id = ?').bind(companyCode, companyCode).all();

        const totals = {};
        (results || []).forEach(r => {
          const lines = typeof r.lines === 'string' ? JSON.parse(r.lines || '[]') : (r.lines || []);
          lines.forEach(l => {
            if (!totals[l.account]) totals[l.account] = { debit: 0, credit: 0 };
            totals[l.account].debit += Number(l.debit || 0);
            totals[l.account].credit += Number(l.credit || 0);
          });
        });

        return new Response(JSON.stringify(totals), { headers });
      }

      // 7. GET /api/reports/profit-loss
      if (path === '/api/reports/profit-loss' && method === 'GET') {
        return new Response(JSON.stringify({ message: "Profit & Loss calculation engine ready" }), { headers });
      }

      // 8. GET /api/reports/balance-sheet
      if (path === '/api/reports/balance-sheet' && method === 'GET') {
        return new Response(JSON.stringify({ message: "Balance Sheet calculation engine ready" }), { headers });
      }

      // 9. POST /api/year-end/:company_code/:year/publish
      if (path.startsWith('/api/year-end/') && path.endsWith('/publish') && method === 'POST') {
        const parts = path.split('/');
        const companyCode = parts[3];
        const year = parts[4];

        return new Response(JSON.stringify({ success: true, company_code: companyCode, year: year, status: 'PUBLISHED' }), { headers });
      }

      // Fallback for static files
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
  }
};
