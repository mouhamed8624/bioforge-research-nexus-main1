
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://esrlselsbcpavfsmmida.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcmxzZWxzYmNwYXZmc21taWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzODk5NjEsImV4cCI6MjA2NTk2NTk2MX0.mHIh4fmsFuAPVa_NetjOfzTL4FuStxzgOAabiQrvjYk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Test Supabase connectivity
export const testSupabaseConnection = async (): Promise<{ connected: boolean; error?: string }> => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test with a simple query that should work with any Supabase instance
    const { data, error } = await Promise.race([
      supabase.from('profiles').select('id').limit(1),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      )
    ]);

    if (error) {
      console.error('Supabase connection test failed:', error);
      
      if (error.message?.includes('fetch') || error.message?.includes('Load failed')) {
        return { connected: false, error: 'Network error - check your internet connection' };
      } else if (error.code === 'PGRST116') {
        // Table doesn't exist, but connection is working
        console.log('Connection successful, but some tables may not exist yet');
        return { connected: true };
      } else {
        return { connected: false, error: `Database error: ${error.message}` };
      }
    }

    console.log('Supabase connection test successful');
    return { connected: true };
  } catch (error: any) {
    console.error('Supabase connection test error:', error);
    
    if (error?.message?.includes('timeout')) {
      return { connected: false, error: 'Connection timed out - check your internet connection' };
    } else if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Load failed')) {
      return { connected: false, error: 'Network error - check your internet connection' };
    } else {
      return { connected: false, error: 'Connection failed - please check your configuration' };
    }
  }
};
