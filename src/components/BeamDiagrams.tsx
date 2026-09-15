import type { BeamResults, LoadType } from '../engine/beam';

interface Props {
  results: BeamResults;
  loadType: LoadType;
  spanLabel: string;
  loadLabel: string;
}

export function BeamDiagrams({ results, loadType, spanLabel, loadLabel }: Props) {
  return (
    <div className="stack">
      <div className="diagram-wrap">
        <svg viewBox="0 0 400 120" role="img" aria-label="Beam elevation diagram">
          {/* Supports */}
          <polygon points="40,78 55,95 25,95" fill="var(--accent)" opacity="0.8" />
          <polygon points="360,78 375,95 345,95" fill="var(--accent)" opacity="0.8" />
          {/* Beam */}
          <rect x="40" y="68" width="320" height="10" rx="2" fill="var(--accent)" />
          {/* Load arrows */}
          {loadType === 'uniform'
            ? Array.from({ length: 9 }, (_, i) => {
                const x = 60 + i * 35;
                return (
                  <g key={i}>
                    <line x1={x} y1="20" x2={x} y2="62" stroke="var(--warning)" strokeWidth="2" />
                    <polygon points={`${x},62 ${x - 4},54 ${x + 4},54`} fill="var(--warning)" />
                  </g>
                );
              })
            : (
              <g>
                <line x1="200" y1="15" x2="200" y2="62" stroke="var(--warning)" strokeWidth="3" />
                <polygon points="200,62 192,50 208,50" fill="var(--warning)" />
                <text x="200" y="12" textAnchor="middle" fill="var(--text)" fontSize="11">
                  {loadLabel}
                </text>
              </g>
            )}
          {loadType === 'uniform' && (
            <text x="200" y="14" textAnchor="middle" fill="var(--text)" fontSize="11">
              w = {loadLabel}
            </text>
          )}
          <text x="200" y="112" textAnchor="middle" fill="var(--text-muted)" fontSize="11">
            L = {spanLabel}
          </text>
        </svg>
        <div className="caption">Simply supported beam — load diagram</div>
      </div>

      <div className="diagram-wrap">
        <MomentSvg points={results.momentDiagram} maxM={results.M} unit={results.M_unit} />
        <div className="caption">
          Moment diagram · M<sub>max</sub> = {results.M.toFixed(3)} {results.M_unit}
        </div>
      </div>
    </div>
  );
}

function MomentSvg({
  points,
  maxM,
  unit,
}: {
  points: { x: number; M: number }[];
  maxM: number;
  unit: string;
}) {
  const W = 400;
  const H = 140;
  const pad = 30;
  const midY = H / 2;
  const scale = maxM > 0 ? (H / 2 - pad) / maxM : 1;
  const poly = points
    .map((p, i) => {
      const x = pad + p.x * (W - 2 * pad);
      const y = midY - p.M * scale;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
  const close = `L${W - pad},${midY} L${pad},${midY} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Moment diagram in ${unit}`}>
      <line x1={pad} y1={midY} x2={W - pad} y2={midY} stroke="var(--border-strong)" strokeWidth="1" />
      <path d={`${poly} ${close}`} fill="var(--accent-glow)" stroke="var(--accent)" strokeWidth="2" />
      <text x={W / 2} y={pad - 8} textAnchor="middle" fill="var(--accent)" fontSize="11">
        +M ({unit})
      </text>
    </svg>
  );
}
