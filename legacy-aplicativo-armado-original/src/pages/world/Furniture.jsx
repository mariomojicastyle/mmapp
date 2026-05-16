import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

// export default function (props) {
export default function Model ({ id, props}) {

    const group = useRef()
    // const { nodes, materials } = useGLTF('M01536/models/P00.glb')
    const { nodes, materials } = useGLTF(`${id}/models/P00.glb`)


    return (
        <group ref={group} {...props} dispose={null} position-y={0.7}>
            <group name="Scene" >
                <mesh
                    name="Pieza_07-01"
                    castShadow
                    
                    geometry={nodes['Pieza_07-01'].geometry}
                    material={materials.N_Duna_Android}
                    scale={0.001}>
                    <mesh
                        name="Perno_0007374-01-Cantidad(5)"
                        castShadow
                        
                        geometry={nodes['Perno_0007374-01-Cantidad(5)'].geometry}
                        material={materials['Material_1.003']}
                        position={[661.298, -14.4, 276.765]}
                    />
                    <mesh
                        name="Perno_0007374-01_2"
                        castShadow
                        
                        geometry={nodes['Perno_0007374-01_2'].geometry}
                        material={materials['Material_1.003']}
                        position={[243.26, -14.306, -116.699]}
                    />
                    <mesh
                        name="Perno_0007374-01_3"
                        castShadow
                        
                        geometry={nodes['Perno_0007374-01_3'].geometry}
                        material={materials['Material_1.003']}
                        position={[-174.718, -14.387, 276.757]}
                    />
                    <mesh
                        name="Perno_0007374-01_4"
                        castShadow
                        
                        geometry={nodes['Perno_0007374-01_4'].geometry}
                        material={materials['Material_1.003']}
                        position={[-174.712, -14.327, -75.236]}
                    />
                    <mesh
                        name="Perno_0007374-01_5"
                        castShadow
                        
                        geometry={nodes['Perno_0007374-01_5'].geometry}
                        material={materials['Material_1.003']}
                        position={[661.29, -14.295, -75.238]}
                    />
                    <mesh
                        name="Pieza_04-01"
                        castShadow
                        
                        geometry={nodes['Pieza_04-01'].geometry}
                        material={materials.N_Duna_Android}
                        position={[-272.971, -259.057, -145.944]}>
                        <mesh
                            name="Pieza_01-01"
                            castShadow
                            
                            geometry={nodes['Pieza_01-01'].geometry}
                            material={materials.N_Duna_Android}
                            position={[-147.446, -135.688, 182.427]}>
                            <mesh
                                name="Deslizador_007391-01_2-Cantidad(6)"
                                castShadow
                                
                                geometry={nodes['Deslizador_007391-01_2-Cantidad(6)'].geometry}
                                material={materials['Material_1.005']}
                                position={[-1.718, -313.757, -154.451]}
                            />
                            <mesh
                                name="Deslizador_007391-01_6"
                                castShadow
                                
                                geometry={nodes['Deslizador_007391-01_6'].geometry}
                                material={materials['Material_1.005']}
                                position={[-1.733, -313.116, 238.967]}
                            />
                            <mesh
                                name="Tornillo_0000152-01_12"
                                castShadow
                                
                                geometry={nodes['Tornillo_0000152-01_12'].geometry}
                                material={materials['Material_1.005']}
                                position={[7.751, 395.378, -16.022]}
                            />
                            <mesh
                                name="Tornillo_0000152-01_16"
                                castShadow
                                
                                geometry={nodes['Tornillo_0000152-01_16'].geometry}
                                material={materials['Material_1.005']}
                                position={[5.768, -242.617, -112.012]}
                            />
                            <mesh
                                name="Tornillo_0000152-01_4-Cantidad(16)"
                                castShadow
                                
                                geometry={nodes['Tornillo_0000152-01_4-Cantidad(16)'].geometry}
                                material={materials['Material_1.005']}
                                position={[7.534, -180.622, -183.522]}
                            />
                            <mesh
                                name="Tornillo_0000152-01_7"
                                castShadow
                                
                                geometry={nodes['Tornillo_0000152-01_7'].geometry}
                                material={materials['Material_1.005']}
                                position={[5.707, -242.622, 207.987]}
                            />
                            <mesh
                                name="Tornillo_0000152-01_8"
                                castShadow
                                
                                geometry={nodes['Tornillo_0000152-01_8'].geometry}
                                material={materials['Material_1.005']}
                                position={[7.751, 459.378, -183.522]}
                            />
                        </mesh>
                        <mesh
                            name="Pieza_05-01"
                            castShadow
                            
                            geometry={nodes['Pieza_05-01'].geometry}
                            material={materials.N_Duna_Android}
                            position={[519.307, 174.801, 28.259]}>
                            <mesh
                                name="Caja_0007374-01_3"
                                castShadow
                                
                                geometry={nodes['Caja_0007374-01_3'].geometry}
                                material={materials['Material_1.004']}
                                position={[-1.814, 52.03, 2.545]}
                                rotation={[0, 0, -Math.PI]}
                            />
                            <mesh
                                name="Pieza_02-01"
                                castShadow
                                
                                geometry={nodes['Pieza_02-01'].geometry}
                                material={materials.N_Duna_Android}
                                position={[-420.794, -252.162, 168.832]}>
                                <mesh
                                    name="Caja_0007374-01"
                                    castShadow
                                    
                                    geometry={nodes['Caja_0007374-01'].geometry}
                                    material={materials['Material_1.004']}
                                    position={[-2.011, 304.273, 226.176]}
                                    rotation={[-Math.PI, 0, -Math.PI]}
                                    scale={-1}
                                />
                                <mesh
                                    name="Caja_0007374-01_9"
                                    castShadow
                                    
                                    geometry={nodes['Caja_0007374-01_9'].geometry}
                                    material={materials['Material_1.004']}
                                    position={[-2.135, 304.329, -125.721]}
                                    rotation={[-Math.PI, 0, -Math.PI]}
                                    scale={-1}
                                />
                                <mesh
                                    name="Deslizador_007391-01"
                                    castShadow
                                    
                                    geometry={nodes['Deslizador_007391-01'].geometry}
                                    material={materials['Material_1.001']}
                                    position={[0.725, -371.988, -148.95]}
                                />
                                <mesh
                                    name="Deslizador_007391-01_5"
                                    castShadow
                                    
                                    geometry={nodes['Deslizador_007391-01_5'].geometry}
                                    material={materials['Material_1.001']}
                                    position={[0.828, -372.063, 243.307]}
                                />
                                <mesh
                                    name="Pieza_08-01"
                                    castShadow
                                    
                                    geometry={nodes['Pieza_08-01'].geometry}
                                    material={materials.N_Duna_Android}
                                    position={[-98.178, 22.364, 31.926]}>
                                    <mesh
                                        name="Tarugo_20030001-01_10"
                                        castShadow
                                        
                                        geometry={nodes['Tarugo_20030001-01_10'].geometry}
                                        material={materials['Material_1.001']}
                                        position={[-133.691, 0.051, -158.425]}
                                    />
                                    <mesh
                                        name="Tarugo_20030001-01_14"
                                        castShadow
                                        
                                        geometry={nodes['Tarugo_20030001-01_14'].geometry}
                                        material={materials['Material_1.001']}
                                        position={[-133.476, 0.051, 97.54]}
                                    />
                                    <mesh
                                        name="Tarugo_20030001-01_18"
                                        castShadow
                                        
                                        geometry={nodes['Tarugo_20030001-01_18'].geometry}
                                        material={materials['Material_1.001']}
                                        position={[84.518, 0.101, -62.417]}
                                    />
                                    <mesh
                                        name="Tarugo_20030001-01_3-Cantidad(20)"
                                        castShadow
                                        
                                        geometry={nodes['Tarugo_20030001-01_3-Cantidad(20)'].geometry}
                                        material={materials['Material_1.001']}
                                        position={[84.268, 0.095, 97.562]}
                                    />
                                </mesh>
                                <mesh
                                    name="Pieza_09-01"
                                    castShadow
                                    
                                    geometry={nodes['Pieza_09-01'].geometry}
                                    material={materials.N_Duna_Android}
                                    position={[-123.005, -300.586, 33.652]}>
                                    <mesh
                                        name="Pieza_06-01"
                                        castShadow
                                        
                                        geometry={nodes['Pieza_06-01'].geometry}
                                        material={materials.N_Duna_Android}
                                        position={[-1.108, -40.451, 231.448]}>
                                        <mesh
                                            name="Tarugo_20030001-01"
                                            castShadow
                                            
                                            geometry={nodes['Tarugo_20030001-01'].geometry}
                                            material={materials['Material_1.001']}
                                            position={[110.372, 15.933, -0.029]}
                                        />
                                        <mesh
                                            name="Tarugo_20030001-01_11"
                                            castShadow
                                            
                                            geometry={nodes['Tarugo_20030001-01_11'].geometry}
                                            material={materials['Material_1.001']}
                                            position={[-107.995, 15.86, -0.031]}
                                        />
                                        <mesh
                                            name="Tarugo_20030001-01_16"
                                            castShadow
                                            
                                            geometry={nodes['Tarugo_20030001-01_16'].geometry}
                                            material={materials['Material_1.001']}
                                            position={[-107.652, -16.122, -0.016]}
                                        />
                                        <mesh
                                            name="Tarugo_20030001-01_6"
                                            castShadow
                                            
                                            geometry={nodes['Tarugo_20030001-01_6'].geometry}
                                            material={materials['Material_1.001']}
                                            position={[110.493, -16.062, -0.008]}
                                        />
                                    </mesh>
                                    <mesh
                                        name="Tarugo_20030001-01_13"
                                        castShadow
                                        
                                        geometry={nodes['Tarugo_20030001-01_13'].geometry}
                                        material={materials['Material_1.001']}
                                        position={[109.31, 0.044, 63.832]}
                                    />
                                    <mesh
                                        name="Tarugo_20030001-01_19"
                                        castShadow
                                        
                                        geometry={nodes['Tarugo_20030001-01_19'].geometry}
                                        material={materials['Material_1.001']}
                                        position={[-109.176, 0.067, -64.117]}
                                    />
                                    <mesh
                                        name="Tarugo_20030001-01_4"
                                        castShadow
                                        
                                        geometry={nodes['Tarugo_20030001-01_4'].geometry}
                                        material={materials['Material_1.001']}
                                        position={[-109.316, 0.054, 63.826]}
                                    />
                                    <mesh
                                        name="Tarugo_20030001-01_9"
                                        castShadow
                                        
                                        geometry={nodes['Tarugo_20030001-01_9'].geometry}
                                        material={materials['Material_1.001']}
                                        position={[108.988, 0.097, -64.159]}
                                    />
                                </mesh>
                                <mesh
                                    name="Tarugo_20030001|1-01_17"
                                    castShadow
                                    
                                    geometry={nodes['Tarugo_20030001-01_17'].geometry}
                                    material={materials['Material_1.001']}
                                    position={[0.964, -142.566, -183.909]}
                                />
                                <mesh
                                    name="Tarugo_20030001-01_2"
                                    castShadow
                                    
                                    geometry={nodes['Tarugo_20030001-01_2'].geometry}
                                    material={materials['Material_1.001']}
                                    position={[0.921, 17.403, -183.565]}
                                />
                                <mesh
                                    name="Tornillo_0000152-01_10"
                                    castShadow
                                    
                                    geometry={nodes['Tornillo_0000152-01_10'].geometry}
                                    material={materials['Material_1.002']}
                                    position={[10.476, 207.958, -169.192]}
                                />
                                <mesh
                                    name="Tornillo_0000152-01_14"
                                    castShadow
                                    
                                    geometry={nodes['Tornillo_0000152-01_14'].geometry}
                                    material={materials['Material_1.001']}
                                    position={[-8.284, 22.389, -126.577]}
                                />
                                <mesh
                                    name="Tornillo_0000152-01_2"
                                    castShadow
                                    
                                    geometry={nodes['Tornillo_0000152-01_2'].geometry}
                                    material={materials['Material_1.001']}
                                    position={[-6.599, 22.39, 225.415]}
                                />
                                <mesh
                                    name="Tornillo_0000152-01_5"
                                    castShadow
                                    
                                    geometry={nodes['Tornillo_0000152-01_5'].geometry}
                                    material={materials['Material_1.001']}
                                    position={[-6.522, -300.619, -126.584]}
                                />
                                <mesh
                                    name="Tornillo_0000152-01_6"
                                    castShadow
                                    
                                    geometry={nodes['Tornillo_0000152-01_6'].geometry}
                                    material={materials['Material_1.002']}
                                    position={[8.377, 271.904, -169.143]}
                                />
                                <mesh
                                    name="Tornillo_0000152-01_9"
                                    castShadow
                                    
                                    geometry={nodes['Tornillo_0000152-01_9'].geometry}
                                    material={materials['Material_1.001']}
                                    position={[-8.283, -300.611, 193.424]}
                                />
                            </mesh>
                            <mesh
                                name="Pieza_03-01"
                                castShadow
                                
                                geometry={nodes['Pieza_03-01'].geometry}
                                material={materials.N_Duna_Android}
                                position={[416.208, 13.528, 131.288]}>
                                <mesh
                                    name="Caja_0007374-01_5"
                                    castShadow
                                    
                                    geometry={nodes['Caja_0007374-01_5'].geometry}
                                    material={materials['Material_1.004']}
                                    position={[-2.296, 38.642, 262.435]}
                                    rotation={[Math.PI, 0, Math.PI]}
                                    scale={-1}
                                />
                                <mesh
                                    name="Caja_0007374-01_7"
                                    castShadow
                                    
                                    geometry={nodes['Caja_0007374-01_7'].geometry}
                                    material={materials['Material_1.004']}
                                    position={[-2.322, 38.65, -89.521]}
                                    rotation={[Math.PI, 0, Math.PI]}
                                    scale={-1}
                                />
                                <mesh
                                    name="Deslizador_007391-01_3"
                                    castShadow
                                    
                                    geometry={nodes['Deslizador_007391-01_3'].geometry}
                                    material={materials['Material_1.002']}
                                    position={[0.6, -637.766, 286.829]}
                                />
                                <mesh
                                    name="Deslizador_007391-01_4"
                                    castShadow
                                    
                                    geometry={nodes['Deslizador_007391-01_4'].geometry}
                                    material={materials['Material_1.002']}
                                    position={[0.163, -637.766, -115.317]}
                                />
                                <mesh
                                    name="Tornillo_0000152-01"
                                    castShadow
                                    
                                    geometry={nodes['Tornillo_0000152-01'].geometry}
                                    material={materials['Material_1.002']}
                                    position={[-8.529, -58.005, -131.757]}
                                />
                                <mesh
                                    name="Tornillo_0000152-01_13"
                                    castShadow
                                    
                                    geometry={nodes['Tornillo_0000152-01_13'].geometry}
                                    material={materials['Material_1.002']}
                                    position={[-6.76, 6.004, -131.752]}
                                />
                            </mesh>
                            <mesh
                                name="Tarugo_20030001-01_12"
                                castShadow
                                
                                geometry={nodes['Tarugo_20030001-01_12'].geometry}
                                material={materials['Material_1.002']}
                                position={[402.286, -12.749, -0.366]}
                            />
                            <mesh
                                name="Tarugo_20030001-01_8"
                                castShadow
                                
                                geometry={nodes['Tarugo_20030001-01_8'].geometry}
                                material={materials['Material_1.002']}
                                position={[-404.945, -12.737, -0.381]}
                            />
                            <mesh
                                name="Tuerca_0004674-01-Cantidad(2)"
                                castShadow
                                
                                geometry={nodes['Tuerca_0004674-01-Cantidad(2)'].geometry}
                                material={materials['Material_1.002']}
                                position={[-391.922, -44.762, 0.647]}
                            />
                            <mesh
                                name="Tuerca_0004674-01_2"
                                castShadow
                                
                                geometry={nodes['Tuerca_0004674-01_2'].geometry}
                                material={materials['Material_1.002']}
                                position={[388.99, -44.757, 0.638]}
                            />
                        </mesh>
                        <mesh
                            name="Tarugo_20030001-01_20"
                            castShadow
                            
                            geometry={nodes['Tarugo_20030001-01_20'].geometry}
                            material={materials['Material_1.005']}
                            position={[-134.687, 163.733, -1.154]}
                        />
                        <mesh
                            name="Tarugo_20030001-01_5"
                            castShadow
                            
                            geometry={nodes['Tarugo_20030001-01_5'].geometry}
                            material={materials['Material_1.005']}
                            position={[-134.342, -156.331, -1.172]}
                        />
                        <mesh
                            name="Tornillo_0000152-01_11"
                            castShadow
                            
                            geometry={nodes['Tornillo_0000152-01_11'].geometry}
                            material={materials['Material_1.004']}
                            position={[98.2, 259.949, 9.604]}
                        />
                        <mesh
                            name="Tornillo_0000152-01_15"
                            castShadow
                            
                            geometry={nodes['Tornillo_0000152-01_15'].geometry}
                            material={materials['Material_1.004']}
                            position={[98.202, 35.967, 7.708]}
                        />
                        <mesh
                            name="Tornillo_0000152-01_3"
                            castShadow
                            
                            geometry={nodes['Tornillo_0000152-01_3'].geometry}
                            material={materials['Material_1.004']}
                            position={[98.2, -316.051, 9.603]}
                        />
                    </mesh>
                    <mesh
                        name="Tarugo_20030001-01_15"
                        castShadow
                        
                        geometry={nodes['Tarugo_20030001-01_15'].geometry}
                        material={materials['Material_1.003']}
                        position={[-407.351, 0.952, -75.205]}
                    />
                    <mesh
                        name="Tarugo_20030001-01_7"
                        castShadow
                        geometry={nodes['Tarugo_20030001-01_7'].geometry}
                        material={materials['Material_1.003']}
                        position={[-302.698, 0.923, -132.162]}
                    />
                </mesh>
            </group>
        </group>
    )
}

useGLTF.preload('M01536/models/P00.glb')
