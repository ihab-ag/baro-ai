/**
 * Settings management for the application.
 */

import dotenv from 'dotenv';

dotenv.config();

export class Settings {
  // LLM Provider Selection
  readonly llmProvider: 'openai' | 'groq';
  
  // OpenAI Configuration
  readonly openaiApiKey: string;
  readonly openaiModel: string;
  
  // Groq Configuration (FREE for development!)
  readonly groqApiKey: string;
  readonly groqModel: string;
  
  // Telegram Configuration
  readonly telegramBotToken: string;
  
  // Supabase Configuration
  readonly supabaseUrl: string;
  readonly supabaseKey: string;
  
  // Application Configuration
  readonly environment: string;
  readonly logLevel: string;
  
  constructor() {
    // Choose LLM provider (default to groq for free tier)
    this.llmProvider = (process.env.LLM_PROVIDER || 'groq') as 'openai' | 'groq';
    
    // OpenAI settings
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    // Groq settings (FREE!)
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    
    // Telegram settings
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
    
    // Supabase settings
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    
    this.environment = process.env.ENVIRONMENT || 'development';
    this.logLevel = process.env.LOG_LEVEL || 'INFO';
    
    // Warn if Supabase is not configured
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('💡 Supabase not configured. Data will be stored in memory only.');
      console.warn('   To enable persistence, add SUPABASE_URL and SUPABASE_ANON_KEY to .env');
    }
    
    // Validate settings based on provider
    if (this.llmProvider === 'openai' && !this.openaiApiKey) {
      console.warn('⚠️  Warning: OPENAI_API_KEY is not set but OpenAI is selected');
    } else if (this.llmProvider === 'groq' && !this.groqApiKey) {
      console.warn('⚠️  Warning: GROQ_API_KEY is not set. Get one for FREE at https://console.groq.com/keys');
    }
  }
}
