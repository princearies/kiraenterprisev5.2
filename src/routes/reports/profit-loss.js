import { Hono } from 'hono';

const app = new Hono();

// GET /api/reports/profit-loss
app.get('/profit-loss', (c) => c.json({ success: true, message: "Profit & Loss engine ready" }));

export { app as profitLoss };
