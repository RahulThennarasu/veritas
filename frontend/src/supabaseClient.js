// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gpessmjaqgyaxuxpylmd.supabase.co'; // Your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZXNzbWphcWd5YXh1eHB5bG1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNTIxNzYsImV4cCI6MjA1NjcyODE3Nn0.g0eLsqPm0LbBIstgOt40CMv6qH8ep3mNRDUUiHanG7Y'; // Your Supabase API key

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
