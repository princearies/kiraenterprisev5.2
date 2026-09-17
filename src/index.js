const HTML_CONTENT = `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KiraEnterpriseV5.2 - Sistem Buku Akaun & Laporan Kewangan</title>
  <style>
    :root {
      --primary: #1e3a8a;
      --secondary: #0d9488;
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #0f172a;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    h1, h2 {
      color: var(--primary);
    }
    .card {
      background: var(--card);
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      margin-bottom: 24px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 6px;
      font-size: 0.9rem;
    }
    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-sizing: border-box;
    }
    .btn-group {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }
    button {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-submit {
      background-color: var(--primary);
      color: white;
    }
    .btn-fetch {
      background-color: var(--secondary);
      color: white;
    }
    button:hover {
      opacity: 0.9;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 10px;
      text-align: left;
      font-size: 0.9rem;
    }
    th {
      background-color: #f1f5f9;
      color: var(--primary);
    }
    .status-msg {
      margin-top: 12px;
      font-weight: 600;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>

<div class="container">
  <h1>KiraEnterpriseV5.2</h1>
  <p><em>Modul Catatan Penyata Kewangan & Imbangan Duga Enterprise</em></p>

  <div class="card">
    <h2>Catatan Penutupan Akaun (Year-End Entry)</h2>
    <form id="accountingForm">
      <div class="form-group">
        <label for="businessName">Nama Entiti Perniagaan (Enterprise Name)</label>
        <input type="text" id="businessName" placeholder="Contoh: Kedai Kopi Borneo Enterprise" required>
      </div>
      
      <div class="form-group">
        <label for="financialYear">Tahun Kewangan (Financial Year - FY)</label>
        <input type="number" id="financialYear" value="2025" required>
      </div>

      <div class="form-group">
        <label for="totalRevenue">Jumlah Hasil / Jualan (Total Revenue - RM)</label>
        <input type="number" step="0.01" id="totalRevenue" placeholder="0.00" required>
      </div>

      <div class="form-group">
        <label for="totalExpense">Jumlah Perbelanjaan / Belanja Kendalian (Total Expenses - RM)</label>
        <input type="number" step="0.01" id="totalExpense" placeholder="0.00" required>
      </div>

      <div class="btn-group">
        <button type="button" class="btn-submit" onclick="submitFinancialReport()">
           Pos Ke Lejar (Save to D1)
        </button>
        <button type="button" class="btn-fetch" onclick="fetchFinancialReports()">
           Tarik Penyata (Pull Records)
        </button>
      </div>
      <div id="statusMsg" class="status-msg"></div>
    </form>
  </div>

  <div class="card">
    <h2>Lejar Imbangan Duga & Penyata Untung Rugi</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Entiti Perniagaan</th>
          <th>Tahun Kewangan</th>
          <th>Jumlah Hasil (RM)</th>
          <th>Jumlah Belanja (RM)</th>
          <th>Untung Bersih (RM)</th>
          <th>Tarikh Kemaskini</th>
        </tr>
      </thead>
      <tbody id="ledgerTableBody">
        <tr>
          <td colspan="7" style="text-align: center; color: #64748b;">Klik "Tarik Penyata" untuk memuat turun rekod lejar.</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<script>
  const WORKER_URL = window.location.origin;

  async function submitFinancialReport() {
    const statusDiv = document.getElementById('statusMsg');
    statusDiv.style.color = 'blue';
    statusDiv.innerText = 'Sedang memproses catatan akaun...';

    const payload = {
      business_name: document.getElementById('businessName').value,
      financial_year: parseInt(document.getElementById('financialYear').value),
      total_revenue: parseFloat(document.getElementById('totalRevenue').value),
      total_expense: parseFloat(document.getElementById('totalExpense').value)
    };

    if (!payload.business_name || isNaN(payload.total_revenue) || isNaN(payload.total_expense)) {
      statusDiv.style.color = 'red';
      statusDiv.innerText = 'Ralat: Sila isi semua butiran perakaunan dengan betul.';
      return;
    }

    try {
      const response = await fetch(\`\${WORKER_URL}/api/save-report\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        statusDiv.style.color = 'green';
        statusDiv.innerText = 'Berjaya! Rekod imbangan telah disimpan ke Cloudflare D1 (mykira).';
        fetchFinancialReports();
      } else {
        throw new Error(result.message || 'Gagal menyimpan rekod.');
      }
    } catch (err) {
      statusDiv.style.color = 'red';
      statusDiv.innerText = 'Ralat Sambungan: ' + err.message;
    }
  }

  async function fetchFinancialReports() {
    const tbody = document.getElementById('ledgerTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Memuat turun data lejar...</td></tr>';

    try {
      const response = await fetch(\`\${WORKER_URL}/api/get-reports\`);
      const data = await response.json();

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Tiada rekod imbangan ditemui.</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td>\${row.id}</td>
          <td><strong>\${row.business_name}</strong></td>
          <td>FY\${row.financial_year}</td>
          <td style="color: green;">\${row.total_revenue.toFixed(2)}</td>
          <td style="color: red;">\${row.total_expense.toFixed(2)}</td>
          <td><strong>\${row.net_profit.toFixed(2)}</strong></td>
          <td>\${new Date(row.created_at).toLocaleDateString('ms-MY')}</td>
        \`;
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = \`<tr><td colspan="7" style="color:red; text-align:center;">Gagal memuat turun rekod: \${err.message}</td></tr>\`;
    }
  }
</script>

</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };

    // Serve HTML GUI at Root URL
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(HTML_CONTENT, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // API: Save Report
    if (request.method === "POST" && url.pathname === "/api/save-report") {
      try {
        const data = await request.json();
        const netProfit = data.total_revenue - data.total_expense;

        const query = `
          INSERT INTO clients (business_name, financial_year, total_revenue, total_expense, net_profit)
          VALUES (?, ?, ?, ?, ?)
        `;

        await env.DB.prepare(query)
          .bind(data.business_name, data.financial_year, data.total_revenue, data.total_expense, netProfit)
          .run();

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // API: Get Reports
    if (request.method === "GET" && url.pathname === "/api/get-reports") {
      try {
        const { results } = await env.DB.prepare("SELECT * FROM clients ORDER BY created_at DESC").all();
        return new Response(JSON.stringify(results), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
