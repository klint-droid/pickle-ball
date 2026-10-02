import React, { useState } from 'react';
import { X, CheckSquare, Sparkles, Check, Coins, Gem, Star } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { sound } from '../game/Audio';

export const QuestsModal: React.FC = () => {
  const { profile, claimQuestReward, setActiveModal } = usePlayer();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!profile) return null;

  const handleClaim = (questId: string) => {
    sound.playButtonClick();
    const res = claimQuestReward(questId);
    if (res.success) {
      setFeedback(res.message);
    }
  };

  return (
    <div className="modal-backdrop-blur">
      <div className="quests-modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <CheckSquare size={24} className="text-cyan-400" />
            <div>
              <h2 className="modal-title">DAILY QUESTS & MILESTONES</h2>
              <p className="modal-subtitle">
                Complete match milestones to harvest coins, player XP, and gems.
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

        {/* Quests List */}
        <div className="quests-list">
          {profile.quests.map((quest) => {
            const percent = Math.min(100, Math.round((quest.progress / quest.target) * 100));
            const canClaim = quest.completed && !quest.claimed;

            return (
              <div
                key={quest.id}
                className={`quest-item-card ${quest.claimed ? 'claimed' : ''} ${
                  canClaim ? 'can-claim' : ''
                }`}
              >
                <div className="quest-left-col">
                  <div className="quest-header-row">
                    <span className={`quest-category-badge cat-${quest.category}`}>
                      {quest.category.toUpperCase()}
                    </span>
                    <h4 className="quest-title">{quest.title}</h4>
                  </div>
                  <p className="quest-desc">{quest.description}</p>

                  {/* Progress Bar */}
                  <div className="quest-progress-wrap">
                    <div className="quest-progress-bar">
                      <div className="quest-progress-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="quest-progress-text">
                      {quest.progress} / {quest.target}
                    </span>
                  </div>
                </div>

                {/* Right Rewards & Action */}
                <div className="quest-right-col">
                  <div className="quest-rewards-box">
                    <span className="reward-chip">
                      <Coins size={12} className="text-yellow-400" />
                      +{quest.rewardCoins}
                    </span>
                    <span className="reward-chip">
                      <Star size={12} className="text-lime-400" />
                      +{quest.rewardXp} XP
                    </span>
                    {quest.rewardGems && (
                      <span className="reward-chip">
                        <Gem size={12} className="text-cyan-400" />
                        +{quest.rewardGems}
                      </span>
                    )}
                  </div>

                  <div className="quest-action-box">
                    {quest.claimed ? (
                      <span className="btn-claimed-label">
                        <Check size={14} />
                        <span>CLAIMED</span>
                      </span>
                    ) : canClaim ? (
                      <button
                        type="button"
                        className="btn-primary btn-claim-quest pulse-glow"
                        onClick={() => handleClaim(quest.id)}
                      >
                        CLAIM
                      </button>
                    ) : (
                      <span className="btn-locked-label">IN PROGRESS</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="daily-modal-footer">
          <span>🏆 Match actions automatically register into your quest logs upon match conclusion!</span>
        </div>
      </div>
    </div>
  );
};
