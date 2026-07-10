import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://dezaisaunoumhqpssols.supabase.co';
// Need anon key. I can get it from .env
const envContent = fs.readFileSync('.env', 'utf-8');
const match = envContent.match(/VITE_SUPABASE_ANON_KEY=["']?([^"'\s]+)/);
const supabaseKey = match[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('manuales')
    .select('data')
    .eq('id_proyecto', '160447.0001_Mesa_Tijuca');

  if (error) {
    console.error(error);
    return;
  }

  const projectData = data[0].data;
  fs.writeFileSync('db_project_data.json', JSON.stringify(projectData, null, 2));
  console.log("Saved to db_project_data.json");
  console.log("Glosario length:", projectData.glosarioTraduccion?.length);
  console.log("Despiece length:", projectData.despiece?.length);
}
main();
