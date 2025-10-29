/**
 * Export command handlers
 */

import { BaseCommandHandler } from './base-command-handler.js';
import { CommandContext, CommandResult } from '../../interfaces/command.interface.js';
import TelegramBot from 'node-telegram-bot-api';
import { Readable } from 'stream';

export class ExportCommandHandler extends BaseCommandHandler {
  canHandle(command: string, context?: any): boolean {
    return command === 'export';
  }

  protected async execute(context: CommandContext): Promise<CommandResult> {
    const csvData = this.tracker.exportToCSV();
    
    if (!csvData || csvData.trim() === '') {
      return {
        success: false,
        message: '📜 No transactions to export.'
      };
    }
    
    const csvBuffer = Buffer.from(csvData, 'utf-8');
    const stream = Readable.from([csvBuffer]);
    const now = new Date();
    const filename = `baro-ai-export-${now.toISOString().split('T')[0]}.csv`;
    
    const balance = this.tracker.getBalance();
    const count = this.tracker.getRecentTransactions(1000).length;
    
    await this.bot.sendDocument(
      context.chatId,
      stream,
      {},
      { filename, caption: `📊 Exported ${count} transaction(s)\n💰 Current balance: $${balance.toFixed(2)}` } as any
    );
    
    return {
      success: true,
      message: '' // Document sent separately
    };
  }
}

export class ExportMonthCommandHandler extends BaseCommandHandler {
  canHandle(command: string, context?: any): boolean {
    return command === 'export_month';
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
    const csvData = this.tracker.exportMonthToCSV(selectedMonth.year, selectedMonth.month);
    
    if (!csvData || csvData.trim() === '') {
      return {
        success: false,
        message: `📜 No transactions to export for ${selectedMonth.name}.`
      };
    }
    
    const csvBuffer = Buffer.from(csvData, 'utf-8');
    const stream = Readable.from([csvBuffer]);
    const filename = `baro-ai-export-${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}.csv`;
    
    const transactions = this.tracker.getTransactionsByMonth(selectedMonth.year, selectedMonth.month);
    const count = transactions.length;
    
    await this.bot.sendDocument(context.chatId, stream, { filename } as any);
    await this.sendMessage(context.chatId, `📊 Exported ${count} transaction(s) from ${selectedMonth.name}`);
    
    return {
      success: true,
      message: '' // Document and message sent separately
    };
  }
}

