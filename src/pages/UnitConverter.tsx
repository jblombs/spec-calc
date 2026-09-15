import { useMemo, useState } from 'react';
import { CONVERSIONS, convert, formatNum } from '../engine/units';

export function UnitConverter() {
  const [id, setId] = useState(CONVERSIONS[0].id);
  const [value, setValue] = useState('10');
  const [reverse, setReverse] = useState(false);

  const item = useMemo(() => CONVERSIONS.find((c) => c.id === id) ?? CONVERSIONS[0], [id]);
  const num = parseFloat(value);
  const result = Number.isFinite(num) ? convert(num, item.factor, reverse) : NaN;

  const from = reverse ? item.toLabel : item.fromLabel;
  const to = reverse ? item.fromLabel : item.toLabel;

  const categories = [...new Set(CONVERSIONS.map((c) => c.category))];

  return (
    <div className="stack">
      <div className="section-title">
        <h1 style={{ margin: 0 }}>Unit Converter</h1>
      </div>
      <section className="card">
        <div className="form-grid">
          <div className="field">
            <label>Category / conversion</label>
            <select value={id} onChange={(e) => setId(e.target.value)}>
              {categories.map((cat) => (
                <optgroup key={cat} label={cat}>
                  {CONVERSIONS.filter((c) => c.category === cat).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fromLabel} ↔ {c.toLabel}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Value ({from})</label>
            <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" />
          </div>
        </div>
        <div className="toolbar">
          <button type="button" className="btn" onClick={() => setReverse((r) => !r)}>
            Swap direction
          </button>
        </div>
        <div className="results-panel">
          <div className="result-tile" style={{ gridColumn: '1 / -1' }}>
            <div className="label">
              {formatNum(num)} {from} =
            </div>
            <div className="value">
              {formatNum(result, 6)}
              <span className="unit">{to}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
