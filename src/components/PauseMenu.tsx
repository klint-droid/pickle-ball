import React from 'react';
import type { DifficultyLevel } from '../types/game';
import { Play, RotateCcw, Home } from 'lucide-react';

interface PauseMenuProps {
  difficulty?: DifficultyLevel;
  onSetDifficulty?: (difficulty: DifficultyLevel) => void;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  difficulty,
  onSetDifficulty,
  onResume,
  onRestart,
  onMainMenu
}) => {
  return (
    <div className="pause-overlay">
      <div className="pause-modal">
        <h2 className="pause-title">MATCH PAUSED</h2>
        <p className="pause-subtitle">Take a breather, adjust difficulty, or restart the match</p>

        {onSetDifficulty && difficulty && (
          <div className="pause-difficulty-box">
            <span className="selector-label">Difficulty:</span>
            <div className="difficulty-toggle-group">
              <button
                className={`diff-btn ${difficulty === 'easy' ? 'active' : ''}`}
                onClick={() => onSetDifficulty('easy')}
                type="button"
              >
                <span className="diff-name">EASY</span>
                <span className="diff-sub">High AI Errors</span>
              </button>
              <button
                className={`diff-btn ${difficulty === 'medium' ? 'active' : ''}`}
                onClick={() => onSetDifficulty('medium')}
                type="button"
              >
                <span className="diff-name">MEDIUM</span>
                <span className="diff-sub">Club Match</span>
              </button>
              <button
                className={`diff-btn ${difficulty === 'hard' ? 'active' : ''}`}
                onClick={() => onSetDifficulty('hard')}
                type="button"
              >
                <span className="diff-name">HARD</span>
                <span className="diff-sub">Tournament</span>
              </button>
            </div>
          </div>
        )}

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
