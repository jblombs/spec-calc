import { describe, it, expect } from 'vitest';
import {
  estimateConcrete,
  estimateRebar,
  estimateLumber,
  estimateDrywall,
  estimatePaint,
} from './materials';

describe('estimateConcrete', () => {
  it('V = L×W×T×(1+waste) for slab', () => {
    const r = estimateConcrete({
      mode: 'slab',
      length: 20,
      width: 10,
      thickness: 0.5, // 6 in
      wasteFraction: 0.1,
    });
    expect(r.volume_ft3).toBeCloseTo(20 * 10 * 0.5 * 1.1, 6);
    expect(r.volume_yd3).toBeCloseTo((100 * 1.1) / 27, 6);
  });

  it('circular column uses πr²h', () => {
    const r = estimateConcrete({
      mode: 'column',
      length: 0,
      width: 2, // diameter ft
      thickness: 10, // height
      wasteFraction: 0,
      circular: true,
    });
    expect(r.volume_ft3).toBeCloseTo(Math.PI * 1 * 1 * 10, 6);
  });
});

describe('estimateRebar', () => {
  it('wt = Σ(len×lb/ft×count)×(1+waste)', () => {
    const r = estimateRebar({
      bars: [
        { length_ft: 20, lb_per_ft: 0.668, count: 10 }, // #4
        { length_ft: 10, lb_per_ft: 1.043, count: 4 }, // #5
      ],
      wasteFraction: 0.1,
    });
    const raw = 20 * 0.668 * 10 + 10 * 1.043 * 4;
    expect(r.weight_lb).toBeCloseTo(raw * 1.1, 6);
  });
});

describe('estimateLumber', () => {
  it('BF = T×W×L/12', () => {
    const r = estimateLumber({
      pieces: [{ thickness_in: 2, width_in: 4, length_ft: 8, count: 10 }],
      wasteFraction: 0.1,
    });
    // one piece: 2*4*8/12 = 5.333..., ×10 = 53.333..., ×1.1
    expect(r.boardFeet).toBeCloseTo(((2 * 4 * 8) / 12) * 10 * 1.1, 6);
  });
});

describe('estimateDrywall', () => {
  it('sheets = area/sheet×(1+waste)', () => {
    const r = estimateDrywall({
      area_ft2: 320,
      sheetArea_ft2: 32,
      wasteFraction: 0.1,
    });
    expect(r.sheets).toBeCloseTo(11, 6); // 10 * 1.1
    expect(r.sheetsCeil).toBe(11);
  });
});

describe('estimatePaint', () => {
  it('gallons = area/coverage×coats×(1+waste)', () => {
    const r = estimatePaint({
      area_ft2: 700,
      coverage_ft2_per_gal: 350,
      coats: 2,
      wasteFraction: 0.1,
    });
    expect(r.gallons).toBeCloseTo((700 / 350) * 2 * 1.1, 6);
  });
});
