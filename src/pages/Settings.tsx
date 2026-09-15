import { useApp } from '../context/AppContext';

export function Settings() {
  const {
    settings,
    setTheme,
    setUnitSystem,
    setDeflectionLimitDivisor,
  } = useApp();

  return (
    <div className="stack">
      <div className="section-title">
        <h1 style={{ margin: 0 }}>Settings</h1>
      </div>
      <section className="card">
        <div className="form-grid">
          <div className="field">
            <label>Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
            >
              <option value="dark">Dark (blueprint)</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="field">
            <label>Default unit system</label>
            <select
              value={settings.unitSystem}
              onChange={(e) => setUnitSystem(e.target.value as 'imperial' | 'metric')}
            >
              <option value="imperial">Imperial (ft, kip, psi)</option>
              <option value="metric">Metric (m, kN, MPa)</option>
            </select>
          </div>
          <div className="field">
            <label>Default deflection limit (L / n)</label>
            <input
              type="number"
              min={1}
              step={1}
              value={settings.deflectionLimitDivisor}
              onChange={(e) => setDeflectionLimitDivisor(Number(e.target.value) || 360)}
            />
          </div>
        </div>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Settings and projects are stored locally in this browser. SpecCalc v1 has no
          backend or user accounts.
        </p>
      </section>
    </div>
  );
}
