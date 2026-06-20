import React, { useState, useRef, useEffect } from 'react';

// Extend window object to store real-time inputs
declare global {
  interface Window {
    gameInput: {
      joystick: { x: number; y: number; active: boolean };
      keys: { w: boolean; a: boolean; s: boolean; d: boolean; space: boolean };
    };
  }
}

// Initialize global inputs
if (typeof window !== 'undefined') {
  window.gameInput = {
    joystick: { x: 0, y: 0, active: false },
    keys: { w: false, a: false, s: false, d: false, space: false },
  };
}

export const VirtualJoystick: React.FC = () => {
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsActive(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const touch = e.touches[0];
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = 50; // max displacement in pixels
    
    let moveX = dx;
    let moveY = dy;
    
    if (distance > maxRadius) {
      moveX = (dx / distance) * maxRadius;
      moveY = (dy / distance) * maxRadius;
    }
    
    setTouchPos({ x: moveX, y: moveY });
    
    // Normalize to range [-1, 1]
    if (window.gameInput) {
      window.gameInput.joystick = {
        x: moveX / maxRadius,
        y: -moveY / maxRadius, // Invert Y so up is positive in 3D coordinates
        active: true,
      };
    }
  };

  const handleTouchEnd = () => {
    setIsActive(false);
    setTouchPos({ x: 0, y: 0 });
    if (window.gameInput) {
      window.gameInput.joystick = {
        x: 0,
        y: 0,
        active: false,
      };
    }
  };

  // Prevent default scroll behavior on touch drag within joystick
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const preventScroll = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };

    el.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      el.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  return (
    <div 
      className="joystick-area interactive"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ opacity: isActive ? 0.9 : 0.6 }}
    >
      <div 
        className="joystick-thumb"
        style={{
          transform: `translate(${touchPos.x}px, ${touchPos.y}px)`,
          transition: isActive ? 'none' : 'transform 0.15s ease-out',
        }}
      />
    </div>
  );
};
export default VirtualJoystick;
