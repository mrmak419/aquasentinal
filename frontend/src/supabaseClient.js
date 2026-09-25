import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hzwbiwbicziczzmevart.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d2Jpd2JpY3ppY3p6bWV2YXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTEyMTUsImV4cCI6MjEwNTIyNzIxNX0.ABTvRNxVva8bKHWupPQCYao0p7NXmRj-CtgsZO_MDbk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
