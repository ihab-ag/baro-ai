/**
 * Tests for PersistedExpenseTracker
 * Note: These tests require a Supabase instance or mocking
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PersistedExpenseTracker } from '../src/agent/persisted-tracker.js';
import { supabase } from '../src/config/database.js';

// Skip all tests if Supabase is not configured
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const hasSupabase = !!(supabaseUrl && supabaseKey);

describe.skipIf(!hasSupabase)('PersistedExpenseTracker', () => {

  let tracker: PersistedExpenseTracker;
  const testUserId = `test-user-${Date.now()}`;

  beforeEach(async () => {
    tracker = new PersistedExpenseTracker(testUserId);
    await tracker.loadTransactions();
  });

  it('should start with zero balance', () => {
    expect(tracker.getBalance()).toBe(0);
  });

  it('should add income and persist', async () => {
    const result = await tracker.addIncome(100, 'Test Salary', 'salary');
    
    expect(result.transaction.amount).toBe(100);
    expect(result.transaction.type).toBe('income');
    expect(result.id).toBeDefined();
    expect(tracker.getBalance()).toBe(100);
  });

  it('should add expense and persist', async () => {
    await tracker.clearHistory();
    await tracker.addIncome(200, 'Income');
    const result = await tracker.addExpense(50, 'Test Groceries', 'groceries');
    
    expect(result.transaction.amount).toBe(50);
    expect(result.transaction.type).toBe('expense');
    expect(tracker.getBalance()).toBe(150);
  });

  it('should manage accounts', async () => {
    await tracker.ensureAccountExists('bank');
    await tracker.setCurrentAccount('bank');
    
    expect(tracker.getCurrentAccount()).toBe('bank');
    
    const accounts = await tracker.getAccounts();
    expect(accounts).toContain('cash');
    expect(accounts).toContain('bank');
  });

  it('should get recent transactions', async () => {
    await tracker.addIncome(100, 'First');
    await tracker.addIncome(200, 'Second');
    
    const recent = tracker.getRecentTransactions(10);
    expect(recent.length).toBeGreaterThanOrEqual(2);
  });

  it('should get categories', async () => {
    await tracker.addExpense(50, 'Groceries', 'groceries');
    await tracker.addExpense(30, 'Lunch', 'dining');
    
    const categories = tracker.getAllCategories();
    expect(categories.length).toBeGreaterThanOrEqual(2);
  });

  it('should get transactions by month', async () => {
    await tracker.addIncome(100, 'Test');
    
    const now = new Date();
    const transactions = tracker.getTransactionsByMonth(now.getFullYear(), now.getMonth());
    expect(transactions.length).toBeGreaterThanOrEqual(1);
  });

  it('should delete transaction', async () => {
    const result = await tracker.addIncome(100, 'To Delete');
    const balanceBefore = tracker.getBalance();
    
    const deleted = await tracker.deleteTransaction(result.id);
    expect(deleted).toBe(true);
    expect(tracker.getBalance()).toBe(balanceBefore - 100);
  });

  it('should create and get budgets', async () => {
    const now = new Date();
    const budgetId = await tracker.createBudget(500, now.getFullYear(), now.getMonth());
    
    expect(budgetId).toBeDefined();
    
    const budgets = await tracker.getBudgets(now.getFullYear(), now.getMonth());
    expect(budgets.length).toBeGreaterThanOrEqual(1);
  });

  it('should get budget status', async () => {
    const now = new Date();
    await tracker.createBudget(500, now.getFullYear(), now.getMonth());
    await tracker.addExpense(100, 'Test Expense', 'groceries');
    
    const status = await tracker.getBudgetStatus(now.getFullYear(), now.getMonth());
    expect(status.length).toBeGreaterThanOrEqual(0);
  });

  it('should export to CSV', async () => {
    await tracker.addIncome(100, 'Test');
    const csv = tracker.exportToCSV();
    
    expect(csv).toContain('Amount');
    expect(csv).toContain('Test');
  });

  afterAll(async () => {
    // Clean up all user data: transactions, budgets, accounts
    await supabase.from('transactions').delete().eq('user_id', testUserId);
    await supabase.from('budgets').delete().eq('user_id', testUserId);
    await supabase.from('accounts').delete().eq('user_id', testUserId);
  });
});

