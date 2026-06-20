import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GameCameraProps {
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

export const GameCamera: React.FC<GameCameraProps> = ({ playerPositionRef }) => {
  const { camera, gl } = useThree();
  
  // Camera Orbit angles (yaw and pitch in radians)
  const yaw = useRef<number>(0); // Horizontal rotation
  const pitch = useRef<number>(0.25); // Vertical rotation (slightly looking down)
  const distance = useRef<number>(10.0); // Distance from player
  
  // Drag Tracking
  const isDragging = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      // Ignore clicks on UI elements (HUD)
      const target = e.target as HTMLElement;
      if (target.closest('.interactive')) return;
      
      isDragging.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      
      const dx = e.clientX - prevMousePos.current.x;
      const dy = e.clientY - prevMousePos.current.y;
      
      // Update camera angles based on drag delta
      yaw.current += dx * 0.005;
      pitch.current = Math.max(0.05, Math.min(1.3, pitch.current - dy * 0.005));
      
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    // Zoom mouse wheel support
    const handleWheel = (e: WheelEvent) => {
      const zoomSpeed = 0.5;
      distance.current = Math.max(6.0, Math.min(18.0, distance.current + Math.sign(e.deltaY) * zoomSpeed));
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [gl]);

  useFrame(() => {
    const playerPos = playerPositionRef.current;
    
    // Ignore updates if player position is not loaded yet (at origin)
    if (playerPos.lengthSq() < 1) return;

    // --- 1. DEFINE LOCAL COORDINATE FRAME AT PLAYER POSITION ---
    // Planetary normal (Up vector pointing outward from the planet center)
    const up = playerPos.clone().normalize();
    
    // Right vector perpendicular to planet normal (aligned with standard global X initially)
    let right = new THREE.Vector3(1, 0, 0).projectOnPlane(up).normalize();
    if (right.lengthSq() < 0.001) {
      // Fallback if player is at the poles where up is parallel to global X
      right = new THREE.Vector3(0, 0, 1).projectOnPlane(up).normalize();
    }
    
    // Forward vector perpendicular to both Up and Right
    const forward = new THREE.Vector3().crossVectors(up, right).normalize();

    // --- 2. CALCULATE CAMERA POSITION OFFSET IN TANGENT SPACE ---
    // Spherical coordinate offsets relative to the player
    const hAngle = yaw.current;
    const vAngle = pitch.current;
    const dist = distance.current;

    // Offset in local coordinate terms
    const localOffset = new THREE.Vector3(
      Math.sin(hAngle) * Math.cos(vAngle),
      Math.sin(vAngle),
      Math.cos(hAngle) * Math.cos(vAngle)
    ).multiplyScalar(dist);

    // Map the local coordinate offset back to world space
    const worldOffset = new THREE.Vector3()
      .addScaledVector(right, localOffset.x)
      .addScaledVector(up, localOffset.y)
      .addScaledVector(forward, localOffset.z);

    const targetCameraPos = playerPos.clone().add(worldOffset);

    // --- 3. SMOOTH CAMERA INTERPOLATION (LERPING) ---
    // Smoothly transition camera position to target
    camera.position.lerp(targetCameraPos, 0.08);
    
    // Smoothly transition camera up direction to match the planetary up normal
    camera.up.lerp(up, 0.08);
    
    // Look slightly above the player's pivot center (at chest level)
    const targetLookAt = playerPos.clone().addScaledVector(up, 0.45);
    camera.lookAt(targetLookAt);

    // Write camera orientation vectors to window for radar alignment
    if (typeof window !== 'undefined') {
      (window as any).cameraVectors = {
        up,
        forward: new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).projectOnPlane(up).normalize(),
        right: new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).projectOnPlane(up).normalize(),
      };
    }
  });

  return null;
};
export default GameCamera;
