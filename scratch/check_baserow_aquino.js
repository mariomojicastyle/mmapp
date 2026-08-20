const supabaseUrl = 'https://dezaisaunoumhqpssols.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlemFpc2F1bm91bWhxcHNzb2xzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgzOTIxMSwiZXhwIjoyMDkxNDE1MjExfQ.mnDJzVs0yPDIzyAahTX-sgZDJBeXQmgQ5HP6y2iSaPg';

async function main() {
  const res = await fetch(`https://api.baserow.io/api/database/rows/table/994/?user_field_names=true&search=Aquino`, {
    headers: {
      'Authorization': 'Token DEMO_BASEROW'
    }
  });
}
