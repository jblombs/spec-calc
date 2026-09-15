import { Link, useParams } from 'react-router-dom';

const LABELS: Record<string, string> = {
  stairs: 'Stair Design',
  roof: 'Roof Pitch',
  foundations: 'Foundations',
  hvac: 'HVAC Manual J',
  electrical: 'Electrical Ampacity',
  plumbing: 'Plumbing Fixture Units',
};

export function ComingSoon() {
  const { module } = useParams();
  const title = LABELS[module ?? ''] ?? 'Module';

  return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      <span className="badge soon" style={{ display: 'inline-block', marginBottom: '1rem' }}>
        Coming in a future release
      </span>
      <h1 style={{ marginTop: 0 }}>{title}</h1>
      <p className="muted" style={{ maxWidth: 480, margin: '0 auto 1.5rem' }}>
        This module is on the SpecCalc roadmap. No placeholder math is shown — we only
        ship calculators with verified formulas (see Beam and Materials in v1).
      </p>
      <Link to="/" className="btn btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}
