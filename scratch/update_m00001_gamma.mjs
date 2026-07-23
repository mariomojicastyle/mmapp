import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://dezaisaunoumhqpssols.supabase.co";
const supabaseAnonKey = "sb_publishable_HyhWSanS2mhByF476p_EzA_6oq2bQOT";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function update() {
  const { data, error } = await supabase
    .from("configuraciones_manual")
    .update({ modo_arranque_movil: "gamma" })
    .eq("id", "6a5bcc21-e227-4596-b1e6-3bce6e31a573")
    .select();

  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Updated successfully:", data);
  }
}

update();
