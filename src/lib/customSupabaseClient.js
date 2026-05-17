import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sufhofybdgumwlffwmum.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1ZmhvZnliZGd1bXdsZmZ3bXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDYzODEsImV4cCI6MjA3NjgyMjM4MX0.vCX_rOQct2QAAJslBQpDrvEL_QM1U_2NOUzZNoPZLbY';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
