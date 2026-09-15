import { describe, it, expect } from 'vitest';
import { calculateBeam } from './beam';

describe('calculateBeam — uniform load (imperial)', () => {
  // L=20 ft, w=1 kip/ft, E=29e6 psi, I=200 in⁴, σ=24000 psi, S=50 in³, L/360
  const base = {
    unitSystem: 'imperial' as const,
    loadType: 'uniform' as const,
    span: 20,
    uniformLoad: 1,
    material: 'steel' as const,
    E: 29_000_000,
    I: 200,
    S_avail: 50,
    sigma: 24_000,
    deflectionLimitDivisor: 360,
  };

  it('computes M = wL²/8', () => {
    const r = calculateBeam(base);
    expect(r.M).toBeCloseTo(50, 6); // 1*400/8
    expect(r.M_unit).toBe('kip·ft');
  });

  it('computes V = wL/2', () => {
    const r = calculateBeam(base);
    expect(r.V).toBeCloseTo(10, 6);
    expect(r.V_unit).toBe('kip');
  });

  it('computes δ = 5wL⁴/(384EI)', () => {
    const r = calculateBeam(base);
    // w_lb/in = 1000/12; L=240 in
    const expected =
      (5 * (1000 / 12) * Math.pow(240, 4)) / (384 * 29_000_000 * 200);
    expect(r.delta).toBeCloseTo(expected, 6);
    expect(r.delta_unit).toBe('in');
  });

  it('computes S_req = M/σ and pass/fail', () => {
    const r = calculateBeam(base);
    // S_req = 50*12*1000/24000 = 25 in³
    expect(r.S_req).toBeCloseTo(25, 6);
    expect(r.stressPass).toBe(true);
    expect(r.delta_allow).toBeCloseTo(240 / 360, 6);
    expect(r.deflectionPass).toBe(true);
    expect(r.pass).toBe(true);
  });

  it('fails when S_avail is insufficient', () => {
    const r = calculateBeam({ ...base, S_avail: 10 });
    expect(r.stressPass).toBe(false);
    expect(r.pass).toBe(false);
  });

  it('fails when deflection exceeds limit', () => {
    const r = calculateBeam({ ...base, I: 50, S_avail: 100 });
    expect(r.deflectionPass).toBe(false);
    expect(r.pass).toBe(false);
  });
});

describe('calculateBeam — midspan point load (imperial)', () => {
  // L=16 ft, P=10 kip, E=29e6, I=100, σ=36000 psi, S=30
  const base = {
    unitSystem: 'imperial' as const,
    loadType: 'point' as const,
    span: 16,
    pointLoad: 10,
    material: 'steel' as const,
    E: 29_000_000,
    I: 100,
    S_avail: 30,
    sigma: 36_000,
    deflectionLimitDivisor: 360,
  };

  it('computes M = PL/4', () => {
    const r = calculateBeam(base);
    expect(r.M).toBeCloseTo(40, 6); // 10*16/4
  });

  it('computes V = P/2', () => {
    const r = calculateBeam(base);
    expect(r.V).toBeCloseTo(5, 6);
  });

  it('computes δ = PL³/(48EI)', () => {
    const r = calculateBeam(base);
    const expected = (10_000 * Math.pow(192, 3)) / (48 * 29_000_000 * 100);
    expect(r.delta).toBeCloseTo(expected, 6);
  });

  it('computes S_req and passes', () => {
    const r = calculateBeam(base);
    // 40*12*1000/36000 = 13.333...
    expect(r.S_req).toBeCloseTo(40 * 12 * 1000 / 36_000, 6);
    expect(r.pass).toBe(true);
  });
});

describe('calculateBeam — metric uniform', () => {
  it('uses metric formulas consistently', () => {
    // L=6 m, w=10 kN/m, E=200000 MPa, I=83560000 mm⁴ (IPE300-ish), σ=160 MPa, S=628000 mm³
    const r = calculateBeam({
      unitSystem: 'metric',
      loadType: 'uniform',
      span: 6,
      uniformLoad: 10,
      material: 'steel',
      E: 200_000,
      I: 83_560_000,
      S_avail: 628_000,
      sigma: 160,
      deflectionLimitDivisor: 360,
    });
    expect(r.M).toBeCloseTo((10 * 36) / 8, 6); // 45 kN·m
    expect(r.V).toBeCloseTo(30, 6);
    expect(r.M_unit).toBe('kN·m');
    expect(r.S_req).toBeCloseTo((45 * 1e6) / 160, 0);
    expect(r.pass).toBe(true);
  });
});

describe('calculateBeam — validation', () => {
  it('throws on non-positive span', () => {
    expect(() =>
      calculateBeam({
        unitSystem: 'imperial',
        loadType: 'uniform',
        span: 0,
        uniformLoad: 1,
        material: 'steel',
        E: 29e6,
        I: 100,
        S_avail: 20,
        sigma: 24000,
        deflectionLimitDivisor: 360,
      }),
    ).toThrow();
  });
});
