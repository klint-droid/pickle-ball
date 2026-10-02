import React from 'react';
import type { ScoringMode, DifficultyLevel } from '../types/game';
import {
  Play,
  HelpCircle,
  Check,
  Gift,
  Tag,
  CheckSquare,
  Sparkles,
  Zap,
  Flame
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { TopResourceBar } from './TopResourceBar';
import { GuestLoginModal } from './GuestLoginModal';
import { DailyRewardsModal } from './DailyRewardsModal';
import { PromosModal } from './PromosModal';
import { LockerModal } from './LockerModal';
import { QuestsModal } from './QuestsModal';
import { ProfileModal } from './ProfileModal';
import { SettingsModal } from './SettingsModal';
import { EnergyRefillModal } from './EnergyRefillModal';
import { PADDLES_CATALOG } from '../services/playerStore';
import { sound } from '../game/Audio';

interface MainMenuProps {
  scoringMode: ScoringMode;
  onSetScoringMode: (mode: ScoringMode) => void;
  difficulty: DifficultyLevel;
  onSetDifficulty: (mode: DifficultyLevel) => void;
  onStartGame: () => void;
  onOpenControls: () => void;
  onOpenInstall?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  scoringMode,
  onSetScoringMode,
  difficulty,
  onSetDifficulty,
  onStartGame,
  onOpenControls,
  onOpenInstall
}) => {
  const {
    profile,
    activeModal,
    setActiveModal,
    hasUnclaimedDailyReward,
    hasUnclaimedEvents,
    hasUnclaimedQuests,
    consumeEnergyForMatch
  } = usePlayer();

  const handlePlayClick = () => {
    sound.playButtonClick();
    if (consumeEnergyForMatch()) {
      onStartGame();
    }
  };

  const equippedPaddleDef = PADDLES_CATALOG.find(
    (p) => p.id === (profile?.equippedPaddle || 'classic_blue')
  ) || PADDLES_CATALOG[0];

  return (
    <div className="main-home-overlay">
      {/* Top Resources and Player Profile Bar */}
      <TopResourceBar />

      {/* Main Home Hub Body */}
      <div className="main-home-body">
        {/* Left Side Navigation Dock */}
        <aside className="home-side-dock" aria-label="Game Features Navigation">
          {/* Daily Rewards Button */}
          <button
            type="button"
            className={`dock-btn dock-btn-daily ${hasUnclaimedDailyReward ? 'dock-pulse' : ''}`}
            onClick={() => {
              sound.playButtonClick();
              setActiveModal('daily');
            }}
            id="dock-btn-daily"
          >
            <div className="dock-icon-wrap bg-lime">
              <Gift size={20} />
            </div>
            <div className="dock-text-col">
              <span className="dock-title">Daily Rewards</span>
              <span className="dock-subtitle">
                {hasUnclaimedDailyReward ? 'CLAIM READY!' : '7-Day Streak'}
              </span>
            </div>
            {hasUnclaimedDailyReward && (
              <span className="dock-notification-badge">
                <Sparkles size={12} />
              </span>
            )}
          </button>

          {/* Promos & Promo Codes Button */}
          <button
            type="button"
            className="dock-btn dock-btn-promos"
            onClick={() => {
              sound.playButtonClick();
              setActiveModal('promos');
            }}
            id="dock-btn-promos"
          >
            <div className="dock-icon-wrap bg-yellow">
              <Tag size={20} />
            </div>
            <div className="dock-text-col">
              <span className="dock-title">Promos & Codes</span>
              <span className="dock-subtitle">Free Bundles & Gifts</span>
            </div>
            {hasUnclaimedEvents && (
              <span className="dock-notification-badge free-tag">FREE</span>
            )}
          </button>

          {/* Paddle Locker & Shop */}
          <button
            type="button"
            className="dock-btn dock-btn-locker"
            onClick={() => {
              sound.playButtonClick();
              setActiveModal('locker');
            }}
            id="dock-btn-locker"
          >
            <div className="dock-icon-wrap bg-cyan">
              <span className="emoji-dock-icon">🏓</span>
            </div>
            <div className="dock-text-col">
              <span className="dock-title">Paddle Locker</span>
              <span className="dock-subtitle">{equippedPaddleDef.name}</span>
            </div>
          </button>

          {/* Quests & Milestones */}
          <button
            type="button"
            className={`dock-btn dock-btn-quests ${hasUnclaimedQuests ? 'dock-pulse' : ''}`}
            onClick={() => {
              sound.playButtonClick();
              setActiveModal('quests');
            }}
            id="dock-btn-quests"
          >
            <div className="dock-icon-wrap bg-purple">
              <CheckSquare size={20} />
            </div>
            <div className="dock-text-col">
              <span className="dock-title">Quests</span>
              <span className="dock-subtitle">Match Milestones</span>
            </div>
            {hasUnclaimedQuests && (
              <span className="dock-notification-badge count-badge">!</span>
            )}
          </button>

          {/* Rules & Controls */}
          <button
            type="button"
            className="dock-btn dock-btn-rules"
            onClick={() => {
              sound.playButtonClick();
              onOpenControls();
            }}
            id="dock-btn-rules"
          >
            <div className="dock-icon-wrap bg-slate">
              <HelpCircle size={20} />
            </div>
            <div className="dock-text-col">
              <span className="dock-title">Rules & Guide</span>
              <span className="dock-subtitle">Official Kitchen Rules</span>
            </div>
          </button>
        </aside>

        {/* Center Main Arena Card */}
        <main className="home-arena-center">
          <div className="arena-card">
            {/* Arena Header */}
            <div className="arena-header">
              <div className="arena-badge">
                <Flame size={14} className="text-orange-400" />
                <span>TOURNAMENT MATCHMAKING</span>
              </div>
              <h2 className="arena-title">
                PICKLE<span className="title-highlight">BALL</span> ARENA
              </h2>
            </div>

            {/* Character & Equipped Paddle Visual Display */}
            <div className="arena-preview-stage">
              <div className="preview-character-container">
                {/* Character silhouette */}
                <div className="preview-player-avatar">
                  <div className="preview-head" />
                  <div className="preview-body" />
                  {/* Equipped paddle preview */}
                  <div
                    className="preview-equipped-paddle"
                    style={{
                      backgroundColor: equippedPaddleDef.color,
                      boxShadow: `0 0 15px ${equippedPaddleDef.glowColor}`
                    }}
                    title={`Equipped: ${equippedPaddleDef.name}`}
                  />
                </div>
                <div className="preview-court-shadow" />
              </div>

              <div className="preview-equipped-info">
                <span className="equipped-label">EQUIPPED PADDLE:</span>
                <span className="equipped-title" style={{ color: equippedPaddleDef.color }}>
                  {equippedPaddleDef.name}
                </span>
                <span className="equipped-perk-text">{equippedPaddleDef.perk}</span>
              </div>
            </div>

            {/* Mode & Difficulty Selectors */}
            <div className="arena-controls-row">
              {/* Difficulty Selection */}
              <div className="difficulty-mode-selector">
                <div className="selector-label-row">
                  <span className="selector-label">Difficulty:</span>
                  <span className="difficulty-hint">
                    {difficulty === 'easy' && 'Casual • High AI Errors'}
                    {difficulty === 'medium' && 'Club Match • Balanced AI'}
                    {difficulty === 'hard' && 'Pro Champion • Laser Focus'}
                  </span>
                </div>
                <div className="difficulty-toggle-group">
                  <button
                    className={`diff-btn ${difficulty === 'easy' ? 'active' : ''}`}
                    onClick={() => {
                      sound.playButtonClick();
                      onSetDifficulty('easy');
                    }}
                    type="button"
                  >
                    <span className="diff-name">EASY</span>
                  </button>
                  <button
                    className={`diff-btn ${difficulty === 'medium' ? 'active' : ''}`}
                    onClick={() => {
                      sound.playButtonClick();
                      onSetDifficulty('medium');
                    }}
                    type="button"
                  >
                    <span className="diff-name">MEDIUM</span>
                  </button>
                  <button
                    className={`diff-btn ${difficulty === 'hard' ? 'active' : ''}`}
                    onClick={() => {
                      sound.playButtonClick();
                      onSetDifficulty('hard');
                    }}
                    type="button"
                  >
                    <span className="diff-name">HARD</span>
                  </button>
                </div>
              </div>

              {/* Scoring Mode Selection */}
              <div className="scoring-mode-selector">
                <span className="selector-label">Scoring Rule:</span>
                <div className="mode-toggle-group">
                  <button
                    className={`mode-btn ${scoringMode === 'side-out' ? 'active' : ''}`}
                    onClick={() => {
                      sound.playButtonClick();
                      onSetScoringMode('side-out');
                    }}
                    type="button"
                  >
                    {scoringMode === 'side-out' && <Check size={14} />}
                    <span>Official Side-Out</span>
                  </button>
                  <button
                    className={`mode-btn ${scoringMode === 'rally' ? 'active' : ''}`}
                    onClick={() => {
                      sound.playButtonClick();
                      onSetScoringMode('rally');
                    }}
                    type="button"
                  >
                    {scoringMode === 'rally' && <Check size={14} />}
                    <span>Fast Rally</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Launch Match Button */}
            <div className="arena-actions">
              <button
                type="button"
                className="btn-primary btn-arena-play pulse-glow"
                onClick={handlePlayClick}
                id="btn-play-match"
              >
                <div className="btn-play-content">
                  <Play size={26} fill="currentColor" />
                  <span className="play-text">PLAY MATCH</span>
                </div>
                <div className="play-energy-tag">
                  <Zap size={14} fill="currentColor" />
                  <span>Cost: 1 Energy</span>
                </div>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Render Active Modals */}
      {(!profile || activeModal === 'guestLogin') && <GuestLoginModal />}
      {activeModal === 'daily' && <DailyRewardsModal />}
      {activeModal === 'promos' && <PromosModal />}
      {activeModal === 'locker' && <LockerModal />}
      {activeModal === 'quests' && <QuestsModal />}
      {activeModal === 'profile' && <ProfileModal />}
      {activeModal === 'settings' && <SettingsModal onOpenInstall={onOpenInstall} />}
      {activeModal === 'energyRefill' && <EnergyRefillModal />}
    </div>
  );
};
