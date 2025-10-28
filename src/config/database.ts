/**
 * Supabase database configuration and client setup.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not set in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

export interface TransactionRow {
  id?: number;
  user_id: string; // Telegram user ID
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category?: string;
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

