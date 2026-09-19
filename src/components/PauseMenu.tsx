import React from 'react';
import { Play, RotateCcw, Home } from 'lucide-react';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onRestart, onMainMenu }) => {
  return (
    <div className="pause-overlay">
      <div className="pause-modal">
        <h2 className="pause-title">MATCH PAUSED</h2>
        <p className="pause-subtitle">Take a breather or restart the game</p>

        <div className="pause-actions">
          <button className="btn-primary" onClick={onResume}>
            <Play size={20} fill="currentColor" />
            <span>RESUME (ESC)</span>
          </button>

          <button className="btn-secondary" onClick={onRestart}>
            <RotateCcw size={18} />
            <span>RESTART MATCH</span>
          </button>

          <button className="btn-secondary" onClick={onMainMenu}>
            <Home size={18} />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
