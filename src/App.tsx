import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { useGameState } from './hooks/useGameState';
import Planet from './components/Planet';
import Player from './components/Player';
import GameCamera from './components/GameCamera';
import QuestManager from './components/QuestManager';
import HUD from './components/HUD';
import { SeededRandom } from './utils/noise';

// Ethereal floating stardust particles
const StardustParticles: React.FC<{ count: number; seed: number; color: string }> = ({ count, seed, color }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const [positions] = React.useMemo(() => {
    const rand = new SeededRandom(seed + 123);
    const pos = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Distribute particles in a shell around the planet
      const theta = rand.next() * Math.PI;
      const phi = rand.next() * Math.PI * 2;
      const dist = rand.range(23, 36); // float above base terrain radius (22)
      
      pos[i * 3] = dist * Math.sin(theta) * Math.cos(phi);
      pos[i * 3 + 1] = dist * Math.cos(theta);
      pos[i * 3 + 2] = dist * Math.sin(theta) * Math.sin(phi);
    }
    return [pos];
  }, [count, seed]);

  useFrame((_, delta: number) => {
    if (pointsRef.current) {
      // Slow background planetary rotation of stardust
      pointsRef.current.rotation.y += delta * 0.012;
      pointsRef.current.rotation.x += delta * 0.006;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.16}
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

export const App: React.FC = () => {
  const gameState = useGameState();
  const {
    planetConfig,
    planetIndex,
    quests,
    color,
    accessory,
    syncCode,
    allQuestsCompleted,
    updateQuestProgress,
    warpNext,
    loadCode,
    selectColor,
    selectAccessory,
    resetGame,
    warping,
    warpMessage,
    customColors,
    colorIndex,
    accessories,
    accessoryIndex,
  } = gameState;

  // Real-time player 3D position reference used by Camera and QuestManager
  const playerPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 26, 0));



  // Celebrate with pastel confetti on completing all quests
  useEffect(() => {
    if (allQuestsCompleted) {
      // Fire confetti bursts
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ffb7b2', '#ffdac1', '#e2f0cb', '#b5ead7', '#c7ceea']
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ffb7b2', '#ffdac1', '#e2f0cb', '#b5ead7', '#c7ceea']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [allQuestsCompleted]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 3D WebGL Canvas Rendering */}
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ fov: 50, near: 0.1, far: 200 }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', outline: 'none' }}
      >
        {/* Sky Background Color matching the planet theme */}
        <color attach="background" args={[planetConfig.theme.skyColor]} />
        
        {/* Soft atmospheric fog */}
        <fog attach="fog" args={[planetConfig.theme.fogColor, 15, 60]} />

        {/* Sky Suns (Binary Star System or Single Star) */}
        {!planetConfig.theme.doubleStars ? (
          <mesh position={[60, 100, 50]}>
            <sphereGeometry args={[7, 16, 16]} />
            <meshBasicMaterial color="#fffbeb" />
          </mesh>
        ) : (
          <>
            {/* Primary warm golden star */}
            <mesh position={[60, 100, 50]}>
              <sphereGeometry args={[6.5, 16, 16]} />
              <meshBasicMaterial color="#ffe082" />
            </mesh>
            {/* Secondary cool cyan star */}
            <mesh position={[-70, 70, -60]}>
              <sphereGeometry args={[4.5, 16, 16]} />
              <meshBasicMaterial color="#80deea" />
            </mesh>
          </>
        )}

        {/* Ethereal Lighting Systems */}
        <ambientLight 
          intensity={0.45} 
          color={planetConfig.theme.skyColor} 
        />
        
        {/* Primary Sun Light */}
        <directionalLight
          position={[12, 28, 12]}
          intensity={1.5}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={70}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-bias={-0.0006}
        />
        
        {/* Secondary Sun Light (Active only in doubleStars systems) */}
        {planetConfig.theme.doubleStars && (
          <directionalLight
            position={[-28, 20, -24]}
            intensity={0.8}
            color="#80deea" // Cyan tint bounce
          />
        )}
        
        {/* Soft bounce light from the bottom sphere */}
        <directionalLight 
          position={[-10, -25, -10]} 
          intensity={0.5} 
          color={planetConfig.theme.accentColor} 
        />

        {/* Ethereal particle clouds */}
        <StardustParticles 
          count={150} 
          seed={planetConfig.seed} 
          color={planetConfig.theme.accentColor} 
        />

        {/* Procedural Planet Mesh */}
        <Planet 
          key={`planet_${planetConfig.seed}`}
          seed={planetConfig.seed} 
          theme={planetConfig.theme} 
        />

        {/* Fluffy Player Character (Ball) */}
        <Player
          key={`player_${planetConfig.seed}`}
          seed={planetConfig.seed}
          theme={planetConfig.theme}
          color={color}
          accessory={accessory}
          playerPositionRef={playerPositionRef}
          onQuestUpdate={updateQuestProgress}
        />

        {/* Quest Manager to handle active objectives and interactions */}
        <QuestManager
          key={`quests_${planetConfig.seed}`}
          seed={planetConfig.seed}
          quests={quests}
          playerPositionRef={playerPositionRef}
          onQuestUpdate={updateQuestProgress}
          waterRadius={planetConfig.theme.waterRadius}
        />

        {/* Orbit Camera follow locked to planetary coordinates */}
        <GameCamera 
          key={`camera_${planetConfig.seed}`}
          playerPositionRef={playerPositionRef} 
        />
      </Canvas>

      {/* 2D Glassmorphic HUD */}
      <HUD
        planetName={planetConfig.name}
        planetIndex={planetIndex}
        quests={quests}
        color={color}
        accessory={accessory}
        customColors={customColors}
        colorIndex={colorIndex}
        accessories={accessories}
        accessoryIndex={accessoryIndex}
        syncCode={syncCode}
        allQuestsCompleted={allQuestsCompleted}
        warpNext={warpNext}
        loadCode={loadCode}
        selectColor={selectColor}
        selectAccessory={selectAccessory}
        resetGame={resetGame}
        playerPositionRef={playerPositionRef}
        seed={planetConfig.seed}
      />



      {/* Warp Transition Screen (Entering Stargate) */}
      {warping && (
        <div className="warp-overlay">
          <div className="warp-spinner" />
          <div className="warp-message">{warpMessage}</div>
        </div>
      )}
    </div>
  );
};

export default App;
