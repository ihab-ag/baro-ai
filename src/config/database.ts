/**
 * Supabase database configuration and client setup.
 */

// Ensure .env is loaded even if this module is imported before Settings
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not set in .env');
}

// Only create client if credentials are provided
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    })
  : null as any; // Type assertion for tests - actual usage will check for null

export interface TransactionRow {
  id?: number;
  user_id: string; // Telegram user ID
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category?: string;
  account?: string; // account name, defaults to 'cash'
  timestamp: string;
  created_at?: string;
}

export interface BudgetRow {
  id?: number;
  user_id: string; // Telegram user ID
  year: number;
  month: number; // 0-11 (JavaScript month format)
  category?: string | null; // null for overall budget, or category name
  amount: number;
  type: 'income' | 'expense';
  created_at?: string;
}

export interface AccountRow {
  id?: number;
  user_id: string;
  name: string; // e.g., 'cash', 'bank', 'card'
  created_at?: string;
}

