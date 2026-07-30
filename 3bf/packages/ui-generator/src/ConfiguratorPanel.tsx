import React from 'react';
import { GHSchemaDefinition, GHParameterSchema } from '@3bf/gh-parser';
import { ParameterSlider } from './ParameterSlider';
import { ParameterToggle } from './ParameterToggle';

export interface ConfiguratorPanelProps {
  schema: GHSchemaDefinition;
  values: Record<string, any>;
  lang?: 'es' | 'pt' | 'en';
  onChange: (paramName: string, newValue: any) => void;
}

export const ConfiguratorPanel: React.FC<ConfiguratorPanelProps> = ({
  schema,
  values,
  lang = 'es',
  onChange
}) => {
  return (
    <div style={{
      backgroundColor: '#f8fafc',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      maxWidth: '400px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '18px' }}>
        ⚙️ {schema.productName.replace(/_/g, ' ')}
      </h3>

      {schema.inputs.map((param: GHParameterSchema) => {
        const labelText = param.label[lang] || param.label.es || param.cleanName;
        const currentVal = values[param.cleanName] !== undefined ? values[param.cleanName] : param.default;

        if (param.component === 'slider') {
          return (
            <ParameterSlider
              key={param.name}
              label={labelText}
              value={Number(currentVal)}
              min={param.min}
              max={param.max}
              step={param.step}
              unit={param.unit}
              onChange={(val) => onChange(param.cleanName, val)}
            />
          );
        }

        if (param.component === 'toggle') {
          return (
            <ParameterToggle
              key={param.name}
              label={labelText}
              value={Boolean(currentVal)}
              onChange={(val) => onChange(param.cleanName, val)}
            />
          );
        }

        return null;
      })}
    </div>
  );
};
