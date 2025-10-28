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
}
