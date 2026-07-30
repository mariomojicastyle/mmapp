import React from 'react';

export interface ParameterToggleProps {
  label: string;
  value: boolean;
  onChange: (newValue: boolean) => void;
}

export const ParameterToggle: React.FC<ParameterToggleProps> = ({
  label,
  value,
  onChange
}) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          padding: '6px 16px',
          borderRadius: '20px',
          border: 'none',
          backgroundColor: value ? '#0284c7' : '#cbd5e1',
          color: '#ffffff',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease'
        }}
      >
        {value ? 'ON' : 'OFF'}
      </button>
    </div>
  );
};
