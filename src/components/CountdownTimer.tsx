import { useEffect, useState } from 'react';

/** Target: Fiesta & Sinoog Festival — 15 January 2027 00:00 Asia/Manila (UTC+8) */
const TARGET_MS = Date.UTC(2027, 0, 14, 16, 0, 0); // 2027-01-15 00:00 PHT

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  past: boolean;
};

function computeTimeLeft(now: number): TimeLeft {
  const diff = TARGET_MS - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, past: false };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function CountdownTimer() {
  const [time, setTime] = useState<TimeLeft>(() => computeTimeLeft(Date.now()));

  useEffect(() => {
    const id = window.setInterval(() => {
      setTime(computeTimeLeft(Date.now()));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (time.past) {
    return (
      <div className="countdown-bar countdown-bar--past" role="status" aria-live="polite">
        <span className="countdown-bar__label">The celebration is underway</span>
        <span className="countdown-bar__tag">Viva Pit Señor!</span>
      </div>
    );
  }

  return (
    <div className="countdown-bar" role="timer" aria-live="off" aria-label="Countdown to Sinoog Festival 2027">
      <div className="countdown-bar__units">
        <div className="countdown-unit">
          <span className="countdown-unit__value">{pad(time.days)}</span>
          <span className="countdown-unit__label">Days</span>
        </div>
        <span className="countdown-sep" aria-hidden>
          :
        </span>
        <div className="countdown-unit">
          <span className="countdown-unit__value">{pad(time.hours)}</span>
          <span className="countdown-unit__label">Hours</span>
        </div>
        <span className="countdown-sep" aria-hidden>
          :
        </span>
        <div className="countdown-unit">
          <span className="countdown-unit__value">{pad(time.minutes)}</span>
          <span className="countdown-unit__label">Mins</span>
        </div>
        <span className="countdown-sep" aria-hidden>
          :
        </span>
        <div className="countdown-unit">
          <span className="countdown-unit__value">{pad(time.seconds)}</span>
          <span className="countdown-unit__label">Secs</span>
        </div>
      </div>
    </div>
  );
}
