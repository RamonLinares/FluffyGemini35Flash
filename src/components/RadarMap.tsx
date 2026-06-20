import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getQuestLocations } from '../utils/noise';
interface RadarMapProps {
  seed: number;
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

export const RadarMap: React.FC<RadarMapProps> = ({ seed, playerPositionRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Re-generate locations when seed changes
  const questLocations = React.useMemo(() => {
    return getQuestLocations(seed);
  }, [seed]);

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radarRadius = canvas.width / 2;
    const center = radarRadius;

    const tick = () => {
      // 1. Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Get real-time player position & camera vectors
      const playerPos = playerPositionRef.current;
      const cameraVecs = (window as any).cameraVectors;
      const progress = (window as any).gameProgress;

      if (!playerPos || playerPos.lengthSq() < 1 || !cameraVecs) {
        // Fallback drawing: just radar background
        drawRadarBackground(ctx, center, radarRadius);
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      const up = cameraVecs.up;
      const cameraForward = cameraVecs.forward;
      const cameraRight = cameraVecs.right;

      // 2. Draw Background
      drawRadarBackground(ctx, center, radarRadius);

      // Helper to project a 3D point onto the 2D radar screen
      const getRadarCoords = (targetPos: THREE.Vector3) => {
        const alpha = playerPos.angleTo(targetPos);
        if (alpha < 0.001) {
          return { x: center, y: center };
        }
        const dir = targetPos.clone().sub(playerPos);
        const tangent = dir.projectOnPlane(up).normalize();

        const xDir = tangent.dot(cameraRight);
        const yDir = tangent.dot(cameraForward);

        // Map angle [0, PI] to pixels [0, radarRadius]
        const distPixels = (alpha / Math.PI) * (radarRadius - 8); // pad from edge
        
        return {
          x: center + xDir * distPixels,
          y: center - yDir * distPixels,
        };
      };

      // 3. Draw Quest Items
      // Beacons
      questLocations.beacons.forEach((beacon) => {
        const active = progress?.activatedBeacons?.[beacon.id];
        const coords = getRadarCoords(beacon.pos);
        
        // Pulse animation for active beacons
        const pulse = active ? Math.abs(Math.sin(Date.now() * 0.005)) * 1.5 + 3.5 : 3.5;
        drawDot(ctx, coords.x, coords.y, active ? '#64ffda' : '#ff8a80', pulse);
      });

      // Flowers (Only if not collected)
      questLocations.flowers.forEach((flower) => {
        const collected = progress?.collectedFlowers?.[flower.id];
        if (collected) return;

        const coords = getRadarCoords(flower.pos);
        drawDot(ctx, coords.x, coords.y, '#ffe082', 3.5);
      });

      // Lost Mini Fluffy (Only if not returned)
      const miniReturned = progress?.miniReturned;
      const miniFollows = progress?.miniFollows;
      if (!miniReturned) {
        if (miniFollows) {
          // If following, it trails right behind player (bottom of radar)
          drawDot(ctx, center, center + 7, '#fff9c4', 3);
        } else {
          const coords = getRadarCoords(questLocations.mini);
          drawDot(ctx, coords.x, coords.y, '#fff59d', 4.5);
        }
      }

      // Home Portal (Highlight it especially if the mini is following!)
      const portalCoords = getRadarCoords(questLocations.homePortal);
      if (miniFollows) {
        // Pulse highly to guide player home
        const portalPulse = Math.abs(Math.sin(Date.now() * 0.007)) * 3 + 4;
        drawRing(ctx, portalCoords.x, portalCoords.y, '#80deea', portalPulse);
      } else {
        drawRing(ctx, portalCoords.x, portalCoords.y, '#b2ebf2', 4);
      }

      // Singing Tree
      const treeCoords = getRadarCoords(questLocations.singingTree);
      drawDot(ctx, treeCoords.x, treeCoords.y, '#ff80ab', 4.5);

      // Summit Altar
      const altarCoords = getRadarCoords(questLocations.summitAltar);
      drawDot(ctx, altarCoords.x, altarCoords.y, '#80deea', 4.5);

      // 4. Draw Player at Center
      drawPlayerMarker(ctx, center);

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [questLocations, playerPositionRef]);

  return (
    <div className="radar-container glass-panel interactive" style={{ pointerEvents: 'auto' }}>
      <canvas ref={canvasRef} width={100} height={100} style={{ display: 'block', borderRadius: '50%' }} />
    </div>
  );
};

// Helper Drawing Functions
function drawRadarBackground(ctx: CanvasRenderingContext2D, center: number, radius: number) {
  // Radar face
  ctx.beginPath();
  ctx.arc(center, center, radius - 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.stroke();

  // Grid lines (Crosshairs)
  ctx.beginPath();
  ctx.moveTo(center, 4);
  ctx.lineTo(center, radius * 2 - 4);
  ctx.moveTo(4, center);
  ctx.lineTo(radius * 2 - 4, center);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.stroke();
  ctx.setLineDash([]); // Reset

  // Range rings (half-distance circle)
  ctx.beginPath();
  ctx.arc(center, center, radius / 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.setLineDash([3, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPlayerMarker(ctx: CanvasRenderingContext2D, center: number) {
  ctx.save();
  ctx.translate(center, center);
  
  // Draw player as a cute pink triangle/arrow pointing straight up (view direction)
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-4.5, 4.5);
  ctx.lineTo(4.5, 4.5);
  ctx.closePath();
  ctx.fillStyle = '#ff80ab';
  ctx.shadowColor = '#ff4081';
  ctx.shadowBlur = 4;
  ctx.fill();
  
  // Outer white border for contrast
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.restore();
}

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 5;
  ctx.fill();

  // Draw white core for better readability
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.restore();
}

function drawRing(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  ctx.stroke();

  // Small inner center dot
  ctx.beginPath();
  ctx.arc(x, y, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.restore();
}

export default RadarMap;
