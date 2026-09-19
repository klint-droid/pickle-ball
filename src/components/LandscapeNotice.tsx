import React from 'react';
import { Smartphone, Maximize2 } from 'lucide-react';

export const LandscapeNotice: React.FC = () => {
  const handleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        if ('orientation' in screen && 'lock' in screen.orientation) {
          await (screen.orientation as unknown as { lock: (mode: string) => Promise<void> }).lock('landscape').catch(() => {});
        }
      }
    } catch {
      // Fullscreen not permitted or cancelled
    }
  };

  return (
    <div className="rotate-device-prompt">
      <div className="rotate-icon-wrapper">
        <Smartphone size={48} className="rotate-phone-icon" />
      </div>
      <h3>ROTATE TO LANDSCAPE</h3>
      <p>Pickleball 2D is designed for landscape court orientation. Please rotate your phone!</p>

      <button className="btn-fullscreen-rotate" onClick={handleFullscreen}>
        <Maximize2 size={16} />
        <span>ENTER FULLSCREEN</span>
      </button>
    </div>
  );
};
