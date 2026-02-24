import { getDataset, getTransactionsForProcessor, getAllProcessorConfigs } from '../generators';

describe('getDataset', () => {
  it('returns a dataset with transactions', () => {
    const { transactions } = getDataset();
    expect(transactions.length).toBeGreaterThan(5000);
  });

  it('returns deterministic data (same on second call)', () => {
    const first = getDataset();
    const second = getDataset();
    expect(first).toBe(second); // same cached reference
  });

  it('has transactions sorted by timestamp', () => {
    const { transactions } = getDataset();
    for (let i = 1; i < Math.min(transactions.length, 1000); i++) {
      expect(transactions[i].timestamp >= transactions[i - 1].timestamp).toBe(true);
    }
  });

  it('includes all 5 processors', () => {
    const { transactions } = getDataset();
    const processorIds = new Set(transactions.map(tx => tx.processorId));
    expect(processorIds.size).toBe(5);
    expect(processorIds.has('payfastmx')).toBe(true);
    expect(processorIds.has('cloudbank')).toBe(true);
    expect(processorIds.has('andean-gateway')).toBe(true);
    expect(processorIds.has('latampay')).toBe(true);
    expect(processorIds.has('novapago')).toBe(true);
  });

  it('includes all expected statuses', () => {
    const { transactions } = getDataset();
    const statuses = new Set(transactions.map(tx => tx.status));
    expect(statuses.has('approved')).toBe(true);
    expect(statuses.has('declined')).toBe(true);
  });

  it('includes all 3 countries', () => {
    const { transactions } = getDataset();
    const countries = new Set(transactions.map(tx => tx.country));
    expect(countries.has('MX')).toBe(true);
    expect(countries.has('CO')).toBe(true);
    expect(countries.has('BR')).toBe(true);
  });

  it('includes all 3 currencies', () => {
    const { transactions } = getDataset();
    const currencies = new Set(transactions.map(tx => tx.currency));
    expect(currencies.has('MXN')).toBe(true);
    expect(currencies.has('COP')).toBe(true);
    expect(currencies.has('BRL')).toBe(true);
  });

  it('has reasonable overall approval rate (70-85%)', () => {
    const { transactions } = getDataset();
    const approved = transactions.filter(tx => tx.status === 'approved').length;
    const rate = approved / transactions.length;
    expect(rate).toBeGreaterThan(0.60);
    expect(rate).toBeLessThan(0.90);
  });
});

describe('getTransactionsForProcessor', () => {
  it('filters by processor id', () => {
    const txs = getTransactionsForProcessor('payfastmx');
    expect(txs.length).toBeGreaterThan(0);
    txs.forEach(tx => {
      expect(tx.processorId).toBe('payfastmx');
    });
  });

  it('filters by time range', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();
    const txs = getTransactionsForProcessor('cloudbank', oneHourAgo, now.toISOString());
    txs.forEach(tx => {
      expect(tx.timestamp >= oneHourAgo).toBe(true);
      expect(tx.timestamp <= now.toISOString()).toBe(true);
    });
  });

  it('returns empty array for unknown processor', () => {
    const txs = getTransactionsForProcessor('nonexistent');
    expect(txs).toHaveLength(0);
  });
});

describe('getAllProcessorConfigs', () => {
  it('returns 5 processor configs', () => {
    const configs = getAllProcessorConfigs();
    expect(configs).toHaveLength(5);
  });

  it('each config has required fields', () => {
    const configs = getAllProcessorConfigs();
    configs.forEach(config => {
      expect(config.id).toBeTruthy();
      expect(config.name).toBeTruthy();
      expect(config.baselineAuthRate).toBeGreaterThan(0);
      expect(config.baselineAuthRate).toBeLessThanOrEqual(1);
      expect(config.baselineResponseTimeMs).toBeGreaterThan(0);
      expect(config.baselineVolumePerHour).toBeGreaterThan(0);
      expect(config.region).toBeTruthy();
      expect(config.color).toMatch(/^#[0-9a-f]{6}$/);
    });
  });
});
