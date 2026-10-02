import React, { useState } from 'react';
import { X, Settings, Volume2, VolumeX, Maximize2, Download, Database, RotateCcw, AlertTriangle } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { sound } from '../game/Audio';

interface SettingsModalProps {
  onOpenInstall?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onOpenInstall }) => {
  const { resetPlayerData, setActiveModal } = usePlayer();
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getIsMuted());
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) sound.playCoinChime();
  };

  const handleToggleFullscreen = async () => {
    sound.playButtonClick();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen error
    }
  };

  const handleResetData = () => {
    resetPlayerData();
    setActiveModal('guestLogin');
  };

  return (
    <div className="modal-backdrop-blur">
      <div className="settings-modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Settings size={24} className="text-slate-300" />
            <div>
              <h2 className="modal-title">GAME SETTINGS</h2>
              <p className="modal-subtitle">
                Configure audio, display options, and manage local guest storage.
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

        {/* Setting Options List */}
        <div className="settings-list">
          {/* Sound Audio Toggle */}
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-title">Game & UI Sound FX</span>
              <span className="setting-desc">Procedural paddle hit, coin drop, and court sound synthesis</span>
            </div>
            <button
              type="button"
              className={`setting-toggle-btn ${!isMuted ? 'active' : ''}`}
              onClick={handleToggleSound}
            >
              {!isMuted ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <span>{!isMuted ? 'AUDIO ON' : 'MUTED'}</span>
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-title">Fullscreen Mode</span>
              <span className="setting-desc">Expand court enclosure to full device display</span>
            </div>
            <button
              type="button"
              className="setting-toggle-btn"
              onClick={handleToggleFullscreen}
            >
              <Maximize2 size={18} />
              <span>FULLSCREEN</span>
            </button>
          </div>

          {/* Install PWA Prompt */}
          {onOpenInstall && (
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-title">Install App (PWA)</span>
                <span className="setting-desc">Install onto home screen for offline gameplay</span>
              </div>
              <button
                type="button"
                className="setting-toggle-btn pwa-btn"
                onClick={() => {
                  sound.playButtonClick();
                  onOpenInstall();
                }}
              >
                <Download size={18} />
                <span>INSTALL APP</span>
              </button>
            </div>
          )}
        </div>

        {/* Database Status Card */}
        <div className="database-status-card">
          <div className="db-card-header">
            <Database size={16} className="text-cyan-400" />
            <span className="db-status-title">DATABASE ARCHITECTURE: STANDALONE LOCALSTORAGE</span>
          </div>
          <p className="db-card-desc">
            No remote database is currently attached. All currency balances, unlocked paddles, quest progress, and claimed promos are preserved in browser storage. Future versions will support seamless cloud database account synchronization.
          </p>
        </div>

        {/* Reset Section */}
        <div className="reset-section">
          {!confirmReset ? (
            <button
              type="button"
              className="btn-danger-outline"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw size={16} />
              <span>Reset Game & Guest Data</span>
            </button>
          ) : (
            <div className="confirm-reset-box">
              <div className="confirm-text">
                <AlertTriangle size={18} className="text-red-400" />
                <span>Are you sure? This will wipe your coins, gems, and unlocked paddles.</span>
              </div>
              <div className="confirm-buttons">
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleResetData}
                >
                  YES, RESET ALL
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setConfirmReset(false)}
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
