/**
 * Budget command handlers
 */

import TelegramBot from 'node-telegram-bot-api';
import { BaseCommandHandler } from './base-command-handler.js';
import { CommandContext, CommandResult } from '../../interfaces/command.interface.js';
import { MessageFormatter } from '../services/message-formatter.service.js';
import { ConfirmationManager, BudgetConfirmation } from '../services/confirmation-manager.service.js';

export class BudgetsCommandHandler extends BaseCommandHandler {
  canHandle(command: string, context?: any): boolean {
    return command === 'budgets';
  }

  protected async execute(context: CommandContext): Promise<CommandResult> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const budgets = await this.tracker.getBudgets(year, month);
    
    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    return {
      success: true,
      message: MessageFormatter.formatBudgets(monthName, budgets)
    };
  }
}

export class BudgetStatusCommandHandler extends BaseCommandHandler {
  canHandle(command: string, context?: any): boolean {
    return command === 'budget_status';
  }

  protected async execute(context: CommandContext): Promise<CommandResult> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const status = await this.tracker.getBudgetStatus(year, month);
    
    return {
      success: true,
      message: MessageFormatter.formatBudgetStatus(status)
    };
  }
}

export class BudgetCreateCommandHandler extends BaseCommandHandler {
  constructor(
    bot: TelegramBot,
    tracker: any,
    private confirmationManager: ConfirmationManager
  ) {
    super(bot, tracker);
  }

  canHandle(command: string, context?: any): boolean {
    return command === 'budget_create';
  }

  protected async execute(context: CommandContext): Promise<CommandResult> {
    const amount = Number(context.args?.amount);
    const category = context.args?.category ? String(context.args.category).trim() : undefined;
    
    if (!amount || amount <= 0) {
      return {
        success: false,
        message: '❌ Invalid budget amount.'
      };
    }
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const existingBudgets = await this.tracker.getBudgets(year, month);
    
    const matchingBudgets = existingBudgets.filter((b: any) =>
      b.type === 'expense' &&
      ((!category && !b.category) || (category && b.category === category))
    );
    
    if (matchingBudgets.length > 0) {
      // Store confirmation
      const confirmation: BudgetConfirmation = {
        amount,
        year,
        month,
        category,
        existingBudgets: matchingBudgets.map((b: any) => ({ id: b.id! }))
      };
      this.confirmationManager.setBudgetConfirmation(context.userId, confirmation);
      
      const budgetType = category || 'overall';
      const total = matchingBudgets.reduce((sum: number, b: any) => sum + parseFloat(b.amount), 0);
      
      return {
        success: true,
        message: `⚠️ *Budget Already Exists*\n\nYou already have a $${total.toFixed(2)} budget for "${budgetType}" this month.\n\nTo replace it with $${amount.toFixed(2)}, reply: "yes" or "confirm"\nTo cancel, just ignore this message.`,
        data: { requiresConfirmation: true }
      };
    }
    
    // Create budget
    try {
      const budgetId = await this.tracker.createBudget(amount, year, month, category);
      if (budgetId) {
        const budgetType = category ? `"${category}"` : 'overall spending';
        const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return {
          success: true,
          message: `✅ Budget set: $${amount.toFixed(2)} for ${budgetType} this month (${monthName}).`
        };
      } else {
        return {
          success: false,
          message: '❌ Failed to create budget. Make sure Supabase is configured.'
        };
      }
    } catch (err) {
      return {
        success: false,
        message: `❌ Error: ${String(err)}`
      };
    }
  }
}

