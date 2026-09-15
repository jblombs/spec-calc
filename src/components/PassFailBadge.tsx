interface Props {
  pass: boolean;
  stressPass: boolean;
  deflectionPass: boolean;
}

export function PassFailBadge({ pass, stressPass, deflectionPass }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
      <span className={`pass-badge ${pass ? 'pass' : 'fail'}`}>
        {pass ? '✓ PASS' : '✗ FAIL'}
      </span>
      <span className="muted" style={{ fontSize: '0.85rem' }}>
        Section: {stressPass ? 'OK' : 'overstressed'} · Deflection:{' '}
        {deflectionPass ? 'OK' : 'exceeds limit'}
      </span>
    </div>
  );
}
