import { useMemo, useState } from 'react';
import {
  estimateConcrete,
  estimateDrywall,
  estimateLumber,
  estimatePaint,
  estimateRebar,
  joinTakeoff,
  REBAR_WEIGHTS,
  type ConcreteMode,
} from '../engine/materials';
import { formatNum } from '../engine/units';
import { useApp } from '../context/AppContext';

export function MaterialEstimator() {
  const { activeProject, touchProject } = useApp();
  const [wastePct, setWastePct] = useState('10');
  const waste = (parseFloat(wastePct) || 0) / 100;

  // Concrete
  const [cMode, setCMode] = useState<ConcreteMode>('slab');
  const [cL, setCL] = useState('20');
  const [cW, setCW] = useState('10');
  const [cT, setCT] = useState('0.5');
  const [cCirc, setCCirc] = useState(false);

  // Rebar
  const [rLen, setRLen] = useState('20');
  const [rCount, setRCount] = useState('12');
  const [rSize, setRSize] = useState('#4');

  // Lumber
  const [lT, setLT] = useState('2');
  const [lW, setLW] = useState('4');
  const [lL, setLL] = useState('8');
  const [lCount, setLCount] = useState('20');

  // Drywall
  const [dArea, setDArea] = useState('320');
  const [dSheet, setDSheet] = useState('32');

  // Paint
  const [pArea, setPArea] = useState('700');
  const [pCov, setPCov] = useState('350');
  const [pCoats, setPCoats] = useState('2');

  const [copied, setCopied] = useState(false);

  const concrete = useMemo(
    () =>
      estimateConcrete({
        mode: cMode,
        length: parseFloat(cL) || 0,
        width: parseFloat(cW) || 0,
        thickness: parseFloat(cT) || 0,
        wasteFraction: waste,
        circular: cMode === 'column' && cCirc,
      }),
    [cMode, cL, cW, cT, waste, cCirc],
  );

  const rebar = useMemo(
    () =>
      estimateRebar({
        bars: [
          {
            length_ft: parseFloat(rLen) || 0,
            lb_per_ft: REBAR_WEIGHTS[rSize] ?? 0.668,
            count: parseFloat(rCount) || 0,
          },
        ],
        wasteFraction: waste,
      }),
    [rLen, rCount, rSize, waste],
  );

  const lumber = useMemo(
    () =>
      estimateLumber({
        pieces: [
          {
            thickness_in: parseFloat(lT) || 0,
            width_in: parseFloat(lW) || 0,
            length_ft: parseFloat(lL) || 0,
            count: parseFloat(lCount) || 0,
          },
        ],
        wasteFraction: waste,
      }),
    [lT, lW, lL, lCount, waste],
  );

  const drywall = useMemo(
    () =>
      estimateDrywall({
        area_ft2: parseFloat(dArea) || 0,
        sheetArea_ft2: parseFloat(dSheet) || 32,
        wasteFraction: waste,
      }),
    [dArea, dSheet, waste],
  );

  const paint = useMemo(
    () =>
      estimatePaint({
        area_ft2: parseFloat(pArea) || 0,
        coverage_ft2_per_gal: parseFloat(pCov) || 350,
        coats: parseFloat(pCoats) || 0,
        wasteFraction: waste,
      }),
    [pArea, pCov, pCoats, waste],
  );

  const takeoff = joinTakeoff([
    concrete.lines,
    rebar.lines,
    lumber.lines,
    drywall.lines,
    paint.lines,
  ]);

  async function copyTakeoff() {
    await navigator.clipboard.writeText(takeoff);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function saveToProject() {
    if (!activeProject) return;
    touchProject(activeProject.id, {
      lastMaterials: { wastePct, takeoff, concrete, rebar, lumber, drywall, paint },
    });
  }

  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <h1 style={{ margin: 0 }}>Material Quantity Estimator</h1>
          <p className="muted" style={{ margin: '0.25rem 0 0' }}>
            Concrete · rebar · lumber BF · drywall · paint — with waste factors
          </p>
        </div>
      </div>

      <section className="card">
        <div className="toolbar no-print">
          <div className="field" style={{ minWidth: 120 }}>
            <label>Waste factor (%)</label>
            <input value={wastePct} onChange={(e) => setWastePct(e.target.value)} inputMode="decimal" />
          </div>
          <button type="button" className="btn" onClick={copyTakeoff}>
            {copied ? 'Copied' : 'Copy takeoff'}
          </button>
          <button type="button" className="btn" onClick={() => window.print()}>
            Print / PDF
          </button>
          <button
            type="button"
            className="btn"
            onClick={saveToProject}
            disabled={!activeProject}
          >
            Save to project
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Concrete — V = L×W×T×(1+waste)</h2>
        <div className="form-grid">
          <div className="field">
            <label>Mode</label>
            <select value={cMode} onChange={(e) => setCMode(e.target.value as ConcreteMode)}>
              <option value="slab">Slab</option>
              <option value="footing">Footing</option>
              <option value="column">Column</option>
            </select>
          </div>
          {!(cMode === 'column' && cCirc) && (
            <div className="field">
              <label>Length (ft)</label>
              <input value={cL} onChange={(e) => setCL(e.target.value)} />
            </div>
          )}
          <div className="field">
            <label>{cMode === 'column' && cCirc ? 'Diameter (ft)' : 'Width (ft)'}</label>
            <input value={cW} onChange={(e) => setCW(e.target.value)} />
          </div>
          <div className="field">
            <label>{cMode === 'column' ? 'Height (ft)' : 'Thickness (ft)'}</label>
            <input value={cT} onChange={(e) => setCT(e.target.value)} />
          </div>
          {cMode === 'column' && (
            <div className="field">
              <label>Circular column</label>
              <select value={cCirc ? 'yes' : 'no'} onChange={(e) => setCCirc(e.target.value === 'yes')}>
                <option value="no">No (rect)</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          )}
        </div>
        <div className="results-panel">
          <div className="result-tile">
            <div className="label">Volume</div>
            <div className="value">
              {formatNum(concrete.volume_ft3, 4)}
              <span className="unit">ft³</span>
            </div>
          </div>
          <div className="result-tile">
            <div className="label">Volume</div>
            <div className="value">
              {formatNum(concrete.volume_yd3, 4)}
              <span className="unit">yd³</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Rebar — wt = Σ(len×lb/ft)×(1+waste)</h2>
        <div className="form-grid">
          <div className="field">
            <label>Bar size</label>
            <select value={rSize} onChange={(e) => setRSize(e.target.value)}>
              {Object.entries(REBAR_WEIGHTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {k} ({v} lb/ft)
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Length each (ft)</label>
            <input value={rLen} onChange={(e) => setRLen(e.target.value)} />
          </div>
          <div className="field">
            <label>Count</label>
            <input value={rCount} onChange={(e) => setRCount(e.target.value)} />
          </div>
        </div>
        <div className="results-panel">
          <div className="result-tile">
            <div className="label">Total weight</div>
            <div className="value">
              {formatNum(rebar.weight_lb, 4)}
              <span className="unit">lb</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Lumber — BF = T×W×L/12</h2>
        <div className="form-grid">
          <div className="field">
            <label>Thickness (in)</label>
            <input value={lT} onChange={(e) => setLT(e.target.value)} />
          </div>
          <div className="field">
            <label>Width (in)</label>
            <input value={lW} onChange={(e) => setLW(e.target.value)} />
          </div>
          <div className="field">
            <label>Length (ft)</label>
            <input value={lL} onChange={(e) => setLL(e.target.value)} />
          </div>
          <div className="field">
            <label>Count</label>
            <input value={lCount} onChange={(e) => setLCount(e.target.value)} />
          </div>
        </div>
        <div className="results-panel">
          <div className="result-tile">
            <div className="label">Board-feet</div>
            <div className="value">
              {formatNum(lumber.boardFeet, 4)}
              <span className="unit">BF</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Drywall — area/sheet×(1+waste)</h2>
        <div className="form-grid">
          <div className="field">
            <label>Wall/ceiling area (ft²)</label>
            <input value={dArea} onChange={(e) => setDArea(e.target.value)} />
          </div>
          <div className="field">
            <label>Sheet area (ft²)</label>
            <input value={dSheet} onChange={(e) => setDSheet(e.target.value)} />
          </div>
        </div>
        <div className="results-panel">
          <div className="result-tile">
            <div className="label">Sheets (exact)</div>
            <div className="value">{formatNum(drywall.sheets, 4)}</div>
          </div>
          <div className="result-tile">
            <div className="label">Order (ceil)</div>
            <div className="value">{drywall.sheetsCeil}</div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Paint — area/coverage×coats×(1+waste)</h2>
        <div className="form-grid">
          <div className="field">
            <label>Area (ft²)</label>
            <input value={pArea} onChange={(e) => setPArea(e.target.value)} />
          </div>
          <div className="field">
            <label>Coverage (ft²/gal)</label>
            <input value={pCov} onChange={(e) => setPCov(e.target.value)} />
          </div>
          <div className="field">
            <label>Coats</label>
            <input value={pCoats} onChange={(e) => setPCoats(e.target.value)} />
          </div>
        </div>
        <div className="results-panel">
          <div className="result-tile">
            <div className="label">Gallons</div>
            <div className="value">
              {formatNum(paint.gallons, 4)}
              <span className="unit">gal</span>
            </div>
          </div>
          <div className="result-tile">
            <div className="label">Buy ~</div>
            <div className="value">
              {paint.gallonsCeil}
              <span className="unit">gal</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Takeoff export</h2>
        <pre className="takeoff-box">{takeoff}</pre>
      </section>
    </div>
  );
}
