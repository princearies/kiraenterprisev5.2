import { Hono } from 'hono';

const app = new Hono();

// GET /api/reports/balance-sheet
app.get('/balance-sheet', (c) => c.json({ success: true, message: "Balance Sheet engine ready" }));

export { app as balanceSheet };
