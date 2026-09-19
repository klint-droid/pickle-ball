import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../game/GameEngine';

interface GameCanvasProps {
  engine: GameEngine;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const VIRTUAL_WIDTH = 1280;
    const VIRTUAL_HEIGHT = 720;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = VIRTUAL_WIDTH * dpr;
      canvas.height = VIRTUAL_HEIGHT * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Convert screen coordinates to virtual 1280x720 space
    const getVirtualCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return { x: 240, y: 360 };
      const scaleX = VIRTUAL_WIDTH / rect.width;
      const scaleY = VIRTUAL_HEIGHT / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    // 1. Mouse / Pointer Hover & Click Events
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        const coords = getVirtualCoords(e.clientX, e.clientY);
        engine.input.setMousePosition(coords.x, coords.y);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 0 && e.pointerType === 'mouse') {
        engine.input.setMouseDown(true);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        engine.input.setMouseDown(false);
      }
    };

    // 2. Mobile Touch Event Handlers (Landscape Drag & Tap)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMovedDistance = 0;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchMovedDistance = 0;
        const coords = getVirtualCoords(touch.clientX, touch.clientY);
        engine.input.setMousePosition(coords.x, coords.y);
        engine.input.setMouseDown(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const dist = Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY);
        touchMovedDistance += dist;
        const coords = getVirtualCoords(touch.clientX, touch.clientY);
        engine.input.setMousePosition(coords.x, coords.y);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      // If it was a short tap (< 15px moved), trigger a swing
      if (touchMovedDistance < 15) {
        engine.input.setMouseDown(true);
      }
      setTimeout(() => {
        engine.input.setMouseDown(false);
      }, 50);
    };

    const handleTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
      engine.input.setMouseDown(false);
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    // Non-passive touch listeners prevent mobile pull-to-refresh & gestures
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    // Main Game Loop
    const loop = () => {
      engine.update();
      ctx.save();
      engine.render(ctx);
      ctx.restore();
      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [engine]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'crosshair',
          touchAction: 'none'
        }}
      />
    </div>
  );
};
