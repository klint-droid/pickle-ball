import React from 'react';
import { X, ArrowRight } from 'lucide-react';

interface ControlsProps {
  onClose: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content controls-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>CONTROLS & OFFICIAL PICKLEBALL RULES</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Controls Layout */}
        <div className="controls-grid">
          {/* Player 1 Card (Mouse Hover) */}
          <div className="control-player-box p1-box">
            <div className="box-title p1-text">
              PLAYER 1 (MOUSE / TOUCH)
            </div>
            <div className="key-layout">
              <div className="key-row">
                <kbd className="key key-wide">MOUSE HOVER</kbd>
                <span className="key-desc">Glide cursor anywhere on court to move paddle</span>
              </div>
              <div className="key-row">
                <kbd className="key key-wide">LEFT CLICK</kbd>
                <span className="key-desc">Swing / Smash (or hit on paddle contact)</span>
              </div>
              <div className="key-row">
                <span className="key-desc" style={{ fontSize: 11, opacity: 0.8 }}>
                  Keyboard backup: <kbd className="key key-small">W</kbd><kbd className="key key-small">A</kbd><kbd className="key key-small">S</kbd><kbd className="key key-small">D</kbd> + <kbd className="key key-small">SPACE</kbd>
                </span>
              </div>
            </div>
          </div>

          {/* Player 2 Card (Smart AI / Local 2P) */}
          <div className="control-player-box p2-box">
            <div className="box-title p2-text">
              PLAYER 2 (AI / LOCAL 2P)
            </div>
            <div className="key-layout">
              <div className="key-row">
                <span className="key-desc" style={{ color: '#f8fafc', fontWeight: 600 }}>
                  Controlled by AI opponent automatically
                </span>
              </div>
              <div className="key-row">
                <div className="key-cluster">
                  <div className="key-cluster-row">
                    <kbd className="key key-small">↑</kbd>
                  </div>
                  <div className="key-cluster-row">
                    <kbd className="key key-small">←</kbd>
                    <kbd className="key key-small">↓</kbd>
                    <kbd className="key key-small">→</kbd>
                  </div>
                </div>
                <span className="key-desc">Arrows to take over P2 manually</span>
              </div>
              <div className="key-row">
                <kbd className="key key-small">ENTER</kbd>
                <span className="key-desc">P2 manual hit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Hit-Assist & Trajectory UX Guide */}
        <div className="hit-assist-guide-card">
          <div className="rules-header">
            <span>TRAJECTORY & HIT ASSISTANCE</span>
          </div>
          <div className="hit-guide-grid">
            <div className="hit-guide-item">
              <div className="hit-visual-tag tag-green">HIT WINDOW</div>
              <p>Paddle ring highlights when the ball is within reach and legal to strike. Click, tap, or glide into it to return.</p>
            </div>
            <div className="hit-guide-item">
              <div className="hit-visual-tag tag-red">BOUNCE REQUIRED</div>
              <p>Appears if volleying would trigger a fault (inside the Kitchen or during the Two-Bounce rule). Wait for bounce.</p>
            </div>
            <div className="hit-guide-item">
              <div className="hit-visual-tag tag-blue">LANDING RETICLE</div>
              <p>Crosshair on the court floor displays arrival position, with timing ring closing inward as the ball descends.</p>
            </div>
          </div>
        </div>

        {/* Official Pickleball Rules Card */}
        <div className="pickleball-rules-card">
          <div className="rules-header">
            <span>AUTHENTIC PICKLEBALL RULES</span>
          </div>

          <div className="rules-list">
            <div className="rule-item">
              <strong className="rule-badge">1. Two-Bounce Rule:</strong>
              <span>
                Both the serve and the return of serve <em>must bounce</em> before being returned. Volleying during either of the first two shots triggers an authentic <strong>Two-Bounce Fault</strong>!
              </span>
            </div>

            <div className="rule-item">
              <strong className="rule-badge">2. Non-Volley Zone (The Kitchen):</strong>
              <span>
                You <em>cannot</em> volley (hit the ball in mid-air before a bounce) while touching or standing inside the Kitchen. You may only hit inside the Kitchen if the ball has already bounced (a "dink")!
              </span>
            </div>

            <div className="rule-item">
              <strong className="rule-badge">3. Side-Out Scoring:</strong>
              <span>
                Only the serving player can score points. If the receiver wins a rally, they earn a <strong>Side-Out</strong> (the serve transfers to them). First to 11 points wins!
              </span>
            </div>

            <div className="rule-item">
              <strong className="rule-badge">4. Diagonal Serving:</strong>
              <span>
                Serves must be struck crosscourt from behind the baseline and must clear the Kitchen lines into the opposite diagonal service box.
              </span>
            </div>
          </div>
        </div>

        <button className="btn-primary modal-close-btn" onClick={onClose}>
          <span>LET'S PLAY PICKLEBALL</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
