/**
 * Account command handlers
 */

import { BaseCommandHandler } from './base-command-handler.js';
import { CommandContext, CommandResult } from '../../interfaces/command.interface.js';
import { MessageFormatter } from '../services/message-formatter.service.js';

export class AccountsCommandHandler extends BaseCommandHandler {
  canHandle(command: string, context?: any): boolean {
    return command === 'accounts';
  }

  protected async execute(context: CommandContext): Promise<CommandResult> {
    const accounts = await this.tracker.getAccounts();
    const current = this.tracker.getCurrentAccount();
    
    return {
      success: true,
      message: MessageFormatter.formatAccounts(accounts, current)
    };
  }
}

export class AccountAddCommandHandler extends BaseCommandHandler {
  canHandle(command: string, context?: any): boolean {
    return command === 'account_add';
  }

  protected async execute(context: CommandContext): Promise<CommandResult> {
    const name = String(context.args?.name || '').trim();
    
    if (!name) {
      return {
        success: false,
        message: '❌ Missing account name.'
      };
    }
    
    await this.tracker.ensureAccountExists(name);
    
    return {
      success: true,
      message: `✅ Account "${name}" created.`
    };
  }
}

export class AccountUseCommandHandler extends BaseCommandHandler {
  canHandle(command: string, context?: any): boolean {
    return command === 'account_use';
  }

  protected async execute(context: CommandContext): Promise<CommandResult> {
    const name = String(context.args?.name || '').trim();
    
    if (!name) {
      return {
        success: false,
        message: '❌ Missing account name.'
      };
    }
    
    await this.tracker.setCurrentAccount(name);
    
    return {
      success: true,
      message: `✅ Current account set to "${name}".`
    };
  }
}

