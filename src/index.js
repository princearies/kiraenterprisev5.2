import { Hono } from 'hono';

const app = new Hono();

// ==========================================
// API ENDPOINTS (Cloudflare D1 JSON Logic)
// ==========================================

// 1. GET ALL CLIENTS (Fetch and extract JSON fields into clean key-value objects)
app.get('/api/clients', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        client_id, 
        json_extract(company_meta, '$.name') AS name, 
        json_extract(company_meta, '$.type') AS type,
        json_extract(company_meta, '$.taxRate') AS tax_rate,
        json_extract(company_meta, '$.yearEnd') AS year_end,
        json_extract(company_meta, '$.hasil') AS hasil,
        json_extract(company_meta, '$.belanja') AS belanja,
        json_extract(company_meta, '$.status_cukai') AS status_cukai
      FROM client_entries
      ORDER BY client_id DESC
    `).all();

    return c.json({ success: true, count: results.length, data: results });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 2. GET SINGLE CLIENT BY ID
app.get('/api/clients/:id', async (c) => {
  try {
    const clientId = c.req.param('id');
    const record = await c.env.DB.prepare(`
      SELECT 
        client_id, 
        company_meta
      FROM client_entries 
      WHERE client_id = ?
    `).bind(clientId).first();

    if (!record) {
      return c.json({ success: false, message: 'Client not found' }, 404);
    }

    return c.json({
      success: true,
      client_id: record.client_id,
      company_meta: JSON.parse(record.company_meta)
    });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 3. POST NEW CLIENT ENTRY (Save metadata as JSON string)
app.post('/api/clients', async (c) => {
  try {
    const body = await c.req.json();
    
    // Generate a unique client ID if not provided
    const clientId = body.client_id || `ent-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const hasil = parseFloat(body.jumlah_hasil) || 0;
    const belanja = parseFloat(body.jumlah_belanja) || 0;
    const untungBersih = hasil - belanja;

    const companyMeta = JSON.stringify({
      name: body.nama_entiti || 'Perusahaan Tanpa Nama',
      type: body.jenis_entiti || 'enterprise',
      taxRate: body.tax_rate ?? 0,
      yearEnd: parseInt(body.tahun_kewangan, 10) || 2025,
      hasil: hasil,
      belanja: belanja,
      untung_bersih: untungBersih,
      status_cukai: body.status_cukai || 'Draft'
    });

    await c.env.DB.prepare(
      'INSERT INTO client_entries (client_id, company_meta) VALUES (?, ?)'
    ).bind(clientId, companyMeta).run();

    return c.json({ 
      success: true, 
      message: 'Entry successfully saved to D1 database.', 
      client_id: clientId 
    }, 201);
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 4. PUT UPDATE CLIENT METADATA
app.put('/api/clients/:id', async (c) => {
  try {
    const clientId = c.req.param('id');
    const body = await c.req.json();

    const record = await c.env.DB.prepare(`
      SELECT company_meta FROM client_entries WHERE client_id = ?
    `).bind(clientId).first();

    if (!record) {
      return c.json({ success: false, message: 'Client not found' }, 404);
    }

    const currentMeta = JSON.parse(record.company_meta);
    const updatedMeta = JSON.stringify({
      ...currentMeta,
      ...body
    });

    await c.env.DB.prepare(`
      UPDATE client_entries SET company_meta = ? WHERE client_id = ?
    `).bind(updatedMeta, clientId).run();

    return c.json({ success: true, message: 'Client metadata updated successfully' });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 5. DELETE CLIENT ENTRY
app.delete('/api/clients/:id', async (c) => {
  try {
    const clientId = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM client_entries WHERE client_id = ?').bind(clientId).run();
    return c.json({ success: true, message: `Client ${clientId} deleted successfully` });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ==========================================
// FRONTEND INTERFACE HTML RENDERER
// ==========================================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ms">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KiraEnterpriseV5.2 - Sistem Buku</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-100 text-slate-800 font-sans p-6">
      <div class="max-w-4xl mx-auto space-y-6">
        <header class="border-b pb-4">
          <h1 class="text-3xl font-bold text-blue-900">KiraEnterpriseV5.2</h1>
          <p class="text-slate-600 text-sm italic">Modul Catatan Penyata Kewangan & Imbangan Duga Enterprise</p>
        </header>

        <!-- INPUT FORM -->
        <div class="bg-white p-6 rounded-xl shadow-md border">
          <h2 class="text-xl font-bold text-blue-900 mb-4">Catatan Penutup Akaun (Year-End Entry)</h2>
          <form id="entryForm" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-1">Nama Entiti Perniagaan (Enterprise Name)</label>
              <input type="text" id="nama_entiti" required placeholder="Contoh: Kedai Kopi Borneo Enterprise" class="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-semibold mb-1">Tahun Kewangan (FY)</label>
                <input type="number" id="tahun_kewangan" value="2025" required class="w-full border rounded-md p-2 text-sm">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1">Jumlah Hasil / Jualan (RM)</label>
                <input type="number" step="0.01" id="jumlah_hasil" placeholder="0.00" required class="w-full border rounded-md p-2 text-sm">
              </div>
              <div>
                <label class="block text-sm font-semibold mb-1">Jumlah Perbelanjaan (RM)</label>
                <input type="number" step="0.01" id="jumlah_belanja" placeholder="0.00" required class="w-full border rounded-md p-2 text-sm">
              </div>
            </div>

            <div class="flex gap-4 pt-2">
              <button type="submit" class="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-md transition text-sm">Pos Ke Lejar (Save to D1)</button>
              <button type="button" id="btnPull" class="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded-md transition text-sm">Tarik Penyata (Pull Records)</button>
            </div>
          </form>
        </div>

        <!-- RECORDS DISPLAY TABLE -->
        <div class="bg-white p-6 rounded-xl shadow-md border">
          <h2 class="text-xl font-bold text-blue-900 mb-4">Lejar Imbangan Duga & Penyata Untung Rugi</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-slate-100 border-b">
                  <th class="p-3">ID Client</th>
                  <th class="p-3">Nama Entiti</th>
                  <th class="p-3">Jenis</th>
                  <th class="p-3">Hasil (RM)</th>
                  <th class="p-3">Belanja (RM)</th>
                  <th class="p-3">Status</th>
                </tr>
              </thead>
              <tbody id="recordsTable">
                <tr><td colspan="6" class="p-4 text-center text-slate-500">Klik 'Tarik Penyata' untuk memuatkan data dari D1.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <script>
        document.getElementById('entryForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const payload = {
            nama_entiti: document.getElementById('nama_entiti').value,
            tahun_kewangan: document.getElementById('tahun_kewangan').value,
            jumlah_hasil: document.getElementById('jumlah_hasil').value,
            jumlah_belanja: document.getElementById('jumlah_belanja').value,
          };

          const res = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (data.success) {
            alert('Rekod berjaya disimpan: ' + data.client_id);
            document.getElementById('entryForm').reset();
            loadRecords();
          } else {
            alert('Ralat: ' + data.error);
          }
        });

        document.getElementById('btnPull').addEventListener('click', loadRecords);

        async function loadRecords() {
          const res = await fetch('/api/clients');
          const result = await res.json();
          const tbody = document.getElementById('recordsTable');
          
          if (result.success && result.data.length > 0) {
            tbody.innerHTML = result.data.map(row => \`
              <tr class="border-b hover:bg-slate-50">
                <td class="p-3 font-mono text-xs">\${row.client_id}</td>
                <td class="p-3 font-medium">\${row.name || '-'}</td>
                <td class="p-3 font-semibold uppercase text-xs text-blue-700">\${row.type || '-'}</td>
                <td class="p-3 font-mono text-emerald-600">\${row.hasil ? parseFloat(row.hasil).toFixed(2) : '0.00'}</td>
                <td class="p-3 font-mono text-rose-600">\${row.belanja ? parseFloat(row.belanja).toFixed(2) : '0.00'}</td>
                <td class="p-3"><span class="px-2 py-1 bg-slate-200 text-xs rounded">\${row.status_cukai || 'Draft'}</span></td>
              </tr>
            \`).join('');
          } else {
            tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-500">Tiada rekod dijumpai.</td></tr>';
          }
        }
      </script>
    </body>
    </html>
  `);
});

export default app;
