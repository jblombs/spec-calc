/** Unit conversion helpers for SpecCalc (imperial ↔ metric). */

export type UnitSystem = 'imperial' | 'metric';

export const LENGTH = {
  ft_to_m: 0.3048,
  in_to_mm: 25.4,
  m_to_ft: 1 / 0.3048,
  mm_to_in: 1 / 25.4,
} as const;

export const FORCE = {
  kip_to_kN: 4.448221615,
  kN_to_kip: 1 / 4.448221615,
  lb_to_N: 4.448221615,
} as const;

export const PRESSURE = {
  psi_to_MPa: 0.00689475729,
  MPa_to_psi: 1 / 0.00689475729,
  ksi_to_MPa: 6.89475729,
} as const;

export const SECTION = {
  in4_to_mm4: Math.pow(25.4, 4),
  mm4_to_in4: 1 / Math.pow(25.4, 4),
  in3_to_mm3: Math.pow(25.4, 3),
  mm3_to_in3: 1 / Math.pow(25.4, 3),
} as const;

export interface ConversionItem {
  id: string;
  category: string;
  fromLabel: string;
  toLabel: string;
  factor: number; // multiply from → to
}

export const CONVERSIONS: ConversionItem[] = [
  { id: 'ft-m', category: 'Length', fromLabel: 'ft', toLabel: 'm', factor: LENGTH.ft_to_m },
  { id: 'in-mm', category: 'Length', fromLabel: 'in', toLabel: 'mm', factor: LENGTH.in_to_mm },
  { id: 'yd-m', category: 'Length', fromLabel: 'yd', toLabel: 'm', factor: 0.9144 },
  { id: 'kip-kN', category: 'Force', fromLabel: 'kip', toLabel: 'kN', factor: FORCE.kip_to_kN },
  { id: 'lb-N', category: 'Force', fromLabel: 'lb', toLabel: 'N', factor: FORCE.lb_to_N },
  { id: 'psi-MPa', category: 'Stress', fromLabel: 'psi', toLabel: 'MPa', factor: PRESSURE.psi_to_MPa },
  { id: 'ksi-MPa', category: 'Stress', fromLabel: 'ksi', toLabel: 'MPa', factor: PRESSURE.ksi_to_MPa },
  { id: 'psf-Pa', category: 'Pressure', fromLabel: 'psf', toLabel: 'Pa', factor: 47.88025898 },
  { id: 'in4-mm4', category: 'Section', fromLabel: 'in⁴', toLabel: 'mm⁴', factor: SECTION.in4_to_mm4 },
  { id: 'in3-mm3', category: 'Section', fromLabel: 'in³', toLabel: 'mm³', factor: SECTION.in3_to_mm3 },
  { id: 'ft3-m3', category: 'Volume', fromLabel: 'ft³', toLabel: 'm³', factor: Math.pow(LENGTH.ft_to_m, 3) },
  { id: 'yd3-m3', category: 'Volume', fromLabel: 'yd³', toLabel: 'm³', factor: 0.76455485798 },
  { id: 'ft2-m2', category: 'Area', fromLabel: 'ft²', toLabel: 'm²', factor: Math.pow(LENGTH.ft_to_m, 2) },
  { id: 'gal-L', category: 'Volume', fromLabel: 'gal (US)', toLabel: 'L', factor: 3.785411784 },
];

export function convert(value: number, factor: number, reverse = false): number {
  return reverse ? value / factor : value * factor;
}

export function formatNum(n: number, digits = 3): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1000 || (Math.abs(n) > 0 && Math.abs(n) < 0.01)) {
    return n.toExponential(3);
  }
  return Number(n.toPrecision(digits + 1)).toString();
}
