import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable Global CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Serve Main UI Interface
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KiraEnterpriseV5.2</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { font-size: 1.1em; opacity: 0.9; }
    .content { padding: 30px; }
    .controls { display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap; }
    .btn { padding: 12px 24px; border: none; border-radius: 8px; font-size: 1em; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4); }
    .btn-danger { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }
    .btn-danger:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(245, 87, 108, 0.4); }
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    thead { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    th, td { padding: 15px; text-align: left; border-bottom: 1px solid #ddd; }
    th { font-weight: 600; text-transform: uppercase; font-size: 0.9em; letter-spacing: 0.5px; }
    tbody tr { transition: background 0.3s ease; }
    tbody tr:hover { background: #f8f9fa; }
    .status-active { background: #10b981; color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 600; display: inline-block; }
    .loading { text-align: center; padding: 40px; color: #667eea; font-size: 1.2em; }
    .empty-state { text-align: center; padding: 40px; color: #999; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
    .stat-label { font-size: 0.9em; opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔥 KiraEnterpriseV5.2</h1>
      <p>Modul Catatan Penyata Kewangan & Imbangan Duga Enterprise</p>
    </div>
    <div class="content">
      <div class="controls">
        <button class="btn btn-primary" onclick="loadCompanies()">📊 Tarik Penyata (Pull Records)</button>
        <button class="btn btn-danger" onclick="deleteAllData()">🗑️ Padam Semua Data</button>
      </div>
      <div id="stats" class="stats" style="display: none;">
        <div class="stat-card"><div class="stat-value" id="totalCompanies">0</div><div class="stat-label">Jumlah Syarikat</div></div>
        <div class="stat-card"><div class="stat-value" id="totalRevenue">RM 0</div><div class="stat-label">Jumlah Hasil</div></div>
        <div class="stat-card"><div class="stat-value" id="totalExpenses">RM 0</div><div class="stat-label">Jumlah Perbelanjaan</div></div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>ID Client</th><th>Nama Entiti</th><th>Jenis</th><th>Hasil (RM)</th><th>Belanja (RM)</th><th>Status</th></tr>
          </thead>
          <tbody id="tableBody">
            <tr><td colspan="6" class="empty-state">Klik 'Tarik Penyata' untuk memuatkan data dari D1.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <script>
    async function loadCompanies() {
      const tableBody = document.getElementById('tableBody');
      const statsDiv = document.getElementById('stats');
      tableBody.innerHTML = '<tr><td colspan="6" class="loading">⏳ Memuatkan data dari Cloudflare D1...</td></tr>';
      try {
        const response = await fetch('/api/clients');
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          let totalRevenue = 0;
          let totalExpenses = 0;
          tableBody.innerHTML = result.data.map(company => {
            const revenue = Number(company.revenue) || 0;
            const expenses = Number(company.expenses) || 0;
            totalRevenue += revenue;
            totalExpenses += expenses;
            return '<tr><td><strong>' + company.client_id + '</strong></td><td>' + company.entity_name + '</td><td>' + (company.entity_type || 'ENTERPRISE') + '</td><td>RM ' + revenue.toLocaleString('ms-MY') + '</td><td>RM ' + expenses.toLocaleString('ms-MY') + '</td><td><span class="status-active">' + company.status + '</span></td></tr>';
          }).join('');
          document.getElementById('totalCompanies').textContent = result.data.length;
          document.getElementById('totalRevenue').textContent = 'RM ' + totalRevenue.toLocaleString('ms-MY');
          document.getElementById('totalExpenses').textContent = 'RM ' + totalExpenses.toLocaleString('ms-MY');
          statsDiv.style.display = 'grid';
        } else {
          tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">📭 Tiada rekod dijumpai dalam database.</td></tr>';
          statsDiv.style.display = 'none';
        }
      } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty-state" style="color: #f5576c;">❌ Ralat: ' + error.message + '</td></tr>';
        statsDiv.style.display = 'none';
      }
    }
    async function deleteAllData() {
      if (!confirm('⚠️ Adakah anda pasti mahu PADAM SEMUA data? Tindakan ini tidak boleh diubah!')) return;
      try {
        const response = await fetch('/api/clients/all', { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
          alert('✅ Semua data berjaya dipadam.');
          loadCompanies();
        } else {
          alert('❌ Ralat: ' + result.error);
        }
      } catch (error) {
        alert('❌ Ralat: ' + error.message);
      }
    }
  </script>
</body>
</html>
  `);
});

// GET Endpoint - Tarik Data Entiti
app.get('/api/clients', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        client_id,
        COALESCE(entity_name, json_extract(company_meta, '$.name'), 'Tiada Nama') AS entity_name,
        COALESCE(entity_type, json_extract(company_meta, '$.type'), 'ENTERPRISE') AS entity_type,
        COALESCE(status, 'Active') AS status,
        COALESCE(json_extract(company_meta, '$.revenue'), json_extract(company_meta, '$.hasil'), 0) AS revenue,
        COALESCE(json_extract(company_meta, '$.expenses'), json_extract(company_meta, '$.belanja'), 0) AS expenses
      FROM client_entries
      ORDER BY client_id DESC
    `).all();

    return c.json({ success: true, count: results.length, data: results });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE Endpoint - Padam Semua Data
app.delete('/api/clients/all', async (c) => {
  try {
    await c.env.DB.prepare(`DELETE FROM client_entries`).run();
    return c.json({ success: true, message: 'Semua rekod dipadam secara kekal.' });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
