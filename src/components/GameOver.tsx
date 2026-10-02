import React, { useEffect, useState, useRef } from 'react';
import { Trophy, RotateCcw, Home, Sparkles, Coins, Gem, Star, Award } from 'lucide-react';
import type { GameScore } from '../types/game';
import { usePlayer, type MatchRewardSummary } from '../context/PlayerContext';
import { sound } from '../game/Audio';

interface GameOverProps {
  score: GameScore;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ score, onPlayAgain, onMainMenu }) => {
  const { profile, recordMatchEnd, consumeEnergyForMatch } = usePlayer();
  const [rewards, setRewards] = useState<MatchRewardSummary | null>(null);
  const recordedRef = useRef(false);

  const isP1Winner = score.winner === 'player1';
  const playerDisplayName = profile?.username || 'PLAYER 1';
  const winnerName = isP1Winner ? playerDisplayName : 'AI OPPONENT';

  useEffect(() => {
    if (!recordedRef.current) {
      recordedRef.current = true;
      const summary = recordMatchEnd(isP1Winner, score.rally, score.scoringMode);
      setRewards(summary);
    }
  }, [isP1Winner, score.rally, score.scoringMode, recordMatchEnd]);

  const handleRematch = () => {
    sound.playButtonClick();
    if (consumeEnergyForMatch()) {
      onPlayAgain();
    }
  };

  const handleReturnHome = () => {
    sound.playButtonClick();
    onMainMenu();
  };

  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        {/* Trophy / Icon */}
        <div className={`trophy-container ${isP1Winner ? 'victory' : 'defeat'}`}>
          <Trophy size={56} className="trophy-icon" />
        </div>

        <h2 className="winner-headline">
          {isP1Winner ? (
            <>
              <span className="text-emerald-400">VICTORY!</span>
              <div className="winner-sub-name">{playerDisplayName} WINS THE MATCH</div>
            </>
          ) : (
            <>
              <span className="text-rose-400">MATCH COMPLETE</span>
              <div className="winner-sub-name">{winnerName} Takes the Game</div>
            </>
          )}
        </h2>

        {/* Level Up Banner */}
        {rewards?.leveledUp && (
          <div className="level-up-toast pulse-glow">
            <Sparkles size={18} className="text-yellow-400" />
            <span>LEVEL UP! YOU ARE NOW LEVEL {rewards.newLevel}! (+Bonus Resources)</span>
          </div>
        )}

        {/* Final Score Banner */}
        <div className="final-score-display">
          <div className="final-player p1">
            <span className="p-tag p1-text">{playerDisplayName}</span>
            <span className="p-num">{score.player1}</span>
          </div>
          <span className="score-divider">-</span>
          <div className="final-player p2">
            <span className="p-num">{score.player2}</span>
            <span className="p-tag p2-text">OPPONENT</span>
          </div>
        </div>

        {/* Post-Match Rewards Grid */}
        {rewards && (
          <div className="post-match-rewards">
            <span className="rewards-header-tag">MATCH REWARDS EARNED:</span>
            <div className="rewards-chips-row">
              <span className="reward-badge-chip">
                <Coins size={14} className="text-yellow-400" />
                +{rewards.coinsEarned} Coins
              </span>
              <span className="reward-badge-chip">
                <Star size={14} className="text-lime-400" />
                +{rewards.xpEarned} XP
              </span>
              <span className="reward-badge-chip">
                <Award size={14} className="text-amber-400" />
                +{rewards.trophiesEarned} Trophies
              </span>
              {rewards.gemsEarned > 0 && (
                <span className="reward-badge-chip">
                  <Gem size={14} className="text-cyan-400" />
                  +{rewards.gemsEarned} Gems
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="game-over-actions">
          <button
            type="button"
            className="btn-primary btn-pulse btn-rematch"
            onClick={handleRematch}
            disabled={!!profile && profile.energy < 1}
          >
            <RotateCcw size={20} />
            <span>PLAY AGAIN (⚡ 1 Energy)</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReturnHome}
          >
            <Home size={18} />
            <span>MAIN LOBBY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
