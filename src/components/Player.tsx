import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getPlanetHeight } from '../utils/noise';

// Initialize global inputs to avoid undefined errors on desktop
if (typeof window !== 'undefined' && !window.gameInput) {
  window.gameInput = {
    joystick: { x: 0, y: 0, active: false },
    keys: { w: false, a: false, s: false, d: false, space: false },
  };
}

interface PlayerProps {
  seed: number;
  color: string;
  accessory: string;
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
  onQuestUpdate: (questType: string, amount: number) => void;
}

const getIrisColor = (bodyColor: string) => {
  switch (bodyColor.toUpperCase()) {
    case '#FFB7B2': return '#d81b60'; // Pink -> Deep Magenta
    case '#FFDAC1': return '#e65100'; // Peach -> Deep Orange
    case '#E2F0CB': return '#33691e'; // Lime -> Forest Green
    case '#B5EAD7': return '#00838f'; // Mint -> Deep Teal
    case '#C7CEEA': return '#1a237e'; // Lavender -> Indigo Blue
    case '#E8D7F1': return '#4a148c'; // Lilac -> Royal Purple
    case '#FCDDEC': return '#880e4f'; // Blossom -> Crimson Rose
    default: return '#1a237e';
  }
};

// Accessory Models
const FlowerAccessory: React.FC = () => (
  <group position={[0.2, 0.58, 0.24]} rotation={[0.25, 0.1, -0.3]} scale={[0.85, 0.85, 0.85]}>
    {/* Stem */}
    <mesh position={[0, 0.1, 0]} castShadow>
      <cylinderGeometry args={[0.02, 0.02, 0.2, 4]} />
      <meshStandardMaterial color="#81c784" roughness={0.9} />
    </mesh>
    {/* Center */}
    <mesh position={[0, 0.22, 0]} castShadow>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial color="#fff176" roughness={0.5} />
    </mesh>
    {/* Petals */}
    {Array.from({ length: 5 }).map((_, idx) => {
      const angle = (idx * Math.PI * 2) / 5;
      return (
        <mesh 
          key={idx}
          position={[Math.cos(angle) * 0.12, 0.22, Math.sin(angle) * 0.12]}
          rotation={[0, -angle, 0]}
          castShadow
        >
          <sphereGeometry args={[0.06, 6, 6]} scale={[1.5, 0.3, 0.8]} />
          <meshStandardMaterial color="#f8bbd0" roughness={0.6} />
        </mesh>
      );
    })}
  </group>
);

const CrownAccessory: React.FC = () => (
  <group position={[0, 0.7, 0.05]} scale={[0.7, 0.7, 0.7]}>
    <mesh castShadow>
      {/* Crown base */}
      <cylinderGeometry args={[0.22, 0.25, 0.15, 8, 1, true]} />
      <meshStandardMaterial color="#ffd54f" metalness={0.9} roughness={0.1} side={THREE.DoubleSide} />
    </mesh>
    {/* Spikes */}
    {Array.from({ length: 5 }).map((_, idx) => {
      const angle = (idx * Math.PI * 2) / 5;
      const x = Math.cos(angle) * 0.22;
      const z = Math.sin(angle) * 0.22;
      return (
        <group key={idx} position={[x, 0.12, z]} rotation={[0, -angle, 0.3]}>
          <mesh castShadow>
            <coneGeometry args={[0.05, 0.15, 4]} />
            <meshStandardMaterial color="#ffd54f" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#ff4081" metalness={0.5} roughness={0.2} />
          </mesh>
        </group>
      );
    })}
  </group>
);

const HeadphonesAccessory: React.FC<{ color: string }> = ({ color }) => (
  <group position={[0, 0.05, 0.05]} scale={[1.02, 1.02, 1.02]}>
    {/* Arch */}
    <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]} castShadow>
      <torusGeometry args={[0.65, 0.04, 8, 24, Math.PI]} />
      <meshStandardMaterial color="#4a4a5a" roughness={0.7} />
    </mesh>
    {/* Left Earcup */}
    <mesh position={[-0.67, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.18, 0.18, 0.1, 8]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
    <mesh position={[-0.72, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.15, 0.15, 0.06, 8]} />
      <meshStandardMaterial color="#e0e0e0" roughness={0.9} />
    </mesh>
    {/* Right Earcup */}
    <mesh position={[0.67, 0.45, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.18, 0.18, 0.1, 8]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
    <mesh position={[0.72, 0.45, 0]} rotation={[0, 0, -Math.PI / 2]}>
      <cylinderGeometry args={[0.15, 0.15, 0.06, 8]} />
      <meshStandardMaterial color="#e0e0e0" roughness={0.9} />
    </mesh>
  </group>
);

const RibbonAccessory: React.FC = () => (
  <group position={[0, 0.58, 0.48]} rotation={[0.4, 0, 0]} scale={[0.7, 0.7, 0.7]}>
    {/* Center knot */}
    <mesh castShadow>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial color="#ff4081" roughness={0.6} />
    </mesh>
    {/* Left loop */}
    <mesh position={[-0.14, 0.05, 0.05]} rotation={[0, 0.3, -0.4]} castShadow>
      <torusGeometry args={[0.1, 0.05, 6, 12]} />
      <meshStandardMaterial color="#ff80ab" roughness={0.6} />
    </mesh>
    {/* Right loop */}
    <mesh position={[0.14, 0.05, 0.05]} rotation={[0, -0.3, 0.4]} castShadow>
      <torusGeometry args={[0.1, 0.05, 6, 12]} />
      <meshStandardMaterial color="#ff80ab" roughness={0.6} />
    </mesh>
    {/* Left ribbon tail */}
    <mesh position={[-0.1, -0.15, 0]} rotation={[0.2, 0, 0.5]} castShadow>
      <boxGeometry args={[0.05, 0.2, 0.02]} />
      <meshStandardMaterial color="#ff4081" roughness={0.7} />
    </mesh>
    {/* Right ribbon tail */}
    <mesh position={[0.1, -0.15, 0]} rotation={[0.2, 0, -0.5]} castShadow>
      <boxGeometry args={[0.05, 0.2, 0.02]} />
      <meshStandardMaterial color="#ff4081" roughness={0.7} />
    </mesh>
  </group>
);

export const Player: React.FC<PlayerProps> = ({
  seed,
  color,
  accessory,
  playerPositionRef,
  onQuestUpdate,
}) => {
  const containerRef = useRef<THREE.Group>(null);
  const visualGroupRef = useRef<THREE.Group>(null);
  
  // Physics States (stored in refs for smooth 60fps operation)
  const pos = useRef<THREE.Vector3>(new THREE.Vector3(0, 26, 0));
  const vel = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const facingAngle = useRef<number>(0);
  const isOnGround = useRef<boolean>(false);
  const highestSummitSeen = useRef<number>(0);

  const radius = 0.75;
  const baseRadius = 22;
  const maxHeight = 4;
  
  // Set up Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keys if typing in an input field
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      if (!window.gameInput) return;
      const key = e.key.toLowerCase();
      if (key === 'w' || e.key === 'ArrowUp') window.gameInput.keys.w = true;
      if (key === 'a' || e.key === 'ArrowLeft') window.gameInput.keys.a = true;
      if (key === 's' || e.key === 'ArrowDown') window.gameInput.keys.s = true;
      if (key === 'd' || e.key === 'ArrowRight') window.gameInput.keys.d = true;
      if (e.key === ' ' || key === 'spacebar') window.gameInput.keys.space = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Ignore keys if typing in an input field
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      if (!window.gameInput) return;
      const key = e.key.toLowerCase();
      if (key === 'w' || e.key === 'ArrowUp') window.gameInput.keys.w = false;
      if (key === 'a' || e.key === 'ArrowLeft') window.gameInput.keys.a = false;
      if (key === 's' || e.key === 'ArrowDown') window.gameInput.keys.s = false;
      if (key === 'd' || e.key === 'ArrowRight') window.gameInput.keys.d = false;
      if (e.key === ' ' || key === 'spacebar') window.gameInput.keys.space = false;
    };

    // Fullscreen touch controls for mobile playability
    const handleTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('.interactive')) return;
      
      if (e.touches.length > 1) {
        // Multi-touch: jump!
        if (window.gameInput) {
          window.gameInput.keys.space = true;
          // Release space after a short delay so physics integrates it
          setTimeout(() => {
            if (window.gameInput) window.gameInput.keys.space = false;
          }, 120);
        }
        return;
      }
      handleTouchUpdate(e);
    };

    const handleTouchUpdate = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      if ((e.target as HTMLElement).closest('.interactive')) return;

      const touch = e.touches[0];
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 15) {
        if (window.gameInput) {
          window.gameInput.joystick = {
            x: dx / distance,
            y: -dy / distance, // Invert Y so touching top goes forward
            active: true,
          };
        }
      } else {
        if (window.gameInput) {
          window.gameInput.joystick = { x: 0, y: 0, active: false };
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        if (window.gameInput) {
          window.gameInput.joystick = { x: 0, y: 0, active: false };
          window.gameInput.keys.space = false;
        }
      } else {
        handleTouchUpdate(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchUpdate, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchUpdate);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useFrame((state, delta) => {
    // Safety clamp delta to avoid huge physics steps on lag spikes
    const dt = Math.min(delta, 0.1);
    
    if (!containerRef.current || !visualGroupRef.current) return;

    // --- 1. SPHERICAL GRAVITY ---
    // The "up" vector is pointing straight out from the planet center to the player
    const up = pos.current.clone().normalize();
    const gravityForce = up.clone().multiplyScalar(-14); // Gravity acceleration pulling to center
    vel.current.addScaledVector(gravityForce, dt);

    // --- 2. MOVEMENT CONTROLS (RELATIVE TO CAMERA) ---
    // Fetch input values
    let dxInput = 0;
    let dyInput = 0;

    if (window.gameInput) {
      if (window.gameInput.keys.w) dyInput += 1.0;
      if (window.gameInput.keys.s) dyInput -= 1.0;
      if (window.gameInput.keys.d) dxInput += 1.0;
      if (window.gameInput.keys.a) dxInput -= 1.0;

      if (window.gameInput.joystick.active) {
        dxInput = window.gameInput.joystick.x;
        dyInput = window.gameInput.joystick.y;
      }
    }

    const hasInput = Math.abs(dxInput) > 0.05 || Math.abs(dyInput) > 0.05;
    const inputVector = new THREE.Vector3();

    if (hasInput) {
      const camera = state.camera;
      
      // Camera directions in world space
      const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

      // Project camera directions onto player's local tangent plane
      const localForward = camForward.clone().projectOnPlane(up).normalize();
      const localRight = camRight.clone().projectOnPlane(up).normalize();

      // Combine inputs to get tangent movement force
      inputVector.addScaledVector(localForward, dyInput).addScaledVector(localRight, dxInput);
      if (inputVector.lengthSq() > 1) {
        inputVector.normalize();
      }

      // Add movement acceleration
      const runSpeed = 22;
      vel.current.addScaledVector(inputVector, runSpeed * dt);
    }

    // --- 3. JUMP PHYSICS ---
    if (window.gameInput?.keys.space && isOnGround.current) {
      const jumpImpulse = 6.2;
      // Add velocity along the player's upward vector
      vel.current.addScaledVector(up, jumpImpulse);
      isOnGround.current = false;
      
      // Sound synthesis fallback (cute synthetic bloop)
      playBloopSound(440, 0.1);
    }

    // --- 4. FRICTION / DRAG ---
    // Separate velocity into normal (radial) and tangent (spherical surface) components
    const normalVel = vel.current.clone().projectOnVector(up);
    const tangentVel = vel.current.clone().sub(normalVel);

    // Apply friction to the tangent velocity component to stop sliding
    const friction = isOnGround.current ? 0.88 : 0.95;
    tangentVel.multiplyScalar(Math.pow(friction, dt * 60));
    vel.current.copy(normalVel).add(tangentVel);

    // --- 5. INTEGRATE POSITION & COLLIDE WITH TERRAIN ---
    pos.current.addScaledVector(vel.current, dt);

    const rawTerrainHeight = getPlanetHeight(pos.current, seed, baseRadius, maxHeight);
    // Clamp terrain height so player floats on the water surface (radius = 22) instead of sinking below it
    const terrainHeight = Math.max(baseRadius, rawTerrainHeight);
    const minDistance = terrainHeight + radius;
    const currentDistance = pos.current.length();

    if (currentDistance <= minDistance) {
      // Snap to terrain surface using updated direction
      const newUp = pos.current.clone().normalize();
      pos.current.copy(newUp).multiplyScalar(minDistance);
      isOnGround.current = true;
      
      // Stop downward velocity
      const radialVelocity = vel.current.dot(newUp);
      if (radialVelocity < 0) {
        vel.current.addScaledVector(newUp, -radialVelocity);
      }
    } else {
      isOnGround.current = false;
    }

    // Update global reference for camera/quests
    playerPositionRef.current.copy(pos.current);

    // --- 6. ALIGN PLAYER RIG TO SPHERE SURFACE ---
    containerRef.current.position.copy(pos.current);
    
    // Calculate alignment rotation (rotates global Y axis to match local planetary Up normal)
    const alignQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      up
    );
    containerRef.current.quaternion.copy(alignQuaternion);

    // --- 7. ROTATE CHARACTER TO FACE RUNNING DIRECTION ---
    if (hasInput && tangentVel.lengthSq() > 0.01) {
      // Transform world tangent velocity to player's local space to find look direction
      const localTangentVel = tangentVel.clone().applyQuaternion(alignQuaternion.clone().invert());
      const targetAngle = Math.atan2(localTangentVel.x, localTangentVel.z);
      
      // Smoothly interpolate angle (lerp)
      let angleDiff = targetAngle - facingAngle.current;
      // Normalize angle difference to [-PI, PI]
      angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
      facingAngle.current += angleDiff * 0.15;
    }
    
    visualGroupRef.current.rotation.y = facingAngle.current;

    // --- 8. ANIME WALK BOUNCE / SQUASH ANIMATION ---
    const speed = tangentVel.length();
    const time = state.clock.getElapsedTime();
    
    if (isOnGround.current && speed > 0.15) {
      // Bobbing position
      const bounce = Math.abs(Math.sin(time * 12)) * 0.18;
      visualGroupRef.current.position.y = bounce;
      
      // Squash & stretch scale
      const stretch = 1 + Math.sin(time * 12) * 0.08;
      const squash = 1 - Math.sin(time * 12) * 0.08;
      visualGroupRef.current.scale.set(squash, stretch, squash);
    } else {
      // Idle state
      visualGroupRef.current.position.y = 0;
      // Soft breathing scale
      const breath = 1 + Math.sin(time * 2.5) * 0.02;
      visualGroupRef.current.scale.set(1 / Math.sqrt(breath), breath, 1 / Math.sqrt(breath));
    }

    // --- 9. SUMMIT QUEST TRIGGER CHECK ---
    const landOffset = terrainHeight - baseRadius;
    if (landOffset > highestSummitSeen.current) {
      highestSummitSeen.current = landOffset;
    }
    // If player reaches near the maximum peak height (which is ~maxHeight offset), complete quest
    if (landOffset >= maxHeight * 0.88 && isOnGround.current) {
      onQuestUpdate('summit', 1);
    }
  });

  // Sound synthesis utility for cute feedback chimes
  const playBloopSound = (freq: number, duration: number) => {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    
    try {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + duration);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // AudioContext might be blocked until user interactions, which is fine
    }
  };

  return (
    <group ref={containerRef}>
      {/* Visual representation of player aligned to local ground orientation */}
      <group ref={visualGroupRef}>
        {/* Fluffy Body Core (Smooth Shading, soft pastel) */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        
        {/* White Belly Patch (plush details) */}
        <mesh position={[0, -0.42, 0.60]} scale={[0.32, 0.32, 0.08]} castShadow receiveShadow>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>

        {/* Detailed bear ears with cute inner ear geometry */}
        {/* Left Ear */}
        <group position={[-0.32, 0.56, 0.05]} rotation={[0, 0, 0.18]}>
          <mesh castShadow>
            <sphereGeometry args={[0.22, 16, 16]} scale={[1, 1, 0.75]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          {/* Inner Ear */}
          <mesh position={[0, 0, 0.06]} scale={[0.7, 0.7, 0.3]}>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial color="#ffcdd2" roughness={0.8} />
          </mesh>
        </group>
        {/* Right Ear */}
        <group position={[0.32, 0.56, 0.05]} rotation={[0, 0, -0.18]}>
          <mesh castShadow>
            <sphereGeometry args={[0.22, 16, 16]} scale={[1, 1, 0.75]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          {/* Inner Ear */}
          <mesh position={[0, 0, 0.06]} scale={[0.7, 0.7, 0.3]}>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial color="#ffcdd2" roughness={0.8} />
          </mesh>
        </group>

        {/* Fluffy White Tail on the Back */}
        <mesh position={[0, -0.26, -0.62]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>

        {/* Cute Snout (White base with dark nose and cute w-mouth) */}
        <group position={[0, -0.05, 0.74]}>
          <mesh castShadow>
            <sphereGeometry args={[0.14, 12, 12]} scale={[1.3, 0.85, 0.7]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
          {/* Nose */}
          <mesh position={[0, 0.04, 0.12]} castShadow>
            <sphereGeometry args={[0.04, 8, 8]} scale={[1.4, 0.8, 0.8]} />
            <meshStandardMaterial color="#3e2723" roughness={0.5} />
          </mesh>
          {/* Mouth (Cute w-shape) */}
          <group position={[0, -0.03, 0.10]}>
            {/* Left curve */}
            <mesh position={[-0.03, 0, 0]} rotation={[0.1, 0, Math.PI]}>
              <torusGeometry args={[0.03, 0.008, 4, 10, Math.PI]} />
              <meshStandardMaterial color="#3e2723" roughness={0.5} />
            </mesh>
            {/* Right curve */}
            <mesh position={[0.03, 0, 0]} rotation={[0.1, 0, Math.PI]}>
              <torusGeometry args={[0.03, 0.008, 4, 10, Math.PI]} />
              <meshStandardMaterial color="#3e2723" roughness={0.5} />
            </mesh>
          </group>
        </group>

        {/* Stubby Paws/Arms */}
        {/* Left Paw */}
        <mesh position={[-0.45, -0.18, 0.52]} rotation={[0.2, 0, 0.45]} castShadow>
          <sphereGeometry args={[0.12, 10, 10]} scale={[1, 0.8, 1.2]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* Right Paw */}
        <mesh position={[0.45, -0.18, 0.52]} rotation={[0.2, 0, -0.45]} castShadow>
          <sphereGeometry args={[0.12, 10, 10]} scale={[1, 0.8, 1.2]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>

        {/* Stubby Feet */}
        {/* Left Foot */}
        <mesh position={[-0.26, -0.62, 0.22]} rotation={[0, 0.25, 0]} castShadow>
          <sphereGeometry args={[0.16, 12, 12]} scale={[1, 0.65, 1.45]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* Right Foot */}
        <mesh position={[0.26, -0.62, 0.22]} rotation={[0, -0.25, 0]} castShadow>
          <sphereGeometry args={[0.16, 12, 12]} scale={[1, 0.65, 1.45]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>

        {/* Anime Eyes (Multi-layered: eyelash, socket, iris, pupil, dual sparkles) */}
        {/* Left Eye */}
        <group position={[-0.2, 0.12, 0.71]} rotation={[0, -0.25, 0]}>
          {/* Eyelash Arch */}
          <mesh position={[0, 0.11, 0.02]} rotation={[0.1, 0, Math.PI * 0.1]} castShadow>
            <torusGeometry args={[0.085, 0.016, 6, 12, Math.PI * 0.8]} />
            <meshStandardMaterial color="#1a1a24" roughness={0.6} />
          </mesh>
          {/* Eyelash Flick */}
          <mesh position={[-0.08, 0.06, 0.03]} rotation={[0.2, 0.1, -0.6]} castShadow>
            <coneGeometry args={[0.015, 0.07, 4]} />
            <meshStandardMaterial color="#1a1a24" roughness={0.6} />
          </mesh>
          {/* Socket Base */}
          <mesh castShadow>
            <sphereGeometry args={[0.08, 16, 16]} scale={[1, 1.3, 0.5]} />
            <meshStandardMaterial color="#1a1a24" roughness={0.1} />
          </mesh>
          {/* Colored Iris */}
          <mesh position={[0, -0.01, 0.01]} scale={[0.88, 1.15, 0.5]} castShadow>
            <sphereGeometry args={[0.076, 16, 16]} />
            <meshStandardMaterial color={getIrisColor(color)} roughness={0.2} />
          </mesh>
          {/* Pupil Core */}
          <mesh position={[0, -0.01, 0.02]} scale={[0.55, 0.8, 0.5]} castShadow>
            <sphereGeometry args={[0.076, 12, 12]} />
            <meshStandardMaterial color="#111116" roughness={0.1} />
          </mesh>
          {/* Main highlight (top-left) */}
          <mesh position={[-0.02, 0.03, 0.04]}>
            <sphereGeometry args={[0.024, 8, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
          </mesh>
          {/* Sub highlight (bottom-right) */}
          <mesh position={[0.02, -0.04, 0.04]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
          </mesh>
        </group>

        {/* Right Eye */}
        <group position={[0.2, 0.12, 0.71]} rotation={[0, 0.25, 0]}>
          {/* Eyelash Arch (Mirrored scale) */}
          <mesh position={[0, 0.11, 0.02]} rotation={[0.1, 0, Math.PI * 0.1]} scale={[-1, 1, 1]} castShadow>
            <torusGeometry args={[0.085, 0.016, 6, 12, Math.PI * 0.8]} />
            <meshStandardMaterial color="#1a1a24" roughness={0.6} />
          </mesh>
          {/* Eyelash Flick (Mirrored) */}
          <mesh position={[0.08, 0.06, 0.03]} rotation={[0.2, -0.1, 0.6]} castShadow>
            <coneGeometry args={[0.015, 0.07, 4]} />
            <meshStandardMaterial color="#1a1a24" roughness={0.6} />
          </mesh>
          {/* Socket Base */}
          <mesh castShadow>
            <sphereGeometry args={[0.08, 16, 16]} scale={[1, 1.3, 0.5]} />
            <meshStandardMaterial color="#1a1a24" roughness={0.1} />
          </mesh>
          {/* Colored Iris */}
          <mesh position={[0, -0.01, 0.01]} scale={[0.88, 1.15, 0.5]} castShadow>
            <sphereGeometry args={[0.076, 16, 16]} />
            <meshStandardMaterial color={getIrisColor(color)} roughness={0.2} />
          </mesh>
          {/* Pupil Core */}
          <mesh position={[0, -0.01, 0.02]} scale={[0.55, 0.8, 0.5]} castShadow>
            <sphereGeometry args={[0.076, 12, 12]} />
            <meshStandardMaterial color="#111116" roughness={0.1} />
          </mesh>
          {/* Main highlight (top-left, non-mirrored for light consistency) */}
          <mesh position={[-0.02, 0.03, 0.04]}>
            <sphereGeometry args={[0.024, 8, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
          </mesh>
          {/* Sub highlight (bottom-right, non-mirrored) */}
          <mesh position={[0.02, -0.04, 0.04]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
          </mesh>
        </group>

        {/* Blush Cheeks (Pastel Pink) */}
        <mesh position={[-0.34, -0.06, 0.66]} rotation={[0, -0.47, 0]} scale={[1, 0.6, 0.3]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#ff8a80" transparent opacity={0.55} roughness={0.95} />
        </mesh>
        <mesh position={[0.34, -0.06, 0.66]} rotation={[0, 0.47, 0]} scale={[1, 0.6, 0.3]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#ff8a80" transparent opacity={0.55} roughness={0.95} />
        </mesh>

        {/* Dynamic Accessory Attachment */}
        {accessory === 'flower' && <FlowerAccessory />}
        {accessory === 'crown' && <CrownAccessory />}
        {accessory === 'headphones' && <HeadphonesAccessory color={color} />}
        {accessory === 'ribbon' && <RibbonAccessory />}
      </group>
    </group>
  );
};
export default Player;
