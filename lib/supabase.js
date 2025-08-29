import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iqxohsjufjukiajuzeeo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxeG9oc2p1Zmp1a2lhanV6ZWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MjI2OTAsImV4cCI6MjA3MDM5ODY5MH0.L7ruA4DByQk7RZlgtZ_CEG1ltShw_jRZZvAld3kUNDk'


export const supabase = createClient(supabaseUrl, supabaseAnonKey)