import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptModalProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  forceShow = false,
  onClose
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Auto-display popup after 1.2s if not previously dismissed in this session
    const hasDismissed = sessionStorage.getItem('pickleball_pwa_dismissed');
    if (!hasDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
    }
  }, [forceShow]);

  if (isInstalled || (!isVisible && !forceShow)) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pickleball_pwa_dismissed', 'true');
    if (onClose) onClose();
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback: browser may not have fired prompt yet, alert friendly tip
      alert('To install, tap your browser menu (⋮ or Share) and select "Add to Home Screen" or "Install App".');
    }
  };

  return (
    <div className="install-popup-overlay" onClick={handleDismiss}>
      <div className="install-popup-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="install-popup-close"
          onClick={handleDismiss}
          aria-label="Close Install Prompt"
        >
          <X size={16} />
        </button>

        <div className="install-popup-body">
          <div className="install-app-badge">
            <img src="/pwa-192x192.png" alt="Pickleball App Icon" className="install-app-icon" />
          </div>

          <div className="install-popup-text">
            <div className="install-popup-title">INSTALL PICKLEBALL APP</div>
            <div className="install-popup-desc">
              {showIOSGuide
                ? 'Follow 2 simple steps to install on iOS:'
                : 'Install for full-screen landscape play, offline matches & instant launch.'}
            </div>
          </div>
        </div>

        {showIOSGuide ? (
          <div className="install-ios-steps">
            <div className="ios-step">
              <span className="step-num">1</span>
              <span>Tap the <Share size={15} className="inline-icon" /> <strong>Share</strong> button in Safari toolbar.</span>
            </div>
            <div className="ios-step">
              <span className="step-num">2</span>
              <span>Scroll down and select <PlusSquare size={15} className="inline-icon" /> <strong>Add to Home Screen</strong>.</span>
            </div>
            <button className="btn-install-dismiss" onClick={handleDismiss}>
              GOT IT
            </button>
          </div>
        ) : (
          <div className="install-popup-actions">
            <button className="btn-install-confirm" onClick={handleInstallClick}>
              <Download size={15} />
              <span>INSTALL NOW</span>
            </button>
            <button className="btn-install-later" onClick={handleDismiss}>
              MAYBE LATER
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
