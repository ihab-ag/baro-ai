/**
 * Interface for expense tracker operations
 * Follows Interface Segregation Principle - clients only depend on methods they use
 */

export interface IExpenseTracker {
  getBalance(): number;
  getRecentTransactions(limit?: number): TransactionWithId[];
  getTransactionsByMonth(year: number, month: number): TransactionWithId[];
  getAllCategories(): string[];
  getAllMonths(): Array<{ year: number; month: number; name: string }>;
  getCategoryStatsForMonth(year: number, month: number): CategoryStats[];
  addIncome(amount: number, description: string, category?: string, account?: string): Promise<TransactionWithId>;
  addExpense(amount: number, description: string, category?: string, account?: string): Promise<TransactionWithId>;
  deleteTransaction(id: number): Promise<boolean>;
  clearHistory(): Promise<number>;
  clearMonth(year: number, month: number): Promise<number>;
  clearAllData(): Promise<DataCount>;
  exportToCSV(): string;
  exportMonthToCSV(year: number, month: number): string;
  ensureLoaded(): Promise<void>;
}

export interface IBudgetTracker {
  createBudget(amount: number, year: number, month: number, category?: string, type?: 'income' | 'expense'): Promise<number>;
  getBudgets(year: number, month: number): Promise<BudgetRow[]>;
  getBudgetStatus(year: number, month: number): Promise<BudgetStatus[]>;
  deleteBudget(id: number): Promise<boolean>;
  deleteBudgetsByCriteria(year: number, month: number, category?: string, type?: 'income' | 'expense'): Promise<number>;
}

export interface IAccountManager {
  getCurrentAccount(): string;
  setCurrentAccount(name: string): Promise<void>;
  getAccounts(): Promise<string[]>;
  ensureAccountExists(name: string): Promise<void>;
}

export interface TransactionWithId {
  id: number;
  transaction: {
    amount: number;
    description: string;
    type: 'income' | 'expense';
    category?: string;
    account?: string;
    timestamp: Date;
  };
}

export interface CategoryStats {
  category: string;
  income: number;
  expense: number;
  net: number;
}

export interface BudgetRow {
  id?: number;
  user_id: string;
  year: number;
  month: number;
  category?: string | null;
  amount: number;
  type: 'income' | 'expense';
  created_at?: string;
}

export interface BudgetStatus {
  category?: string;
  budgetAmount: number;
  spentAmount: number;
  remaining: number;
  percentage: number;
}

export interface DataCount {
  transactions: number;
  budgets: number;
  accounts: number;
}

