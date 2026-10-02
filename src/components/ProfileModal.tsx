import React, { useState } from 'react';
import { X, User, LogOut, Check, Dices, Save } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { AVATAR_LIST, getRankTier, generateRandomGuestName } from '../services/playerStore';
import { sound } from '../game/Audio';

export const ProfileModal: React.FC = () => {
  const { profile, updateProfile, logout, setActiveModal } = usePlayer();

  const [editName, setEditName] = useState<string>(() => profile?.username || '');
  const [editAvatar, setEditAvatar] = useState<string>(() => profile?.avatar || 'pickle_champ');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!profile) return null;

  const currentAvatar = AVATAR_LIST.find((a) => a.id === editAvatar) || AVATAR_LIST[0];
  const rankTier = getRankTier(profile.trophies);
  const winRate =
    profile.stats.matchesPlayed > 0
      ? Math.round((profile.stats.wins / profile.stats.matchesPlayed) * 100)
      : 0;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playButtonClick();
    updateProfile(editName, editAvatar);
    setSaveStatus('Profile updated successfully!');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleRandomize = () => {
    sound.playButtonClick();
    setEditName(generateRandomGuestName());
  };

  return (
    <div className="modal-backdrop-blur">
      <div className="profile-modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <User size={24} className="text-sky-400" />
            <div>
              <h2 className="modal-title">PLAYER PROFILE & STATS</h2>
              <p className="modal-subtitle">
                Inspect your career tournament record, customize your avatar, or manage guest sessions.
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

        {/* Profile Card Header Banner */}
        <div className="profile-hero-banner">
          <div className="hero-avatar-box" style={{ borderColor: currentAvatar.color }}>
            <span className="hero-avatar-emoji">{currentAvatar.emoji}</span>
            <span className="hero-level-tag">Lv.{profile.level}</span>
          </div>

          <div className="hero-info-box">
            <div className="hero-name-row">
              <span className="guest-badge-pill">GUEST ACCOUNT</span>
              <h3 className="hero-player-name">{profile.username}</h3>
            </div>
            <div className="hero-rank-row">
              <span className="rank-badge" style={{ color: rankTier.color }}>
                {rankTier.icon} {rankTier.name}
              </span>
              <span className="hero-trophies-count">🏆 {profile.trophies} Trophies</span>
            </div>
          </div>
        </div>

        {/* Career Stats Grid */}
        <div className="career-stats-grid">
          <div className="stat-card">
            <span className="stat-label">Matches Played</span>
            <span className="stat-value">{profile.stats.matchesPlayed}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Wins</span>
            <span className="stat-value text-emerald-400">{profile.stats.wins}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value text-sky-400">{winRate}%</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Longest Rally</span>
            <span className="stat-value text-amber-400">
              {profile.stats.highestRally} <span className="stat-sub">hits</span>
            </span>
          </div>
        </div>

        {/* Edit Nickname & Avatar Form */}
        <form onSubmit={handleSaveProfile} className="profile-edit-section">
          <h4 className="section-title">Customize Guest Profile</h4>

          {saveStatus && (
            <div className="save-status-toast">
              <Check size={16} />
              <span>{saveStatus}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="edit-username">
              Nickname:
            </label>
            <div className="input-with-action">
              <input
                id="edit-username"
                type="text"
                className="game-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={20}
                required
              />
              <button
                type="button"
                className="btn-random-name"
                onClick={handleRandomize}
                title="Generate Random Nickname"
              >
                <Dices size={16} />
                <span>Random</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Avatar Badge:</label>
            <div className="avatar-grid mini">
              {AVATAR_LIST.map((av) => {
                const isSelected = editAvatar === av.id;
                return (
                  <button
                    type="button"
                    key={av.id}
                    className={`avatar-choice-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      sound.playButtonClick();
                      setEditAvatar(av.id);
                    }}
                    style={{ borderColor: isSelected ? av.color : 'rgba(255, 255, 255, 0.15)' }}
                    title={av.label}
                  >
                    <span className="avatar-emoji">{av.emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="profile-form-actions">
            <button type="submit" className="btn-primary btn-save-profile">
              <Save size={16} />
              <span>SAVE PROFILE CHANGES</span>
            </button>

            <button
              type="button"
              className="btn-secondary btn-switch-guest"
              onClick={logout}
            >
              <LogOut size={16} />
              <span>Switch / Log Out Guest</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
