import React from 'react';

export interface DynamicModelProps {
  geometryBuffer?: ArrayBuffer | null;
  color?: string;
}

export const DynamicModel: React.FC<DynamicModelProps> = ({
  color = '#0284c7'
}) => {
  return (
    <mesh castShadow receiveShadow position={[0, 0, 0]}>
      <boxGeometry args={[1.5, 0.8, 0.4]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
    </mesh>
  );
};
