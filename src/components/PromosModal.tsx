import React, { useState } from 'react';
import { X, Tag, Gift, Check, Sparkles, AlertCircle, Zap, Coins, Gem, ArrowRight } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { PROMO_CODES, EVENT_PROMOS } from '../services/playerStore';
import { sound } from '../game/Audio';

export const PromosModal: React.FC = () => {
  const {
    profile,
    redeemPromoCode,
    claimEventPromo,
    setActiveModal
  } = usePlayer();

  const [activeTab, setActiveTab] = useState<'codes' | 'events'>('codes');
  const [codeInput, setCodeInput] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!profile) return null;

  const handleRedeem = (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const targetCode = (customCode || codeInput).trim().toUpperCase();
    if (!targetCode) return;

    sound.playButtonClick();
    const res = redeemPromoCode(targetCode);
    if (res.success) {
      setMessage({ text: `${res.message} ${res.details || ''}`, isError: false });
      setCodeInput('');
    } else {
      setMessage({ text: res.message, isError: true });
    }
  };

  const handleClaimEvent = (eventId: string) => {
    sound.playButtonClick();
    const res = claimEventPromo(eventId);
    if (res.success) {
      setMessage({ text: res.message, isError: false });
    } else {
      setMessage({ text: res.message, isError: true });
    }
  };

  return (
    <div className="modal-backdrop-blur">
      <div className="promos-modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Tag size={24} className="text-yellow-400" />
            <div>
              <h2 className="modal-title">PROMOS & SPECIAL BUNDLES</h2>
              <p className="modal-subtitle">
                Redeem community promo gift codes and claim free limited-time tournament event packs.
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

        {/* Tab Switcher */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab ${activeTab === 'codes' ? 'active' : ''}`}
            onClick={() => {
              sound.playButtonClick();
              setActiveTab('codes');
              setMessage(null);
            }}
          >
            <Tag size={16} />
            <span>Redeem Promo Codes</span>
          </button>
          <button
            type="button"
            className={`modal-tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => {
              sound.playButtonClick();
              setActiveTab('events');
              setMessage(null);
            }}
          >
            <Gift size={16} />
            <span>Event Bundles & Drops</span>
          </button>
        </div>

        {/* Toast Alert */}
        {message && (
          <div className={`promo-toast-alert ${message.isError ? 'error' : 'success'}`}>
            {message.isError ? <AlertCircle size={18} /> : <Sparkles size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab 1: Promo Code Input */}
        {activeTab === 'codes' && (
          <div className="promo-codes-pane">
            <form onSubmit={(e) => handleRedeem(e)} className="promo-input-form">
              <label htmlFor="promo-code-input" className="form-label">
                Enter Promo Code:
              </label>
              <div className="promo-input-row">
                <input
                  id="promo-code-input"
                  type="text"
                  className="game-input promo-input"
                  placeholder="e.g. WELCOME2026"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  maxLength={20}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="submit" className="btn-primary btn-redeem" id="btn-redeem-code">
                  <span>REDEEM</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>

            {/* Active Codes List (Quick-Click to autofill/test) */}
            <div className="active-codes-section">
              <h3 className="section-heading">
                <Sparkles size={16} className="text-yellow-400" />
                <span>ACTIVE COMMUNITY PROMO CODES (TAP TO CLAIM)</span>
              </h3>

              <div className="codes-chips-grid">
                {PROMO_CODES.map((promo) => {
                  const isRedeemed = profile.redeemedPromos.includes(promo.code);
                  return (
                    <div
                      key={promo.code}
                      className={`code-chip-card ${isRedeemed ? 'redeemed' : ''}`}
                    >
                      <div className="code-chip-header">
                        <span className="code-text">{promo.code}</span>
                        {isRedeemed ? (
                          <span className="badge-redeemed">REDEEMED</span>
                        ) : (
                          <button
                            type="button"
                            className="btn-quick-claim"
                            onClick={() => handleRedeem(undefined, promo.code)}
                          >
                            CLAIM
                          </button>
                        )}
                      </div>
                      <p className="code-desc">{promo.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Special Event Promos */}
        {activeTab === 'events' && (
          <div className="events-pane">
            <div className="events-grid">
              {EVENT_PROMOS.map((event) => {
                const isClaimed = profile.claimedEvents.includes(event.id);
                return (
                  <div key={event.id} className={`event-promo-card ${isClaimed ? 'claimed' : ''}`}>
                    <div className="event-card-top">
                      <span className="event-icon-badge">{event.icon}</span>
                      <div className="event-title-wrap">
                        <div className="event-badge-tag">{event.badge}</div>
                        <h4 className="event-card-title">{event.title}</h4>
                      </div>
                    </div>

                    <p className="event-card-desc">{event.description}</p>

                    <div className="event-rewards-row">
                      {event.coins > 0 && (
                        <span className="event-reward-tag">
                          <Coins size={14} className="text-yellow-400" />
                          +{event.coins.toLocaleString()}
                        </span>
                      )}
                      {event.gems > 0 && (
                        <span className="event-reward-tag">
                          <Gem size={14} className="text-cyan-400" />
                          +{event.gems}
                        </span>
                      )}
                      {event.energy && (
                        <span className="event-reward-tag">
                          <Zap size={14} className="text-amber-400" />
                          +{event.energy} Energy
                        </span>
                      )}
                    </div>

                    <div className="event-card-action">
                      {isClaimed ? (
                        <button type="button" className="btn-event-claimed" disabled>
                          <Check size={16} />
                          <span>CLAIMED</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary btn-event-claim"
                          onClick={() => handleClaimEvent(event.id)}
                        >
                          <Gift size={16} />
                          <span>CLAIM FREE BUNDLE</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="daily-modal-footer">
          <span>✨ Promo codes and event bundles grant instant coins, gems, energy and rare gear without requiring a database!</span>
        </div>
      </div>
    </div>
  );
};
