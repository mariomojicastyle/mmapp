const supabaseUrl = 'https://dezaisaunoumhqpssols.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlemFpc2F1bm91bWhxcHNzb2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgzOTIxMSwiZXhwIjoyMDkxNDE1MjExfQ.mnDJzVs0yPDIzyAahTX-sgZDJBeXQmgQ5HP6y2iSaPg';

async function main() {
  const res = await fetch(`${supabaseUrl}/rest/v1/marketing_posts?select=id,titulo,contenido_base,fecha_programada,estado`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  });

  const data = await res.json();
  console.log('Posts in DB:', JSON.stringify(data, null, 2));
}

main();
