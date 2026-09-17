import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { companies } from './routes/companies';
import { journalEntries } from './routes/journal-entries';
import { trialBalance } from './routes/reports/trial-balance';
import { profitLoss } from './routes/reports/profit-loss';
import { balanceSheet } from './routes/reports/balance-sheet';

const app = new Hono();

// Global CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Register Routes
app.route('/api', companies);
app.route('/api', journalEntries);
app.route('/api/reports', trialBalance);
app.route('/api/reports', profitLoss);
app.route('/api/reports', balanceSheet);

// 3. Route Utama (Landing Page)
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>KiraEnterpriseV5.2 - API Status</title>
      <style>
        body { font-family: sans-serif; text-align: center; margin-top: 50px; background: #f4f4f9; }
        h1 { color: #2c3e50; }
        .status { color: green; font-weight: bold; font-size: 1.2em; }
        .links { margin-top: 20px; }
        a { display: block; margin: 10px auto; color: #3498db; text-decoration: none; max-width: 300px; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>🔥 KiraEnterpriseV5.2 API</h1>
      <p class="status">✅ System Online & Modular</p>
      <div class="links">
        <a href="/api/companies"> Senarai Syarikat</a>
        <a href="/api/journal-entries?company_code=ENT-001">📖 Jurnal (Contoh)</a>
        <a href="/api/reports/trial-balance?company_code=ENT-001">⚖️ Imbangan Duga</a>
      </div>
    </body>
    </html>
  `);
});

export default app;
