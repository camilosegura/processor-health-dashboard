export const TRANSACTION_STATUSES = ['approved', 'declined', 'timeout', 'error'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const DECLINE_REASONS = [
  'insufficient_funds',
  'card_expired',
  'do_not_honor',
  'fraud_suspected',
  'invalid_card',
  'processor_error',
] as const;
export type DeclineReason = (typeof DECLINE_REASONS)[number];

export interface Transaction {
  id: string;
  processorId: string;
  timestamp: string;
  amount: number;
  currency: string;
  country: string;
  status: TransactionStatus;
  responseTimeMs: number;
  cardNetwork: string;
  declineReason?: DeclineReason;
}
