import { createClient } from '@supabase/supabase-js'; 

const supabaseUrl = 'https://vnvhahkfqlnodbnbtjam.supabase.co';

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudmhhaGtmcWxub2RibmJ0amFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTgxODYsImV4cCI6MjA5MjUzNDE4Nn0.5BplOK5gSqDQTpsIHsEukVyVr7z42Thjo-jhN47-VIM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);