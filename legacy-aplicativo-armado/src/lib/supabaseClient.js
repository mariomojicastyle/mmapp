// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// El código lee las variables del .env a través de VITE
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Inicializa y exporta el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)