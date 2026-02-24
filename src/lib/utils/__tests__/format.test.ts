import { formatPercent, formatMs, formatNumber, formatTrend } from '../format';

describe('formatPercent', () => {
  it('formats with default 1 decimal', () => {
    expect(formatPercent(85.6789)).toBe('85.7%');
  });

  it('formats with custom decimals', () => {
    expect(formatPercent(85.6789, 2)).toBe('85.68%');
  });

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('formats 100', () => {
    expect(formatPercent(100)).toBe('100.0%');
  });
});

describe('formatMs', () => {
  it('formats milliseconds below 1000', () => {
    expect(formatMs(500)).toBe('500ms');
  });

  it('formats milliseconds at exactly 1000 as seconds', () => {
    expect(formatMs(1000)).toBe('1.0s');
  });

  it('formats milliseconds above 1000 as seconds', () => {
    expect(formatMs(2500)).toBe('2.5s');
  });

  it('rounds sub-second values', () => {
    expect(formatMs(499.7)).toBe('500ms');
  });

  it('formats zero', () => {
    expect(formatMs(0)).toBe('0ms');
  });
});

describe('formatNumber', () => {
  it('formats numbers below 1000 as-is', () => {
    expect(formatNumber(500)).toBe('500');
  });

  it('formats thousands with K suffix', () => {
    expect(formatNumber(1500)).toBe('1.5K');
  });

  it('formats millions with M suffix', () => {
    expect(formatNumber(2500000)).toBe('2.5M');
  });

  it('formats exactly 1000', () => {
    expect(formatNumber(1000)).toBe('1.0K');
  });
});

describe('formatTrend', () => {
  it('formats positive trend with + sign', () => {
    expect(formatTrend(5.3)).toBe('+5.3%');
  });

  it('formats negative trend with - sign', () => {
    expect(formatTrend(-3.7)).toBe('-3.7%');
  });

  it('formats zero as +0.0%', () => {
    expect(formatTrend(0)).toBe('+0.0%');
  });
});
