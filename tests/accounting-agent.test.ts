/**
 * Tests for AccountingAgent
 * Note: These tests may require API keys or mocks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountingAgent } from '../src/agent/accounting-agent.js';
import { Settings } from '../src/config/settings.js';

// Mock tracker
const createMockTracker = () => ({
  getBalance: vi.fn(() => 1000),
  addIncome: vi.fn(async () => ({ id: 1, transaction: {} })),
  addExpense: vi.fn(async () => ({ id: 2, transaction: {} })),
  getCurrentAccount: vi.fn(() => 'cash'),
  getRecentTransactions: vi.fn(() => []),
});

describe('AccountingAgent', () => {
  let settings: Settings;
  let mockTracker: ReturnType<typeof createMockTracker>;

  beforeEach(() => {
    settings = new Settings();
    mockTracker = createMockTracker();
  });

  it('should initialize correctly', () => {
    const agent = new AccountingAgent(settings, mockTracker as any);
    
    expect(agent).toBeDefined();
    expect(agent.tracker).toBe(mockTracker);
  });

  it('should get balance summary', () => {
    const agent = new AccountingAgent(settings, mockTracker as any);
    const summary = agent.getBalanceSummary();
    
    expect(summary.balance).toBe(1000);
    expect(summary.recentTransactions).toBeDefined();
  });
});

