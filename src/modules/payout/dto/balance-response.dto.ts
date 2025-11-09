export class BalanceResponseDto {
  available: number;
  pending: number;
  escrowed: number;
  total: number;
  currency: string;
  minPayoutAmount: number;
  nextPayoutDate: Date | null;

  availableFormatted: string;
  pendingFormatted: string;
  escrowedFormatted: string;
  totalFormatted: string;

  static create(balance: {
    available: number;
    pending: number;
    escrowed: number;
    total: number;
    currency: string;
  }): BalanceResponseDto {
    const formatted = (amount: number, currency: string) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount / 100);
    };

    return {
      ...balance,
      minPayoutAmount: 10000, // Will be dynamic based on currency
      nextPayoutDate: this.getNextFriday(),
      availableFormatted: formatted(balance.available, balance.currency),
      pendingFormatted: formatted(balance.pending, balance.currency),
      escrowedFormatted: formatted(balance.escrowed, balance.currency),
      totalFormatted: formatted(balance.total, balance.currency),
    };
  }

  private static getNextFriday(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    nextFriday.setHours(10, 0, 0, 0);
    return nextFriday;
  }
}
