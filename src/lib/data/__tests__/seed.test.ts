import { createRng, randomBetween, randomInt, weightedChoice } from '../seed';

describe('createRng', () => {
  it('produces deterministic results for same seed', () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);
    const results1 = Array.from({ length: 10 }, () => rng1());
    const results2 = Array.from({ length: 10 }, () => rng2());
    expect(results1).toEqual(results2);
  });

  it('produces different results for different seeds', () => {
    const rng1 = createRng(42);
    const rng2 = createRng(99);
    const val1 = rng1();
    const val2 = rng2();
    expect(val1).not.toBe(val2);
  });

  it('produces values between 0 and 1', () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('produces a reasonable distribution', () => {
    const rng = createRng(42);
    const values = Array.from({ length: 10000 }, () => rng());
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    // Average should be roughly 0.5 for a uniform distribution
    expect(avg).toBeGreaterThan(0.45);
    expect(avg).toBeLessThan(0.55);
  });
});

describe('randomBetween', () => {
  it('produces values within range', () => {
    const rng = createRng(42);
    for (let i = 0; i < 100; i++) {
      const val = randomBetween(rng, 10, 20);
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThan(20);
    }
  });

  it('is deterministic', () => {
    const rng1 = createRng(42);
    const rng2 = createRng(42);
    expect(randomBetween(rng1, 0, 100)).toBe(randomBetween(rng2, 0, 100));
  });
});

describe('randomInt', () => {
  it('produces integers within range (inclusive)', () => {
    const rng = createRng(42);
    for (let i = 0; i < 100; i++) {
      const val = randomInt(rng, 1, 6);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('can produce both min and max values', () => {
    const rng = createRng(42);
    const values = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      values.add(randomInt(rng, 1, 3));
    }
    expect(values.has(1)).toBe(true);
    expect(values.has(2)).toBe(true);
    expect(values.has(3)).toBe(true);
  });
});

describe('weightedChoice', () => {
  it('returns the only option', () => {
    const rng = createRng(42);
    const result = weightedChoice(rng, [{ value: 'only', weight: 1 }]);
    expect(result).toBe('only');
  });

  it('respects weights over many iterations', () => {
    const rng = createRng(42);
    const counts: Record<string, number> = { a: 0, b: 0 };
    const options = [
      { value: 'a', weight: 0.9 },
      { value: 'b', weight: 0.1 },
    ];
    for (let i = 0; i < 10000; i++) {
      counts[weightedChoice(rng, options)]++;
    }
    // 'a' should be picked ~90% of the time
    expect(counts.a).toBeGreaterThan(8500);
    expect(counts.b).toBeGreaterThan(500);
  });

  it('works with object values', () => {
    const rng = createRng(42);
    const options = [
      { value: { code: 'MX', currency: 'MXN' }, weight: 1 },
    ];
    const result = weightedChoice(rng, options);
    expect(result).toEqual({ code: 'MX', currency: 'MXN' });
  });
});
