/**
 * Expense tracker with Supabase persistence.
 */

import { Transaction, type TransactionData } from './expense-tracker.js';
import { supabase, type TransactionRow, type BudgetRow, type AccountRow } from '../config/database.js';

interface TransactionWithId {
  transaction: Transaction;
  id: number;
}

export class PersistedExpenseTracker {
  private userId: string;
  private balance: number = 0;
  private transactions: TransactionWithId[] = [];
  private isLoaded: boolean = false;
  private loadingPromise?: Promise<void>;
  private currentAccount: string = 'cash';
  
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
    // De-duplicate concurrent loads
    if (this.loadingPromise) return this.loadingPromise;
    this.loadingPromise = (async () => {
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
          row.account || undefined,
          new Date(row.timestamp)
        )
      }));
      
      // Calculate balance from transactions
      this.balance = this.transactions.reduce((total, item) => {
        const t = item.transaction;
        return t.type === 'income' ? total + t.amount : total - t.amount;
      }, 0);
      
      console.log(`✅ Loaded ${this.transactions.length} transactions. Balance: $${this.balance.toFixed(2)}`);
      this.isLoaded = true;
      // Ensure default account exists
      await this.ensureAccountExists('cash');
    } catch (error) {
      console.error('Failed to load transactions from Supabase:', error);
    } finally {
      this.loadingPromise = undefined;
    }
    })();
    return this.loadingPromise;
  }

  async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;
    await this.loadTransactions();
  }

  getCurrentAccount(): string {
    return this.currentAccount || 'cash';
  }

  async setCurrentAccount(name: string): Promise<void> {
    const account = name.trim().toLowerCase();
    await this.ensureAccountExists(account);
    this.currentAccount = account;
  }

  async ensureAccountExists(name: string): Promise<void> {
    const account = name.trim().toLowerCase();
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', this.userId)
        .eq('name', account)
        .maybeSingle();
      if (error) {
        console.warn('accounts select error (non-fatal):', error);
      }
      if (!data) {
        const insertRow: AccountRow = { user_id: this.userId, name: account };
        const { error: insErr } = await supabase.from('accounts').insert([insertRow]);
        if (insErr) {
          console.warn('accounts insert error (non-fatal):', insErr);
        }
      }
    } catch (e) {
      console.warn('ensureAccountExists failed (non-fatal):', e);
    }
  }

  async getAccounts(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('name')
        .eq('user_id', this.userId)
        .order('name', { ascending: true });
      if (error) {
        console.warn('accounts fetch error:', error);
        // fallback to accounts from transactions
        const set = new Set<string>();
        this.transactions.forEach(it => set.add(it.transaction.account || 'cash'));
        return Array.from(set).sort();
      }
      const names = (data || []).map(r => r.name);
      if (!names.includes('cash')) names.unshift('cash');
      return Array.from(new Set(names));
    } catch {
      const set = new Set<string>();
      this.transactions.forEach(it => set.add(it.transaction.account || 'cash'));
      const list = Array.from(set).sort();
      if (!list.includes('cash')) list.unshift('cash');
      return list;
    }
  }
  
  async addIncome(amount: number, description: string, category?: string, account?: string): Promise<TransactionWithId> {
    const acct = (account || this.currentAccount || 'cash').toLowerCase();
    await this.ensureAccountExists(acct);
    const transaction = new Transaction(amount, description, 'income', category, acct);
    this.balance += amount;
    
    // Save to Supabase and get ID
    const id = await this.saveTransaction(transaction);
    
    const item = { id, transaction };
    this.transactions.push(item);
    
    return item;
  }
  
  async addExpense(amount: number, description: string, category?: string, account?: string): Promise<TransactionWithId> {
    const acct = (account || this.currentAccount || 'cash').toLowerCase();
    await this.ensureAccountExists(acct);
    const transaction = new Transaction(amount, description, 'expense', category, acct);
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
        account: transaction.account || 'cash',
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
  
  /**
   * Clear all transactions for a specific month and year
   * Returns the number of transactions deleted
   */
  async clearMonth(year: number, month: number): Promise<number> {
    // Get transactions for this month
    const monthTransactions = this.getTransactionsByMonth(year, month);
    const count = monthTransactions.length;
    
    if (count === 0) {
      return 0;
    }
    
    try {
      // Calculate balance adjustment
      let balanceAdjustment = 0;
      monthTransactions.forEach(item => {
        const t = item.transaction;
        if (t.type === 'income') {
          balanceAdjustment -= t.amount;
        } else {
          balanceAdjustment += t.amount;
        }
      });
      
      // Delete from local array
      const idsToDelete = new Set(monthTransactions.map(item => item.id));
      this.transactions = this.transactions.filter(item => !idsToDelete.has(item.id));
      this.balance += balanceAdjustment;
      
      // Delete from Supabase
      // Filter by date range for the month
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', this.userId)
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);
      
      if (error) {
        console.error('Error clearing month transactions from Supabase:', error);
      }
      
      return count;
    } catch (error) {
      console.error('Failed to clear month transactions:', error);
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
  
  getAllCategories(): string[] {
    const categories = new Set<string>();
    this.transactions.forEach(item => {
      if (item.transaction.category) {
        categories.add(item.transaction.category);
      }
    });
    return Array.from(categories).sort();
  }
  
  getCategoryStatsForMonth(year: number, month: number): Array<{category: string, income: number, expense: number, net: number}> {
    const monthTransactions = this.getTransactionsByMonth(year, month);
    const categoryMap = new Map<string, {income: number, expense: number}>();
    
    monthTransactions.forEach(item => {
      const t = item.transaction;
      const cat = t.category || 'Uncategorized';
      
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { income: 0, expense: 0 });
      }
      
      const stats = categoryMap.get(cat)!;
      if (t.type === 'income') {
        stats.income += t.amount;
      } else {
        stats.expense += t.amount;
      }
    });
    
    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      income: stats.income,
      expense: stats.expense,
      net: stats.income - stats.expense
    })).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }
  
  /**
   * Get transactions for a specific month and year
   * Both year and month must match exactly
   */
  getTransactionsByMonth(year: number, month: number): TransactionWithId[] {
    return this.transactions.filter(item => {
      const date = item.transaction.timestamp;
      return date.getFullYear() === year && date.getMonth() === month;
    });
  }
  
  /**
   * Get all unique months (year + month combinations) with transactions
   * Sorted by most recent first
   */
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
  
  /**
   * Export all transactions as CSV, sorted by date (oldest first)
   */
  exportToCSV(): string {
    // Sort transactions by date (oldest first)
    const sortedTransactions = [...this.transactions]
      .sort((a, b) => a.transaction.timestamp.getTime() - b.transaction.timestamp.getTime());
    
    // CSV header
    const headers = ['ID', 'Date', 'Type', 'Amount', 'Description', 'Category', 'Account'];
    
    // CSV rows
    const rows = sortedTransactions.map(item => {
      const t = item.transaction;
      return [
        item.id.toString(),
        t.timestamp.toISOString().split('T')[0], // Date only (YYYY-MM-DD)
        t.type,
        t.amount.toFixed(2),
        t.description.replace(/"/g, '""'), // Escape double quotes in description
        t.category || '',
        t.account || 'cash'
      ].map(field => `"${field}"`).join(',');
    });
    
    return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
  }
  
  exportMonthToCSV(year: number, month: number): string {
    const filtered = this.transactions
      .filter(item => item.transaction.timestamp.getFullYear() === year && item.transaction.timestamp.getMonth() === month)
      .sort((a, b) => a.transaction.timestamp.getTime() - b.transaction.timestamp.getTime());
    if (filtered.length === 0) return '';
    const headers = ['ID', 'Date', 'Type', 'Amount', 'Description', 'Category'];
    const rows = filtered.map(item => {
      const t = item.transaction;
      return [
        item.id.toString(),
        t.timestamp.toISOString().split('T')[0],
        t.type,
        t.amount.toFixed(2),
        t.description.replace(/"/g, '""'),
        t.category || ''
      ].map(field => `"${field}"`).join(',');
    });
    return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
  }
  
  // Budget management methods
  
  async createBudget(amount: number, year: number, month: number, category?: string, type: 'income' | 'expense' = 'expense'): Promise<number> {
    try {
      // First, delete any existing budget for the same parameters (to allow updates)
      await this.deleteBudgetsByCriteria(year, month, category, type);
      
      const row: BudgetRow = {
        user_id: this.userId,
        year,
        month,
        category: category || null,
        amount,
        type
      };
      
      const { data, error } = await supabase
        .from('budgets')
        .insert([row])
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating budget:', error);
        throw error;
      }
      
      return data.id;
    } catch (error) {
      console.error('Failed to create budget:', error);
      throw error;
    }
  }
  
  async deleteBudgetsByCriteria(year: number, month: number, category?: string, type: 'income' | 'expense' = 'expense'): Promise<number> {
    try {
      let query = supabase
        .from('budgets')
        .delete()
        .eq('user_id', this.userId)
        .eq('year', year)
        .eq('month', month)
        .eq('type', type);
      
      if (category) {
        query = query.eq('category', category);
      } else {
        query = query.is('category', null);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('Error deleting budgets by criteria:', error);
        return 0;
      }
      
      return 1;
    } catch (error) {
      console.error('Failed to delete budgets by criteria:', error);
      return 0;
    }
  }
  
  /**
   * Get budgets for a specific month and year
   * Both year and month must match exactly
   */
  async getBudgets(year: number, month: number): Promise<BudgetRow[]> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', this.userId)
        .eq('year', year)
        .eq('month', month);
      
      if (error) {
        console.error('Error fetching budgets:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
      return [];
    }
  }
  
  async getBudgetStatus(year: number, month: number): Promise<Array<{
    category?: string,
    budgetAmount: number,
    spentAmount: number,
    remaining: number,
    percentage: number
  }>> {
    // Get all budgets for this month
    const budgets = await this.getBudgets(year, month);
    
    // Get transactions for this month
    const monthTransactions = this.getTransactionsByMonth(year, month);
    
    // Calculate spending by category
    const spendingByCategory = new Map<string, number>();
    let totalSpent = 0;
    
    monthTransactions.forEach(item => {
      const t = item.transaction;
      if (t.type === 'expense') {
        const cat = t.category || 'Uncategorized';
        spendingByCategory.set(cat, (spendingByCategory.get(cat) || 0) + t.amount);
        totalSpent += t.amount;
      }
    });
    
    // Build status for each budget
    const statusList: Array<{
      category?: string,
      budgetAmount: number,
      spentAmount: number,
      remaining: number,
      percentage: number
    }> = [];
    
    for (const budget of budgets) {
      if (budget.type === 'expense') {
        // Handle overall budget (null category) vs category-specific budgets
        if (budget.category === null || budget.category === undefined) {
          // Overall budget - use total spent
          const remaining = budget.amount - totalSpent;
          const percentage = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;
          
          statusList.push({
            category: 'Overall Budget',
            budgetAmount: budget.amount,
            spentAmount: totalSpent,
            remaining,
            percentage
          });
        } else {
          // Category-specific budget
          const spent = spendingByCategory.get(budget.category) || 0;
          const remaining = budget.amount - spent;
          const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
          
          statusList.push({
            category: budget.category,
            budgetAmount: budget.amount,
            spentAmount: spent,
            remaining,
            percentage
          });
        }
      }
    }
    
    return statusList.sort((a, b) => {
      // Sort: Overall first, then by most over-budget first
      if (a.category === 'Overall Budget') return -1;
      if (b.category === 'Overall Budget') return 1;
      return Math.abs(b.remaining) - Math.abs(a.remaining);
    });
  }
  
  async deleteBudget(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', this.userId);
      
      if (error) {
        console.error('Error deleting budget:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete budget:', error);
      return false;
    }
  }
}

