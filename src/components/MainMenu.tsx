import React, { useState, useEffect } from 'react';
import type { ScoringMode, DifficultyLevel } from '../types/game';
import { Play, HelpCircle, Check, Download, Maximize2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface MainMenuProps {
  scoringMode: ScoringMode;
  onSetScoringMode: (mode: ScoringMode) => void;
  difficulty: DifficultyLevel;
  onSetDifficulty: (mode: DifficultyLevel) => void;
  onStartGame: () => void;
  onOpenControls: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  scoringMode,
  onSetScoringMode,
  difficulty,
  onSetDifficulty,
  onStartGame,
  onOpenControls
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        if ('orientation' in screen && 'lock' in screen.orientation) {
          await (screen.orientation as unknown as { lock: (mode: string) => Promise<void> }).lock('landscape').catch(() => {});
        }
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignored if fullscreen permission denied
    }
  };

  return (
    <div className="menu-overlay">
      <div className="menu-modal">
        <h1 className="menu-title">
          PICKLE<span className="title-highlight">BALL</span>
        </h1>
        <p className="menu-subtitle">
          Full-court tournament simulator with official non-volley kitchen rules, side-out scoring, and reactive AI physics.
        </p>

        {/* Difficulty Level Selection Tabs */}
        <div className="difficulty-mode-selector">
          <div className="selector-label-row">
            <span className="selector-label">Difficulty:</span>
            <span className="difficulty-hint">
              {difficulty === 'easy' && '0.8x ball speed • Generous reach • Casual AI'}
              {difficulty === 'medium' && '1.0x regulation speed • Standard reach • Competitive AI'}
              {difficulty === 'hard' && '1.2x tournament speed • Tight reach • Pro AI'}
            </span>
          </div>
          <div className="difficulty-toggle-group">
            <button
              className={`diff-btn ${difficulty === 'easy' ? 'active' : ''}`}
              onClick={() => onSetDifficulty('easy')}
              type="button"
            >
              <span className="diff-name">EASY</span>
              <span className="diff-sub">Casual Rally</span>
            </button>
            <button
              className={`diff-btn ${difficulty === 'medium' ? 'active' : ''}`}
              onClick={() => onSetDifficulty('medium')}
              type="button"
            >
              <span className="diff-name">MEDIUM</span>
              <span className="diff-sub">Standard</span>
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

          <div className="menu-secondary-row">
            <button className="btn-secondary" onClick={onOpenControls}>
              <HelpCircle size={18} />
              <span>RULES & CONTROLS</span>
            </button>

            <button
              className="btn-secondary btn-icon-only"
              onClick={handleToggleFullscreen}
              title="Toggle Fullscreen"
              aria-label="Toggle Fullscreen"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          {/* Install PWA Prompt Button */}
          {deferredPrompt && !isInstalled && (
            <button className="btn-pwa-install" onClick={handleInstallClick}>
              <Download size={18} />
              <span>INSTALL APP (PWA)</span>
            </button>
          )}
        </div>

        {/* Quick Controls Preview Footer */}
        <div className="quick-controls-footer">
          <div className="footer-p1">
            <span className="footer-label p1-text">PLAYER 1</span>
            <code>MOUSE / TOUCH</code> + <code>CLICK</code>
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
