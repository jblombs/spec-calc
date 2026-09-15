/**
 * Structural Beam Load Calculator — simply supported beams.
 *
 * Formulas (spec):
 * - Uniform w: M=wL²/8 · V=wL/2 · δ=5wL⁴/(384EI)
 * - Midspan P: M=PL/4 · V=P/2 · δ=PL³/(48EI)
 * - S_req=M/σ · pass if S_avail≥S_req AND δ≤ deflection limit
 *
 * Internal math uses consistent imperial base (kip, ft, in, psi) or
 * metric base (kN, m, mm, MPa) depending on unitSystem.
 */

import type { UnitSystem } from './units';

export type LoadType = 'uniform' | 'point';
export type MaterialKind = 'steel' | 'wood' | 'concrete';

export interface SectionPreset {
  id: string;
  label: string;
  material: MaterialKind;
  /** Moment of inertia */
  I: number;
  /** Section modulus */
  S: number;
  unitSystem: UnitSystem;
}

/** Common W-shapes (imperial: I in in⁴, S in in³) and lumber. */
export const SECTION_PRESETS: SectionPreset[] = [
  // Steel W-shapes (AISC approximate published values)
  { id: 'W8x18', label: 'W8×18', material: 'steel', I: 61.9, S: 15.2, unitSystem: 'imperial' },
  { id: 'W10x22', label: 'W10×22', material: 'steel', I: 118, S: 23.2, unitSystem: 'imperial' },
  { id: 'W12x26', label: 'W12×26', material: 'steel', I: 204, S: 33.4, unitSystem: 'imperial' },
  { id: 'W14x30', label: 'W14×30', material: 'steel', I: 291, S: 42.0, unitSystem: 'imperial' },
  { id: 'W16x36', label: 'W16×36', material: 'steel', I: 448, S: 56.5, unitSystem: 'imperial' },
  { id: 'W18x40', label: 'W18×40', material: 'steel', I: 612, S: 68.4, unitSystem: 'imperial' },
  { id: 'W21x44', label: 'W21×44', material: 'steel', I: 843, S: 81.6, unitSystem: 'imperial' },
  { id: 'W24x55', label: 'W24×55', material: 'steel', I: 1350, S: 114, unitSystem: 'imperial' },
  // Dimensional lumber (approx. S for select structural; I about strong axis)
  { id: '2x6', label: '2×6 lumber', material: 'wood', I: 20.8, S: 7.56, unitSystem: 'imperial' },
  { id: '2x8', label: '2×8 lumber', material: 'wood', I: 47.6, S: 13.1, unitSystem: 'imperial' },
  { id: '2x10', label: '2×10 lumber', material: 'wood', I: 98.9, S: 21.4, unitSystem: 'imperial' },
  { id: '2x12', label: '2×12 lumber', material: 'wood', I: 178, S: 31.6, unitSystem: 'imperial' },
  { id: '4x8', label: '4×8 lumber', material: 'wood', I: 111, S: 30.7, unitSystem: 'imperial' },
  { id: '4x12', label: '4×12 lumber', material: 'wood', I: 417, S: 73.8, unitSystem: 'imperial' },
  // Metric HEA-ish approximations (I mm⁴, S mm³)
  { id: 'HEA200', label: 'HEA 200', material: 'steel', I: 36920000, S: 389500, unitSystem: 'metric' },
  { id: 'HEA300', label: 'HEA 300', material: 'steel', I: 182600000, S: 1260000, unitSystem: 'metric' },
  { id: 'IPE300', label: 'IPE 300', material: 'steel', I: 83560000, S: 628000, unitSystem: 'metric' },
];

/** Default modulus of elasticity E by material. */
export const DEFAULT_E: Record<MaterialKind, { imperial: number; metric: number; imperialUnit: string; metricUnit: string }> = {
  steel: { imperial: 29_000_000, metric: 200_000, imperialUnit: 'psi', metricUnit: 'MPa' },
  wood: { imperial: 1_600_000, metric: 11_000, imperialUnit: 'psi', metricUnit: 'MPa' },
  concrete: { imperial: 3_600_000, metric: 25_000, imperialUnit: 'psi', metricUnit: 'MPa' },
};

export interface BeamInputs {
  unitSystem: UnitSystem;
  loadType: LoadType;
  /** Span length: ft (imperial) or m (metric) */
  span: number;
  /** Uniform load w: kip/ft or kN/m */
  uniformLoad?: number;
  /** Midspan point load P: kip or kN */
  pointLoad?: number;
  material: MaterialKind;
  /** Modulus E: psi or MPa */
  E: number;
  /** Moment of inertia I: in⁴ or mm⁴ */
  I: number;
  /** Available section modulus: in³ or mm³ */
  S_avail: number;
  /** Allowable bending stress σ: psi or MPa */
  sigma: number;
  /** Deflection limit divisor (default 360 → L/360) */
  deflectionLimitDivisor: number;
}

export interface BeamResults {
  /** Max moment M */
  M: number;
  M_unit: string;
  /** Max shear V */
  V: number;
  V_unit: string;
  /** Max deflection δ */
  delta: number;
  delta_unit: string;
  /** Allowable deflection */
  delta_allow: number;
  /** Required section modulus */
  S_req: number;
  S_unit: string;
  stressPass: boolean;
  deflectionPass: boolean;
  pass: boolean;
  /** Diagram samples 0..1 along span */
  momentDiagram: { x: number; M: number }[];
  shearDiagram: { x: number; V: number }[];
}

/**
 * Compute beam results with exact formulas from the product spec.
 * Units are kept consistent within each system.
 */
export function calculateBeam(input: BeamInputs): BeamResults {
  const { unitSystem, loadType, span: L, material: _m, E, I, S_avail, sigma, deflectionLimitDivisor } = input;

  if (!(L > 0) || !(E > 0) || !(I > 0) || !(sigma > 0) || !(deflectionLimitDivisor > 0)) {
    throw new Error('Invalid inputs: span, E, I, sigma, and deflection limit must be positive');
  }

  let M: number;
  let V: number;
  let delta: number;
  let momentDiagram: { x: number; M: number }[];
  let shearDiagram: { x: number; V: number }[];

  if (unitSystem === 'imperial') {
    // Working units: L_ft, loads in kip, E psi, I in⁴ → δ in inches; M in kip·ft
    const L_ft = L;
    const L_in = L_ft * 12;

    if (loadType === 'uniform') {
      const w = input.uniformLoad ?? 0; // kip/ft
      if (!(w >= 0)) throw new Error('Uniform load must be non-negative');
      M = (w * L_ft * L_ft) / 8; // kip·ft
      V = (w * L_ft) / 2; // kip
      // δ = 5wL⁴/(384EI) with L in inches, w in lb/in, E psi, I in⁴ → inches
      const w_lb_per_in = (w * 1000) / 12;
      delta = (5 * w_lb_per_in * Math.pow(L_in, 4)) / (384 * E * I);

      momentDiagram = sampleUniformMoment(L_ft, w, 21);
      shearDiagram = sampleUniformShear(L_ft, w, 21);
    } else {
      const P = input.pointLoad ?? 0; // kip
      if (!(P >= 0)) throw new Error('Point load must be non-negative');
      M = (P * L_ft) / 4; // kip·ft
      V = P / 2; // kip
      // δ = PL³/(48EI) with P in lb, L in inches → inches
      const P_lb = P * 1000;
      delta = (P_lb * Math.pow(L_in, 3)) / (48 * E * I);

      momentDiagram = samplePointMoment(L_ft, P, 21);
      shearDiagram = samplePointShear(L_ft, P, 21);
    }

    // S_req = M/σ with M in kip·ft → convert to lb·in: M*12*1000; σ in psi → in³
    const S_req = (M * 12 * 1000) / sigma;
    const delta_allow = L_in / deflectionLimitDivisor;
    const stressPass = S_avail >= S_req;
    const deflectionPass = delta <= delta_allow;

    return {
      M,
      M_unit: 'kip·ft',
      V,
      V_unit: 'kip',
      delta,
      delta_unit: 'in',
      delta_allow,
      S_req,
      S_unit: 'in³',
      stressPass,
      deflectionPass,
      pass: stressPass && deflectionPass,
      momentDiagram,
      shearDiagram,
    };
  }

  // Metric: L in m, w in kN/m, P in kN, E in MPa, I in mm⁴
  // Convert to N, mm for deflection consistency
  const L_m = L;
  const L_mm = L_m * 1000;

  if (loadType === 'uniform') {
    const w = input.uniformLoad ?? 0; // kN/m
    if (!(w >= 0)) throw new Error('Uniform load must be non-negative');
    M = (w * L_m * L_m) / 8; // kN·m
    V = (w * L_m) / 2; // kN
    // δ = 5wL⁴/(384EI): w in N/mm, L mm, E MPa(=N/mm²), I mm⁴ → mm
    const w_N_per_mm = (w * 1000) / 1000; // kN/m = N/mm
    delta = (5 * w_N_per_mm * Math.pow(L_mm, 4)) / (384 * E * I);

    momentDiagram = sampleUniformMoment(L_m, w, 21);
    shearDiagram = sampleUniformShear(L_m, w, 21);
  } else {
    const P = input.pointLoad ?? 0; // kN
    if (!(P >= 0)) throw new Error('Point load must be non-negative');
    M = (P * L_m) / 4; // kN·m
    V = P / 2; // kN
    const P_N = P * 1000;
    delta = (P_N * Math.pow(L_mm, 3)) / (48 * E * I);

    momentDiagram = samplePointMoment(L_m, P, 21);
    shearDiagram = samplePointShear(L_m, P, 21);
  }

  // S_req = M/σ: M in kN·m = N·mm * 1e6 / 1e3 wait:
  // M (N·mm) / σ (N/mm²) = mm³
  // M_kNm * 1e6 N·mm / σ_MPa = mm³
  const S_req = (M * 1e6) / sigma;
  const delta_allow = L_mm / deflectionLimitDivisor;
  const stressPass = S_avail >= S_req;
  const deflectionPass = delta <= delta_allow;

  return {
    M,
    M_unit: 'kN·m',
    V,
    V_unit: 'kN',
    delta,
    delta_unit: 'mm',
    delta_allow,
    S_req,
    S_unit: 'mm³',
    stressPass,
    deflectionPass,
    pass: stressPass && deflectionPass,
    momentDiagram,
    shearDiagram,
  };
}

function sampleUniformMoment(L: number, w: number, n: number) {
  const pts: { x: number; M: number }[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * L;
    // M(x) = (wL/2)*x - w*x²/2
    const M = (w * L * x) / 2 - (w * x * x) / 2;
    pts.push({ x: i / (n - 1), M });
  }
  return pts;
}

function sampleUniformShear(L: number, w: number, n: number) {
  const pts: { x: number; V: number }[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * L;
    const V = (w * L) / 2 - w * x;
    pts.push({ x: i / (n - 1), V });
  }
  return pts;
}

function samplePointMoment(L: number, P: number, n: number) {
  const pts: { x: number; M: number }[] = [];
  for (let i = 0; i < n; i++) {
    const xi = i / (n - 1);
    const x = xi * L;
    const M = x <= L / 2 ? (P / 2) * x : (P / 2) * (L - x);
    pts.push({ x: xi, M });
  }
  return pts;
}

function samplePointShear(_L: number, P: number, n: number) {
  const pts: { x: number; V: number }[] = [];
  for (let i = 0; i < n; i++) {
    const xi = i / (n - 1);
    const V = xi < 0.5 ? P / 2 : xi > 0.5 ? -P / 2 : 0;
    pts.push({ x: xi, V });
  }
  return pts;
}
