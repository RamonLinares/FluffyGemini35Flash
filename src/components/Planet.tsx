import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PlanetTheme } from '../types';
import { getPlanetHeight, SeededRandom } from '../utils/noise';

interface PlanetProps {
  seed: number;
  theme: PlanetTheme;
}

// Low-poly Anime Tree
const Tree: React.FC<{ position: THREE.Vector3; quaternion: THREE.Quaternion; color: string; scale: number }> = ({
  position,
  quaternion,
  color,
  scale,
}) => {
  const trunkHeight = 1.6 * scale; // Increased to pierce through ground
  const trunkRadius = 0.12 * scale;
  const buryDepth = 0.4 * scale;   // Depth to extend below surface
  
  return (
    <group position={position} quaternion={quaternion}>
      {/* Trunk */}
      <mesh position={[0, (trunkHeight / 2) - buryDepth, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[trunkRadius * 0.7, trunkRadius, trunkHeight, 5]} />
        <meshStandardMaterial color="#bcaaa4" flatShading roughness={0.9} />
      </mesh>
      
      {/* Leaves (fluffy pillowy shapes positioned relative to surface) */}
      <mesh position={[0, 1.2 * scale, 0]} castShadow>
        <dodecahedronGeometry args={[0.7 * scale, 1]} />
        <meshStandardMaterial color={color} flatShading roughness={0.8} />
      </mesh>
      <mesh position={[0.2 * scale, 1.2 * scale + 0.3 * scale, 0.1 * scale]} castShadow>
        <dodecahedronGeometry args={[0.5 * scale, 1]} />
        <meshStandardMaterial color={color} flatShading roughness={0.8} />
      </mesh>
      <mesh position={[-0.2 * scale, 1.2 * scale + 0.2 * scale, -0.15 * scale]} castShadow>
        <dodecahedronGeometry args={[0.45 * scale, 1]} />
        <meshStandardMaterial color={color} flatShading roughness={0.8} />
      </mesh>
    </group>
  );
};

// Glowing Crystal / Gem
const Crystal: React.FC<{ position: THREE.Vector3; quaternion: THREE.Quaternion; color: string; scale: number }> = ({
  position,
  quaternion,
  color,
  scale,
}) => {
  return (
    <mesh position={position} quaternion={quaternion} castShadow>
      <octahedronGeometry args={[0.45 * scale, 0]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={0.2} 
        roughness={0.1} 
        metalness={0.8}
        flatShading
      />
    </mesh>
  );
};

// Floating Sky Island (Rock base + glowing crystal on top, floating in the air)
const FloatingIsland: React.FC<{ position: THREE.Vector3; scale: number; color: string }> = ({
  position,
  scale,
  color,
}) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Rock base */}
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial color="#90a4ae" flatShading roughness={0.9} />
      </mesh>
      {/* Little crystal growing on top */}
      <mesh position={[0, 0.7, 0]} rotation={[0.2, 0.4, 0.1]} castShadow>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.6} 
          roughness={0.1} 
          metalness={0.8}
          flatShading
        />
      </mesh>
    </group>
  );
};

// Ethereal Clouds orbiting the planet
const Clouds: React.FC<{ radius: number; seed: number; color: string }> = ({ radius, seed, color }) => {
  const cloudsRef = useRef<THREE.Group>(null);
  
  const cloudList = useMemo(() => {
    const rand = new SeededRandom(seed + 444);
    const count = 6;
    const items = [];
    
    for (let i = 0; i < count; i++) {
      // Random direction
      const theta = rand.next() * Math.PI;
      const phi = rand.next() * Math.PI * 2;
      const dist = radius + rand.range(4, 7); // Floating height
      
      const pos = new THREE.Vector3(
        dist * Math.sin(theta) * Math.cos(phi),
        dist * Math.cos(theta),
        dist * Math.sin(theta) * Math.sin(phi)
      );
      
      const dir = pos.clone().normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const scaleX = rand.range(1.5, 3.0);
      const scaleY = rand.range(0.8, 1.2);
      const scaleZ = rand.range(1.0, 1.8);
      
      items.push({ pos, quat, scale: new THREE.Vector3(scaleX, scaleY, scaleZ) });
    }
    return items;
  }, [radius, seed]);

  useFrame((_, delta) => {
    if (cloudsRef.current) {
      // Slow orbital rotation
      cloudsRef.current.rotation.y += delta * 0.02;
      cloudsRef.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <group ref={cloudsRef}>
      {cloudList.map((c, i) => (
        <group key={i} position={c.pos} quaternion={c.quat} scale={c.scale}>
          {/* Main cloud body */}
          <mesh>
            <dodecahedronGeometry args={[1.0, 1]} />
            <meshStandardMaterial color={color} transparent opacity={0.75} roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0.5, 0.1, 0.2]} scale={[0.8, 0.8, 0.8]}>
            <dodecahedronGeometry args={[0.8, 1]} />
            <meshStandardMaterial color={color} transparent opacity={0.75} roughness={0.9} flatShading />
          </mesh>
          <mesh position={[-0.5, -0.1, -0.1]} scale={[0.7, 0.7, 0.7]}>
            <dodecahedronGeometry args={[0.7, 1]} />
            <meshStandardMaterial color={color} transparent opacity={0.75} roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const Planet: React.FC<PlanetProps> = ({ seed, theme }) => {
  const baseRadius = 22;
  const maxHeight = 4;

  // 1. Procedural Terrain Geometry Generation
  const terrainGeometry = useMemo(() => {
    const geom = new THREE.IcosahedronGeometry(baseRadius, 5); // 5 levels of subdivision
    const posAttr = geom.getAttribute('position');
    const count = posAttr.count;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const tempPos = new THREE.Vector3();
    const tempCol = new THREE.Color();

    for (let i = 0; i < count; i++) {
      tempPos.fromBufferAttribute(posAttr, i);
      const dir = tempPos.clone().normalize();
      
      // Retrieve ground height at this vertex position
      const height = getPlanetHeight(dir, seed, baseRadius, maxHeight);
      tempPos.copy(dir).multiplyScalar(height);
      
      positions[i * 3] = tempPos.x;
      positions[i * 3 + 1] = tempPos.y;
      positions[i * 3 + 2] = tempPos.z;

      // Color coding by height
      const heightOffset = height - baseRadius; // -maxHeight to maxHeight
      
      if (heightOffset < -0.3) {
        // Deep Ocean Bed
        tempCol.set(theme.waterColor);
        tempCol.lerp(new THREE.Color(theme.landColor), 0.1);
      } else if (heightOffset < 0.15) {
        // Sandy Shore
        tempCol.set('#ffe8d6'); // Warm sand
        tempCol.lerp(new THREE.Color(theme.landColor), 0.35);
      } else if (heightOffset < 1.8) {
        // Grassy land
        tempCol.set(theme.landColor);
      } else if (heightOffset < 2.9) {
        // Rock cliffs
        tempCol.set(theme.rockColor);
      } else {
        // High Snowy/Ethereal Altars
        tempCol.set('#ffffff');
        tempCol.lerp(new THREE.Color(theme.accentColor), 0.15);
      }

      colors[i * 3] = tempCol.r;
      colors[i * 3 + 1] = tempCol.g;
      colors[i * 3 + 2] = tempCol.b;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();
    return geom;
  }, [seed, theme]);

  // 2. Procedural Props Scattering (Seeded Random)
  const propsList = useMemo(() => {
    const rand = new SeededRandom(seed + 99);
    const list = [];
    const minHeightForLand = baseRadius + 0.15; // Only grow props above sea level
    
    // Generate potential positions
    const attempts = 120;
    for (let i = 0; i < attempts; i++) {
      // Pick a random point on unit sphere
      const theta = rand.next() * Math.PI;
      const phi = rand.next() * Math.PI * 2;
      
      const dir = new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi)
      );

      const height = getPlanetHeight(dir, seed, baseRadius, maxHeight);
      
      if (height > minHeightForLand) {
        const position = dir.clone().multiplyScalar(height);
        
        // Quaternion to orient the prop away from the center of the planet
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir
        );
        
        const scale = rand.range(0.7, 1.3);
        
        // Seeded roll to select type (Trees vs Crystals)
        const typeRoll = rand.next();
        if (typeRoll < 0.65) {
          // Tree
          const leafColor = theme.propColors[Math.floor(rand.next() * theme.propColors.length)];
          list.push({
            id: `tree_${i}`,
            type: 'tree',
            position,
            quaternion,
            color: leafColor,
            scale,
          });
        } else if (typeRoll < 0.85) {
          // Crystal
          const crystalColor = theme.accentColor;
          list.push({
            id: `crystal_${i}`,
            type: 'crystal',
            position,
            quaternion,
            color: crystalColor,
            scale: scale * 0.8,
          });
        }
      }
    }
    return list;
  }, [seed, theme]);

  // 3. Generate Floating Sky Islands underneath the planet (Seeded Random)
  const floatingIslands = useMemo(() => {
    const rand = new SeededRandom(seed + 888);
    const count = 6;
    const items = [];
    for (let i = 0; i < count; i++) {
      // Place them in space below the planet center (Y is negative, around -34 to -23)
      const x = rand.range(-16, 16);
      const y = rand.range(-34, -23);
      const z = rand.range(-16, 16);
      const scale = rand.range(0.9, 1.8);
      items.push({
        id: `island_${i}`,
        position: new THREE.Vector3(x, y, z),
        scale,
        color: theme.accentColor,
      });
    }
    return items;
  }, [seed, theme]);

  return (
    <group>
      {/* Procedural Deformed Terrain Mesh */}
      <mesh geometry={terrainGeometry} castShadow receiveShadow>
        <meshStandardMaterial 
          vertexColors 
          roughness={0.8} 
          metalness={0.1} 
          flatShading
        />
      </mesh>

      {/* Water Sphere (Translucent Blue) */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[baseRadius, 32, 32]} />
        <meshStandardMaterial 
          color={theme.waterColor} 
          transparent 
          opacity={0.65} 
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Render Scattered Trees and Crystals */}
      {propsList.map((p) => {
        if (p.type === 'tree') {
          return (
            <Tree 
              key={p.id} 
              position={p.position} 
              quaternion={p.quaternion} 
              color={p.color} 
              scale={p.scale} 
            />
          );
        } else {
          return (
            <Crystal 
              key={p.id} 
              position={p.position} 
              quaternion={p.quaternion} 
              color={p.color} 
              scale={p.scale} 
            />
          );
        }
      })}

      {/* Slow floating clouds */}
      <Clouds radius={baseRadius} seed={seed} color="#ffffff" />

      {/* Floating islands in the sky underneath the planet */}
      {floatingIslands.map((island) => (
        <FloatingIsland
          key={island.id}
          position={island.position}
          scale={island.scale}
          color={island.color}
        />
      ))}
    </group>
  );
};
export default Planet;
