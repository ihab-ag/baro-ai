/**
 * Service for formatting messages consistently
 * Single Responsibility: Only handles message formatting
 */

import { TransactionWithId, BudgetStatus } from '../../interfaces/expense-tracker.interface.js';

export class MessageFormatter {
  static formatBalance(balance: number): string {
    return `💰 Current balance: $${balance.toFixed(2)}`;
  }

  static formatHistory(transactions: TransactionWithId[]): string {
    if (transactions.length === 0) {
      return '📜 No transactions yet.';
    }
    
    const lines = transactions.map((item, i) => {
      const t = item.transaction;
      const sign = t.type === 'income' ? '+' : '-';
      const emoji = t.type === 'income' ? '📥' : '📤';
      const desc = t.description.length > 25 ? t.description.substring(0, 22) + '...' : t.description;
      const id = item.id ? `[ID: ${item.id}]` : '';
      return `${i + 1}. ${emoji} ${sign}$${t.amount.toFixed(2)} - ${desc} ${id}`;
    });
    
    return `📋 Last ${transactions.length} transactions:\n\n${lines.join('\n')}`;
  }

  static formatMonths(months: Array<{ name: string }>): string {
    if (months.length === 0) {
      return '📅 No transactions found.';
    }
    
    const lines = months.map((m, i) => `${i + 1}. ${m.name}`);
    return `📅 Available months:\n\n${lines.join('\n')}`;
  }

  static formatMonthTransactions(
    monthName: string,
    transactions: TransactionWithId[]
  ): string {
    if (transactions.length === 0) {
      return `📅 No transactions for ${monthName}`;
    }
    
    const lines = transactions.map((item, i) => {
      const t = item.transaction;
      const sign = t.type === 'income' ? '+' : '-';
      const emoji = t.type === 'income' ? '📥' : '📤';
      const desc = t.description.length > 25 ? t.description.substring(0, 22) + '...' : t.description;
      const date = t.timestamp.toLocaleDateString();
      return `${i + 1}. ${emoji} ${sign}$${t.amount.toFixed(2)} - ${desc} (${date})`;
    });
    
    const totalIncome = transactions
      .filter(item => item.transaction.type === 'income')
      .reduce((sum, item) => sum + item.transaction.amount, 0);
    
    const totalExpense = transactions
      .filter(item => item.transaction.type === 'expense')
      .reduce((sum, item) => sum + item.transaction.amount, 0);
    
    const net = totalIncome - totalExpense;
    
    return `📅 ${monthName}:\n\n${lines.join('\n')}\n\n📊 Summary:\n📥 Income: $${totalIncome.toFixed(2)}\n📤 Expenses: $${totalExpense.toFixed(2)}\n💰 Net: $${net.toFixed(2)}`;
  }

  static formatCategories(categories: string[]): string {
    if (categories.length === 0) {
      return '📂 No categories found. Transactions will be uncategorized.';
    }
    
    const lines = categories.map((cat, i) => `${i + 1}. ${cat}`);
    return `📂 Your categories:\n\n${lines.join('\n')}`;
  }

  static formatCategoryStats(monthName: string, stats: Array<{ category: string; income: number; expense: number; net: number }>): string {
    if (stats.length === 0) {
      return `📊 No transactions for ${monthName}`;
    }
    
    const lines = stats.map((s, i) => {
      const sign = s.net >= 0 ? '+' : '';
      return `${i + 1}. ${s.category}:\n   📥 Income: $${s.income.toFixed(2)}\n   📤 Expenses: $${s.expense.toFixed(2)}\n   💰 Net: ${sign}$${s.net.toFixed(2)}`;
    });
    
    return `📊 Category Stats for ${monthName}:\n\n${lines.join('\n\n')}`;
  }

  static formatBudgets(monthName: string, budgets: Array<{ category?: string | null; amount: number; type: string }>): string {
    if (budgets.length === 0) {
      return '💰 No budgets set for this month.';
    }
    
    const lines = budgets.map(b => {
      const cat = b.category || 'Overall Budget';
      return `• ${cat}: $${parseFloat(String(b.amount)).toFixed(2)} (${b.type === 'expense' ? 'expense' : 'income'})`;
    });
    
    return `💰 Budgets for ${monthName}:\n\n${lines.join('\n')}`;
  }

  static formatBudgetStatus(status: BudgetStatus[]): string {
    if (status.length === 0) {
      return '💰 No budgets set for this month.';
    }
    
    const lines = status.map(s => {
      const cat = s.category || 'Overall';
      const emoji = s.remaining >= 0 ? '✅' : '⚠️';
      const statusText = s.percentage > 0 ? `${s.percentage.toFixed(1)}% spent` : 'No spending yet';
      return `${emoji} ${cat}:\n   Budget: $${s.budgetAmount.toFixed(2)}\n   Spent: $${s.spentAmount.toFixed(2)}\n   Remaining: $${s.remaining.toFixed(2)}\n   ${statusText}`;
    });
    
    return `📊 Budget Status:\n\n${lines.join('\n\n')}`;
  }

  static formatAccounts(accounts: string[], currentAccount: string): string {
    const lines = accounts.map((name, i) => 
      name === currentAccount ? `${i + 1}. ${name} (current)` : `${i + 1}. ${name}`
    );
    return `🏦 Your accounts:\n\n${lines.join('\n')}`;
  }

  static formatTransactionAdded(
    action: string,
    amount: number,
    description: string,
    account: string,
    balance: number
  ): string {
    return `${action} of $${amount.toFixed(2)} for ${description} in ${account}. Current balance: $${balance.toFixed(2)}`;
  }
}

