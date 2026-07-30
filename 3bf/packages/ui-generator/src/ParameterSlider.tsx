import React from 'react';

export interface ParameterSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (newValue: number) => void;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  value,
  min = 0,
  max = 3000,
  step = 10,
  unit = 'mm',
  onChange
}) => {
  return (
    <div style={{ marginBottom: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
        <span>{label}</span>
        <span style={{ color: '#0284c7' }}>{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: '#0284c7',
          cursor: 'pointer'
        }}
      />
    </div>
  );
};
