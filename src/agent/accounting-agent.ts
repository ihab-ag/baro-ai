/**
 * Main accounting agent using LangChain.
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { Settings } from '../config/settings.js';

export class AccountingAgent {
  private llm: ChatOpenAI | ChatGroq;
  private prompt: any;
  public tracker: any;
  private settings: Settings;
  
  constructor(settings: Settings, tracker: any) {
    this.settings = settings;
    this.tracker = tracker;
    
    // Initialize LLM based on provider
    if (settings.llmProvider === 'groq') {
      console.log('🚀 Using GROQ (FREE tier) for LLM');
      this.llm = new ChatGroq({
        model: settings.groqModel,
        temperature: 0.3,
        apiKey: settings.groqApiKey,
        streaming: false
      });
    } else {
      console.log('🚀 Using OpenAI for LLM');
      this.llm = new ChatOpenAI({
        model: settings.openaiModel,
        temperature: 0.3,
        openAIApiKey: settings.openaiApiKey,
        streaming: false
      });
    }
    
    // Store prompt template as string for now
    this.prompt = `You are a helpful accounting assistant for a finance bot. Your job is to either:
1) extract financial transaction information, or
2) infer a NON-DESTRUCTIVE bot command intent from natural language.
      
Extract the following information from the message:
1. Transaction type: "income" (money received, got paid, salary, etc.) or "expense" (money spent, paid for, bought, etc.)
2. Amount: The numerical amount (as a NUMBER, not string). Extract even if written as plain numbers like "20" (means $20 or 20)
3. Description: What the transaction was for
4. Category (optional): Such as groceries, salary, dining, etc.
5. Account (optional): Which account this transaction belongs to (e.g., cash, bank, card)

EXAMPLES:
- "i got paid 20" → {"transaction":{"type":"income","amount":20,"description":"got paid"}}
- "spent 50 on groceries" → {"transaction":{"type":"expense","amount":50,"description":"groceries","category":"groceries"}}
- "paid $30 for lunch" → {"transaction":{"type":"expense","amount":30,"description":"lunch","category":"dining"}}

ALLOWED COMMANDS (non-destructive only):
- balance
- history
- months
- month {index}
- categories
- catstats {index}
- budgets
- budget_status
- budget_create {amount, category?}
- accounts
- account_add {name}
- account_use {name}
- export
- export_month {index}

For budget_create command, extract:
- amount: the budget amount as a number
- category: optional category name (if specified, otherwise null for overall budget)

NEVER infer destructive commands like delete, clear, or override.

Respond ONLY with valid JSON in this format:
{
  "intent": {
    "type": "transaction" | "command" | "none",
    "command"?: "balance" | "history" | "months" | "month" | "categories" | "catstats" | "budgets" | "budget_status" | "budget_create" | "accounts" | "account_add" | "account_use" | "export" | "export_month",
    "args"?: { 
      "index"?: number, 
      "name"?: string,
      "amount"?: number,
      "category"?: string
    }
  },
  "transaction": {
    "type"?: "income" | "expense",
    "amount"?: number,
    "description"?: string,
    "category"?: string,
    "account"?: string
  }
}

EXAMPLES:
- "show balance" → {"intent":{"type":"command","command":"balance"}}
- "set budget $500 for groceries" → {"intent":{"type":"command","command":"budget_create","args":{"amount":500,"category":"groceries"}}}
- "set budget $1000" → {"intent":{"type":"command","command":"budget_create","args":{"amount":1000}}}
- "switch to bank account" → {"intent":{"type":"command","command":"account_use","args":{"name":"bank"}}}

If you cannot infer anything, respond with: {"intent":{"type":"none"}}`;
  }
  
  async processMessage(message: string): Promise<any> {
    try {
      console.log(`Processing: ${message}`);
      
      // Invoke LLM with prompt
      const messages = [
        { role: 'system', content: this.prompt },
        { role: 'user', content: message }
      ];
      
      const response = await this.llm.invoke(messages);
      
      // Parse the response
      console.log(`LLM Response: ${response.content}`);
      
      // Try to parse as JSON
      const responseText = typeof response.content === 'string' ? response.content : String(response.content);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      let data: any;
      
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        data = { type: 'none' };
      }
      
      // Handle intent routing
      const intent = data.intent?.type || 'transaction';
      if (intent === 'command') {
        // Return command to caller to handle safely
        return {
          success: true,
          intent: {
            type: 'command',
            command: data.intent.command,
            args: data.intent.args || {}
          }
        };
      }
      // Fallback to transaction
      const txn = data.transaction || data; // support old format
      const result = this.processTransaction(txn, message);
      return result;
      
    } catch (error) {
      console.error(`Error processing message: ${error}`);
      return {
        success: false,
        error: String(error),
        balance: this.tracker.getBalance(),
        message: 'An error occurred processing your message.'
      };
    }
  }
  
  private processTransaction(data: any, originalMessage: string): any {
    if (data.type === 'none') {
      return {
        success: false,
        message: "I couldn't extract a transaction from your message. Please try again with a clear amount and purpose.",
        balance: this.tracker.getBalance()
      };
    }
    
    const type = data.type;
    // Parse amount - handle both string and number formats
    const amountValue = typeof data.amount === 'string' ? parseFloat(data.amount.replace(/[^0-9.-]/g, '')) : Number(data.amount);
    const amount = amountValue;
    const description = data.description || originalMessage;
    const category = data.category;
    const account = (data.account || this.tracker.getCurrentAccount?.() || 'cash');
    
    // Validate amount after parsing
    if (!amount || isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: 'Invalid amount. Please provide a valid number.',
        balance: this.tracker.getBalance()
      };
    }
    
    // Add transaction
    let action: string;
    
    if (type === 'income') {
      this.tracker.addIncome(amount, description, category, account);
      action = 'Added income';
    } else if (type === 'expense') {
      this.tracker.addExpense(amount, description, category, account);
      action = 'Added expense';
    } else {
      return {
        success: false,
        message: 'Unknown transaction type.',
        balance: this.tracker.getBalance()
      };
    }
    
    return {
      success: true,
      action,
      amount,
      description,
      category,
      balance: this.tracker.getBalance(),
      message: `${action} of $${amount.toFixed(2)} for ${description} in ${account}. Current balance: $${this.tracker.getBalance().toFixed(2)}`
    };
  }
  
  getBalanceSummary(): any {
    const recentTransactions = this.tracker.getRecentTransactions(5);
    
    return {
      balance: this.tracker.getBalance(),
      recentTransactions: recentTransactions.map((t: any) => ({
        type: t.type,
        amount: t.amount,
        description: t.description,
        category: t.category,
        timestamp: t.timestamp.toISOString()
      }))
    };
  }
}
