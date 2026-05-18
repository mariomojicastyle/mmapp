---
name: react-three-fiber-expert
description: Best practices, hooks, and patterns for React Three Fiber (R3F) and Drei. Use when building 3D web applications, optimizing WebGL performance, or implementing camera controls and scene interactions.
---

# React Three Fiber (R3F) & Drei Best Practices

## 1. Core Concepts
React Three Fiber is a React renderer for Three.js. 
- **Rule of Thumb:** If you can do it in Three.js, you can do it in R3F. `new THREE.Mesh()` becomes `<mesh />`.
- **Properties:** Class properties become props: `mesh.position.set(1, 2, 3)` -> `<mesh position={[1, 2, 3]} />`.

## 2. Drei Utilities
Always prefer `@react-three/drei` helpers over writing manual Three.js logic.
- `<Center>`: Automatically calculates the bounding box of its children and centers them. Extremely useful for aligning imported `.glb` models.
  - `bottom` prop: Aligns the lowest point of the model to `Y = 0`.
- `<OrbitControls>`: Handles camera orbiting, zooming, and panning.
  - `makeDefault` prop: Tells other Drei components (like `TransformControls`) that this is the primary camera controller.
- `<Environment>`: Image-based lighting (IBL). Use `preset="city"` or pass an HDR file.
- `<ContactShadows>` / `<SoftShadows>`: Pre-built shadow solutions that perform better than manual shadow maps.

## 3. Loading Models
Use `useGLTF` from Drei to load models.
```jsx
import { useGLTF, Center } from '@react-three/drei'

export default function FurnitureModel({ url }) {
  const { scene } = useGLTF(url)
  return (
    <Center bottom>
      <primitive object={scene} />
    </Center>
  )
}
```
**Important:** Do NOT mutate `scene.position` directly if using `<Center>`. Let Drei handle the layout.

## 4. Animation and Loops
Do **not** use `setInterval` or React `useEffect` for 60fps animations. Use `useFrame`.
```jsx
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

function SpinningMesh() {
  const meshRef = useRef()
  useFrame((state, delta) => {
    // Delta is time since last frame. Ensures smooth animation regardless of framerate.
    meshRef.current.rotation.y += delta
  })
  return <mesh ref={meshRef}><boxGeometry /></mesh>
}
```

## 5. State Management
R3F works seamlessly with Zustand for global state. Do not pass rapidly changing 3D state (like camera coordinates every frame) through React Context, as it causes massive re-renders. Use Zustand's transient updates (e.g., `useStore.getState()`) inside `useFrame`.

## 6. Performance Optimization
- **Instancing:** If rendering many identical objects, use `<InstancedMesh>` instead of mapping over `<mesh>`.
- **Dispose:** R3F auto-disposes geometries and materials when unmounted.
- **Shadows:** Shadows are expensive. Use `castShadow` and `receiveShadow` only on meshes that truly need them.
- **DPR:** Cap pixel ratio to save GPU: `<Canvas dpr={[1, 2]}>` (default in newer versions).

## 7. Math & Coordinates
- R3F uses a Right-Handed Y-Up coordinate system (X=right, Y=up, Z=towards viewer).
- For angle manipulation, use Math.PI (e.g., `rotation={[-Math.PI / 2, 0, 0]}` to lay a plane flat on the floor).
