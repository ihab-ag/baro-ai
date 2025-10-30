/**
 * Tests for command handlers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BalanceCommandHandler, HistoryCommandHandler } from '../src/telegram/handlers/view-command-handlers.js';
import { AccountsCommandHandler } from '../src/telegram/handlers/account-command-handlers.js';
import { BudgetsCommandHandler } from '../src/telegram/handlers/budget-command-handlers.js';
import TelegramBot from 'node-telegram-bot-api';

// Mock tracker
const createMockTracker = () => ({
  getBalance: vi.fn(() => 1000),
  getRecentTransactions: vi.fn((limit: number) => [
    {
      id: 1,
      transaction: {
        amount: 100,
        description: 'Salary',
        type: 'income',
        category: 'salary',
        timestamp: new Date(),
      },
    },
  ]),
  getAllMonths: vi.fn(() => [
    { year: 2024, month: 0, name: 'January 2024' },
  ]),
  getTransactionsByMonth: vi.fn(() => []),
  getAllCategories: vi.fn(() => ['groceries', 'dining']),
  getCategoryStatsForMonth: vi.fn(() => []),
  getBudgets: vi.fn(async () => []),
  getBudgetStatus: vi.fn(async () => []),
  createBudget: vi.fn(async () => 1),
  getAccounts: vi.fn(async () => ['cash', 'bank']),
  getCurrentAccount: vi.fn(() => 'cash'),
  setCurrentAccount: vi.fn(async () => {}),
  ensureAccountExists: vi.fn(async () => {}),
  exportToCSV: vi.fn(() => 'ID,Amount,Description\n1,100,Salary'),
  exportMonthToCSV: vi.fn(() => ''),
  deleteTransaction: vi.fn(async () => true),
  clearHistory: vi.fn(async () => 10),
  clearMonth: vi.fn(async () => 5),
  clearAllData: vi.fn(async () => ({ transactions: 10, budgets: 2, accounts: 2 })),
  ensureLoaded: vi.fn(async () => {}),
});

// Mock bot
const createMockBot = () => ({
  sendMessage: vi.fn(async () => {}),
  sendDocument: vi.fn(async () => {}),
} as unknown as TelegramBot);

describe('BalanceCommandHandler', () => {
  it('should handle balance command', async () => {
    const bot = createMockBot();
    const tracker = createMockTracker();
    const handler = new BalanceCommandHandler(bot, tracker as any);

    expect(handler.canHandle('balance', {} as any)).toBe(true);
    expect(handler.canHandle('balance', {} as any)).toBe(true);
    expect(handler.canHandle('invalid', {} as any)).toBe(false);

    const result = await handler.handle({
      userId: 'test',
      chatId: 123,
      message: 'balance',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('$1000.00');
    expect(tracker.getBalance).toHaveBeenCalled();
  });
});

describe('HistoryCommandHandler', () => {
  it('should handle history command', async () => {
    const bot = createMockBot();
    const tracker = createMockTracker();
    const handler = new HistoryCommandHandler(bot, tracker as any);

    expect(handler.canHandle('history', {} as any)).toBe(true);

    const result = await handler.handle({
      userId: 'test',
      chatId: 123,
      message: 'history',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('transactions');
    expect(tracker.getRecentTransactions).toHaveBeenCalledWith(10);
  });
});

describe('AccountsCommandHandler', () => {
  it('should handle accounts command', async () => {
    const bot = createMockBot();
    const tracker = createMockTracker();
    const handler = new AccountsCommandHandler(bot, tracker as any);

    expect(handler.canHandle('accounts', {} as any)).toBe(true);

    const result = await handler.handle({
      userId: 'test',
      chatId: 123,
      message: 'accounts',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('accounts');
    expect(tracker.getAccounts).toHaveBeenCalled();
    expect(tracker.getCurrentAccount).toHaveBeenCalled();
  });
});

describe('BudgetsCommandHandler', () => {
  it('should handle budgets command', async () => {
    const bot = createMockBot();
    const tracker = createMockTracker();
    const handler = new BudgetsCommandHandler(bot, tracker as any);

    expect(handler.canHandle('budgets', {} as any)).toBe(true);

    const result = await handler.handle({
      userId: 'test',
      chatId: 123,
      message: 'budgets',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('budget');
    expect(tracker.getBudgets).toHaveBeenCalled();
  });
});

