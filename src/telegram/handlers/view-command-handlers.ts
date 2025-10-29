/**
 * View command handlers - handle read-only commands
 */

import { BaseCommandHandler } from './base-command-handler.js';
import { CommandContext, CommandResult } from '../../interfaces/command.interface.js';
import { MessageFormatter } from '../services/message-formatter.service.js';

export class BalanceCommandHandler extends BaseCommandHandler {
  canHandle(command: string, context?: any): boolean {
    return command === 'balance';
  }

  protected async execute(context: CommandContext): Promise<CommandResult> {
    const balance = this.tracker.getBalance();
    return {
      success: true,
      message: MessageFormatter.formatBalance(balance)
    };
  }
}

export class HistoryCommandHandler extends BaseCommandHandler {
  canHandle(command: string, context?: any): boolean {
    return command === 'history';
  }

  protected async execute(context: CommandContext): Promise<CommandResult> {
    const transactions = this.tracker.getRecentTransactions(10);
    return {
      success: true,
      message: MessageFormatter.formatHistory(transactions)
    };
  }
}

export class MonthsCommandHandler extends BaseCommandHandler {
  canHandle(command: string, context?: any): boolean {
    return command === 'months';
  }

  protected async execute(context: CommandContext): Promise<CommandResult> {
    const months = this.tracker.getAllMonths();
    return {
      success: true,
      message: MessageFormatter.formatMonths(months)
    };
  }
}

export class MonthCommandHandler extends BaseCommandHandler {
  canHandle(command: string, context?: any): boolean {
    return command === 'month';
  }

  protected async execute(context: CommandContext): Promise<CommandResult> {
    const index = Number(context.args?.index || 1);
    const months = this.tracker.getAllMonths();
    const monthIndex = index - 1;
    
    if (monthIndex < 0 || monthIndex >= months.length) {
      return {
        success: false,
        message: '❌ Invalid month number. Send "months" to see available months.'
      };
    }
    
    const selectedMonth = months[monthIndex];
    const transactions = this.tracker.getTransactionsByMonth(selectedMonth.year, selectedMonth.month);
    
    return {
      success: true,
      message: MessageFormatter.formatMonthTransactions(selectedMonth.name, transactions)
    };
  }
}

export class CategoriesCommandHandler extends BaseCommandHandler {
  canHandle(command: string, context?: any): boolean {
    return command === 'categories';
  }

  protected async execute(context: CommandContext): Promise<CommandResult> {
    const categories = this.tracker.getAllCategories();
    return {
      success: true,
      message: MessageFormatter.formatCategories(categories)
    };
  }
}

export class CategoryStatsCommandHandler extends BaseCommandHandler {
  canHandle(command: string, context?: any): boolean {
    return command === 'catstats';
  }

  protected async execute(context: CommandContext): Promise<CommandResult> {
    const index = Number(context.args?.index || 1);
    const months = this.tracker.getAllMonths();
    const monthIndex = index - 1;
    
    if (monthIndex < 0 || monthIndex >= months.length) {
      return {
        success: false,
        message: '❌ Invalid month number. Send "months" to see available months.'
      };
    }
    
    const selectedMonth = months[monthIndex];
    const stats = this.tracker.getCategoryStatsForMonth(selectedMonth.year, selectedMonth.month);
    
    return {
      success: true,
      message: MessageFormatter.formatCategoryStats(selectedMonth.name, stats)
    };
  }
}

