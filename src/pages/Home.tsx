import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

const MODULES = [
  {
    to: '/beam',
    title: 'Structural Beam Load',
    desc: 'Simply supported uniform & midspan point load with pass/fail.',
    status: 'ready' as const,
  },
  {
    to: '/materials',
    title: 'Material Quantity',
    desc: 'Concrete, rebar, lumber BF, drywall, paint with waste factors.',
    status: 'ready' as const,
  },
  {
    to: '/units',
    title: 'Unit Converter',
    desc: 'Imperial ↔ metric for common construction units.',
    status: 'ready' as const,
  },
  {
    to: '/coming/stairs',
    title: 'Stair Design',
    desc: 'Rise/run, headroom, stringer layout.',
    status: 'coming' as const,
  },
  {
    to: '/coming/roof',
    title: 'Roof Pitch',
    desc: 'Pitch, rafter length, area factors.',
    status: 'coming' as const,
  },
  {
    to: '/coming/foundations',
    title: 'Foundations',
    desc: 'Footing sizing and soil bearing checks.',
    status: 'coming' as const,
  },
  {
    to: '/coming/hvac',
    title: 'HVAC Manual J',
    desc: 'Load calculation (Manual J).',
    status: 'coming' as const,
  },
  {
    to: '/coming/electrical',
    title: 'Electrical Ampacity',
    desc: 'Wire sizing and ampacity tables.',
    status: 'coming' as const,
  },
  {
    to: '/coming/plumbing',
    title: 'Plumbing Fixture Units',
    desc: 'DFU / WSFU sizing helpers.',
    status: 'coming' as const,
  },
];

export function Home() {
  const { projects, activeProject, addProject, selectProject, removeProject } = useApp();
  const [name, setName] = useState('');

  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p className="muted" style={{ margin: '0.25rem 0 0' }}>
            Professional calculators for architecture & construction trades.
          </p>
        </div>
      </div>

      <section className="card">
        <h2>Modules</h2>
        <div className="grid-modules">
          {MODULES.map((m) =>
            m.status === 'ready' ? (
              <Link key={m.to} to={m.to} className="module-card">
                <span className="badge">Ready</span>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </Link>
            ) : (
              <Link key={m.to} to={m.to} className="module-card coming">
                <span className="badge soon">Coming</span>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </Link>
            ),
          )}
        </div>
      </section>

      <section className="card">
        <h2>Projects</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Saved locally in your browser (localStorage). No account required.
        </p>
        <div className="toolbar no-print">
          <input
            placeholder="New project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '0.5rem 0.65rem',
              minWidth: 200,
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              addProject(name || 'Untitled Project');
              setName('');
            }}
          >
            Create project
          </button>
        </div>
        {activeProject && (
          <p>
            Active: <strong>{activeProject.name}</strong>{' '}
            <span className="muted">
              · updated {new Date(activeProject.updatedAt).toLocaleString()}
            </span>
          </p>
        )}
        {projects.length === 0 ? (
          <p className="muted">No projects yet. Create one to save calc results.</p>
        ) : (
          <ul className="project-list">
            {projects.map((p) => (
              <li key={p.id}>
                <div style={{ flex: 1 }}>
                  <strong>{p.name}</strong>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>
                    {p.lastBeam ? 'Has beam results · ' : ''}
                    {p.lastMaterials ? 'Has materials takeoff · ' : ''}
                    {new Date(p.updatedAt).toLocaleString()}
                  </div>
                </div>
                <button type="button" className="btn" onClick={() => selectProject(p.id)}>
                  {activeProject?.id === p.id ? 'Active' : 'Open'}
                </button>
                <button type="button" className="btn" onClick={() => removeProject(p.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
