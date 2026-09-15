import { useMemo, useState } from 'react';
import {
  calculateBeam,
  DEFAULT_E,
  SECTION_PRESETS,
  type LoadType,
  type MaterialKind,
} from '../engine/beam';
import { formatNum, type UnitSystem } from '../engine/units';
import { useApp } from '../context/AppContext';
import { PassFailBadge } from '../components/PassFailBadge';
import { BeamDiagrams } from '../components/BeamDiagrams';

export function BeamCalculator() {
  const { settings, activeProject, touchProject } = useApp();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(settings.unitSystem);
  const [loadType, setLoadType] = useState<LoadType>('uniform');
  const [span, setSpan] = useState(unitSystem === 'imperial' ? '20' : '6');
  const [uniformLoad, setUniformLoad] = useState(unitSystem === 'imperial' ? '1' : '10');
  const [pointLoad, setPointLoad] = useState(unitSystem === 'imperial' ? '10' : '50');
  const [material, setMaterial] = useState<MaterialKind>('steel');
  const [E, setE] = useState(String(DEFAULT_E.steel[unitSystem === 'imperial' ? 'imperial' : 'metric']));
  const [I, setI] = useState('200');
  const [S, setS] = useState('50');
  const [sigma, setSigma] = useState(unitSystem === 'imperial' ? '24000' : '160');
  const [deflDiv, setDeflDiv] = useState(String(settings.deflectionLimitDivisor));
  const [presetId, setPresetId] = useState('');
  const [copied, setCopied] = useState(false);

  const presets = SECTION_PRESETS.filter((p) => p.unitSystem === unitSystem);

  const computed = useMemo(() => {
    try {
      const r = calculateBeam({
        unitSystem,
        loadType,
        span: parseFloat(span),
        uniformLoad: parseFloat(uniformLoad),
        pointLoad: parseFloat(pointLoad),
        material,
        E: parseFloat(E),
        I: parseFloat(I),
        S_avail: parseFloat(S),
        sigma: parseFloat(sigma),
        deflectionLimitDivisor: parseFloat(deflDiv),
      });
      return { results: r, error: null as string | null };
    } catch (e) {
      return {
        results: null,
        error: e instanceof Error ? e.message : 'Invalid inputs',
      };
    }
  }, [unitSystem, loadType, span, uniformLoad, pointLoad, material, E, I, S, sigma, deflDiv]);
  const results = computed.results;
  const calcError = computed.error;

  function applyMaterial(m: MaterialKind) {
    setMaterial(m);
    setE(String(DEFAULT_E[m][unitSystem === 'imperial' ? 'imperial' : 'metric']));
  }

  function applyPreset(id: string) {
    setPresetId(id);
    const p = SECTION_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setI(String(p.I));
    setS(String(p.S));
    applyMaterial(p.material);
  }

  function switchUnits(next: UnitSystem) {
    setUnitSystem(next);
    setPresetId('');
    setE(String(DEFAULT_E[material][next === 'imperial' ? 'imperial' : 'metric']));
    if (next === 'imperial') {
      setSpan('20');
      setUniformLoad('1');
      setPointLoad('10');
      setI('200');
      setS('50');
      setSigma('24000');
    } else {
      setSpan('6');
      setUniformLoad('10');
      setPointLoad('50');
      setI('83560000');
      setS('628000');
      setSigma('160');
    }
  }

  function saveToProject() {
    if (!activeProject || !results) return;
    touchProject(activeProject.id, {
      lastBeam: {
        unitSystem,
        loadType,
        span,
        uniformLoad,
        pointLoad,
        material,
        E,
        I,
        S,
        sigma,
        deflDiv,
        results: {
          M: results.M,
          V: results.V,
          delta: results.delta,
          S_req: results.S_req,
          pass: results.pass,
        },
      },
    });
  }

  function printReport() {
    window.print();
  }

  async function copySummary() {
    if (!results) return;
    const text = [
      'SpecCalc — Beam Load Report',
      `System: ${unitSystem}`,
      `Load: ${loadType}`,
      `Span: ${span}`,
      `M = ${results.M.toFixed(4)} ${results.M_unit}`,
      `V = ${results.V.toFixed(4)} ${results.V_unit}`,
      `δ = ${results.delta.toFixed(4)} ${results.delta_unit} (allow ${results.delta_allow.toFixed(4)})`,
      `S_req = ${results.S_req.toFixed(4)} ${results.S_unit} (avail ${S})`,
      `Result: ${results.pass ? 'PASS' : 'FAIL'}`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const spanUnit = unitSystem === 'imperial' ? 'ft' : 'm';
  const loadUnit = unitSystem === 'imperial' ? (loadType === 'uniform' ? 'kip/ft' : 'kip') : loadType === 'uniform' ? 'kN/m' : 'kN';
  const eUnit = unitSystem === 'imperial' ? 'psi' : 'MPa';
  const iUnit = unitSystem === 'imperial' ? 'in⁴' : 'mm⁴';
  const sUnit = unitSystem === 'imperial' ? 'in³' : 'mm³';
  const sigUnit = unitSystem === 'imperial' ? 'psi' : 'MPa';

  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <h1 style={{ margin: 0 }}>Structural Beam Load Calculator</h1>
          <p className="muted" style={{ margin: '0.25rem 0 0' }}>
            Simply supported · uniform or midspan point load · exact spec formulas
          </p>
        </div>
        <PassFailBadge
          pass={results?.pass ?? false}
          stressPass={results?.stressPass ?? false}
          deflectionPass={results?.deflectionPass ?? false}
        />
      </div>

      <section className="card">
        <div className="toolbar no-print">
          <button
            type="button"
            className={`btn ${unitSystem === 'imperial' ? 'btn-primary' : ''}`}
            onClick={() => switchUnits('imperial')}
          >
            Imperial
          </button>
          <button
            type="button"
            className={`btn ${unitSystem === 'metric' ? 'btn-primary' : ''}`}
            onClick={() => switchUnits('metric')}
          >
            Metric
          </button>
          <button type="button" className="btn" onClick={printReport}>
            Print / PDF
          </button>
          <button type="button" className="btn" onClick={copySummary} disabled={!results}>
            {copied ? 'Copied' : 'Copy summary'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={saveToProject}
            disabled={!activeProject || !results}
            title={activeProject ? `Save to ${activeProject.name}` : 'Create/select a project first'}
          >
            Save to project
          </button>
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Load type</label>
            <select value={loadType} onChange={(e) => setLoadType(e.target.value as LoadType)}>
              <option value="uniform">Uniform load w</option>
              <option value="point">Midspan point load P</option>
            </select>
          </div>
          <div className="field">
            <label>Span L ({spanUnit})</label>
            <input value={span} onChange={(e) => setSpan(e.target.value)} inputMode="decimal" />
          </div>
          {loadType === 'uniform' ? (
            <div className="field">
              <label>Uniform load w ({loadUnit})</label>
              <input value={uniformLoad} onChange={(e) => setUniformLoad(e.target.value)} inputMode="decimal" />
            </div>
          ) : (
            <div className="field">
              <label>Point load P ({loadUnit})</label>
              <input value={pointLoad} onChange={(e) => setPointLoad(e.target.value)} inputMode="decimal" />
            </div>
          )}
          <div className="field">
            <label>Material</label>
            <select value={material} onChange={(e) => applyMaterial(e.target.value as MaterialKind)}>
              <option value="steel">Steel</option>
              <option value="wood">Wood</option>
              <option value="concrete">Concrete</option>
            </select>
          </div>
          <div className="field">
            <label>Section preset</label>
            <select value={presetId} onChange={(e) => applyPreset(e.target.value)}>
              <option value="">Custom I &amp; S…</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>E ({eUnit})</label>
            <input value={E} onChange={(e) => setE(e.target.value)} inputMode="decimal" />
          </div>
          <div className="field">
            <label>I ({iUnit})</label>
            <input value={I} onChange={(e) => { setI(e.target.value); setPresetId(''); }} inputMode="decimal" />
          </div>
          <div className="field">
            <label>S<sub>avail</sub> ({sUnit})</label>
            <input value={S} onChange={(e) => { setS(e.target.value); setPresetId(''); }} inputMode="decimal" />
          </div>
          <div className="field">
            <label>Allowable σ ({sigUnit})</label>
            <input value={sigma} onChange={(e) => setSigma(e.target.value)} inputMode="decimal" />
          </div>
          <div className="field">
            <label>Deflection limit L / n</label>
            <input value={deflDiv} onChange={(e) => setDeflDiv(e.target.value)} inputMode="decimal" />
          </div>
        </div>

        {calcError && (
          <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{calcError}</p>
        )}

        {results && (
          <>
            <div className="results-panel">
              <div className="result-tile">
                <div className="label">Max moment M</div>
                <div className="value">
                  {formatNum(results.M, 4)}
                  <span className="unit">{results.M_unit}</span>
                </div>
              </div>
              <div className="result-tile">
                <div className="label">Max shear V</div>
                <div className="value">
                  {formatNum(results.V, 4)}
                  <span className="unit">{results.V_unit}</span>
                </div>
              </div>
              <div className="result-tile">
                <div className="label">Deflection δ</div>
                <div className="value">
                  {formatNum(results.delta, 4)}
                  <span className="unit">{results.delta_unit}</span>
                </div>
              </div>
              <div className="result-tile">
                <div className="label">δ allow (L/{deflDiv})</div>
                <div className="value">
                  {formatNum(results.delta_allow, 4)}
                  <span className="unit">{results.delta_unit}</span>
                </div>
              </div>
              <div className="result-tile">
                <div className="label">S<sub>req</sub> = M/σ</div>
                <div className="value">
                  {formatNum(results.S_req, 4)}
                  <span className="unit">{results.S_unit}</span>
                </div>
              </div>
              <div className="result-tile">
                <div className="label">S<sub>avail</sub></div>
                <div className="value">
                  {formatNum(parseFloat(S), 4)}
                  <span className="unit">{sUnit}</span>
                </div>
              </div>
            </div>

            <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>
              Formulas: {loadType === 'uniform' ? 'M=wL²/8 · V=wL/2 · δ=5wL⁴/(384EI)' : 'M=PL/4 · V=P/2 · δ=PL³/(48EI)'}
              {' · '}Pass if S<sub>avail</sub> ≥ S<sub>req</sub> AND δ ≤ L/{deflDiv}
            </p>

            <BeamDiagrams
              results={results}
              loadType={loadType}
              spanLabel={`${span} ${spanUnit}`}
              loadLabel={`${loadType === 'uniform' ? uniformLoad : pointLoad} ${loadUnit}`}
            />
          </>
        )}
      </section>
    </div>
  );
}
