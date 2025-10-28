/**
 * Expense tracker with Supabase persistence.
 */

import { Transaction, type TransactionData } from './expense-tracker.js';
import { supabase, type TransactionRow } from '../config/database.js';

interface TransactionWithId {
  transaction: Transaction;
  id: number;
}

export class PersistedExpenseTracker {
  private userId: string;
  private balance: number = 0;
  private transactions: TransactionWithId[] = [];
  
  constructor(userId: string) {
    this.userId = userId;
    // Balance will be calculated from transactions
    this.balance = 0;
    this.transactions = [];
  }
  
  /**
   * Load transactions from Supabase on initialization
   */
  async loadTransactions(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', this.userId)
        .order('timestamp', { ascending: false })
        .limit(1000); // Load recent 1000 transactions
      
      if (error) {
        console.error('Error loading transactions:', error);
        return;
      }
      
      this.transactions = (data || []).map(row => ({
        id: row.id!,
        transaction: new Transaction(
          parseFloat(row.amount),
          row.description,
          row.type as 'income' | 'expense',
          row.category || undefined,
          new Date(row.timestamp)
        )
      }));
      
      // Calculate balance from transactions
      this.balance = this.transactions.reduce((total, item) => {
        const t = item.transaction;
        return t.type === 'income' ? total + t.amount : total - t.amount;
      }, 0);
      
      console.log(`✅ Loaded ${this.transactions.length} transactions. Balance: $${this.balance.toFixed(2)}`);
    } catch (error) {
      console.error('Failed to load transactions from Supabase:', error);
    }
  }
  
  async addIncome(amount: number, description: string, category?: string): Promise<TransactionWithId> {
    const transaction = new Transaction(amount, description, 'income', category);
    this.balance += amount;
    
    // Save to Supabase and get ID
    const id = await this.saveTransaction(transaction);
    
    const item = { id, transaction };
    this.transactions.push(item);
    
    return item;
  }
  
  async addExpense(amount: number, description: string, category?: string): Promise<TransactionWithId> {
    const transaction = new Transaction(amount, description, 'expense', category);
    this.balance -= amount;
    
    // Save to Supabase and get ID
    const id = await this.saveTransaction(transaction);
    
    const item = { id, transaction };
    this.transactions.push(item);
    
    return item;
  }
  
  private async saveTransaction(transaction: Transaction): Promise<number> {
    try {
      const row: TransactionRow = {
        user_id: this.userId,
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type,
        category: transaction.category,
        timestamp: transaction.timestamp.toISOString()
      };
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([row])
        .select('id')
        .single();
      
      if (error) {
        console.error('Error saving transaction to Supabase:', error);
        return Date.now(); // Fallback ID
      }
      
      return data.id;
    } catch (error) {
      console.error('Failed to save transaction to Supabase:', error);
      return Date.now(); // Fallback ID
    }
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    try {
      const itemIndex = this.transactions.findIndex(item => item.id === id);
      if (itemIndex === -1) return false;
      
      const item = this.transactions[itemIndex];
      const transaction = item.transaction;
      
      // Update balance
      if (transaction.type === 'income') {
        this.balance -= transaction.amount;
      } else {
        this.balance += transaction.amount;
      }
      
      // Remove from local array
      this.transactions.splice(itemIndex, 1);
      
      // Delete from Supabase
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', this.userId);
      
      if (error) {
        console.error('Error deleting transaction from Supabase:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      return false;
    }
  }
  
  async clearHistory(): Promise<number> {
    const count = this.transactions.length;
    
    try {
      // Delete all from Supabase
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', this.userId);
      
      if (error) {
        console.error('Error clearing transactions from Supabase:', error);
      }
      
      // Clear local array
      this.transactions = [];
      this.balance = 0;
      
      return count;
    } catch (error) {
      console.error('Failed to clear transactions:', error);
      return 0;
    }
  }
  
  getTransaction(id: number): TransactionWithId | undefined {
    return this.transactions.find(item => item.id === id);
  }
  
  getBalance(): number {
    return this.balance;
  }
  
  getRecentTransactions(limit: number = 10): TransactionWithId[] {
    return [...this.transactions]
      .sort((a, b) => b.transaction.timestamp.getTime() - a.transaction.timestamp.getTime())
      .slice(0, limit);
  }
  
  getTransactionsByCategory(category: string): TransactionWithId[] {
    return this.transactions.filter(item => item.transaction.category === category);
  }
  
  getTransactionsByMonth(year: number, month: number): TransactionWithId[] {
    return this.transactions.filter(item => {
      const date = item.transaction.timestamp;
      return date.getFullYear() === year && date.getMonth() === month;
    });
  }
  
  getAllMonths(): Array<{year: number, month: number, name: string}> {
    const months = new Set<string>();
    const dateToKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
    
    this.transactions.forEach(item => {
      const date = item.transaction.timestamp;
      months.add(dateToKey(date));
    });
    
    return Array.from(months)
      .map(key => {
        const [year, month] = key.split('-').map(Number);
        return { year, month, name: new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }
}

