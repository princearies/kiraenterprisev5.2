import { Hono } from 'hono';

const app = new Hono();

// Enable Global CORS untuk akses universal dari pelbagai aplikasi / domain
app.use('*', async (c, next) => {
  await next();
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
});

// Serve Main UI Interface
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KiraEnterpriseV5.2 - Universal Data Hub</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 min-h-screen p-8 text-slate-800">
  <div class="max-w-5xl mx-auto space-y-6">
    <header class="border-b pb-4 flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-bold text-blue-900">KiraEnterpriseV5.2</h1>
        <p class="text-slate-500 text-sm">Pusat Data Universal & Catatan Penyata Kewangan</p>
      </div>
      <span class="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">Universal API Active</span>
    </header>

    <!-- Form Entry -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 class="text-lg font-bold text-slate-800 mb-4">Daftar / Kemaskini Data Entiti</h2>
      <form id="clientForm" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Nama Entiti Perniagaan</label>
          <input type="text" id="entity_name" required placeholder="Contoh: Kedai Kopi Borneo Enterprise" class="w-full p-2.5 border rounded-lg text-sm bg-slate-50">
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Tahun Kewangan (FY)</label>
            <input type="number" id="fy" value="2025" class="w-full p-2.5 border rounded-lg text-sm bg-slate-50">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Hasil (RM)</label>
            <input type="number" step="0.01" id="revenue" value="0.00" class="w-full p-2.5 border rounded-lg text-sm bg-slate-50">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Perbelanjaan (RM)</label>
            <input type="number" step="0.01" id="expenses" value="0.00" class="w-full p-2.5 border rounded-lg text-sm bg-slate-50">
          </div>
        </div>
        <div class="flex gap-4 pt-2">
          <button type="submit" class="flex-1 bg-blue-800 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-900 transition-colors">Simpan Data Universal</button>
          <button type="button" id="btnPull" class="flex-1 bg-teal-600 text-white font-semibold py-2.5 rounded-lg hover:bg-teal-700 transition-colors">Muat Turun Data (Pull)</button>
          <button type="button" id="btnReset" class="bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-rose-700 transition-colors">Padam Semua</button>
        </div>
      </form>
    </div>

    <!-- Table Display -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="p-4 border-b bg-slate-50 font-bold text-blue-900">Senarai Record Pangkalan Data Universal</div>
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
            <tr><td colspan="6" class="p-4 text-center text-slate-400">Sila klik 'Muat Turun Data' untuk memuatkan rekod.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    function loadData() {
      fetch('/api/clients')
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';
            if (json.data.length === 0) {
              tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400">Tiada rekod tersimpan di D1.</td></tr>';
              return;
            }
            json.data.forEach(c => {
              const tr = document.createElement('tr');
              tr.className = 'border-b hover:bg-slate-50';
              tr.innerHTML = 
                '<td class="p-3 font-mono text-xs text-slate-500">' + (c.client_id || '-') + '</td>' +
                '<td class="p-3 font-medium text-slate-800">' + (c.entity_name || 'Tiada Nama') + '</td>' +
                '<td class="p-3 font-semibold text-blue-600">' + (c.entity_type || 'ENTERPRISE') + '</td>' +
                '<td class="p-3 font-semibold text-emerald-600">RM ' + Number(c.revenue || 0).toFixed(2) + '</td>' +
                '<td class="p-3 font-semibold text-rose-600">RM ' + Number(c.expenses || 0).toFixed(2) + '</td>' +
                '<td class="p-3"><span class="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-medium">' + (c.status || 'Active') + '</span></td>';
              tbody.appendChild(tr);
            });
          }
        })
        .catch(err => alert('Fetch error: ' + err.message));
    }

    document.getElementById('btnPull').onclick = loadData;

    document.getElementById('btnReset').onclick = function() {
      if (confirm('Adakah anda pasti mahu memadam SEMUA rekod universal di D1?')) {
        fetch('/api/clients/all', { method: 'DELETE' })
          .then(res => res.json())
          .then(json => {
            if (json.success) {
              alert('Semua data universal berjaya dipadam!');
              loadData();
            } else {
              alert('Ralat: ' + json.error);
            }
          });
      }
    };

    document.getElementById('clientForm').onsubmit = function(e) {
      e.preventDefault();
      const bodyData = {
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
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          alert('Berjaya disimpan ke Pangkalan Data Universal!');
          loadData();
        } else {
          alert('Ralat: ' + json.error);
        }
      });
    };
  </script>
</body>
</html>`);
});

// GET Endpoint - Diperakses oleh Mana-Mana Aplikasi (Universal Read)
app.get('/api/clients', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        client_id,
        COALESCE(entity_name, json_extract(company_meta, '$.name'), 'Tiada Nama') AS entity_name,
        COALESCE(entity_type, json_extract(company_meta, '$.type'), 'ENTERPRISE') AS entity_type,
        COALESCE(status, 'Active') AS status,
        COALESCE(
          json_extract(company_meta, '$.revenue'),
          json_extract(company_meta, '$.hasil'),
          0
        ) AS revenue,
        COALESCE(
          json_extract(company_meta, '$.expenses'),
          json_extract(company_meta, '$.belanja'),
          0
        ) AS expenses
      FROM client_entries
      ORDER BY client_id DESC
    `).all();

    return c.json({ success: true, count: results.length, data: results });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST Endpoint - Diperakses oleh Mana-Mana Aplikasi (Universal Write)
app.post('/api/clients', async (c) => {
  try {
    const body = await c.req.json();
    const clientId = 'ent-' + Math.floor(1000 + Math.random() * 9000);
    const meta = JSON.stringify({ 
      name: body.entity_name, 
      type: 'enterprise',
      revenue: body.revenue, 
      expenses: body.expenses, 
      yearEnd: body.fy 
    });

    await c.env.DB.prepare(`
      INSERT INTO client_entries (client_id, entity_name, entity_type, status, company_meta)
      VALUES (?, ?, 'ENTERPRISE', 'Active', ?)
    `).bind(clientId, body.entity_name, meta).run();

    return c.json({ success: true, client_id: clientId });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE Endpoint - Pembersihan Penuh
app.delete('/api/clients/all', async (c) => {
  try {
    await c.env.DB.prepare(`DELETE FROM client_entries`).run();
    return c.json({ success: true, message: 'Semua rekod dipadam secara kekal.' });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
