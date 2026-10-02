import React from 'react';
import { X, Zap, Gem, Gift, Clock } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { sound } from '../game/Audio';

export const EnergyRefillModal: React.FC = () => {
  const { profile, refillEnergyWithGems, setActiveModal } = usePlayer();

  if (!profile) return null;

  const handleRefillGems = () => {
    sound.playButtonClick();
    refillEnergyWithGems();
  };

  const handleGoToPromos = () => {
    sound.playButtonClick();
    setActiveModal('promos');
  };

  return (
    <div className="modal-backdrop-blur">
      <div className="energy-modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Zap size={24} className="text-amber-400" />
            <div>
              <h2 className="modal-title">ENERGY RECHARGE</h2>
              <p className="modal-subtitle">
                Tournament matches require 1 Energy to enter court.
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

        {/* Current status */}
        <div className="energy-status-banner">
          <div className="energy-big-count">
            <Zap size={32} fill="currentColor" className="text-amber-400" />
            <span>
              {profile.energy} / {profile.maxEnergy} Energy
            </span>
          </div>
          <div className="energy-timer-note">
            <Clock size={16} />
            <span>Recharges naturally (+1 energy every 3 minutes)</span>
          </div>
        </div>

        {/* Refill options */}
        <div className="energy-options-grid">
          {/* Option 1: Gems */}
          <div className="energy-option-card">
            <div className="opt-title-row">
              <Gem size={20} className="text-cyan-400" />
              <h4>Instant Full Refill</h4>
            </div>
            <p className="opt-desc">Instantly restore all 10 Energy points.</p>
            <button
              type="button"
              className="btn-primary btn-opt-refill"
              onClick={handleRefillGems}
              disabled={profile.gems < 20}
            >
              <span>REFILL FOR 20 GEMS</span>
              <span className="balance-hint">(You have {profile.gems} 💎)</span>
            </button>
          </div>

          {/* Option 2: Event Promos */}
          <div className="energy-option-card">
            <div className="opt-title-row">
              <Gift size={20} className="text-yellow-400" />
              <h4>Free Event Drops</h4>
            </div>
            <p className="opt-desc">Check the Promos tab for free weekend energy drops!</p>
            <button
              type="button"
              className="btn-secondary btn-opt-promo"
              onClick={handleGoToPromos}
            >
              <span>CHECK PROMOS & GIFTS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
