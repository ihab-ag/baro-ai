/**
 * Telegram bot - Clean, SOLID-compliant implementation
 * Follows Single Responsibility, Dependency Inversion, and Open/Closed principles
 */

import TelegramBot from 'node-telegram-bot-api';
import { AccountingAgent } from '../agent/accounting-agent.js';
import { Settings } from '../config/settings.js';
import { PersistedExpenseTracker } from '../agent/persisted-tracker.js';
import { ConfirmationManager } from './services/confirmation-manager.service.js';
import { CommandRouter } from './router/command-router.js';
import { CommandContext } from '../interfaces/command.interface.js';

// View command handlers
import {
  BalanceCommandHandler,
  HistoryCommandHandler,
  MonthsCommandHandler,
  MonthCommandHandler,
  CategoriesCommandHandler,
  CategoryStatsCommandHandler
} from './handlers/view-command-handlers.js';

// Budget handlers
import {
  BudgetsCommandHandler,
  BudgetStatusCommandHandler,
  BudgetCreateCommandHandler
} from './handlers/budget-command-handlers.js';

// Account handlers
import {
  AccountsCommandHandler,
  AccountAddCommandHandler,
  AccountUseCommandHandler
} from './handlers/account-command-handlers.js';

// Export handlers
import {
  ExportCommandHandler,
  ExportMonthCommandHandler
} from './handlers/export-command-handlers.js';

// Destructive handlers
import {
  DeleteTransactionHandler,
  ClearAllTransactionsHandler,
  ClearMonthHandler,
  ClearAllDataHandler
} from './handlers/destructive-command-handlers.js';

class BotService {
  private bot: TelegramBot;
  private settings: Settings;
  private userAgents = new Map<string, AccountingAgent>();
  private confirmationManager = new ConfirmationManager();
  private commandRouter = new CommandRouter();

  constructor(token: string, settings: Settings) {
    this.bot = new TelegramBot(token, { polling: true });
    this.settings = settings;
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.setupViewHandlers();
    this.setupBudgetHandlers();
    this.setupAccountHandlers();
    this.setupExportHandlers();
    this.setupDestructiveHandlers();
    this.setupMessageHandlers();
  }

  private getOrCreateAgent(userId: string): AccountingAgent {
    if (!this.userAgents.has(userId)) {
      if (!this.settings.supabaseUrl || !this.settings.supabaseKey) {
        throw new Error('Supabase is required. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.');
      }
      
        const tracker = new PersistedExpenseTracker(userId);
      const agent = new AccountingAgent(this.settings, tracker);
      this.userAgents.set(userId, agent);
        
      // Load user's transactions asynchronously
        tracker.loadTransactions().catch(err => 
          console.error(`Failed to load transactions for user ${userId}:`, err)
        );
    }
    
    return this.userAgents.get(userId)!;
  }

  private setupViewHandlers(): void {
    // Register handlers for each user when needed
    // They'll be created per-user to access the correct tracker
  }

  private setupBudgetHandlers(): void {
    // Budget handlers need confirmation manager
  }

  private setupAccountHandlers(): void {
    // Account handlers
  }

  private setupExportHandlers(): void {
    // Export handlers
  }

  private setupDestructiveHandlers(): void {
    // Destructive handlers need to be initialized per-user
  }

  private async setupMessageHandlers(): Promise<void> {
    // Greeting
    this.bot.onText(/\/start|hi|hello/i, async (msg) => {
    const chatId = msg.chat.id;
      await this.bot.sendMessage(
      chatId,
      '👋 Welcome to Baro AI!\n\n' +
        'I can help you track expenses:\n' +
        '• "I spent $50 on groceries"\n' +
        '• "Received $200 salary"\n' +
        '• "Paid $30 for lunch"\n\n' +
        'Type "help" to see all commands!'
    );
  });

    // Main message handler
    this.bot.on('message', async (msg) => {
      await this.handleMessage(msg);
    });
  }

  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id || chatId);
    const text = msg.text || '';

    if (!text) return;
    
    try {
      const agent = this.getOrCreateAgent(userId);
      await agent.tracker.ensureLoaded();
    
      // Skip greeting commands
    const textLower = text.toLowerCase().trim();
    if (textLower === 'hi' || textLower === 'hello' || textLower.startsWith('/start')) return;
    
    // Help command
    if (/^help$|^commands$/i.test(text)) {
        await this.sendHelpMessage(chatId);
      return;
    }

      // Check pending confirmations first
      const confirmationResult = await this.handleConfirmations(userId, chatId, text, agent);
      if (confirmationResult.handled) return;

      // Check destructive commands (explicit patterns only)
      const destructiveResult = await this.handleDestructiveCommands(userId, chatId, text, agent);
      if (destructiveResult.handled) return;

      // Process via AI (transactions or NLU commands)
      await this.processAIMessage(chatId, text, agent, userId);
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Error: ${String(error)}`);
      console.error('Error handling message:', error);
    }
  }

  private async sendHelpMessage(chatId: number): Promise<void> {
    const helpMessage = `📚 *Baro AI Commands:*\n\n` +
      `💬 *Transaction Commands (Natural Language):*\n` +
      `• "Received $500 salary" - Add income\n` +
      `• "Spent $50 on groceries" - Add expense\n` +
      `• "Paid $30 for lunch" - Add expense\n\n` +
      `📊 *View Commands (Natural Language):*\n` +
      `• "show balance" or "what's my balance?"\n` +
      `• "show history" or "list transactions"\n` +
      `• "show months" or "list months"\n` +
      `• "show month 1" or "january transactions"\n` +
      `• "show categories" or "list categories"\n` +
      `• "category stats for month 1"\n` +
      `• "show budgets" or "list budgets"\n` +
      `• "budget status" or "how am I doing with budgets?"\n\n` +
      `🏦 *Account Commands (Natural Language):*\n` +
      `• "show accounts" or "list accounts"\n` +
      `• "create account bank" or "add account card"\n` +
      `• "switch to bank" or "use bank account"\n\n` +
      `💰 *Budget Commands (Natural Language):*\n` +
      `• "set budget $500" or "budget $500 for groceries"\n\n` +
      `💾 *Export Commands (Natural Language):*\n` +
      `• "export data" or "download transactions"\n` +
      `• "export month 1" or "download january"\n\n` +
      `🗑️ *Delete Commands (Explicit Only):*\n` +
      `• \`delete 12345\` - Delete transaction by ID\n` +
      `• \`clear month 1\` - Clear all transactions for month #1\n` +
      `• \`clear\` - Delete all transactions\n` +
      `• \`clear all data\` - Delete EVERYTHING (transactions, budgets, accounts)\n\n` +
      `ℹ️ Just talk naturally - the AI understands!`;
    
    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  private async handleConfirmations(
    userId: string,
    chatId: number,
    text: string,
    agent: AccountingAgent
  ): Promise<{ handled: boolean }> {
    const tracker = agent.tracker as any;

    // Budget confirmation
    if (this.confirmationManager.hasBudgetConfirmation(userId)) {
      if (/^(yes|confirm|replace|y)$/i.test(text)) {
        const confirmation = this.confirmationManager.getBudgetConfirmation(userId)!;
        this.confirmationManager.clearBudgetConfirmation(userId);

        try {
          for (const budget of confirmation.existingBudgets) {
            await tracker.deleteBudget?.(budget.id);
          }

          const budgetId = await tracker.createBudget?.(
            confirmation.amount,
            confirmation.year,
            confirmation.month,
            confirmation.category
          );

          if (budgetId) {
            const budgetType = confirmation.category ? `"${confirmation.category}"` : 'overall spending';
            const monthName = new Date(confirmation.year, confirmation.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            await this.bot.sendMessage(chatId, `✅ Budget updated: $${confirmation.amount.toFixed(2)} for ${budgetType} this month (${monthName}).`);
        } else {
            await this.bot.sendMessage(chatId, '❌ Failed to update budget.');
          }
        } catch (err) {
          await this.bot.sendMessage(chatId, `❌ Error: ${String(err)}`);
        }
        return { handled: true };
      } else if (/^(no|cancel|skip|ignore)$/i.test(text)) {
        this.confirmationManager.clearBudgetConfirmation(userId);
        await this.bot.sendMessage(chatId, '❌ Budget update cancelled.');
        return { handled: true };
      }
    }

    // Clear month confirmation
    if (this.confirmationManager.hasClearMonthConfirmation(userId)) {
      const clearMonthHandler = new ClearMonthHandler(this.bot, tracker, this.confirmationManager);
      const result = await clearMonthHandler.handleConfirmation({ userId, chatId, message: text });
      if (result.message) {
        await this.bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
      }
      return { handled: !!result.message };
    }

    // Clear all data confirmation
    if (this.confirmationManager.hasClearAllDataConfirmation(userId)) {
      const clearAllHandler = new ClearAllDataHandler(
        this.bot,
        tracker,
        this.confirmationManager,
        this.settings.supabaseUrl || '',
        this.settings.supabaseKey || ''
      );
      const result = await clearAllHandler.handleConfirmation({ userId, chatId, message: text });
      if (result.message) {
        await this.bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
      }
      return { handled: !!result.message };
    }

    // Clear all transactions confirmation
    if (/^(yes clear all|confirm clear)$/i.test(text)) {
      const count = await tracker.clearHistory?.() || 0;
      if (count > 0) {
        await this.bot.sendMessage(chatId, `✅ Cleared ${count} transactions from database and memory.\n💰 Balance reset to $${tracker.getBalance().toFixed(2)}`);
      } else {
        await this.bot.sendMessage(chatId, '📜 No transactions to clear.');
      }
      return { handled: true };
    }

    return { handled: false };
  }

  private async handleDestructiveCommands(
    userId: string,
    chatId: number,
    text: string,
    agent: AccountingAgent
  ): Promise<{ handled: boolean }> {
    const tracker = agent.tracker as any;

    // Delete transaction
    const deleteHandler = new DeleteTransactionHandler(this.bot, tracker);
    if (deleteHandler.canHandle(text)) {
      const result = await deleteHandler.handle({ userId, chatId, message: text });
      await this.bot.sendMessage(chatId, result.message);
      return { handled: true };
    }

    // Clear all transactions
    const clearHandler = new ClearAllTransactionsHandler(this.bot, tracker, this.confirmationManager);
    if (clearHandler.canHandle(text)) {
      const result = await clearHandler.handle({ userId, chatId, message: text });
      if (result.message) {
        await this.bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
      }
      return { handled: true };
    }

    // Clear month
    const clearMonthHandler = new ClearMonthHandler(this.bot, tracker, this.confirmationManager);
    if (clearMonthHandler.canHandle(text)) {
      const result = await clearMonthHandler.handle({ userId, chatId, message: text });
      if (result.message) {
        await this.bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
      }
      return { handled: true };
    }

    // Clear all data
    const clearAllHandler = new ClearAllDataHandler(
      this.bot,
      tracker,
      this.confirmationManager,
      this.settings.supabaseUrl || '',
      this.settings.supabaseKey || ''
    );
    if (clearAllHandler.canHandle(text)) {
      const result = await clearAllHandler.handle({ userId, chatId, message: text });
      if (result.message) {
        await this.bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
      }
      return { handled: true };
    }

    return { handled: false };
  }

  private async processAIMessage(
    chatId: number,
    text: string,
    agent: AccountingAgent,
    userId: string
  ): Promise<void> {
    try {
      const result = await agent.processMessage(text);
      
      // If AI resolved a command, route to handler
      if (result?.intent?.type === 'command') {
        const cmd = String(result.intent.command || '').toLowerCase();
        const context: CommandContext = {
          userId,
          chatId,
          message: text,
          args: {
            command: cmd,
            ...result.intent.args
          }
        };

        const handlerResult = await this.routeCommand(agent, context);
        if (handlerResult?.message) {
          await this.bot.sendMessage(chatId, handlerResult.message, { parse_mode: handlerResult.message.includes('*') ? 'Markdown' : undefined });
        }
        return;
      }

      // Regular transaction response
      if (result.message) {
        await this.bot.sendMessage(chatId, result.message);
      }
    } catch (err) {
      await this.bot.sendMessage(chatId, `❌ Error: ${String(err)}`);
    }
  }

  private async routeCommand(agent: AccountingAgent, context: CommandContext) {
    const tracker = agent.tracker as any;
    
    // Instantiate handlers with correct dependencies
    const handlers = [
      new BalanceCommandHandler(this.bot, tracker),
      new HistoryCommandHandler(this.bot, tracker),
      new MonthsCommandHandler(this.bot, tracker),
      new MonthCommandHandler(this.bot, tracker),
      new CategoriesCommandHandler(this.bot, tracker),
      new CategoryStatsCommandHandler(this.bot, tracker),
      new BudgetsCommandHandler(this.bot, tracker),
      new BudgetStatusCommandHandler(this.bot, tracker),
      new BudgetCreateCommandHandler(this.bot, tracker, this.confirmationManager),
      new AccountsCommandHandler(this.bot, tracker),
      new AccountAddCommandHandler(this.bot, tracker),
      new AccountUseCommandHandler(this.bot, tracker),
      new ExportCommandHandler(this.bot, tracker),
      new ExportMonthCommandHandler(this.bot, tracker),
    ];

    for (const handler of handlers) {
      const command = context.args?.command || '';
      if (handler.canHandle(command, context)) {
        const result = await handler.handle(context);
        if (result.data?.requiresConfirmation) {
          // Confirmation already handled in the handler
        }
        return result;
      }
    }

    return null;
  }

  start(): void {
    console.log('\n🤖 Telegram bot started (long-polling)');
    console.log('💡 Open Telegram and send your bot a message to start!\n');
  }
}

async function main() {
  // Run pre-flight tests (basic checks)
  console.log('\n🧪 Running pre-flight checks...\n');
  
  try {
    // Basic functionality check
    const { ExpenseTracker } = await import('../agent/expense-tracker.js');
    const tracker = new ExpenseTracker();
    
    // Test transaction operations
    tracker.addIncome(100, 'Test');
    tracker.addExpense(50, 'Test Expense');
    const balance = tracker.getBalance();
    
    if (balance !== 50) {
      throw new Error(`Balance calculation failed: expected 50, got ${balance}`);
    }
    
    // Test CSV export
    const csv = tracker.exportToCSV();
    if (!csv || !csv.includes('Amount')) {
      throw new Error('CSV export failed');
    }
    
    console.log('✅ Core functionality checks passed\n');
  } catch (error: any) {
    console.error('❌ Pre-flight check failed:', error.message);
    console.error('⚠️  Continuing anyway, but some features may not work.\n');
  }

  const settings = new Settings();
  const token = settings.telegramBotToken;

  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN not set in .env');
    process.exit(1);
  }

  const botService = new BotService(token, settings);
  botService.start();
}

main().catch((e) => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});

