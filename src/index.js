export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight requests
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

    // Save Record (POST /api/save-report)
    if (request.method === "POST" && url.pathname === "/api/save-report") {
      try {
        const data = await request.json();
        const netProfit = data.total_revenue - data.total_expense;

        const query = `
          INSERT INTO clients (business_name, financial_year, total_revenue, total_expense, net_profit)
          VALUES (?, ?, ?, ?, ?)
        `;

        await env.DB.prepare(query)
          .bind(
            data.business_name,
            data.financial_year,
            data.total_revenue,
            data.total_expense,
            netProfit
          )
          .run();

        return new Response(
          JSON.stringify({ success: true, message: "Rekod berjaya disimpan!" }),
          { headers: corsHeaders }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, message: err.message }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Retrieve Records (GET /api/get-reports)
    if (request.method === "GET" && url.pathname === "/api/get-reports") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT * FROM clients ORDER BY created_at DESC"
        ).all();

        return new Response(JSON.stringify(results), { headers: corsHeaders });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
