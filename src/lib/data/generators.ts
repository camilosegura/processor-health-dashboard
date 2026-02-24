import { Transaction, TransactionStatus, DeclineReason, DECLINE_REASONS } from '@/types/transaction';
import { ProcessorConfig } from '@/types/processor';
import { PROCESSORS } from './processors';
import { createRng, randomBetween, randomInt, weightedChoice } from './seed';
import { getAnomalyFactor } from './anomalies';

const COUNTRIES = [
  { value: { code: 'MX', currency: 'MXN' }, weight: 0.4 },
  { value: { code: 'CO', currency: 'COP' }, weight: 0.3 },
  { value: { code: 'BR', currency: 'BRL' }, weight: 0.3 },
];

const CARD_NETWORKS = [
  { value: 'Visa', weight: 0.45 },
  { value: 'Mastercard', weight: 0.30 },
  { value: 'Amex', weight: 0.15 },
  { value: 'Discover', weight: 0.10 },
];

interface GeneratedDataset {
  transactions: Transaction[];
  generatedAt: number;
}

let cachedDataset: GeneratedDataset | null = null;

export function getDataset(): GeneratedDataset {
  if (!cachedDataset) {
    cachedDataset = generateFullDataset();
  }
  return cachedDataset;
}

function generateFullDataset(): GeneratedDataset {
  const rng = createRng(42);
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const startTime = now - sevenDaysMs;
  const transactions: Transaction[] = [];
  let txId = 1;

  // Generate transactions hour by hour for each processor
  for (let hourOffset = 0; hourOffset < 7 * 24; hourOffset++) {
    const hourTimestamp = startTime + hourOffset * 60 * 60 * 1000;
    const hoursAgo = (now - hourTimestamp) / (60 * 60 * 1000);

    // More transactions in recent hours (simulate growth + activity patterns)
    const recencyMultiplier = 0.6 + 0.4 * (hourOffset / (7 * 24));

    // Time-of-day pattern (peak during business hours)
    const hourOfDay = new Date(hourTimestamp).getUTCHours();
    const todMultiplier = hourOfDay >= 8 && hourOfDay <= 22 ? 1.0 : 0.4;

    for (const processor of PROCESSORS) {
      const baseCount = Math.round(
        processor.baselineVolumePerHour * recencyMultiplier * todMultiplier
      );
      // Add some variance
      const txCount = Math.max(1, baseCount + randomInt(rng, -Math.floor(baseCount * 0.2), Math.floor(baseCount * 0.2)));

      const authFactor = getAnomalyFactor(processor.id, hoursAgo, 'authRate');
      const latencyFactor = getAnomalyFactor(processor.id, hoursAgo, 'latency');
      const effectiveAuthRate = Math.min(1, processor.baselineAuthRate * authFactor);

      for (let i = 0; i < txCount; i++) {
        const minuteOffset = randomInt(rng, 0, 59);
        const secondOffset = randomInt(rng, 0, 59);
        const timestamp = new Date(
          hourTimestamp + minuteOffset * 60000 + secondOffset * 1000
        ).toISOString();

        const country = weightedChoice(rng, COUNTRIES);
        const cardNetwork = weightedChoice(rng, CARD_NETWORKS);

        // Determine status
        let status: TransactionStatus;
        let declineReason: DeclineReason | undefined;
        const roll = rng();
        if (roll < effectiveAuthRate) {
          status = 'approved';
        } else if (roll < effectiveAuthRate + 0.02) {
          status = 'timeout';
        } else if (roll < effectiveAuthRate + 0.03) {
          status = 'error';
        } else {
          status = 'declined';
          declineReason = DECLINE_REASONS[randomInt(rng, 0, DECLINE_REASONS.length - 1)];
        }

        // Response time with anomaly factor
        const baseLatency = processor.baselineResponseTimeMs;
        let responseTimeMs = Math.round(
          randomBetween(rng, baseLatency * 0.5, baseLatency * 1.8) * latencyFactor
        );
        if (status === 'timeout') {
          responseTimeMs = randomInt(rng, 8000, 15000);
        }

        // Amount varies by currency
        let amount: number;
        if (country.currency === 'MXN') {
          amount = Math.round(randomBetween(rng, 100, 8000) * 100) / 100;
        } else if (country.currency === 'COP') {
          amount = Math.round(randomBetween(rng, 5000, 500000));
        } else {
          amount = Math.round(randomBetween(rng, 20, 2000) * 100) / 100;
        }

        transactions.push({
          id: `tx-${String(txId++).padStart(7, '0')}`,
          processorId: processor.id,
          timestamp,
          amount,
          currency: country.currency,
          country: country.code,
          status,
          responseTimeMs,
          cardNetwork,
          declineReason,
        });
      }
    }
  }

  // Sort by timestamp
  transactions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return { transactions, generatedAt: now };
}

export function getTransactionsForProcessor(
  processorId: string,
  startTime?: string,
  endTime?: string
): Transaction[] {
  const { transactions } = getDataset();
  return transactions.filter(tx => {
    if (tx.processorId !== processorId) return false;
    if (startTime && tx.timestamp < startTime) return false;
    if (endTime && tx.timestamp > endTime) return false;
    return true;
  });
}

export function getTransactionsInRange(startTime: string, endTime: string): Transaction[] {
  const { transactions } = getDataset();
  return transactions.filter(tx => tx.timestamp >= startTime && tx.timestamp <= endTime);
}

export function getAllProcessorConfigs(): ProcessorConfig[] {
  return PROCESSORS;
}
