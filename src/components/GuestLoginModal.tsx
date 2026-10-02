import React, { useState } from 'react';
import { Play, Dices, Shield, CloudOff, Sparkles, Check } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { AVATAR_LIST, generateRandomGuestName } from '../services/playerStore';
import { sound } from '../game/Audio';

export const GuestLoginModal: React.FC = () => {
  const { profile, loginAsGuest, setActiveModal } = usePlayer();

  const [guestName, setGuestName] = useState<string>(
    () => profile?.username || generateRandomGuestName()
  );
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    () => profile?.avatar || 'pickle_champ'
  );

  const handleRandomizeName = () => {
    sound.playButtonClick();
    setGuestName(generateRandomGuestName());
  };

  const handleEnterGame = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = guestName.trim() || generateRandomGuestName();
    loginAsGuest(finalName, selectedAvatar);
  };

  return (
    <div className="modal-backdrop-blur">
      <div className="login-modal-card">
        {/* Header Ribbon */}
        <div className="login-badge-header">
          <Shield size={16} />
          <span>INSTANT GUEST SESSION • ZERO DATABASE REQUIRED</span>
        </div>

        <h1 className="login-title">
          PICKLE<span className="title-highlight">BALL</span> PRO
        </h1>
        <p className="login-subtitle">
          Enter the arena as a guest player. All progress, unlocked gear, promo bundles, and rewards are stored locally on your device!
        </p>

        {/* Starter Pack Callout */}
        <div className="starter-pack-banner">
          <div className="starter-pack-header">
            <Sparkles size={16} className="text-yellow-400" />
            <span>NEW GUEST WELCOME REWARD INCLUDED:</span>
          </div>
          <div className="starter-pack-rewards">
            <span className="pack-chip">🪙 1,500 Coins</span>
            <span className="pack-chip">💎 60 Gems</span>
            <span className="pack-chip">⚡ 10 Full Energy</span>
            <span className="pack-chip">🏓 Cobalt Paddle</span>
          </div>
        </div>

        <form onSubmit={handleEnterGame} className="login-form">
          {/* Guest Name Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="guest-name-input">
              Player Nickname:
            </label>
            <div className="input-with-action">
              <input
                id="guest-name-input"
                type="text"
                className="game-input"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={20}
                placeholder="Enter gamertag..."
                required
              />
              <button
                type="button"
                className="btn-random-name"
                onClick={handleRandomizeName}
                title="Generate Random Nickname"
              >
                <Dices size={18} />
                <span>Random</span>
              </button>
            </div>
          </div>

          {/* Avatar Selection */}
          <div className="form-group">
            <label className="form-label">Choose Avatar Icon:</label>
            <div className="avatar-grid">
              {AVATAR_LIST.map((av) => {
                const isSelected = selectedAvatar === av.id;
                return (
                  <button
                    type="button"
                    key={av.id}
                    className={`avatar-choice-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      sound.playButtonClick();
                      setSelectedAvatar(av.id);
                    }}
                    style={{ borderColor: isSelected ? av.color : 'rgba(255, 255, 255, 0.15)' }}
                    title={av.label}
                  >
                    <span className="avatar-emoji">{av.emoji}</span>
                    {isSelected && (
                      <span className="avatar-check-badge">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="login-actions">
            <button type="submit" className="btn-primary btn-large btn-login" id="btn-login-as-guest">
              <Play size={20} fill="currentColor" />
              <span>PLAY AS GUEST</span>
            </button>

            {profile && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveModal('none')}
              >
                Continue Previous Session ({profile.username})
              </button>
            )}
          </div>
        </form>

        {/* Future Cloud Sync Notice */}
        <div className="cloud-future-notice">
          <CloudOff size={14} />
          <span>Cloud Accounts & Cross-Device Database Sync Coming Soon</span>
        </div>
      </div>
    </div>
  );
};
