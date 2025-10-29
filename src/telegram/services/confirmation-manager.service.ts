/**
 * Service for managing pending confirmations
 * Single Responsibility: Only handles confirmation state
 */

export interface BudgetConfirmation {
  amount: number;
  year: number;
  month: number;
  category?: string;
  existingBudgets: Array<{ id: number }>;
}

export interface ClearMonthConfirmation {
  year: number;
  month: number;
  count: number;
  monthName: string;
}

export interface ClearAllDataConfirmation {
  transactions: number;
  budgets: number;
  accounts: number;
}

export class ConfirmationManager {
  private budgetConfirmations = new Map<string, BudgetConfirmation>();
  private clearMonthConfirmations = new Map<string, ClearMonthConfirmation>();
  private clearAllDataConfirmations = new Map<string, ClearAllDataConfirmation>();

  setBudgetConfirmation(userId: string, confirmation: BudgetConfirmation): void {
    this.budgetConfirmations.set(userId, confirmation);
  }

  getBudgetConfirmation(userId: string): BudgetConfirmation | undefined {
    return this.budgetConfirmations.get(userId);
  }

  clearBudgetConfirmation(userId: string): void {
    this.budgetConfirmations.delete(userId);
  }

  hasBudgetConfirmation(userId: string): boolean {
    return this.budgetConfirmations.has(userId);
  }

  setClearMonthConfirmation(userId: string, confirmation: ClearMonthConfirmation): void {
    this.clearMonthConfirmations.set(userId, confirmation);
  }

  getClearMonthConfirmation(userId: string): ClearMonthConfirmation | undefined {
    return this.clearMonthConfirmations.get(userId);
  }

  clearClearMonthConfirmation(userId: string): void {
    this.clearMonthConfirmations.delete(userId);
  }

  hasClearMonthConfirmation(userId: string): boolean {
    return this.clearMonthConfirmations.has(userId);
  }

  setClearAllDataConfirmation(userId: string, confirmation: ClearAllDataConfirmation): void {
    this.clearAllDataConfirmations.set(userId, confirmation);
  }

  getClearAllDataConfirmation(userId: string): ClearAllDataConfirmation | undefined {
    return this.clearAllDataConfirmations.get(userId);
  }

  clearClearAllDataConfirmation(userId: string): void {
    this.clearAllDataConfirmations.delete(userId);
  }

  hasClearAllDataConfirmation(userId: string): boolean {
    return this.clearAllDataConfirmations.has(userId);
  }

  clearAll(userId: string): void {
    this.budgetConfirmations.delete(userId);
    this.clearMonthConfirmations.delete(userId);
    this.clearAllDataConfirmations.delete(userId);
  }
}

