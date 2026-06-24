import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PlanetTheme } from '../types';
import { getPlanetHeight, SeededRandom, getPerlinGenerator } from '../utils/noise';

interface PlanetProps {
  seed: number;
  theme: PlanetTheme;
  maxHeight: number;
}

// Low-poly Anime Tree
const Tree: React.FC<{ position: THREE.Vector3; quaternion: THREE.Quaternion; color: string; scale: number }> = ({
  position,
  quaternion,
  color,
  scale,
}) => {
  const trunkHeight = 1.6 * scale;
  const trunkRadius = 0.12 * scale;
  const buryDepth = 0.4 * scale;
  
  return (
    <group position={position} quaternion={quaternion}>
      <mesh position={[0, (trunkHeight / 2) - buryDepth, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[trunkRadius * 0.7, trunkRadius, trunkHeight, 5]} />
        <meshStandardMaterial color="#bcaaa4" flatShading roughness={0.9} />
      </mesh>
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

// Orbiting Moon Component
const OrbitingMoon: React.FC<{
  distance: number;
  size: number;
  color: string;
  speed: number;
  tilt: number;
  planetType: 'forest' | 'crystal' | 'desert' | 'mechanic' | 'water';
}> = ({
  distance,
  size,
  color,
  speed,
  tilt,
  planetType,
}) => {
  const moonRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((_, delta) => {
    if (moonRef.current) {
      moonRef.current.rotation.y += delta * speed;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });
  
  return (
    <group ref={moonRef} rotation={[tilt, 0, tilt * 0.5]}>
      <group position={[distance, 0, 0]}>
        <mesh ref={meshRef} castShadow receiveShadow>
          {planetType === 'crystal' ? (
            <octahedronGeometry args={[size, 0]} />
          ) : (
            <sphereGeometry args={[size, 12, 12]} />
          )}
          <meshStandardMaterial 
            color={color} 
            roughness={planetType === 'crystal' ? 0.15 : 0.8} 
            metalness={planetType === 'crystal' ? 0.9 : 0.1}
            flatShading 
          />
        </mesh>
        
        {planetType === 'mechanic' && (
          <mesh rotation={[Math.PI / 3.5, 0.2, 0.1]} receiveShadow>
            <ringGeometry args={[size * 1.35, size * 1.9, 16]} />
            <meshStandardMaterial 
              color={color} 
              side={THREE.DoubleSide} 
              transparent 
              opacity={0.8} 
              roughness={0.4}
              metalness={0.8}
            />
          </mesh>
        )}
      </group>
    </group>
  );
};

// Palm Tree for Water worlds
const PalmTree: React.FC<{ position: THREE.Vector3; quaternion: THREE.Quaternion; scale: number }> = ({
  position,
  quaternion,
  scale,
}) => {
  const height = 2.0 * scale;
  return (
    <group position={position} quaternion={quaternion}>
      <mesh position={[0.1 * scale, height * 0.4, 0]} rotation={[0, 0, -0.15]} castShadow>
        <cylinderGeometry args={[0.08 * scale, 0.12 * scale, height, 5]} />
        <meshStandardMaterial color="#8d6e63" flatShading roughness={0.9} />
      </mesh>
      {Array.from({ length: 6 }).map((_, idx) => {
        const angle = (idx * Math.PI * 2) / 6;
        return (
          <mesh 
            key={idx}
            position={[0.2 * scale, height * 0.85, 0]} 
            rotation={[0.3, angle, 0]} 
            scale={[1.2 * scale, 0.1 * scale, 0.4 * scale]}
            castShadow
          >
            <boxGeometry args={[0.8, 1, 1]} />
            <meshStandardMaterial color="#2e7d32" flatShading roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
};

// Cactus for Desert worlds
const Cactus: React.FC<{ position: THREE.Vector3; quaternion: THREE.Quaternion; scale: number }> = ({
  position,
  quaternion,
  scale,
}) => {
  const mainHeight = 1.4 * scale;
  return (
    <group position={position} quaternion={quaternion}>
      <mesh position={[0, mainHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.14 * scale, 0.14 * scale, mainHeight, 6]} />
        <meshStandardMaterial color="#388e3c" flatShading roughness={0.9} />
      </mesh>
      <mesh position={[-0.2 * scale, mainHeight * 0.6, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.8, 1, 0.8]} castShadow>
        <cylinderGeometry args={[0.1 * scale, 0.1 * scale, 0.3 * scale, 5]} />
        <meshStandardMaterial color="#388e3c" flatShading roughness={0.9} />
      </mesh>
      <mesh position={[-0.3 * scale, mainHeight * 0.75, 0]} scale={[0.8, 1, 0.8]} castShadow>
        <cylinderGeometry args={[0.1 * scale, 0.1 * scale, 0.4 * scale, 5]} />
        <meshStandardMaterial color="#388e3c" flatShading roughness={0.9} />
      </mesh>
      <mesh position={[0.2 * scale, mainHeight * 0.45, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[0.8, 1, 0.8]} castShadow>
        <cylinderGeometry args={[0.1 * scale, 0.1 * scale, 0.3 * scale, 5]} />
        <meshStandardMaterial color="#388e3c" flatShading roughness={0.9} />
      </mesh>
      <mesh position={[0.3 * scale, mainHeight * 0.6, 0]} scale={[0.8, 1, 0.8]} castShadow>
        <cylinderGeometry args={[0.1 * scale, 0.1 * scale, 0.4 * scale, 5]} />
        <meshStandardMaterial color="#388e3c" flatShading roughness={0.9} />
      </mesh>
    </group>
  );
};

// Steampunk Gear for Mechanic worlds
const SteampunkGear: React.FC<{ position: THREE.Vector3; quaternion: THREE.Quaternion; scale: number; color: string }> = ({
  position,
  quaternion,
  scale,
  color,
}) => {
  const gearRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (gearRef.current) {
      gearRef.current.rotation.y += delta * 0.8;
    }
  });
  return (
    <group position={position} quaternion={quaternion}>
      <mesh ref={gearRef} rotation={[Math.PI / 2, 0, 0]} scale={[scale * 0.8, scale * 0.8, scale * 0.25]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 1, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.8} flatShading />
      </mesh>
    </group>
  );
};

// Mechanical Antenna for Mechanic worlds
const MechAntenna: React.FC<{ position: THREE.Vector3; quaternion: THREE.Quaternion; scale: number; color: string }> = ({
  position,
  quaternion,
  scale,
  color,
}) => {
  return (
    <group position={position} quaternion={quaternion}>
      <mesh position={[0, 0.8 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.03 * scale, 0.05 * scale, 1.6 * scale, 4]} />
        <meshStandardMaterial color="#78909c" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.65 * scale, 0]} castShadow>
        <sphereGeometry args={[0.15 * scale, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} roughness={0.1} />
      </mesh>
    </group>
  );
};

// Crystal Obelisk for Crystal worlds
const CrystalObelisk: React.FC<{ position: THREE.Vector3; quaternion: THREE.Quaternion; scale: number; color: string }> = ({
  position,
  quaternion,
  scale,
  color,
}) => {
  return (
    <mesh position={position} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[0.02 * scale, 0.25 * scale, 2.2 * scale, 6]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={0.5} 
        roughness={0.05} 
        metalness={0.9}
        flatShading
      />
    </mesh>
  );
};

// Ruined stone pillar for Forest civilizations
const RuinedPillar: React.FC<{ position: THREE.Vector3; quaternion: THREE.Quaternion; scale: number }> = ({
  position,
  quaternion,
  scale,
}) => {
  const height = 1.8 * scale;
  return (
    <group position={position} quaternion={quaternion}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22 * scale, 0.22 * scale, height, 6]} />
        <meshStandardMaterial color="#b0bec5" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, height + 0.08 * scale, 0]} castShadow>
        <boxGeometry args={[0.5 * scale, 0.16 * scale, 0.5 * scale]} />
        <meshStandardMaterial color="#b0bec5" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
};

// Boulders/Rocks for Desert worlds
const DesertRock: React.FC<{ position: THREE.Vector3; quaternion: THREE.Quaternion; scale: number }> = ({
  position,
  quaternion,
  scale,
}) => {
  return (
    <mesh position={position} quaternion={quaternion} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.55 * scale, 1]} />
      <meshStandardMaterial color="#a1887f" flatShading roughness={0.95} />
    </mesh>
  );
};

// Metal Pipes for Mechanic worlds
const MetalPipe: React.FC<{ position: THREE.Vector3; quaternion: THREE.Quaternion; scale: number }> = ({
  position,
  quaternion,
  scale,
}) => {
  return (
    <group position={position} quaternion={quaternion}>
      <mesh position={[0, 0.6 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.08 * scale, 0.08 * scale, 1.2 * scale, 5]} />
        <meshStandardMaterial color="#90a4ae" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.15 * scale, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1 * scale, 0.1 * scale, 0.4 * scale, 5]} />
        <meshStandardMaterial color="#78909c" metalness={0.85} roughness={0.3} />
      </mesh>
    </group>
  );
};

// Seaweed for Water worlds
const Seaweed: React.FC<{ position: THREE.Vector3; quaternion: THREE.Quaternion; scale: number }> = ({
  position,
  quaternion,
  scale,
}) => {
  return (
    <mesh position={position} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[0.02 * scale, 0.06 * scale, 1.5 * scale, 4]} />
      <meshStandardMaterial color="#004d40" flatShading roughness={0.8} />
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
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial color="#90a4ae" flatShading roughness={0.9} />
      </mesh>
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

export const Planet: React.FC<PlanetProps> = ({ seed, theme, maxHeight }) => {
  const baseRadius = 22;
  const waterRef1 = useRef<THREE.Mesh>(null);
  const waterRef2 = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const tide = 1.0 + Math.sin(time * 1.2) * 0.004;

    if (waterRef1.current) {
      waterRef1.current.rotation.y += delta * 0.06;
      waterRef1.current.rotation.x += delta * 0.03;
      waterRef1.current.scale.set(tide, tide, tide);
    }
    if (waterRef2.current) {
      waterRef2.current.rotation.y -= delta * 0.045;
      waterRef2.current.rotation.z += delta * 0.025;
      const innerTide = tide * 0.995;
      waterRef2.current.scale.set(innerTide, innerTide, innerTide);
    }
  });

  // 1. Procedural Terrain Geometry Generation
  const terrainGeometry = useMemo(() => {
    const geom = new THREE.IcosahedronGeometry(baseRadius, 6); // 6 levels of subdivision
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

  // 1.5. Procedural Water/Lava Geometry Generation (Low-poly waves)
  const waterGeometry = useMemo(() => {
    const geom = new THREE.IcosahedronGeometry(theme.waterRadius, 4); // 4 levels of detail is plenty for water (2562 vertices)
    const posAttr = geom.getAttribute('position');
    const count = posAttr.count;
    const positions = new Float32Array(count * 3);
    const tempPos = new THREE.Vector3();
    const perlin = getPerlinGenerator(seed + 888); // Different seed for water noise

    for (let i = 0; i < count; i++) {
      tempPos.fromBufferAttribute(posAttr, i);
      const dir = tempPos.clone().normalize();
      
      // Calculate a gentle wave noise displacement
      const waveNoise = perlin.fbm(dir.x * 2.0, dir.y * 2.0, dir.z * 2.0, 3, 2.0, 0.5);
      const height = theme.waterRadius + waveNoise * 0.18;
      tempPos.copy(dir).multiplyScalar(height);
      
      positions[i * 3] = tempPos.x;
      positions[i * 3 + 1] = tempPos.y;
      positions[i * 3 + 2] = tempPos.z;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    return geom;
  }, [seed, theme.waterRadius]);

  // 2. Procedural Props Scattering (Seeded Random)
  const propsList = useMemo(() => {
    const rand = new SeededRandom(seed + 99);
    const list = [];
    const minHeightForLand = theme.waterRadius + 0.15; // Only grow props above sea level
    
    // Generate potential positions
    const attempts = 180;
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
        
        // Seeded roll to select type based on planetType
        const typeRoll = rand.next();
        const pType = theme.planetType || 'forest';
        
        if (pType === 'mechanic') {
          if (typeRoll < 0.38) {
            list.push({
              id: `gear_${i}`,
              type: 'gear',
              position,
              quaternion,
              color: theme.propColors[Math.floor(rand.next() * theme.propColors.length)],
              scale: scale * 1.1,
            });
          } else if (typeRoll < 0.75) {
            list.push({
              id: `antenna_${i}`,
              type: 'antenna',
              position,
              quaternion,
              color: theme.accentColor,
              scale: scale * 0.9,
            });
          } else if (typeRoll < 0.92) {
            list.push({
              id: `pipe_${i}`,
              type: 'pipe',
              position,
              quaternion,
              color: '#90a4ae',
              scale: scale * 1.0,
            });
          }
        } else if (pType === 'desert') {
          if (typeRoll < 0.45) {
            list.push({
              id: `cactus_${i}`,
              type: 'cactus',
              position,
              quaternion,
              color: '#388e3c',
              scale: scale * 1.0,
            });
          } else if (typeRoll < 0.75) {
            list.push({
              id: `rock_${i}`,
              type: 'rock',
              position,
              quaternion,
              color: '#a1887f',
              scale: scale * 1.2,
            });
          } else if (typeRoll < 0.90) {
            list.push({
              id: `crystal_${i}`,
              type: 'crystal',
              position,
              quaternion,
              color: '#ff5722',
              scale: scale * 0.8,
            });
          }
        } else if (pType === 'water') {
          if (typeRoll < 0.45) {
            list.push({
              id: `palmtree_${i}`,
              type: 'palmtree',
              position,
              quaternion,
              color: '#2e7d32',
              scale: scale * 1.0,
            });
          } else if (typeRoll < 0.80) {
            list.push({
              id: `seaweed_${i}`,
              type: 'seaweed',
              position,
              quaternion,
              color: '#004d40',
              scale: scale * 1.1,
            });
          } else if (typeRoll < 0.92) {
            list.push({
              id: `crystal_${i}`,
              type: 'crystal',
              position,
              quaternion,
              color: '#4db6ac',
              scale: scale * 0.7,
            });
          }
        } else if (pType === 'crystal') {
          if (typeRoll < 0.45) {
            list.push({
              id: `obelisk_${i}`,
              type: 'obelisk',
              position,
              quaternion,
              color: theme.accentColor,
              scale: scale * 1.0,
            });
          } else if (typeRoll < 0.80) {
            list.push({
              id: `crystal_${i}`,
              type: 'crystal',
              position,
              quaternion,
              color: theme.propColors[Math.floor(rand.next() * theme.propColors.length)],
              scale: scale * 0.85,
            });
          } else if (typeRoll < 0.92 && theme.civilization === 'crystal_spires') {
            list.push({
              id: `pillar_${i}`,
              type: 'pillar',
              position,
              quaternion,
              color: '#cfd8dc',
              scale: scale * 0.9,
            });
          }
        } else {
          if (typeRoll < 0.65) {
            list.push({
              id: `tree_${i}`,
              type: 'tree',
              position,
              quaternion,
              color: theme.propColors[Math.floor(rand.next() * theme.propColors.length)],
              scale: scale * 1.0,
            });
          } else if (typeRoll < 0.82) {
            list.push({
              id: `crystal_${i}`,
              type: 'crystal',
              position,
              quaternion,
              color: theme.accentColor,
              scale: scale * 0.8,
            });
          } else if (typeRoll < 0.92 && theme.civilization === 'ruins') {
            list.push({
              id: `pillar_${i}`,
              type: 'pillar',
              position,
              quaternion,
              color: '#b0bec5',
              scale: scale * 0.95,
            });
          }
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
          roughness={theme.roughness ?? 0.8} 
          metalness={theme.metalness ?? 0.1} 
          flatShading
        />
      </mesh>

      {/* Cybernetic Wireframe Grid (Mechanic planets only) */}
      {theme.planetType === 'mechanic' && (
        <mesh geometry={terrainGeometry} scale={[1.002, 1.002, 1.002]}>
          <meshBasicMaterial 
            color={theme.accentColor} 
            wireframe 
            transparent 
            opacity={0.4} 
          />
        </mesh>
      )}

      {/* Water / Lava Sphere Layer 1 */}
      <mesh ref={waterRef1} geometry={waterGeometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color={theme.planetType === 'desert' ? '#ff3d00' : theme.waterColor} 
          emissive={theme.planetType === 'desert' ? '#ff1a00' : theme.waterColor}
          emissiveIntensity={theme.planetType === 'desert' ? 0.65 : 0.15}
          transparent 
          opacity={theme.planetType === 'desert' ? 0.75 : 0.55} 
          roughness={theme.planetType === 'desert' ? 0.8 : 0.15}
          metalness={theme.planetType === 'desert' ? 0.1 : 0.8} // shiny water reflections
          flatShading
        />
      </mesh>

      {/* Water / Lava Sphere Layer 2 (Inner rotating layer for moiré waves) */}
      <mesh ref={waterRef2} geometry={waterGeometry} receiveShadow>
        <meshStandardMaterial 
          color={theme.planetType === 'desert' ? '#e65100' : theme.accentColor} // Use accent color for rich color blending
          emissive={theme.planetType === 'desert' ? '#ff3d00' : theme.accentColor}
          emissiveIntensity={theme.planetType === 'desert' ? 0.4 : 0.1}
          transparent 
          opacity={theme.planetType === 'desert' ? 0.6 : 0.4} 
          roughness={theme.planetType === 'desert' ? 0.9 : 0.25}
          metalness={theme.planetType === 'desert' ? 0.1 : 0.6}
          flatShading
        />
      </mesh>

      {/* Orbital Rings (Tilted) */}
      {theme.hasRings && (
        <mesh rotation={[Math.PI / 3.5, 0, Math.PI / 6]} castShadow receiveShadow>
          <ringGeometry args={[baseRadius * 1.45, baseRadius * 2.1, 64]} />
          <meshStandardMaterial 
            color={theme.ringColor || '#ffffff'} 
            transparent 
            opacity={0.55} 
            side={THREE.DoubleSide} 
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* Orbiting Moons */}
      {theme.moonsCount > 0 && Array.from({ length: theme.moonsCount }).map((_, idx) => {
        const distance = baseRadius * 1.7 + idx * 4.5;
        const size = 0.8 + (idx * 0.5) + (Math.sin(idx * 99) * 0.2);
        const color = theme.moonColors[idx] || theme.accentColor;
        const speed = 0.08 + (0.05 / (idx + 1)) * (idx % 2 === 0 ? 1 : -1);
        const tilt = 0.2 + idx * 0.25;
        
        return (
          <OrbitingMoon
            key={idx}
            distance={distance}
            size={size}
            color={color}
            speed={speed}
            tilt={tilt}
            planetType={theme.planetType}
          />
        );
      })}

      {/* Render Scattered Props based on type */}
      {propsList.map((p) => {
        switch (p.type) {
          case 'tree':
            return <Tree key={p.id} position={p.position} quaternion={p.quaternion} color={p.color} scale={p.scale} />;
          case 'crystal':
            return <Crystal key={p.id} position={p.position} quaternion={p.quaternion} color={p.color} scale={p.scale} />;
          case 'palmtree':
            return <PalmTree key={p.id} position={p.position} quaternion={p.quaternion} scale={p.scale} />;
          case 'cactus':
            return <Cactus key={p.id} position={p.position} quaternion={p.quaternion} scale={p.scale} />;
          case 'gear':
            return <SteampunkGear key={p.id} position={p.position} quaternion={p.quaternion} scale={p.scale} color={p.color} />;
          case 'antenna':
            return <MechAntenna key={p.id} position={p.position} quaternion={p.quaternion} scale={p.scale} color={p.color} />;
          case 'obelisk':
            return <CrystalObelisk key={p.id} position={p.position} quaternion={p.quaternion} scale={p.scale} color={p.color} />;
          case 'pillar':
            return <RuinedPillar key={p.id} position={p.position} quaternion={p.quaternion} scale={p.scale} />;
          case 'rock':
            return <DesertRock key={p.id} position={p.position} quaternion={p.quaternion} scale={p.scale} />;
          case 'pipe':
            return <MetalPipe key={p.id} position={p.position} quaternion={p.quaternion} scale={p.scale} />;
          case 'seaweed':
            return <Seaweed key={p.id} position={p.position} quaternion={p.quaternion} scale={p.scale} />;
          default:
            return null;
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
