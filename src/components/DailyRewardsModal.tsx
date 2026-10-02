import React, { useState } from 'react';
import { X, Gift, Check, Lock, Sparkles, Coins, Gem, Zap } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { DAILY_REWARDS } from '../services/playerStore';
import { sound } from '../game/Audio';

export const DailyRewardsModal: React.FC = () => {
  const { profile, claimDailyReward, setActiveModal, isDailyRewardAvailable } = usePlayer();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!profile) return null;

  const { claimedDays, currentDay } = profile.dailyRewards;

  const handleClaim = (day: number) => {
    sound.playButtonClick();
    const res = claimDailyReward(day);
    if (res.success) {
      setFeedback(res.message);
    } else {
      setFeedback(res.message);
    }
  };

  return (
    <div className="modal-backdrop-blur">
      <div className="daily-modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Gift size={24} className="text-lime-400" />
            <div>
              <h2 className="modal-title">7-DAY LOGIN REWARDS</h2>
              <p className="modal-subtitle">
                Log in each day to unlock expanding resource bundles and the legendary Golden Sovereign Paddle!
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => {
              sound.playButtonClick();
              setActiveModal('none');
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="reward-toast-alert">
            <Sparkles size={18} />
            <span>{feedback}</span>
          </div>
        )}

        {/* 7 Days Grid */}
        <div className="daily-rewards-grid">
          {DAILY_REWARDS.map((reward) => {
            const isClaimed = claimedDays.includes(reward.day);
            const isCurrent = reward.day === currentDay;
            const canClaim = isCurrent && isDailyRewardAvailable;
            const isLocked = !isClaimed && !canClaim;
            const isGrandPrize = reward.day === 7;

            return (
              <div
                key={reward.day}
                className={`daily-card ${isClaimed ? 'claimed' : ''} ${canClaim ? 'can-claim pulse-glow' : ''} ${
                  isLocked ? 'locked' : ''
                } ${isGrandPrize ? 'grand-prize' : ''}`}
              >
                <div className="daily-card-day">
                  <span>DAY {reward.day}</span>
                  {isGrandPrize && <span className="grand-tag">LEGENDARY</span>}
                </div>

                <div className="daily-card-icon-area">
                  {isClaimed ? (
                    <div className="daily-status-icon claimed-icon">
                      <Check size={28} strokeWidth={3} />
                    </div>
                  ) : isLocked ? (
                    <div className="daily-status-icon lock-icon">
                      <Lock size={24} />
                    </div>
                  ) : (
                    <div className="daily-status-icon ready-icon">
                      <Sparkles size={28} />
                    </div>
                  )}
                </div>

                {/* Reward Items */}
                <div className="daily-card-contents">
                  {reward.coins > 0 && (
                    <div className="daily-resource-line">
                      <Coins size={14} className="text-yellow-400" />
                      <span>+{reward.coins.toLocaleString()} Coins</span>
                    </div>
                  )}
                  {reward.gems > 0 && (
                    <div className="daily-resource-line">
                      <Gem size={14} className="text-cyan-400" />
                      <span>+{reward.gems} Gems</span>
                    </div>
                  )}
                  {reward.energy && (
                    <div className="daily-resource-line">
                      <Zap size={14} className="text-amber-400" />
                      <span>+{reward.energy} Energy</span>
                    </div>
                  )}
                  {reward.paddleName && (
                    <div className="daily-paddle-line">
                      <span>🏓 {reward.paddleName}</span>
                    </div>
                  )}
                </div>

                {/* Claim Button */}
                <div className="daily-card-action">
                  {isClaimed ? (
                    <span className="btn-claimed-label">CLAIMED</span>
                  ) : canClaim ? (
                    <button
                      type="button"
                      className="btn-claim-today"
                      onClick={() => handleClaim(reward.day)}
                    >
                      CLAIM NOW
                    </button>
                  ) : (
                    <span className="btn-locked-label">
                      {isCurrent ? 'COME BACK TOMORROW' : 'LOCKED'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="daily-modal-footer">
          <span>💡 Tip: Logging in every 24 hours maintains your streak. Day 7 awards the exclusive Golden Sovereign paddle!</span>
        </div>
      </div>
    </div>
  );
};
