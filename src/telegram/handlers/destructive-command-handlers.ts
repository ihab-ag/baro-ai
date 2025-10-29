/**
 * Destructive command handlers - require explicit patterns (not AI-inferred)
 */

import TelegramBot from 'node-telegram-bot-api';
import { CommandContext, CommandResult } from '../../interfaces/command.interface.js';
import { IExpenseTracker, IBudgetTracker } from '../../interfaces/expense-tracker.interface.js';
import { ConfirmationManager } from '../services/confirmation-manager.service.js';

export class DeleteTransactionHandler {
  constructor(
    private bot: TelegramBot,
    private tracker: IExpenseTracker
  ) {}

  canHandle(message: string): boolean {
    return /^delete\s+\d+$/i.test(message);
  }

  async handle(context: CommandContext): Promise<CommandResult> {
    const match = context.message.match(/(\d+)/);
    if (!match) {
      return {
        success: false,
        message: '❌ Invalid transaction ID.'
      };
    }

    const id = parseInt(match[1]);
    const deleted = await this.tracker.deleteTransaction(id);
    
    if (deleted) {
      const balance = this.tracker.getBalance();
      return {
        success: true,
        message: `✅ Transaction ${id} deleted. New balance: $${balance.toFixed(2)}`
      };
    } else {
      return {
        success: false,
        message: `❌ Transaction ${id} not found.`
      };
    }
  }
}

export class ClearAllTransactionsHandler {
  constructor(
    private bot: TelegramBot,
    private tracker: IExpenseTracker,
    private confirmationManager: ConfirmationManager
  ) {}

  canHandle(message: string): boolean {
    return /^clear$|^clearall$|^clear all$/i.test(message);
  }

  async handle(context: CommandContext): Promise<CommandResult> {
    const count = this.tracker.getRecentTransactions(10000).length;
    
    if (count === 0) {
      return {
        success: true,
        message: '📜 No transactions to clear.'
      };
    }
    
    const balance = this.tracker.getBalance();
    
    return {
      success: true,
      message: `⚠️ *WARNING: Clear All Transactions?*\n\n` +
        `This will delete ${count} transactions permanently!\n\n` +
        `Balance: $${balance.toFixed(2)}\n\n` +
        `To confirm, reply: "yes clear all" or "confirm clear"\n` +
        `To cancel, just ignore this message.`,
      data: { requiresConfirmation: true }
    };
  }

  async handleConfirmation(context: CommandContext): Promise<CommandResult> {
    if (!/^(yes clear all|confirm clear)$/i.test(context.message)) {
      return {
        success: false,
        message: ''
      };
    }

    const count = await this.tracker.clearHistory();
    
    if (count > 0) {
      const balance = this.tracker.getBalance();
      return {
        success: true,
        message: `✅ Cleared ${count} transactions from database and memory.\n💰 Balance reset to $${balance.toFixed(2)}`
      };
    } else {
      return {
        success: true,
        message: '📜 No transactions to clear.'
      };
    }
  }
}

export class ClearMonthHandler {
  constructor(
    private bot: TelegramBot,
    private tracker: IExpenseTracker,
    private confirmationManager: ConfirmationManager
  ) {}

  canHandle(message: string): boolean {
    return /^clear month\s+\d+$/i.test(message);
  }

  async handle(context: CommandContext): Promise<CommandResult> {
    const match = context.message.match(/(\d+)/);
    if (!match) {
      return {
        success: false,
        message: '❌ Invalid month number.'
      };
    }

    const monthIndex = parseInt(match[1]) - 1;
    const months = this.tracker.getAllMonths();
    
    if (monthIndex < 0 || monthIndex >= months.length) {
      return {
        success: false,
        message: '❌ Invalid month number. Send "months" to see available months.'
      };
    }
    
    const selectedMonth = months[monthIndex];
    const transactions = this.tracker.getTransactionsByMonth(selectedMonth.year, selectedMonth.month);
    
    if (transactions.length === 0) {
      return {
        success: true,
        message: `📜 No transactions to clear for ${selectedMonth.name}.`
      };
    }
    
    // Store confirmation
    this.confirmationManager.setClearMonthConfirmation(context.userId, {
      year: selectedMonth.year,
      month: selectedMonth.month,
      count: transactions.length,
      monthName: selectedMonth.name
    });
    
    return {
      success: true,
      message: `⚠️ *WARNING: Clear Month?*\n\n` +
        `This will delete ${transactions.length} transaction(s) from ${selectedMonth.name} permanently!\n\n` +
        `To confirm, reply: "yes" or "confirm"\n` +
        `To cancel, just ignore this message.`,
      data: { requiresConfirmation: true }
    };
  }

  async handleConfirmation(context: CommandContext): Promise<CommandResult> {
    if (!/^(yes|confirm|y)$/i.test(context.message)) {
      return {
        success: false,
        message: ''
      };
    }

    const confirmation = this.confirmationManager.getClearMonthConfirmation(context.userId);
    if (!confirmation) {
      return {
        success: false,
        message: '❌ No pending confirmation found.'
      };
    }

    this.confirmationManager.clearClearMonthConfirmation(context.userId);
    
    const count = await this.tracker.clearMonth(confirmation.year, confirmation.month);
    const balance = this.tracker.getBalance();
    
    if (count > 0) {
      return {
        success: true,
        message: `✅ Cleared ${count} transaction(s) from ${confirmation.monthName}.\n💰 New balance: $${balance.toFixed(2)}`
      };
    } else {
      return {
        success: true,
        message: '📜 No transactions to clear.'
      };
    }
  }
}

export class ClearAllDataHandler {
  constructor(
    private bot: TelegramBot,
    private tracker: IExpenseTracker & { clearAllData: () => Promise<{ transactions: number; budgets: number; accounts: number }> },
    private confirmationManager: ConfirmationManager,
    private supabaseUrl: string,
    private supabaseKey: string
  ) {}

  canHandle(message: string): boolean {
    return /^(clear all data|delete all data|reset all|wipe all)$/i.test(message);
  }

  async handle(context: CommandContext): Promise<CommandResult> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(this.supabaseUrl, this.supabaseKey);
      
      // Count transactions
      const { count: txCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', context.userId.toString());
      
      // Count budgets
      const { count: budgetsCount } = await supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', context.userId.toString());
      
      // Count accounts
      const { count: accountsCount } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', context.userId.toString());
      
      const tx = txCount || 0;
      const budgets = budgetsCount || 0;
      const accounts = accountsCount || 0;
      
      if (tx === 0 && budgets === 0 && accounts === 0) {
        return {
          success: true,
          message: '📜 No data to clear.'
        };
      }
      
      // Store confirmation
      this.confirmationManager.setClearAllDataConfirmation(context.userId, {
        transactions: tx,
        budgets: budgets,
        accounts: accounts
      });
      
      return {
        success: true,
        message: `⚠️ *CRITICAL WARNING: Clear ALL Data?*\n\n` +
          `This will PERMANENTLY delete:\n` +
          `• ${tx} transaction(s)\n` +
          `• ${budgets} budget(s)\n` +
          `• ${accounts} account(s)\n\n` +
          `This action CANNOT be undone!\n\n` +
          `To confirm, reply: "yes delete everything" or "confirm delete all"\n` +
          `To cancel, just ignore this message.`,
        data: { requiresConfirmation: true }
      };
    } catch (err) {
      return {
        success: false,
        message: `❌ Error counting data: ${String(err)}`
      };
    }
  }

  async handleConfirmation(context: CommandContext): Promise<CommandResult> {
    if (!/^(yes delete everything|confirm delete all|yes wipe all)$/i.test(context.message)) {
      if (/^(no|cancel|skip|ignore)$/i.test(context.message)) {
        this.confirmationManager.clearClearAllDataConfirmation(context.userId);
        return {
          success: true,
          message: '❌ Clear all data cancelled.'
        };
      }
      return {
        success: false,
        message: ''
      };
    }

    const confirmation = this.confirmationManager.getClearAllDataConfirmation(context.userId);
    if (!confirmation) {
      return {
        success: false,
        message: '❌ No pending confirmation found.'
      };
    }

    this.confirmationManager.clearClearAllDataConfirmation(context.userId);
    
    try {
      const result = await this.tracker.clearAllData();
      const balance = this.tracker.getBalance();
      
      return {
        success: true,
        message: `✅ *All Data Cleared*\n\n` +
          `Deleted:\n` +
          `• ${result.transactions} transaction(s)\n` +
          `• ${result.budgets} budget(s)\n` +
          `• ${result.accounts} account(s)\n\n` +
          `💰 Balance reset to $${balance.toFixed(2)}\n\n` +
          `Your account has been reset to a fresh start.`
      };
    } catch (err) {
      return {
        success: false,
        message: `❌ Error: ${String(err)}`
      };
    }
  }
}

