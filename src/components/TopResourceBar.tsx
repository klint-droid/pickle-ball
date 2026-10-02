import React, { useState, useEffect } from 'react';
import { Coins, Gem, Zap, Trophy, Settings, Plus } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { AVATAR_LIST, getRankTier } from '../services/playerStore';
import { sound } from '../game/Audio';

export const TopResourceBar: React.FC = () => {
  const {
    profile,
    setActiveModal,
    hasUnclaimedDailyReward,
    hasUnclaimedEvents,
    hasUnclaimedQuests
  } = usePlayer();

  const [timeUntilEnergy, setTimeUntilEnergy] = useState<string>('');

  // Energy recharge countdown timer
  useEffect(() => {
    if (!profile) return;

    const updateCountdown = () => {
      if (profile.energy >= profile.maxEnergy) {
        setTimeUntilEnergy('MAX');
        return;
      }

      const elapsed = Date.now() - profile.lastEnergyRechargeTime;
      const remainingMs = Math.max(0, 3 * 60 * 1000 - (elapsed % (3 * 60 * 1000)));
      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      setTimeUntilEnergy(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [profile]);

  if (!profile) return null;

  const currentAvatar = AVATAR_LIST.find((a) => a.id === profile.avatar) || AVATAR_LIST[0];
  const rankTier = getRankTier(profile.trophies);
  const xpPercent = Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100));

  return (
    <header className="top-resource-bar" aria-label="Player profile and resources">
      {/* Left: Player Profile Pill */}
      <button
        type="button"
        className="profile-pill-btn"
        onClick={() => {
          sound.playButtonClick();
          setActiveModal('profile');
        }}
        title="View Player Profile & Stats"
        id="top-bar-profile-btn"
      >
        <div className="profile-avatar-wrap" style={{ borderColor: currentAvatar.color }}>
          <span className="profile-avatar-emoji">{currentAvatar.emoji}</span>
          <span className="profile-level-badge">Lv.{profile.level}</span>
        </div>

        <div className="profile-info-col">
          <div className="profile-name-row">
            <span className="profile-guest-tag">GUEST</span>
            <span className="profile-name-text">{profile.username}</span>
          </div>

          <div className="profile-xp-bar-wrap" title={`${profile.xp} / ${profile.xpToNextLevel} XP`}>
            <div className="profile-xp-bar-fill" style={{ width: `${xpPercent}%` }} />
            <span className="profile-xp-text">
              {profile.xp}/{profile.xpToNextLevel} XP
            </span>
          </div>
        </div>
      </button>

      {/* Right: Currency & Resource Counters */}
      <div className="resource-counters-row">
        {/* Trophies Counter */}
        <button
          type="button"
          className="resource-pill trophies-pill"
          onClick={() => {
            sound.playButtonClick();
            setActiveModal('profile');
          }}
          title={`Rank: ${rankTier.name}`}
          id="top-bar-trophies-btn"
        >
          <div className="resource-icon-wrap trophies-icon-wrap">
            <Trophy size={16} />
          </div>
          <div className="resource-val-col">
            <span className="resource-val">{profile.trophies.toLocaleString()}</span>
            <span className="resource-sub-label">{rankTier.name.split(' ')[0]}</span>
          </div>
        </button>

        {/* Energy Counter */}
        <button
          type="button"
          className={`resource-pill energy-pill ${profile.energy === 0 ? 'energy-empty' : ''}`}
          onClick={() => {
            sound.playButtonClick();
            if (profile.energy < profile.maxEnergy) {
              setActiveModal('energyRefill');
            }
          }}
          title={profile.energy < profile.maxEnergy ? `Next energy in ${timeUntilEnergy}` : 'Energy Full'}
          id="top-bar-energy-btn"
        >
          <div className="resource-icon-wrap energy-icon-wrap">
            <Zap size={16} fill="currentColor" />
          </div>
          <div className="resource-val-col">
            <span className="resource-val">
              {profile.energy}/{profile.maxEnergy}
            </span>
            <span className="resource-sub-label">
              {profile.energy >= profile.maxEnergy ? 'FULL' : `+1 in ${timeUntilEnergy}`}
            </span>
          </div>
          {profile.energy < profile.maxEnergy && (
            <span className="resource-plus-btn" title="Refill Energy">
              <Plus size={12} />
            </span>
          )}
        </button>

        {/* Coins Counter */}
        <button
          type="button"
          className="resource-pill coins-pill"
          onClick={() => {
            sound.playButtonClick();
            setActiveModal('promos');
          }}
          title="Coins (Click for Promos & Free Rewards)"
          id="top-bar-coins-btn"
        >
          <div className="resource-icon-wrap coins-icon-wrap">
            <Coins size={16} />
          </div>
          <div className="resource-val-col">
            <span className="resource-val">{profile.coins.toLocaleString()}</span>
            <span className="resource-sub-label">COINS</span>
          </div>
          <span className="resource-plus-btn">
            <Plus size={12} />
          </span>
        </button>

        {/* Gems Counter */}
        <button
          type="button"
          className="resource-pill gems-pill"
          onClick={() => {
            sound.playButtonClick();
            setActiveModal('promos');
          }}
          title="Premium Gems (Click for Promos)"
          id="top-bar-gems-btn"
        >
          <div className="resource-icon-wrap gems-icon-wrap">
            <Gem size={16} />
          </div>
          <div className="resource-val-col">
            <span className="resource-val">{profile.gems.toLocaleString()}</span>
            <span className="resource-sub-label">GEMS</span>
          </div>
          <span className="resource-plus-btn">
            <Plus size={12} />
          </span>
        </button>

        {/* Settings Button */}
        <button
          type="button"
          className="resource-pill settings-pill-btn"
          onClick={() => {
            sound.playButtonClick();
            setActiveModal('settings');
          }}
          title="Game Settings & Audio"
          id="top-bar-settings-btn"
        >
          <Settings size={18} />
          {(hasUnclaimedDailyReward || hasUnclaimedEvents || hasUnclaimedQuests) && (
            <span className="notification-dot pulse-dot" />
          )}
        </button>
      </div>
    </header>
  );
};
