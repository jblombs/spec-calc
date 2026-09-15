/**
 * Material Quantity Estimator
 * - Concrete: V = L×W×T×(1+waste)
 * - Rebar: wt = Σ(len×lb/ft)×(1+waste)
 * - Lumber BF: BF = T×W×L/12
 * - Drywall: sheets = area/sheetArea×(1+waste)
 * - Paint: gallons = area/coverage×coats×(1+waste)
 */

export type ConcreteMode = 'slab' | 'footing' | 'column';

export interface ConcreteInput {
  mode: ConcreteMode;
  length: number; // ft
  width: number; // ft (or diameter for round column treated as width)
  thickness: number; // ft (or height for column)
  wasteFraction: number; // 0.10 = 10%
  /** If true, treat as circular column: diameter = width */
  circular?: boolean;
}

export interface ConcreteResult {
  volume_ft3: number;
  volume_yd3: number;
  wasteFraction: number;
  mode: ConcreteMode;
  lines: string[];
}

export function estimateConcrete(input: ConcreteInput): ConcreteResult {
  const { mode, length, width, thickness, wasteFraction, circular } = input;
  if (length < 0 || width < 0 || thickness < 0 || wasteFraction < 0) {
    throw new Error('Dimensions and waste must be non-negative');
  }
  let raw: number;
  if (mode === 'column' && circular) {
    const r = width / 2;
    raw = Math.PI * r * r * thickness; // thickness = height
  } else {
    raw = length * width * thickness;
  }
  const volume_ft3 = raw * (1 + wasteFraction);
  const volume_yd3 = volume_ft3 / 27;
  const lines = [
    `Concrete (${mode}${circular ? ', circular' : ''})`,
    `  Raw: ${raw.toFixed(2)} ft³`,
    `  Waste: ${(wasteFraction * 100).toFixed(0)}%`,
    `  Total: ${volume_ft3.toFixed(2)} ft³ (${volume_yd3.toFixed(3)} yd³)`,
  ];
  return { volume_ft3, volume_yd3, wasteFraction, mode, lines };
}

export interface RebarBar {
  length_ft: number;
  lb_per_ft: number;
  count: number;
}

export interface RebarInput {
  bars: RebarBar[];
  wasteFraction: number;
}

export interface RebarResult {
  weight_lb: number;
  wasteFraction: number;
  lines: string[];
}

export function estimateRebar(input: RebarInput): RebarResult {
  const { bars, wasteFraction } = input;
  if (wasteFraction < 0) throw new Error('Waste must be non-negative');
  let raw = 0;
  const detail: string[] = [];
  for (const b of bars) {
    if (b.length_ft < 0 || b.lb_per_ft < 0 || b.count < 0) {
      throw new Error('Bar dimensions must be non-negative');
    }
    const w = b.length_ft * b.lb_per_ft * b.count;
    raw += w;
    detail.push(`  ${b.count}× ${b.length_ft} ft @ ${b.lb_per_ft} lb/ft = ${w.toFixed(1)} lb`);
  }
  const weight_lb = raw * (1 + wasteFraction);
  const lines = [
    'Rebar',
    ...detail,
    `  Raw: ${raw.toFixed(1)} lb`,
    `  Waste: ${(wasteFraction * 100).toFixed(0)}%`,
    `  Total: ${weight_lb.toFixed(1)} lb`,
  ];
  return { weight_lb, wasteFraction, lines };
}

/** Common rebar weights (lb/ft) */
export const REBAR_WEIGHTS: Record<string, number> = {
  '#3': 0.376,
  '#4': 0.668,
  '#5': 1.043,
  '#6': 1.502,
  '#7': 2.044,
  '#8': 2.67,
};

export interface LumberPiece {
  thickness_in: number;
  width_in: number;
  length_ft: number;
  count: number;
}

export interface LumberInput {
  pieces: LumberPiece[];
  wasteFraction: number;
}

export interface LumberResult {
  boardFeet: number;
  wasteFraction: number;
  lines: string[];
}

/** BF = T×W×L/12 per piece (T,W in inches, L in feet), then × count × (1+waste) */
export function estimateLumber(input: LumberInput): LumberResult {
  const { pieces, wasteFraction } = input;
  if (wasteFraction < 0) throw new Error('Waste must be non-negative');
  let raw = 0;
  const detail: string[] = [];
  for (const p of pieces) {
    if (p.thickness_in < 0 || p.width_in < 0 || p.length_ft < 0 || p.count < 0) {
      throw new Error('Lumber dimensions must be non-negative');
    }
    const bf = (p.thickness_in * p.width_in * p.length_ft) / 12;
    const total = bf * p.count;
    raw += total;
    detail.push(
      `  ${p.count}× ${p.thickness_in}×${p.width_in}×${p.length_ft}' = ${total.toFixed(2)} BF`,
    );
  }
  const boardFeet = raw * (1 + wasteFraction);
  const lines = [
    'Lumber (board-feet)',
    ...detail,
    `  Raw: ${raw.toFixed(2)} BF`,
    `  Waste: ${(wasteFraction * 100).toFixed(0)}%`,
    `  Total: ${boardFeet.toFixed(2)} BF`,
  ];
  return { boardFeet, wasteFraction, lines };
}

export interface DrywallInput {
  area_ft2: number;
  sheetArea_ft2: number; // default 32 (4×8)
  wasteFraction: number;
}

export interface DrywallResult {
  sheets: number;
  sheetsCeil: number;
  wasteFraction: number;
  lines: string[];
}

export function estimateDrywall(input: DrywallInput): DrywallResult {
  const { area_ft2, sheetArea_ft2, wasteFraction } = input;
  if (area_ft2 < 0 || sheetArea_ft2 <= 0 || wasteFraction < 0) {
    throw new Error('Invalid drywall inputs');
  }
  const sheets = (area_ft2 / sheetArea_ft2) * (1 + wasteFraction);
  const sheetsCeil = Math.ceil(sheets);
  const lines = [
    'Drywall',
    `  Area: ${area_ft2.toFixed(1)} ft²`,
    `  Sheet: ${sheetArea_ft2} ft²`,
    `  Waste: ${(wasteFraction * 100).toFixed(0)}%`,
    `  Sheets needed: ${sheets.toFixed(2)} → order ${sheetsCeil}`,
  ];
  return { sheets, sheetsCeil, wasteFraction, lines };
}

export interface PaintInput {
  area_ft2: number;
  coverage_ft2_per_gal: number; // default 350
  coats: number;
  wasteFraction: number;
}

export interface PaintResult {
  gallons: number;
  gallonsCeil: number;
  wasteFraction: number;
  lines: string[];
}

export function estimatePaint(input: PaintInput): PaintResult {
  const { area_ft2, coverage_ft2_per_gal, coats, wasteFraction } = input;
  if (area_ft2 < 0 || coverage_ft2_per_gal <= 0 || coats < 0 || wasteFraction < 0) {
    throw new Error('Invalid paint inputs');
  }
  const gallons = (area_ft2 / coverage_ft2_per_gal) * coats * (1 + wasteFraction);
  const gallonsCeil = Math.ceil(gallons * 4) / 4; // round up to quarter gallon
  const lines = [
    'Paint',
    `  Area: ${area_ft2.toFixed(1)} ft²`,
    `  Coverage: ${coverage_ft2_per_gal} ft²/gal`,
    `  Coats: ${coats}`,
    `  Waste: ${(wasteFraction * 100).toFixed(0)}%`,
    `  Gallons: ${gallons.toFixed(2)} → buy ~${gallonsCeil}`,
  ];
  return { gallons, gallonsCeil, wasteFraction, lines };
}

export function joinTakeoff(lineGroups: string[][]): string {
  return lineGroups.map((g) => g.join('\n')).join('\n\n');
}
