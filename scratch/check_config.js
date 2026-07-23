import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://dezaisaunoumhqpssols.supabase.co";
const supabaseAnonKey = "sb_publishable_HyhWSanS2mhByF476p_EzA_6oq2bQOT";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase
    .from("configuraciones_manual")
    .select("*, proyectos!inner(nombre, codigo_manual)")
    .eq("proyectos.codigo_manual", "M00001")
    .maybeSingle();

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("modo_arranque_movil:", data?.modo_arranque_movil);
    console.log("Full config keys:", Object.keys(data || {}));
  }
}

check();
