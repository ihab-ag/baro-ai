/**
 * Integration tests for complete workflows
 */

import { describe, it, expect } from 'vitest';
import { ExpenseTracker } from '../src/agent/expense-tracker.js';

describe('Integration: Complete Workflow', () => {
  it('should handle a complete month of transactions', () => {
    const tracker = new ExpenseTracker();

    // Add income
    tracker.addIncome(3000, 'Salary', 'salary');
    expect(tracker.getBalance()).toBe(3000);

    // Add multiple expenses
    tracker.addExpense(500, 'Rent', 'rent');
    tracker.addExpense(300, 'Groceries', 'groceries');
    tracker.addExpense(100, 'Gas', 'transport');
    tracker.addExpense(200, 'Dining', 'dining');

    expect(tracker.getBalance()).toBe(1900);

    // Check categories by getting transactions
    const salaryTx = tracker.getTransactionsByCategory('salary');
    const rentTx = tracker.getTransactionsByCategory('rent');
    const groceriesTx = tracker.getTransactionsByCategory('groceries');
    
    expect(salaryTx.length).toBeGreaterThanOrEqual(1);
    expect(rentTx.length).toBeGreaterThanOrEqual(1);
    expect(groceriesTx.length).toBeGreaterThanOrEqual(1);

    // Check transactions by category
    const groceries = tracker.getTransactionsByCategory('groceries');
    expect(groceries.length).toBe(1);
    expect(groceries[0].amount).toBe(300);

    // Export data
    const csv = tracker.exportToCSV();
    expect(csv).toContain('Salary');
    expect(csv).toContain('Groceries');
    expect(csv).toContain('Rent');
  });

  it('should track balance correctly with mixed transactions', () => {
    const tracker = new ExpenseTracker();

    // Initial balance
    expect(tracker.getBalance()).toBe(0);

    // Income
    tracker.addIncome(1000, 'Salary');
    expect(tracker.getBalance()).toBe(1000);

    // Expenses
    tracker.addExpense(100, 'Item 1');
    tracker.addExpense(50, 'Item 2');
    expect(tracker.getBalance()).toBe(850);

    // More income
    tracker.addIncome(200, 'Bonus');
    expect(tracker.getBalance()).toBe(1050);

    // Final check
    const transactions = tracker.getRecentTransactions(100);
    expect(transactions.length).toBe(4);
    
    const incomeTotal = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    expect(incomeTotal).toBe(1200);

    const expenseTotal = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    expect(expenseTotal).toBe(150);
  });

  it('should maintain transaction order (most recent first)', async () => {
    const tracker = new ExpenseTracker();

    tracker.addIncome(100, 'First');
    await new Promise(resolve => setTimeout(resolve, 10));
    tracker.addIncome(200, 'Second');
    await new Promise(resolve => setTimeout(resolve, 10));
    tracker.addIncome(300, 'Third');

    const recent = tracker.getRecentTransactions(3);
    expect(recent.length).toBe(3);
    // Most recent should be last added
    expect(recent[0].description).toBe('Third');
  });

  it('should handle empty state correctly', () => {
    const tracker = new ExpenseTracker();

    expect(tracker.getBalance()).toBe(0);
    expect(tracker.getRecentTransactions(10).length).toBe(0);
    expect(tracker.getTransactionsByCategory('test').length).toBe(0);
    
    const csv = tracker.exportToCSV();
    expect(csv).toBeTruthy();
    expect(csv).toContain('Amount');
  });

  it('should track transactions correctly', () => {
    const tracker = new ExpenseTracker();

    tracker.addIncome(1000, 'Salary');
    tracker.addExpense(200, 'Expense');
    expect(tracker.getBalance()).toBe(800);
    
    const transactions = tracker.getRecentTransactions(10);
    expect(transactions.length).toBe(2);
    expect(tracker.getBalance()).toBe(800);
  });
});

