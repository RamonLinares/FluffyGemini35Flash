import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Quest } from '../types';
import { getPlanetHeight, getQuestLocations } from '../utils/noise';

interface QuestManagerProps {
  seed: number;
  quests: Quest[];
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
  onQuestUpdate: (questType: string, amount: number) => void;
}

// Synth Sound Player Helper
const playSynthSound = (type: 'collect' | 'beacon' | 'find' | 'home' | 'music') => {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'collect') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'beacon') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.setValueAtTime(329.63, now + 0.1); // E4
      osc.frequency.setValueAtTime(392.00, now + 0.2); // G4
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.4); // C5
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'find') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.12); // A5
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'home') {
      // Major chord arpeggio
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(392.00, now); // G4
      osc.frequency.setValueAtTime(523.25, now + 0.1); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.3); // G5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.55);
    } else if (type === 'music') {
      // Relaxing high synth chord pulse
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440.00 + Math.random() * 220, now); 
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.start(now);
      osc.stop(now + 1.3);
    }
  } catch (e) {
    // Context blocked is fine
  }
};

export const QuestManager: React.FC<QuestManagerProps> = ({
  seed,
  quests: _quests,
  playerPositionRef,
  onQuestUpdate,
}) => {
  const baseRadius = 22;
  const maxHeight = 4;

  // Active state for quest object collections (reset when seed/planet changes)
  const [collectedFlowers, setCollectedFlowers] = useState<{ [id: string]: boolean }>({});
  const [activatedBeacons, setActivatedBeacons] = useState<{ [id: string]: boolean }>({});
  const [miniFollows, setMiniFollows] = useState<boolean>(false);
  const [miniReturned, setMiniReturned] = useState<boolean>(false);

  // Music Tree timer
  const lastMusicSoundTime = useRef<number>(0);
  const musicTimer = useRef<number>(0);
  const miniPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const miniMeshRef = useRef<THREE.Group>(null);
  const progressRef = useRef({
    collectedFlowers: {} as { [id: string]: boolean },
    activatedBeacons: {} as { [id: string]: boolean },
    miniFollows: false,
    miniReturned: false,
  });
  
  useEffect(() => {
    setCollectedFlowers({});
    setActivatedBeacons({});
    setMiniFollows(false);
    setMiniReturned(false);
    musicTimer.current = 0;
    progressRef.current = {
      collectedFlowers: {},
      activatedBeacons: {},
      miniFollows: false,
      miniReturned: false,
    };
  }, [seed]);

  // --- 1. PROCEDURALLY GENERATE LOCATIONS FOR QUEST ELEMENTS ---
  // --- 1. PROCEDURALLY GENERATE LOCATIONS FOR QUEST ELEMENTS ---
  const locations = useMemo(() => {
    const locs = getQuestLocations(seed, baseRadius, maxHeight);
    miniPosition.current.copy(locs.mini);
    return locs;
  }, [seed]);

  // --- 2. COLLISION & INTERACTION LOOP ---
  useFrame((state, delta) => {
    const playerPos = playerPositionRef.current;
    if (playerPos.lengthSq() < 1) return;

    if (typeof window !== 'undefined') {
      (window as any).gameProgress = progressRef.current;
    }

    // --- Quest 1: Starflower Gathering ---
    locations.flowers.forEach((flower) => {
      if (collectedFlowers[flower.id]) return;
      
      const dist = playerPos.distanceTo(flower.pos);
      if (dist < 1.3) {
        // Collect!
        setCollectedFlowers((prev) => {
          const next = { ...prev, [flower.id]: true };
          progressRef.current.collectedFlowers = next;
          return next;
        });
        onQuestUpdate('collect', 1);
        playSynthSound('collect');
      }
    });

    // --- Quest 2: Ancient Beacons ---
    locations.beacons.forEach((beacon) => {
      if (activatedBeacons[beacon.id]) return;

      const dist = playerPos.distanceTo(beacon.pos);
      if (dist < 1.6) {
        // Activate!
        setActivatedBeacons((prev) => {
          const next = { ...prev, [beacon.id]: true };
          progressRef.current.activatedBeacons = next;
          return next;
        });
        onQuestUpdate('beacon', 1);
        playSynthSound('beacon');
      }
    });

    // --- Quest 3: Lost Mini-Fluffy Follow & Return ---
    if (!miniReturned) {
      if (!miniFollows) {
        // Check if player reaches the mini fluffy
        const distToMini = playerPos.distanceTo(locations.mini);
        if (distToMini < 2.2) {
          setMiniFollows(true);
          progressRef.current.miniFollows = true;
          playSynthSound('find');
        }
      } else {
        // Mini follows player. Trailing follow behind the player on the tangent surface
        const up = playerPos.clone().normalize();
        
        // Find direction from player to mini-fluffy, project it onto tangent plane
        const dirToMini = miniPosition.current.clone().sub(playerPos);
        let tangentDir = dirToMini.projectOnPlane(up).normalize();
        
        // Fallback if they are directly overlapping
        if (tangentDir.lengthSq() < 0.001) {
          tangentDir.set(1, 0, 0).projectOnPlane(up).normalize();
        }
        
        // Target position is 1.4 units behind the player along the surface
        const targetPos = playerPos.clone().addScaledVector(tangentDir, 1.4);
        
        // Lerp mini position
        miniPosition.current.lerp(targetPos, 0.08);
        
        // Match terrain height
        const miniUp = miniPosition.current.clone().normalize();
        const rawMiniH = getPlanetHeight(miniPosition.current, seed, baseRadius, maxHeight);
        const miniH = Math.max(baseRadius, rawMiniH);
        miniPosition.current.copy(miniUp).multiplyScalar(miniH + 0.38); // float at its body radius
        
        if (miniMeshRef.current) {
          miniMeshRef.current.position.copy(miniPosition.current);
          const alignQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), miniUp);
          miniMeshRef.current.quaternion.copy(alignQuat);
          
          // Happy bouncing animation
          const bounce = Math.abs(Math.sin(state.clock.getElapsedTime() * 14)) * 0.15;
          miniMeshRef.current.children[0].position.y = bounce;
        }

        // Check if mini is returned to Home Portal
        const distToPortal = miniPosition.current.distanceTo(locations.homePortal);
        if (distToPortal < 2.0) {
          setMiniFollows(false);
          setMiniReturned(true);
          progressRef.current.miniFollows = false;
          progressRef.current.miniReturned = true;
          onQuestUpdate('find_mini', 1);
          playSynthSound('home');
        }
      }
    }

    // --- Quest 4: Summit Altar ---
    const distToSummit = playerPos.distanceTo(locations.summitAltar);
    if (distToSummit < 2.0) {
      onQuestUpdate('summit', 1);
    }

    // --- Quest 5: Singing Tree ---
    const distToSingingTree = playerPos.distanceTo(locations.singingTree);
    if (distToSingingTree < 3.8) {
      // Increment timer
      musicTimer.current += delta;
      
      // Play a soft bell synth notes every 1.2s while near
      const elapsed = state.clock.getElapsedTime();
      if (elapsed - lastMusicSoundTime.current > 1.1) {
        playSynthSound('music');
        lastMusicSoundTime.current = elapsed;
      }
      
      // We require 5 units of listening time (seconds)
      if (musicTimer.current >= 1.0) {
        onQuestUpdate('singing_tree', 1);
        musicTimer.current = 0; // Tick every second
      }
    }
  });

  return (
    <group>
      {/* 1. Starflowers */}
      {locations.flowers.map((flower) => {
        if (collectedFlowers[flower.id]) return null;
        
        return (
          <group key={flower.id} position={flower.pos} quaternion={flower.quat}>
            {/* Stem (extends deeper and taller) */}
            <mesh position={[0, 0.35, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.9, 4]} />
              <meshStandardMaterial color="#c8e6c9" roughness={0.9} />
            </mesh>
            {/* Spinning Petals (floats higher) */}
            <mesh 
              position={[0, 0.8, 0]}
              onBeforeRender={(_1, _2, _3, _4, _5, group) => {
                if (group) group.rotation.y = Date.now() * 0.003;
              }}
            >
              <dodecahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial 
                color="#ffe082" 
                emissive="#ffe082" 
                emissiveIntensity={0.6} 
                flatShading 
              />
            </mesh>
            {/* Glowing aura halo ring */}
            <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.35, 0.42, 8]} />
              <meshBasicMaterial color="#ffe082" transparent opacity={0.8} side={THREE.DoubleSide} />
            </mesh>
            {/* Ethereal light shaft to prevent getting lost/buried */}
            <mesh position={[0, 4, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 8, 6, 1, true]} />
              <meshBasicMaterial color="#ffe082" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          </group>
        );
      })}

      {/* 2. Ancient Beacons */}
      {locations.beacons.map((b) => {
        const active = activatedBeacons[b.id];
        return (
          <group key={b.id} position={b.pos} quaternion={b.quat}>
            {/* Pillar Stone Base (buried slightly below surface) */}
            <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.35, 0.45, 1.8, 6]} />
              <meshStandardMaterial color="#b0bec5" roughness={0.9} flatShading />
            </mesh>
            {/* Glowing Relic Crystal */}
            <mesh 
              position={[0, 1.7, 0]}
              onBeforeRender={(_1, _2, _3, _4, _5, group) => {
                if (group) {
                  group.rotation.y = Date.now() * (active ? 0.006 : 0.001);
                  group.position.y = 1.7 + Math.sin(Date.now() * 0.003) * 0.08;
                }
              }}
            >
              <octahedronGeometry args={[0.28, 0]} />
              <meshStandardMaterial 
                color={active ? '#a7ffeb' : '#ff8a80'} 
                emissive={active ? '#64ffda' : '#ff5252'} 
                emissiveIntensity={active ? 0.9 : 0.2}
                roughness={0.2}
                flatShading
              />
            </mesh>
            {/* Ethereal light beam (shows active teal or inactive warm red) */}
            <mesh position={[0, 5, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 8, 6, 1, true]} />
              <meshBasicMaterial 
                color={active ? "#64ffda" : "#ff8a80"} 
                transparent 
                opacity={active ? 0.35 : 0.15} 
                side={THREE.DoubleSide} 
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}

      {/* 3. Lost Mini Fluffy */}
      {!miniReturned && (
        <group 
          ref={!miniFollows ? undefined : miniMeshRef} 
          position={!miniFollows ? locations.mini : undefined}
          quaternion={!miniFollows ? locations.miniQuat : undefined}
        >
          {/* Visual Container */}
          <group>
            {/* Body */}
            <mesh castShadow>
              <sphereGeometry args={[0.38, 12, 12]} />
              <meshStandardMaterial color="#fff9c4" roughness={0.95} flatShading />
            </mesh>
            {/* Ethereal rescue guide beam (only when idle/unfound) */}
            {!miniFollows && (
              <mesh position={[0, 4, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 8, 6, 1, true]} />
                <meshBasicMaterial color="#fff9c4" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
            )}
            {/* Tufts */}
            {Array.from({ length: 4 }).map((_, idx) => (
              <mesh key={idx} position={[Math.sin(idx) * 0.2, Math.cos(idx) * 0.2, 0.2]} scale={[0.15, 0.15, 0.15]}>
                <sphereGeometry args={[0.5, 6, 6]} />
                <meshStandardMaterial color="#fff9c4" roughness={0.95} flatShading />
              </mesh>
            ))}
            {/* Happy anime eyes */}
            <mesh position={[-0.1, 0.06, 0.32]}>
              <sphereGeometry args={[0.04, 6, 6]} scale={[1, 1.2, 0.3]} />
              <meshStandardMaterial color="#212121" />
            </mesh>
            <mesh position={[0.1, 0.06, 0.32]}>
              <sphereGeometry args={[0.04, 6, 6]} scale={[1, 1.2, 0.3]} />
              <meshStandardMaterial color="#212121" />
            </mesh>
            {/* Mini bow */}
            <mesh position={[0, 0.38, 0]}>
              <sphereGeometry args={[0.07, 6, 6]} />
              <meshStandardMaterial color="#f06292" />
            </mesh>
          </group>
        </group>
      )}

      {/* 4. Home Portal Ring */}
      <group position={locations.homePortal} quaternion={locations.homePortalQuat}>
        {/* Glow Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[1.2, 1.4, 16]} />
          <meshBasicMaterial color="#b2ebf2" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
        {/* Swirling particle plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0, 1.2, 16]} />
          <meshBasicMaterial color="#e0f7fa" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
        {/* Ethereal portal pillar */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 3, 16, 1, true]} />
          <meshBasicMaterial color="#80deea" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 5. Singing Tree */}
      <group position={locations.singingTree} quaternion={locations.singingTreeQuat}>
        {/* Trunk (buried slightly below surface) */}
        <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.25, 0.45, 3.6, 6]} />
          <meshStandardMaterial color="#8d6e63" roughness={0.9} flatShading />
        </mesh>
        {/* Leaf Crown (Soft Pink/Yellow Heart shapes) */}
        <mesh 
          position={[0, 3.2, 0]} 
          castShadow
          onBeforeRender={(_1, _2, _3, _4, _5, group) => {
            if (group) group.rotation.y = Date.now() * 0.0006;
          }}
        >
          <dodecahedronGeometry args={[1.6, 1]} />
          <meshStandardMaterial color="#f8bbd0" roughness={0.8} flatShading />
        </mesh>
        <mesh position={[0.6, 3.8, 0.4]} scale={[0.7, 0.7, 0.7]} castShadow>
          <dodecahedronGeometry args={[1.4, 1]} />
          <meshStandardMaterial color="#ffe082" roughness={0.8} flatShading />
        </mesh>
        {/* Floating Ethereal Music Notes indicator aura */}
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.5, 2.7, 16]} />
          <meshBasicMaterial color="#f8bbd0" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
        {/* Ethereal pink light beam */}
        <mesh position={[0, 6, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 12, 8, 1, true]} />
          <meshBasicMaterial color="#f8bbd0" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>

      {/* 6. Summit Altar Archway */}
      <group position={locations.summitAltar} quaternion={locations.summitAltarQuat}>
        {/* Stone Arch Left Pillar (buried slightly below surface) */}
        <mesh position={[-0.9, 0.7, 0]} castShadow>
          <boxGeometry args={[0.25, 2.0, 0.25]} />
          <meshStandardMaterial color="#cfd8dc" roughness={0.8} flatShading />
        </mesh>
        {/* Stone Arch Right Pillar (buried slightly below surface) */}
        <mesh position={[0.9, 0.7, 0]} castShadow>
          <boxGeometry args={[0.25, 2.0, 0.25]} />
          <meshStandardMaterial color="#cfd8dc" roughness={0.8} flatShading />
        </mesh>
        {/* Stone Arch Top Beam */}
        <mesh position={[0, 1.7, 0]} castShadow>
          <boxGeometry args={[2.1, 0.25, 0.35]} />
          <meshStandardMaterial color="#cfd8dc" roughness={0.8} flatShading />
        </mesh>
        {/* Meditation Platform Altar (buried slightly below surface) */}
        <mesh position={[0, 0.1, 0]} receiveShadow>
          <boxGeometry args={[1.2, 0.4, 1.2]} />
          <meshStandardMaterial color="#b0bec5" roughness={0.9} flatShading />
        </mesh>
        {/* Glowing altar light relic */}
        <mesh 
          position={[0, 0.3, 0]}
          onBeforeRender={(_1, _2, _3, _4, _5, group) => {
            if (group) group.rotation.y = Date.now() * 0.002;
          }}
        >
          <dodecahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial color="#b2ebf2" emissive="#00bcd4" emissiveIntensity={0.6} flatShading />
        </mesh>
        {/* Ethereal light beam */}
        <mesh position={[0, 5, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 10, 6, 1, true]} />
          <meshBasicMaterial color="#b2ebf2" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
};
export default QuestManager;
