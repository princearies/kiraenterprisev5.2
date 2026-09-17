import { Hono } from 'hono';

const app = new Hono();

// GET /api/reports/trial-balance
app.get('/trial-balance', async (c) => {
  try {
    const companyCode = c.req.query('company_code');
    if (!companyCode) return c.json({ success: false, error: 'company_code is required' }, 400);
    
    const { results } = await c.env.DB.prepare('SELECT lines FROM journal_entries WHERE company_id = ? OR client_id = ?').bind(companyCode, companyCode).all();
    
    const totals = {};
    (results || []).forEach(r => {
      const lines = typeof r.lines === 'string' ? JSON.parse(r.lines || '[]') : (r.lines || []);
      lines.forEach(l => {
        if (!totals[l.account]) totals[l.account] = { debit: 0, credit: 0 };
        totals[l.account].debit += Number(l.debit || 0);
        totals[l.account].credit += Number(l.credit || 0);
      });
    });
    return c.json({ success: true, data: totals });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export { app as trialBalance };
