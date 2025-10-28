/**
 * WhatsApp message handler.
 */

import { AccountingAgent } from '../agent/accounting-agent.js';

export class WhatsAppHandler {
  private agent: AccountingAgent;
  
  constructor(agent: AccountingAgent) {
    this.agent = agent;
  }
  
  async handleMessage(message: any): Promise<any> {
    try {
      // Extract message text
      const text = this.extractText(message);
      
      if (!text) {
        return {
          status: 'error',
          message: 'No text found in message'
        };
      }
      
      // Process with the accounting agent
      const result = await this.agent.processMessage(text);
      
      // Format response
      const responseMessage = result.message || 'Transaction processed';
      
      return {
        status: 'success',
        message: responseMessage,
        result
      };
      
    } catch (error) {
      console.error(`Error handling message: ${error}`);
      return {
        status: 'error',
        message: `Error processing message: ${error}`
      };
    }
  }
  
  private extractText(message: any): string {
    // This is a placeholder - adapt to actual WhatsApp API structure
    // Typical structure might be: message.message.text.body
    return message?.message?.text?.body || message?.text || '';
  }
  
  async handleImage(imageData: Buffer, caption?: string): Promise<any> {
    try {
      // Process image with OCR or vision model
      // TODO: Implement image processing
      
      // If there's a caption, try to process it
      if (caption) {
        const result = await this.agent.processMessage(caption);
        return {
          status: 'success',
          message: result.message || 'Transaction processed',
          result
        };
      }
      
      return {
        status: 'info',
        message: 'Image received. Please provide transaction details.'
      };
      
    } catch (error) {
      console.error(`Error handling image: ${error}`);
      return {
        status: 'error',
        message: `Error processing image: ${error}`
      };
    }
  }
}
