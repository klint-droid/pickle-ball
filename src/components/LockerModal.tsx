import React, { useState } from 'react';
import { X, ShieldCheck, Check, Sparkles, AlertCircle, Coins, Gem } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { PADDLES_CATALOG } from '../services/playerStore';
import { sound } from '../game/Audio';

export const LockerModal: React.FC = () => {
  const {
    profile,
    equipPaddle,
    buyPaddle,
    setActiveModal
  } = usePlayer();

  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  if (!profile) return null;

  const handleEquip = (paddleId: string) => {
    sound.playButtonClick();
    equipPaddle(paddleId);
    setFeedback({ text: 'Paddle equipped for tournament play!', isError: false });
  };

  const handleBuy = (paddleId: string) => {
    sound.playButtonClick();
    const res = buyPaddle(paddleId);
    if (res.success) {
      setFeedback({ text: res.message, isError: false });
    } else {
      setFeedback({ text: res.message, isError: true });
    }
  };

  return (
    <div className="modal-backdrop-blur">
      <div className="locker-modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge">🏓</span>
            <div>
              <h2 className="modal-title">PADDLE LOCKER & PRO SHOP</h2>
              <p className="modal-subtitle">
                Customize your paddle skin on court. Unlocked gear immediately reflects in your match graphics!
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

        {/* Current Balance Bar */}
        <div className="locker-balance-bar">
          <span className="balance-label">Your Available Resources:</span>
          <div className="balance-chips">
            <span className="res-chip">
              <Coins size={14} className="text-yellow-400" />
              <span>{profile.coins.toLocaleString()} Coins</span>
            </span>
            <span className="res-chip">
              <Gem size={14} className="text-cyan-400" />
              <span>{profile.gems.toLocaleString()} Gems</span>
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`promo-toast-alert ${feedback.isError ? 'error' : 'success'}`}>
            {feedback.isError ? <AlertCircle size={18} /> : <Sparkles size={18} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Paddles Grid */}
        <div className="paddles-grid">
          {PADDLES_CATALOG.map((paddle) => {
            const isUnlocked = profile.unlockedPaddles.includes(paddle.id);
            const isEquipped = profile.equippedPaddle === paddle.id;

            return (
              <div
                key={paddle.id}
                className={`paddle-card rarity-${paddle.rarity} ${isEquipped ? 'equipped' : ''}`}
              >
                {/* Top Rarity Tag */}
                <div className="paddle-card-header">
                  <span className={`rarity-tag rarity-${paddle.rarity}`}>
                    {paddle.rarity.toUpperCase()}
                  </span>
                  {isEquipped && (
                    <span className="equipped-badge">
                      <Check size={12} strokeWidth={3} />
                      <span>EQUIPPED</span>
                    </span>
                  )}
                </div>

                {/* Paddle Blade Graphic Preview */}
                <div className="paddle-graphic-wrap">
                  <div
                    className="paddle-blade-mockup"
                    style={{
                      backgroundColor: paddle.color,
                      boxShadow: `0 0 20px ${paddle.glowColor}55, 0 4px 12px rgba(0,0,0,0.5)`
                    }}
                  >
                    <div className="paddle-inner-core" />
                  </div>
                  <div className="paddle-handle-mockup" />
                </div>

                {/* Title & Perk */}
                <div className="paddle-info">
                  <h4 className="paddle-name">{paddle.name}</h4>
                  <span className="paddle-perk">{paddle.perk}</span>
                  <p className="paddle-desc">{paddle.description}</p>
                </div>

                {/* Action Button */}
                <div className="paddle-action">
                  {isEquipped ? (
                    <button type="button" className="btn-paddle-status active" disabled>
                      <ShieldCheck size={16} />
                      <span>ACTIVE ON COURT</span>
                    </button>
                  ) : isUnlocked ? (
                    <button
                      type="button"
                      className="btn-primary btn-equip"
                      onClick={() => handleEquip(paddle.id)}
                    >
                      <span>EQUIP PADDLE</span>
                    </button>
                  ) : paddle.costCoins ? (
                    <button
                      type="button"
                      className="btn-buy-coins"
                      onClick={() => handleBuy(paddle.id)}
                    >
                      <Coins size={14} />
                      <span>{paddle.costCoins.toLocaleString()} COINS</span>
                    </button>
                  ) : paddle.costGems ? (
                    <button
                      type="button"
                      className="btn-buy-gems"
                      onClick={() => handleBuy(paddle.id)}
                    >
                      <Gem size={14} />
                      <span>{paddle.costGems} GEMS</span>
                    </button>
                  ) : (
                    <span className="special-reward-label">SPECIAL REWARD</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="daily-modal-footer">
          <span>🎯 Equipping a paddle changes your character's paddle color and visual flair in all tournament matches!</span>
        </div>
      </div>
    </div>
  );
};
