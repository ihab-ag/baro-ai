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
    this.prompt = `You are a helpful accounting assistant. Your job is to extract financial transaction information from user messages.
      
Extract the following information from the message:
1. Transaction type: "income" (money received) or "expense" (money spent)
2. Amount: The numerical amount
3. Description: What the transaction was for
4. Category (optional): Such as groceries, salary, dining, etc.
5. Account (optional): Which account this transaction belongs to (e.g., cash, bank, card)

Respond ONLY with valid JSON in this format:
{
  "type": "income" or "expense",
  "amount": <number>,
  "description": "<string>",
  "category": "<optional category>",
  "account": "<optional account>"
}

If you cannot extract a transaction from the message, respond with: {"type": "none"}`;
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
      let data;
      
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        data = { type: 'none' };
      }
      
      // Process the transaction
      const result = this.processTransaction(data, message);
      
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
    const amount = data.amount;
    const description = data.description || originalMessage;
    const category = data.category;
    const account = (data.account || this.tracker.getCurrentAccount?.() || 'cash');
    
    if (!amount || amount <= 0) {
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
