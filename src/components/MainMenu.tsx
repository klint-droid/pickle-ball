import React from 'react';
import type { ScoringMode } from '../types/game';
import { Play, HelpCircle, Check, MousePointer } from 'lucide-react';

interface MainMenuProps {
  scoringMode: ScoringMode;
  onSetScoringMode: (mode: ScoringMode) => void;
  onStartGame: () => void;
  onOpenControls: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  scoringMode,
  onSetScoringMode,
  onStartGame,
  onOpenControls
}) => {
  return (
    <div className="menu-overlay">
      <div className="menu-modal">
        {/* Pickleball Logo Badge */}
        <div className="menu-badge">
          <div className="ball-icon">
            <span className="dot d1"></span>
            <span className="dot d2"></span>
            <span className="dot d3"></span>
            <span className="dot d4"></span>
          </div>
          <span className="badge-text">MOUSE HOVER CONTROLS</span>
        </div>

        <h1 className="menu-title">
          PICKLE<span className="title-highlight">BALL</span>
        </h1>
        <p className="menu-subtitle">
          Glide your mouse to move your paddle across the court. Official Non-Volley Zone (Kitchen) rules, Two-Bounce physics, and smart AI opponent.
        </p>

        {/* Scoring Mode Selection Tabs */}
        <div className="scoring-mode-selector">
          <span className="selector-label">Scoring Rule:</span>
          <div className="mode-toggle-group">
            <button
              className={`mode-btn ${scoringMode === 'side-out' ? 'active' : ''}`}
              onClick={() => onSetScoringMode('side-out')}
              type="button"
            >
              {scoringMode === 'side-out' && <Check size={14} />}
              <span>Official Side-Out</span>
            </button>
            <button
              className={`mode-btn ${scoringMode === 'rally' ? 'active' : ''}`}
              onClick={() => onSetScoringMode('rally')}
              type="button"
            >
              {scoringMode === 'rally' && <Check size={14} />}
              <span>Fast Rally</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="menu-actions">
          <button className="btn-primary" onClick={onStartGame}>
            <Play size={22} fill="currentColor" />
            <span>PLAY MATCH</span>
          </button>

          <button className="btn-secondary" onClick={onOpenControls}>
            <HelpCircle size={18} />
            <span>RULES & CONTROLS</span>
          </button>
        </div>

        {/* Quick Keyboard Preview Footer */}
        <div className="quick-controls-footer">
          <div className="footer-p1">
            <span className="footer-label p1-text">
              <MousePointer size={11} style={{ display: 'inline', marginRight: 3 }} />
              PLAYER 1
            </span>
            <code>MOUSE HOVER</code> + <code>CLICK</code>
          </div>
          <div className="footer-divider"></div>
          <div className="footer-p2">
            <span className="footer-label p2-text">PLAYER 2</span>
            <code>SMART AI</code> / <code>ARROWS</code>
          </div>
        </div>
      </div>
    </div>
  );
};
