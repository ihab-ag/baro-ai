/**
 * Command interface for handling bot commands
 * Follows Command Pattern for better extensibility
 */

export interface CommandContext {
  userId: string;
  chatId: number;
  message: string;
  args?: Record<string, any>;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

export interface ICommandHandler {
  canHandle(command: string, context: CommandContext): boolean;
  handle(context: CommandContext): Promise<CommandResult>;
}

export interface CommandIntent {
  type: 'transaction' | 'command' | 'none';
  command?: string;
  args?: Record<string, any>;
}

export type CommandType = 
  | 'balance'
  | 'history'
  | 'months'
  | 'month'
  | 'categories'
  | 'catstats'
  | 'budgets'
  | 'budget_status'
  | 'budget_create'
  | 'accounts'
  | 'account_add'
  | 'account_use'
  | 'export'
  | 'export_month';

