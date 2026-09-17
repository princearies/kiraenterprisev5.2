import { Hono } from 'hono';

const app = new Hono();

// Serve UI via HTML string (no template literal variable evaluation bugs)
app.get('/', (c) => {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KiraEnterpriseV5.2</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 min-h-screen p-8 text-slate-800">
  <div class="max-w-5xl mx-auto space-y-6">
    <header class="border-b pb-4">
      <h1 class="text-3xl font-bold text-blue-900">KiraEnterpriseV5.2</h1>
      <p class="text-slate-500 text-sm">Modul Catatan Penyata Kewangan & Imbangan Duga Enterprise</p>
    </header>

    <!-- Entry Form -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 class="text-lg font-bold text-slate-800 mb-4">Catatan Penutup Akaun (Year-End Entry)</h2>
      <form id="clientForm" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Nama Entiti Perniagaan (Enterprise Name)</label>
          <input type="text" id="entity_name" required placeholder="Contoh: Kedai Kopi Borneo Enterprise" class="w-full p-2.5 border rounded-lg text-sm bg-slate-50">
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Tahun Kewangan (FY)</label>
            <input type="number" id="fy" value="2025" class="w-full p-2.5 border rounded-lg text-sm bg-slate-50">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Jumlah Hasil / Jualan (RM)</label>
            <input type="number" step="0.01" id="revenue" value="0.00" class="w-full p-2.5 border rounded-lg text-sm bg-slate-50">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Jumlah Perbelanjaan (RM)</label>
            <input type="number" step="0.01" id="expenses" value="0.00" class="w-full p-2.5 border rounded-lg text-sm bg-slate-50">
          </div>
        </div>
        <div class="flex gap-4 pt-2">
          <button type="submit" class="flex-1 bg-blue-800 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-900 transition-colors">Pos Ke Lejar (Save to D1)</button>
          <button type="button" id="btnPull" class="flex-1 bg-teal-600 text-white font-semibold py-2.5 rounded-lg hover:bg-teal-700 transition-colors">Tarik Penyata (Pull Records)</button>
        </div>
      </form>
    </div>

    <!-- Table Display -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="p-4 border-b bg-slate-50 font-bold text-blue-900">Lejar Imbangan Duga & Penyata Untung Rugi</div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-100 text-slate-600 uppercase text-xs">
            <tr>
              <th class="p-3">ID Client</th>
              <th class="p-3">Nama Entiti</th>
              <th class="p-3">Jenis</th>
              <th class="p-3">Hasil (RM)</th>
              <th class="p-3">Belanja (RM)</th>
              <th class="p-3">Status</th>
            </tr>
          </thead>
          <tbody id="tableBody">
            <tr><td colspan="6" class="p-4 text-center text-slate-400">Klik 'Tarik Penyata' untuk memuatkan data dari D1.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    function loadData() {
      fetch('/api/clients')
        .then(function(res) { return res.json(); })
        .then(function(json) {
          if (json.success) {
            var tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';
            json.data.forEach(function(c) {
              var tr = document.createElement('tr');
              tr.className = 'border-b hover:bg-slate-50';
              tr.innerHTML = 
                '<td class="p-3 font-mono text-xs text-slate-500">' + (c.client_id || '') + '</td>' +
                '<td class="p-3 font-medium text-slate-800">' + (c.entity_name || '') + '</td>' +
                '<td class="p-3 font-semibold text-blue-600">' + (c.entity_type || '') + '</td>' +
                '<td class="p-3 font-semibold text-emerald-600">' + Number(c.revenue || 0).toFixed(2) + '</td>' +
                '<td class="p-3 font-semibold text-rose-600">' + Number(c.expenses || 0).toFixed(2) + '</td>' +
                '<td class="p-3"><span class="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-medium">' + (c.status || 'Draft') + '</span></td>';
              tbody.appendChild(tr);
            });
          }
        })
        .catch(function(err) {
          alert('Fetch error: ' + err.message);
        });
    }

    document.getElementById('btnPull').onclick = function() {
      loadData();
    };

    document.getElementById('clientForm').onsubmit = function(e) {
      e.preventDefault();
      var bodyData = {
        entity_name: document.getElementById('entity_name').value,
        fy: document.getElementById('fy').value,
        revenue: parseFloat(document.getElementById('revenue').value),
        expenses: parseFloat(document.getElementById('expenses').value)
      };
      fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      })
      .then(function(res) { return res.json(); })
      .then(function(json) {
        if (json.success) {
          alert('Berjaya disimpan ke D1!');
          loadData();
        } else {
          alert('Ralat: ' + json.error);
        }
      });
    };
  </script>
</body>
</html>`;
  return c.html(htmlContent);
});

// GET clients endpoint
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

// POST client endpoint
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
