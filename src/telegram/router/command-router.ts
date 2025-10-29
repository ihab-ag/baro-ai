/**
 * Command router - routes commands to appropriate handlers
 * Follows Strategy Pattern - easily extensible for new commands
 */

import { ICommandHandler, CommandContext, CommandResult } from '../../interfaces/command.interface.js';

export class CommandRouter {
  private handlers: ICommandHandler[] = [];

  register(handler: ICommandHandler): void {
    this.handlers.push(handler);
  }

  async route(context: CommandContext): Promise<CommandResult | null> {
    for (const handler of this.handlers) {
      if (handler.canHandle(context.args?.command || context.message, context)) {
        return await handler.handle(context);
      }
    }
    return null;
  }

  getHandler(command: string): ICommandHandler | undefined {
    return this.handlers.find(h => h.canHandle(command, { userId: '', chatId: 0, message: '', args: { command } }));
  }
}

