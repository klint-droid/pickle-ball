import React from 'react';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import type { GameScore } from '../types/game';

interface GameOverProps {
  score: GameScore;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ score, onPlayAgain, onMainMenu }) => {
  const winnerName = score.winner === 'player1' ? 'PLAYER 1' : 'PLAYER 2';
  const winnerColorClass = score.winner === 'player1' ? 'p1-text' : 'p2-text';

  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        {/* Trophy Icon */}
        <div className="trophy-container">
          <Trophy size={56} className="trophy-icon" />
        </div>

        <h2 className="winner-headline">
          <span className={winnerColorClass}>{winnerName}</span> WINS!
        </h2>

        {/* Final Score Banner */}
        <div className="final-score-display">
          <div className="final-player p1">
            <span className="p-tag p1-text">PLAYER 1</span>
            <span className="p-num">{score.player1}</span>
          </div>
          <span className="score-divider">-</span>
          <div className="final-player p2">
            <span className="p-num">{score.player2}</span>
            <span className="p-tag p2-text">PLAYER 2</span>
          </div>
        </div>

        <p className="game-over-sub">
          First to 11 points! Match concluded after an intense court battle.
        </p>

        {/* Buttons */}
        <div className="game-over-actions">
          <button className="btn-primary btn-pulse" onClick={onPlayAgain}>
            <RotateCcw size={20} />
            <span>PLAY AGAIN</span>
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
