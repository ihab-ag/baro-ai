/**
 * Base command handler following Template Method Pattern
 * Open/Closed Principle: Open for extension, closed for modification
 */

import { ICommandHandler, CommandContext, CommandResult } from '../../interfaces/command.interface.js';
import { IExpenseTracker, IBudgetTracker, IAccountManager } from '../../interfaces/expense-tracker.interface.js';
import TelegramBot from 'node-telegram-bot-api';

export abstract class BaseCommandHandler implements ICommandHandler {
  constructor(
    protected bot: TelegramBot,
    protected tracker: IExpenseTracker & IBudgetTracker & IAccountManager
  ) {}

  abstract canHandle(command: string, context: CommandContext): boolean;
  
  async handle(context: CommandContext): Promise<CommandResult> {
    try {
      return await this.execute(context);
    } catch (error) {
      return {
        success: false,
        message: `❌ Error: ${String(error)}`
      };
    }
  }

  protected abstract execute(context: CommandContext): Promise<CommandResult>;
  
  protected async sendMessage(chatId: number, message: string, options?: any): Promise<void> {
    await this.bot.sendMessage(chatId, message, options);
  }
}

