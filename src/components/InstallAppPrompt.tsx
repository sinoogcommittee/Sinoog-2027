import { useEffect, useMemo, useState } from 'react';
import { Download, MonitorDown, Share, Smartphone, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type InstallPlatform = 'ios' | 'android' | 'mac-safari' | 'desktop';

function getPlatform(): InstallPlatform {
  const userAgent = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  if (/Macintosh/i.test(userAgent) && /Safari/i.test(userAgent) && !/Chrome|Chromium|Edg/i.test(userAgent)) return 'mac-safari';
  return 'desktop';
}

function isInstalled(): boolean {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

export function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const platform = useMemo(() => getPlatform(), []);

  useEffect(() => {
    if (isInstalled() || sessionStorage.getItem('sinoog-install-dismissed') === 'yes') return;

    const revealTimer = window.setTimeout(() => setVisible(true), 1800);
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const handleInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
      sessionStorage.setItem('sinoog-install-dismissed', 'yes');
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.clearTimeout(revealTimer);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem('sinoog-install-dismissed', 'yes');
  };

  const handleInstall = async () => {
    if (!installEvent) {
      setShowSteps(true);
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === 'accepted') setVisible(false);
    else setShowSteps(true);
  };

  if (!visible) return null;

  return (
    <aside className="install-app-prompt" aria-labelledby="install-app-title" aria-live="polite">
      <button type="button" className="install-app-prompt__close" onClick={dismiss} aria-label="Dismiss install app message">
        <X size={18} />
      </button>
      <img src="/images/hero_section_art.webp" alt="" className="install-app-prompt__icon" />
      <div className="install-app-prompt__content">
        <span className="eyebrow">Keep Sinoog close</span>
        <h2 id="install-app-title">Install Sinoog 2027</h2>
        <p>Open schedules, news, registration, and the gallery from your home screen or desktop.</p>
        {showSteps && (
          <div className="install-app-prompt__steps">
            {platform === 'ios' ? (
              <><Share size={18} /><span>Tap <strong>Share</strong>, choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</span></>
            ) : platform === 'android' ? (
              <><Smartphone size={18} /><span>Open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span></>
            ) : platform === 'mac-safari' ? (
              <><MonitorDown size={18} /><span>In Safari, choose <strong>File → Add to Dock</strong>.</span></>
            ) : (
              <><MonitorDown size={18} /><span>Use the install icon in the address bar, or open the browser menu and choose <strong>Install Sinoog 2027</strong>.</span></>
            )}
          </div>
        )}
        <div className="install-app-prompt__actions">
          <button type="button" className="button button--primary button--sm" onClick={() => showSteps && !installEvent ? dismiss() : void handleInstall()}>
            <Download size={16} /> {installEvent ? 'Install app' : showSteps ? 'Got it' : 'How to install'}
          </button>
          <button type="button" className="button button--ghost button--sm" onClick={dismiss}>Not now</button>
        </div>
      </div>
    </aside>
  );
}
