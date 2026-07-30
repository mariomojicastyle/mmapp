import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Center } from '@react-three/drei';
import { DynamicModel } from './DynamicModel';

export interface ConfiguratorViewerProps {
  geometryBuffer?: ArrayBuffer | null;
  modelColor?: string;
  width?: string | number;
  height?: string | number;
}

export const ConfiguratorViewer: React.FC<ConfiguratorViewerProps> = ({
  geometryBuffer,
  modelColor = '#0284c7',
  width = '100%',
  height = '500px'
}) => {
  return (
    <div style={{ width, height, borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f1f5f9', position: 'relative' }}>
      <Canvas shadows camera={{ position: [2.5, 2, 2.5], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[-5, -2, -5]} intensity={0.4} />

        <Center top>
          <DynamicModel geometryBuffer={geometryBuffer} color={modelColor} />
        </Center>

        <Grid
          infiniteGrid
          cellSize={0.1}
          cellThickness={0.6}
          cellColor="#cbd5e1"
          sectionSize={1}
          sectionThickness={1.2}
          sectionColor="#94a3b8"
          fadeDistance={10}
        />

        <OrbitControls makeDefault minDistance={1} maxDistance={10} maxPolarAngle={Math.PI / 2 + 0.1} />
      </Canvas>
    </div>
  );
};
