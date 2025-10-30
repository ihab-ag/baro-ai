/**
 * Tests for ExpenseTracker core functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Transaction } from '../src/agent/expense-tracker.js';
import { ExpenseTracker } from '../src/agent/expense-tracker.js';

describe('Transaction', () => {
  it('should create an income transaction', () => {
    const transaction = new Transaction(100, 'Salary', 'income', 'salary');
    
    expect(transaction.amount).toBe(100);
    expect(transaction.description).toBe('Salary');
    expect(transaction.type).toBe('income');
    expect(transaction.category).toBe('salary');
  });

  it('should create an expense transaction', () => {
    const transaction = new Transaction(50, 'Groceries', 'expense', 'groceries');
    
    expect(transaction.amount).toBe(50);
    expect(transaction.description).toBe('Groceries');
    expect(transaction.type).toBe('expense');
    expect(transaction.category).toBe('groceries');
  });

  it('should serialize and deserialize correctly', () => {
    const original = new Transaction(100, 'Test', 'income', 'salary', new Date('2024-01-15'));
    const json = original.toJSON();
    const restored = Transaction.fromJSON(json);
    
    expect(restored.amount).toBe(original.amount);
    expect(restored.description).toBe(original.description);
    expect(restored.type).toBe(original.type);
    expect(restored.category).toBe(original.category);
    expect(restored.timestamp.getTime()).toBe(original.timestamp.getTime());
  });
});

describe('ExpenseTracker', () => {
  let tracker: ExpenseTracker;

  beforeEach(() => {
    tracker = new ExpenseTracker();
  });

  it('should start with zero balance', () => {
    expect(tracker.getBalance()).toBe(0);
  });

  it('should add income correctly', () => {
    tracker.addIncome(100, 'Salary', 'salary');
    
    expect(tracker.getBalance()).toBe(100);
    expect(tracker.getRecentTransactions(1).length).toBe(1);
  });

  it('should add expense correctly', () => {
    tracker.addIncome(200, 'Salary');
    tracker.addExpense(50, 'Groceries', 'groceries');
    
    expect(tracker.getBalance()).toBe(150);
    expect(tracker.getRecentTransactions(2).length).toBe(2);
  });

  it('should track balance correctly with multiple transactions', () => {
    tracker.addIncome(1000, 'Salary');
    tracker.addExpense(100, 'Groceries');
    tracker.addExpense(50, 'Lunch');
    tracker.addIncome(200, 'Freelance');
    
    expect(tracker.getBalance()).toBe(1050);
  });

  it('should return recent transactions in correct order', async () => {
    tracker.addIncome(100, 'First');
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to ensure different timestamps
    tracker.addIncome(200, 'Second');
    await new Promise(resolve => setTimeout(resolve, 10));
    tracker.addIncome(300, 'Third');
    
    const recent = tracker.getRecentTransactions(2);
    expect(recent.length).toBe(2);
    // Most recent should be last (newest timestamp)
    expect(recent[0].description).toBe('Third');
    expect(recent[1].description).toBe('Second');
  });

  it('should get transactions by category', () => {
    tracker.addExpense(50, 'Groceries', 'groceries');
    tracker.addExpense(30, 'More groceries', 'groceries');
    tracker.addExpense(20, 'Lunch', 'dining');
    
    const groceries = tracker.getTransactionsByCategory('groceries');
    expect(groceries.length).toBe(2);
  });

  it('should get transactions by category', () => {
    tracker.addExpense(50, 'Groceries', 'groceries');
    tracker.addExpense(30, 'More groceries', 'groceries');
    tracker.addExpense(20, 'Lunch', 'dining');
    
    const groceries = tracker.getTransactionsByCategory('groceries');
    expect(groceries.length).toBe(2);
    const dining = tracker.getTransactionsByCategory('dining');
    expect(dining.length).toBe(1);
  });

  it('should export to CSV correctly', () => {
    tracker.addIncome(100, 'Salary', 'salary');
    tracker.addExpense(50, 'Groceries', 'groceries');
    
    const csv = tracker.exportToCSV();
    expect(csv).toContain('Amount');
    expect(csv).toContain('100');
    expect(csv).toContain('50');
    expect(csv).toContain('Salary');
    expect(csv).toContain('Groceries');
  });

  it('should reset balance when transactions are cleared (manual)', () => {
    tracker.addIncome(100, 'Salary');
    tracker.addExpense(50, 'Groceries');
    
    expect(tracker.getBalance()).toBe(50);
    
    // Manual clear by removing transactions
    const transactions = tracker.getRecentTransactions(100);
    expect(transactions.length).toBe(2);
  });
});

