/**
 * Expense tracking module to manage balance and transactions.
 */

export interface TransactionData {
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category?: string;
  timestamp: string;
}

export class Transaction {
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category?: string;
  timestamp: Date;
  
  constructor(
    amount: number,
    description: string,
    type: 'income' | 'expense',
    category?: string,
    timestamp?: Date
  ) {
    this.amount = amount;
    this.description = description;
    this.type = type;
    this.category = category;
    this.timestamp = timestamp || new Date();
  }
  
  toJSON(): TransactionData {
    return {
      amount: this.amount,
      description: this.description,
      type: this.type,
      category: this.category,
      timestamp: this.timestamp.toISOString()
    };
  }
  
  static fromJSON(data: TransactionData): Transaction {
    return new Transaction(
      data.amount,
      data.description,
      data.type,
      data.category,
      new Date(data.timestamp)
    );
  }
}

export class ExpenseTracker {
  private balance: number;
  private transactions: Transaction[];
  
  constructor(initialBalance: number = 0.0) {
    this.balance = initialBalance;
    this.transactions = [];
  }
  
  addIncome(amount: number, description: string, category?: string): Transaction {
    const transaction = new Transaction(amount, description, 'income', category);
    this.balance += amount;
    this.transactions.push(transaction);
    return transaction;
  }
  
  addExpense(amount: number, description: string, category?: string): Transaction {
    const transaction = new Transaction(amount, description, 'expense', category);
    this.balance -= amount;
    this.transactions.push(transaction);
    return transaction;
  }
  
  getBalance(): number {
    return this.balance;
  }
  
  getRecentTransactions(limit: number = 10): Transaction[] {
    return [...this.transactions]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  getTransactionsByCategory(category: string): Transaction[] {
    return this.transactions.filter(t => t.category === category);
  }
  
  toJSON() {
    return {
      balance: this.balance,
      transactions: this.transactions.map(t => t.toJSON())
    };
  }
  
  fromJSON(data: { balance: number; transactions: TransactionData[] }) {
    this.balance = data.balance;
    this.transactions = data.transactions.map(t => Transaction.fromJSON(t));
  }
  
  // CSV Exports
  exportToCSV(): string {
    const sorted = [...this.transactions].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const headers = ['ID', 'Date', 'Type', 'Amount', 'Description', 'Category'];
    const rows = sorted.map((t, idx) => [
      '',
      t.timestamp.toISOString().split('T')[0],
      t.type,
      t.amount.toFixed(2),
      t.description.replace(/"/g, '""'),
      t.category || ''
    ].map(field => `"${field}"`).join(','));
    return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
  }
  
  exportMonthToCSV(year: number, month: number): string {
    const filtered = this.transactions
      .filter(t => t.timestamp.getFullYear() === year && t.timestamp.getMonth() === month)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    if (filtered.length === 0) return '';
    const headers = ['ID', 'Date', 'Type', 'Amount', 'Description', 'Category'];
    const rows = filtered.map(t => [
      '',
      t.timestamp.toISOString().split('T')[0],
      t.type,
      t.amount.toFixed(2),
      t.description.replace(/"/g, '""'),
      t.category || ''
    ].map(field => `"${field}"`).join(','));
    return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
  }
}
