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

    // Mouse Hover & Pointer Events
    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const scaleX = VIRTUAL_WIDTH / rect.width;
      const scaleY = VIRTUAL_HEIGHT / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;
      engine.input.setMousePosition(mouseX, mouseY);
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 0) {
        engine.input.setMouseDown(true);
      }
    };

    const handlePointerUp = () => {
      engine.input.setMouseDown(false);
    };

    const handlePointerLeave = () => {
      engine.input.setMouseDown(false);
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);

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
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [engine]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
      />
    </div>
  );
};
