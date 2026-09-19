import React, { useState } from 'react';
import type { GameScore, GameState, ScoringMode, DifficultyLevel } from '../types/game';
import { sound } from '../game/Audio';
import { Volume2, VolumeX, Pause, Play, ShieldAlert, Sparkles, Maximize2, Timer } from 'lucide-react';

interface ScoreboardProps {
  score: GameScore;
  gameState: GameState;
  onPauseToggle: () => void;
  onToggleScoringMode?: (mode: ScoringMode) => void;
  onSetDifficulty?: (diff: DifficultyLevel) => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  score,
  gameState,
  onPauseToggle,
  onToggleScoringMode,
  onSetDifficulty
}) => {
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
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

  const courtSideLabel = score.serverCourt === 'even' ? 'RIGHT / EVEN' : 'LEFT / ODD';

  return (
    <div className="scoreboard-container">
      {/* Top Glassmorphism HUD Bar */}
      <div className="scoreboard-hud">
        {/* Player 1 Info Card */}
        <div className={`player-card p1 ${score.server === 'player1' ? 'serving' : ''}`}>
          <div className="player-indicator">
            <span className="p-dot p1-dot"></span>
            <div className="player-meta">
              <span className="player-title">PLAYER 1</span>
              {score.server === 'player1' && (
                <span className="serve-badge">
                  SERVE ({courtSideLabel})
                </span>
              )}
            </div>
          </div>
          <div className="score-num">{score.player1}</div>
        </div>

        {/* Center Match Stats & Mode */}
        <div className="center-hud">
          <div className="match-title-row">
            <span className="match-title">PICKLEBALL</span>
            {onToggleScoringMode && (
              <button
                className="mode-toggle-chip"
                onClick={() =>
                  onToggleScoringMode(score.scoringMode === 'side-out' ? 'rally' : 'side-out')
                }
                title="Click to toggle Scoring Rule"
              >
                {score.scoringMode === 'side-out' ? 'SIDE-OUT' : 'RALLY'}
              </button>
            )}
            {onSetDifficulty && (
              <button
                className={`difficulty-chip diff-${score.difficulty || 'medium'}`}
                onClick={() => {
                  const current = score.difficulty || 'medium';
                  const next: DifficultyLevel =
                    current === 'easy' ? 'medium' : current === 'medium' ? 'hard' : 'easy';
                  onSetDifficulty(next);
                }}
                title="Click to cycle Difficulty (Easy -> Medium -> Hard)"
              >
                {(score.difficulty || 'medium').toUpperCase()}
              </button>
            )}
          </div>
          <div className="rally-box">
            <span className="rally-label">RALLY</span>
            <span className="rally-value">{score.rally}</span>
          </div>
        </div>

        {/* Player 2 Info Card */}
        <div className={`player-card p2 ${score.server === 'player2' ? 'serving' : ''}`}>
          <div className="score-num">{score.player2}</div>
          <div className="player-indicator">
            <div className="player-meta text-right">
              <span className="player-title">PLAYER 2</span>
              {score.server === 'player2' && (
                <span className="serve-badge">
                  SERVE ({courtSideLabel})
                </span>
              )}
            </div>
            <span className="p-dot p2-dot"></span>
          </div>
        </div>

        {/* HUD Utilities */}
        <div className="hud-controls">
          <button
            className="hud-btn"
            onClick={handleToggleFullscreen}
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
          <button
            className="hud-btn"
            onClick={toggleSound}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button
            className="hud-btn"
            onClick={onPauseToggle}
            title={gameState === 'paused' ? 'Resume (ESC)' : 'Pause (ESC)'}
            aria-label="Pause Game"
          >
            {gameState === 'paused' ? <Play size={17} /> : <Pause size={17} />}
          </button>
        </div>
      </div>

      {/* Pre-Serve Countdown Notification Banner */}
      {score.serveCountdown !== null && gameState === 'playing' && (
        <div className="serve-countdown-banner">
          <div className="countdown-hud-badge">
            <Timer size={18} className="timer-icon pulse-fast" />
            <span className="countdown-hud-text">
              SERVE IN <strong className="countdown-digit">{score.serveCountdown}</strong>s
            </span>
            <span className="countdown-hint">TAP / CLICK TO SERVE NOW</span>
          </div>
        </div>
      )}

      {/* Point / Fault Announcement Banner */}
      {gameState === 'point' && (
        <div className="point-announcement">
          <div className={`point-badge ${score.isSideOut ? 'side-out-badge' : ''}`}>
            {score.isSideOut ? (
              <div className="point-headline side-out-text">
                <ShieldAlert size={20} />
                <span>SIDE OUT! SERVE TRANSFERRED</span>
              </div>
            ) : (
              <div className="point-headline">
                <Sparkles size={18} className="sparkle-icon" />
                <span className={score.pointWinner === 'player1' ? 'p1-text' : 'p2-text'}>
                  {score.pointWinner === 'player1' ? 'PLAYER 1' : 'PLAYER 2'} SCORES!
                </span>
              </div>
            )}
            <span className="point-reason">{score.pointReason}</span>
          </div>
        </div>
      )}
    </div>
  );
};
