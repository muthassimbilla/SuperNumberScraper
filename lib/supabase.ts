import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://nvsaxbxbgwmqlxpiixid.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52c2F4YnhiZ3dtcWx4cGlpeGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjU2OTcsImV4cCI6MjA3MzYwMTY5N30.lyOk4nvT1bp0ZCfCTxyrup9lc-BuxEIfD5ge78row4I"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
