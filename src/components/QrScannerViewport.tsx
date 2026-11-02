import type { RefObject } from 'react';
import { Camera, QrCode, ScanLine } from 'lucide-react';

export interface QrScannerViewportProps {
  /**
   * Ref forwarded to the HTML video element that BrowserQRCodeReader attaches to.
   */
  videoRef: RefObject<HTMLVideoElement | null>;
  /**
   * Whether the camera stream is actively scanning.
   */
  active: boolean;
  /**
   * Optional custom CSS class name for the outer viewport wrapper.
   */
  className?: string;
  /**
   * Guidance text displayed in the bottom badge when camera is active.
   * Defaults to 'Align QR code inside frame'.
   */
  hint?: string;
  /**
   * Guidance text displayed in the bottom badge when camera is idle/stopped.
   * Defaults to 'Camera off — tap Start camera'.
   */
  idleHint?: string;
  /**
   * Optional callback when tapping/clicking the viewport while idle (e.g. to start camera).
   */
  onOverlayClick?: () => void;
}

/**
 * Reusable camera viewport with high-contrast targeting guide square (reticle),
 * translucent vignette mask, golden corner brackets, and scanning laser animation.
 * Optimized for both desktop and mobile screens.
 */
export function QrScannerViewport({
  videoRef,
  active,
  className = '',
  hint = 'Align QR code inside frame',
  idleHint = 'Camera off — tap Start camera',
  onOverlayClick,
}: QrScannerViewportProps) {
  return (
    <div
      className={`qr-scanner-viewport ${active ? 'is-active' : 'is-idle'} ${className}`.trim()}
      onClick={!active && onOverlayClick ? onOverlayClick : undefined}
      role={!active && onOverlayClick ? 'button' : undefined}
      tabIndex={!active && onOverlayClick ? 0 : undefined}
      onKeyDown={
        !active && onOverlayClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOverlayClick();
              }
            }
          : undefined
      }
      aria-label={active ? 'QR camera scanner active' : 'QR camera preview (off)'}
    >
      <video ref={videoRef} className="qr-scanner-video" muted playsInline />

      <div className="qr-scanner-overlay" aria-hidden="true">
        {/* Centered Guide Square / Reticle */}
        <div className="qr-scanner-reticle">
          <span className="qr-reticle-corner qr-reticle-corner--tl" />
          <span className="qr-reticle-corner qr-reticle-corner--tr" />
          <span className="qr-reticle-corner qr-reticle-corner--bl" />
          <span className="qr-reticle-corner qr-reticle-corner--br" />

          {active ? (
            <div className="qr-reticle-laser" />
          ) : (
            <div className="qr-reticle-idle-target">
              <QrCode size={36} className="qr-reticle-idle-icon" />
            </div>
          )}
        </div>

        {/* Guidance Badge */}
        <div className="qr-scanner-hint">
          {active ? (
            <>
              <ScanLine size={13} className="qr-hint-icon" />
              <span>{hint}</span>
            </>
          ) : (
            <>
              <Camera size={13} className="qr-hint-icon" />
              <span>{idleHint}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
