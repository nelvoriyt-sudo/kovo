import React from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { ACCENTS, normalizeAppearance } from '../lib/appearance.js';

export default function AppearanceSettings({ settings, onChange }) {
  const current = normalizeAppearance(settings);
  return (
    <section className="panel appearance-settings" aria-labelledby="appearance-title">
      <h2 id="appearance-title">Make Kovo yours</h2>
      <p className="section-copy">Choose how your workspace looks. Your preferences save automatically.</p>
      <fieldset>
        <legend>Color mode</legend>
        <div className="theme-options">
          {[['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'Use device setting', Monitor]].map(([value, label, Icon]) => (
            <label key={value} className={`theme-option theme-preview-${value}`}>
              <input type="radio" name="colorMode" value={value} checked={current.colorMode === value} onChange={() => onChange('colorMode', value)} />
              <span className="theme-preview" aria-hidden="true"><i/><span><b/><b/><b/></span></span>
              <span className="theme-option-label"><Icon size={17}/>{label}<Check className="choice-check" size={16}/></span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Accent color</legend>
        <div className="accent-grid">
          {Object.entries(ACCENTS).map(([value, accent]) => (
            <label className="accent-swatch" key={value}>
              <input type="radio" name="accentTheme" value={value} checked={current.accentTheme === value} onChange={() => onChange('accentTheme', value)} />
              <span className="accent-dot" style={{ background: accent.hex }}/>{accent.label}<Check className="choice-check" size={14}/>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="preference-columns">
        <fieldset><legend>Spacing</legend><div className="segmented">
          {[['comfortable', 'Comfortable'], ['compact', 'Compact']].map(([value, label]) => <label key={value}><input type="radio" name="density" checked={current.density === value} onChange={() => onChange('density', value)}/><span>{label}</span></label>)}
        </div></fieldset>
        <fieldset><legend>Text size</legend><div className="segmented">
          {[['standard', 'Standard'], ['large', 'Larger']].map(([value, label]) => <label key={value}><input type="radio" name="textSize" checked={current.textSize === value} onChange={() => onChange('textSize', value)}/><span>{label}</span></label>)}
        </div></fieldset>
      </div>
    </section>
  );
}
