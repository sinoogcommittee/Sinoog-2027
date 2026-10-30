/* ── Bespoke Handcrafted Colored Icons Closely Aligned to Admin Functions ── */

/** 1. Overview: Committee Command Desk & Operations Sparkline */
export function AdminOverviewIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Command desk / monitor frame */}
      <rect x="2.5" y="3.5" width="19" height="13" rx="2.5" fill="#4c121b" stroke="#fcc419" strokeWidth="0.9" />
      {/* Status metric mini-cards */}
      <rect x="4.5" y="5.5" width="6.5" height="4.5" rx="1.2" fill="#ff6b6b" />
      <rect x="13" y="5.5" width="6.5" height="4.5" rx="1.2" fill="#ffd43b" />
      <circle cx="7.75" cy="7.75" r="1.3" fill="#ffffff" />
      <circle cx="16.25" cy="7.75" r="1.3" fill="#d9480f" />
      {/* Real-time operational sparkline */}
      <path d="M 5 13.5 L 8.5 11.5 L 11.5 14 L 15 11 L 19 13.5" stroke="#20c997" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Workspace Base Stand */}
      <path d="M 9.5 16.5 L 8 20.5 H 16 L 14.5 16.5" stroke="#ffd43b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="7" y1="20.5" x2="17" y2="20.5" stroke="#ffd43b" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** 2. Activities & Schedule: Liturgical Mass Calendar with Novena Star & Church Bell */
export function AdminActivitiesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Calendar Body */}
      <rect x="3" y="4" width="14" height="17" rx="2.5" fill="#ffffff" stroke="#dee2e6" strokeWidth="0.8" />
      {/* Cardinal Red Liturgical Banner */}
      <path d="M 3 6.5 C 3 5.1 4.1 4 5.5 4 H 14.5 C 15.9 4 17 5.1 17 6.5 V 8.5 H 3 V 6.5 Z" fill="#e03131" />
      {/* Gold Ring Bindings */}
      <rect x="6" y="2.5" width="1.5" height="3" rx="0.75" fill="#fcc419" />
      <rect x="12.5" y="2.5" width="1.5" height="3" rx="0.75" fill="#fcc419" />
      {/* Calendar Grid Dots */}
      <circle cx="6.5" cy="11.5" r="1" fill="#adb5bd" />
      <circle cx="10" cy="11.5" r="1" fill="#adb5bd" />
      <circle cx="13.5" cy="11.5" r="1" fill="#adb5bd" />
      <circle cx="6.5" cy="15" r="1" fill="#adb5bd" />
      {/* Gold Novena Date Badge */}
      <rect x="8.5" y="13.5" width="6.5" height="5" rx="1.5" fill="#ffd43b" />
      <path d="M 11.75 14.2 L 12.2 15.4 H 13.4 L 12.4 16.1 L 12.8 17.3 L 11.75 16.6 L 10.7 17.3 L 11.1 16.1 L 10.1 15.4 H 11.3 Z" fill="#c92a2a" />
      {/* Golden Church Bell */}
      <path d="M 18 10 C 16 10 15 12 15 15 C 14.5 16 14 16.5 14 17.5 H 22 C 22 16.5 21.5 16 21 15 C 21 12 20 10 18 10 Z" fill="#fcc419" stroke="#e67700" strokeWidth="0.8" />
      <circle cx="18" cy="18.5" r="1" fill="#e67700" />
      <path d="M 18 8 V 10" stroke="#fcc419" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** 3. News Posts: Parish Newsletter Bulletin with Blue Headline & Golden Megaphone */
export function AdminNewsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Newspaper Card */}
      <rect x="2" y="4" width="15" height="17" rx="2" fill="#ffffff" stroke="#dee2e6" strokeWidth="0.8" />
      {/* Royal Blue Headline Banner */}
      <rect x="4" y="6" width="11" height="3" rx="0.8" fill="#1c7ed6" />
      {/* News Photo Thumbnail */}
      <rect x="4" y="11" width="4.5" height="4" rx="0.6" fill="#ff8787" />
      {/* Story Lines */}
      <rect x="10" y="11" width="5" height="1" rx="0.5" fill="#868e96" />
      <rect x="10" y="13" width="5" height="1" rx="0.5" fill="#adb5bd" />
      <rect x="4" y="16.5" width="11" height="1" rx="0.5" fill="#868e96" />
      <rect x="4" y="18.5" width="8" height="1" rx="0.5" fill="#adb5bd" />
      {/* Golden Megaphone Speaker */}
      <path d="M 15 12 L 20 9.5 V 17.5 L 15 15 Z" fill="#ffd43b" stroke="#f59f00" strokeWidth="0.8" />
      <rect x="13" y="12" width="2.5" height="3" rx="0.8" fill="#ff6b6b" />
      <path d="M 14 15 L 13 18" stroke="#ff6b6b" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M 21.5 11.5 C 22.5 12.5 22.5 14.5 21.5 15.5" stroke="#ff922b" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** 4. Registrations: Sinoog Fun Run Race Bib with Golden Number Plate & Athlete Check */
export function AdminRegistrationsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Race Bib Card */}
      <rect x="3" y="4" width="18" height="16" rx="2" fill="#ffffff" stroke="#ced4da" strokeWidth="0.8" />
      {/* Emerald Runner Header Strip */}
      <path d="M 3 6 C 3 4.9 3.9 4 5 4 H 19 C 20.1 4 21 4.9 21 6 V 8.5 H 3 V 6 Z" fill="#20c997" />
      {/* Bib Corner Pin Holes */}
      <circle cx="5.5" cy="6.2" r="0.9" fill="#ffffff" />
      <circle cx="18.5" cy="6.2" r="0.9" fill="#ffffff" />
      <circle cx="5.5" cy="17.5" r="0.8" fill="#ced4da" />
      <circle cx="18.5" cy="17.5" r="0.8" fill="#ced4da" />
      {/* Gold Number Plate */}
      <rect x="6.5" y="11" width="11" height="6" rx="1.2" fill="#ffd43b" stroke="#f59f00" strokeWidth="0.6" />
      {/* Runner Checkmark / Athletic Sprint Symbol */}
      <path d="M 8.5 14 L 10.5 15.5 L 15.5 12.2" stroke="#d9480f" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 4b. Kit Claiming: Race Kit Package / Singlet with Verified Handover Badge */
export function AdminKitClaimIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Kit package / tote bag */}
      <rect x="3.5" y="7" width="17" height="13" rx="2.5" fill="#ffffff" stroke="#ced4da" strokeWidth="0.8" />
      {/* Gold Festival Bag Handle */}
      <path d="M 8.5 7 V 4.5 C 8.5 3.4 9.4 2.5 10.5 2.5 H 13.5 C 14.6 2.5 15.5 3.4 15.5 4.5 V 7" stroke="#fcc419" strokeWidth="1.3" strokeLinecap="round" />
      {/* Wine / Crimson Top Banner */}
      <path d="M 3.5 9.5 C 3.5 8.1 4.6 7 6 7 H 18 C 19.4 7 20.5 8.1 20.5 9.5 V 10.5 H 3.5 V 9.5 Z" fill="#841c2b" />
      {/* Race Bib on bag */}
      <rect x="6.5" y="12" width="7" height="5.5" rx="1" fill="#fff9db" stroke="#f59f00" strokeWidth="0.6" />
      <circle cx="8" cy="13.2" r="0.6" fill="#841c2b" />
      <circle cx="12" cy="13.2" r="0.6" fill="#841c2b" />
      <rect x="8" y="14.5" width="4" height="1.8" rx="0.5" fill="#f59f00" />
      {/* Verified Claim Checkmark Badge */}
      <circle cx="16.5" cy="15" r="3.5" fill="#20c997" stroke="#ffffff" strokeWidth="0.8" />
      <path d="M 15 15 L 16.2 16.2 L 18 14" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 5. Race Timing: Checkered Finish Flag with Golden Chronometer Stopwatch */
export function AdminTimingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Checkered Racing Flag Staff */}
      <line x1="3" y1="21" x2="11" y2="3" stroke="#adb5bd" strokeWidth="1.4" strokeLinecap="round" />
      {/* Checkered Flag Wave */}
      <path d="M 8.5 4.5 Q 13 3 17 6 Q 13 8 9.5 9 Z" fill="#ffd43b" stroke="#e67700" strokeWidth="0.6" />
      <path d="M 17 6 Q 13 8 9.5 9 Q 13 11 16.5 13 Q 13.5 12 8 11.5 Z" fill="#212529" />
      {/* Golden Stopwatch */}
      <circle cx="15.5" cy="14.5" r="6" fill="#fff9db" stroke="#fcc419" strokeWidth="1.2" />
      {/* Stopwatch Crown & Start Button */}
      <rect x="14.5" y="7" width="2" height="2" rx="0.5" fill="#f59f00" />
      <circle cx="19" cy="9.5" r="0.9" fill="#e03131" />
      {/* Red Second Hand Needle */}
      <circle cx="15.5" cy="14.5" r="1.1" fill="#e03131" />
      <line x1="15.5" y1="14.5" x2="17.8" y2="11.5" stroke="#e03131" strokeWidth="1.3" strokeLinecap="round" />
      {/* Dial ticks */}
      <circle cx="15.5" cy="10" r="0.6" fill="#868e96" />
      <circle cx="19.5" cy="14.5" r="0.6" fill="#868e96" />
    </svg>
  );
}

/** 6. Delegations: Sinulog Troupe Festival Feathered Crown & Contingent Shield */
export function AdminDelegationsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Left Emerald Troupe Feather */}
      <path d="M 6 8 C 5 2 10 3 11 9 C 9 8 7 8 6 8 Z" fill="#20c997" />
      {/* Center Golden Plume with Crimson Core */}
      <path d="M 12 1 C 9 4 10 8 12 10 C 14 8 15 4 12 1 Z" fill="#ffd43b" />
      <path d="M 12 3 C 11 5 11.5 7 12 8 C 12.5 7 13 5 12 3 Z" fill="#ff6b6b" />
      {/* Right Royal Violet Troupe Feather */}
      <path d="M 18 8 C 19 2 14 3 13 9 C 15 8 17 8 18 8 Z" fill="#9775fa" />
      {/* Delegation Contingent Shield */}
      <path d="M 5 11 Q 12 13 19 11 V 17 C 19 20 12 22.5 12 22.5 C 12 22.5 5 20 5 17 Z" fill="#4c121b" stroke="#fcc419" strokeWidth="0.9" />
      {/* Cross of Sto. Niño on Shield */}
      <path d="M 12 13.5 V 19.5 M 9.5 16 H 14.5" stroke="#ffd43b" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.4" fill="#ff6b6b" />
    </svg>
  );
}

/** 7. Users & Staff: Administrator Security Credentials ID Badge with Key & Shield */
export function AdminUsersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Security ID Badge Card in Royal Violet */}
      <rect x="3" y="4" width="18" height="15" rx="3" fill="#7048e8" stroke="#ffd43b" strokeWidth="0.8" />
      {/* Lanyard Clip Notch */}
      <rect x="10" y="2" width="4" height="2.5" rx="1" fill="#ffd43b" />
      {/* Primary Admin Silhouette in Gold */}
      <circle cx="9.5" cy="9.5" r="2.4" fill="#ffd43b" />
      <path d="M 5.5 16 C 5.5 13.5 7.5 12.8 9.5 12.8 C 11.5 12.8 13.5 13.5 13.5 16 Z" fill="#fff9db" />
      {/* Secondary Team Silhouette in Coral */}
      <circle cx="15.5" cy="9" r="1.8" fill="#ff8787" />
      <path d="M 13.8 15 C 14.2 13.8 15.2 13.2 16.5 13.2 C 17.8 13.2 18.8 13.8 19 15 Z" fill="#ffa8a8" opacity="0.9" />
      {/* Verified Status Badge */}
      <circle cx="18.5" cy="16.5" r="3" fill="#20c997" stroke="#ffffff" strokeWidth="0.8" />
      <path d="M 17.2 16.5 L 18.1 17.4 L 19.8 15.6" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 8. Financial Records: Treasury Ledger Book with Golden Philippine Peso Coin (₱) */
export function AdminFinanceIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Financial Ledger Book */}
      <rect x="3" y="3.5" width="18" height="16" rx="2.5" fill="#2b8a3e" stroke="#fcc419" strokeWidth="0.9" />
      {/* Spine bookmark ribbon */}
      <path d="M 7 3.5 V 10 L 9 8.5 L 11 10 V 3.5" fill="#e03131" />
      {/* Golden Philippine Peso Coin */}
      <circle cx="14" cy="11.5" r="4.8" fill="#ffd43b" stroke="#e67700" strokeWidth="0.9" />
      {/* Peso '₱' Symbol */}
      <text x="14" y="14" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#741f29" fontFamily="system-ui, -apple-system, sans-serif">₱</text>
      {/* Upward Growth Arrow */}
      <path d="M 5.5 16 L 8 13.5 L 10 15 L 12.5 12.5 M 12.5 12.5 H 10 M 12.5 12.5 V 14.5" stroke="#a9e34b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 9. Sponsors: Golden Handshake with Ruby Gratitude Heart & Laurel */
export function AdminSponsorsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Radiant Heart */}
      <path d="M 12 7.5 C 10.5 4.5 6.5 5 6.5 8 C 6.5 11 12 14 12 14 C 12 14 17.5 11 17.5 8 C 17.5 5 13.5 4.5 12 7.5 Z" fill="#ff6b6b" stroke="#e03131" strokeWidth="0.8" />
      <path d="M 9.5 6.5 C 8.5 6.5 7.5 7.2 7.5 8.2" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
      {/* Clasped Hands in Gold and Warm Amber */}
      <path d="M 2 15 L 7 13 L 11 16 L 9 18 L 4 19 Z" fill="#fcc419" stroke="#e67700" strokeWidth="0.6" />
      <path d="M 22 15 L 17 13 L 12 16.5 L 14 18.5 L 20 19 Z" fill="#ff922b" stroke="#d9480f" strokeWidth="0.6" />
      <path d="M 10 15 L 12.5 17.5 M 11.5 14 L 14 16.5" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
      {/* Green Gratitude Laurel Arcs */}
      <path d="M 3 10 C 3 6 6 3 9 2" stroke="#20c997" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.5 2.5" />
      <path d="M 21 10 C 21 6 18 3 15 2" stroke="#20c997" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1.5 2.5" />
    </svg>
  );
}

/** 10. Gallery: Royal Indigo Camera with Golden Flash & Celebration Photo Print */
export function AdminGalleryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Celebration Photo Print */}
      <rect x="9" y="2" width="12" height="11" rx="1.5" transform="rotate(12 15 7.5)" fill="#ffffff" stroke="#ced4da" strokeWidth="0.8" />
      <rect x="10.5" y="3.5" width="9" height="6.5" rx="0.8" transform="rotate(12 15 7.5)" fill="#20c997" />
      <circle cx="16.5" cy="5.5" r="1.2" fill="#ffd43b" />
      {/* Indigo Camera Body */}
      <rect x="2" y="8" width="17" height="13" rx="2.5" fill="#5c7cfa" stroke="#4263eb" strokeWidth="0.8" />
      {/* Gold Flash & Red Record Lamp */}
      <rect x="5" y="6" width="4.5" height="2" rx="0.8" fill="#ffd43b" />
      <circle cx="16" cy="11" r="1" fill="#ff6b6b" />
      {/* Cyan/Amber Concentric Lens */}
      <circle cx="10.5" cy="14.5" r="4.5" fill="#1864ab" stroke="#ffd43b" strokeWidth="1" />
      <circle cx="10.5" cy="14.5" r="2.8" fill="#22b8cf" />
      <circle cx="9.5" cy="13.5" r="1" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}

/** 11. Website Settings: Interlocking Precision Brass Mechanical Gears */
export function AdminSettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Large Golden Cog / Gear */}
      <circle cx="11" cy="11" r="5.5" fill="#fcc419" stroke="#e67700" strokeWidth="0.9" />
      <path d="M 11 3.5 V 5.5 M 11 16.5 V 18.5 M 3.5 11 H 5.5 M 16.5 11 H 18.5 M 5.7 5.7 L 7.1 7.1 M 14.9 14.9 L 16.3 16.3 M 5.7 16.3 L 7.1 14.9 M 14.9 7.1 L 16.3 5.7" stroke="#e67700" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="11" cy="11" r="2.5" fill="#4c121b" />
      <circle cx="11" cy="11" r="1.1" fill="#fff9db" />
      {/* Secondary Teal Control Slider Cog */}
      <circle cx="18" cy="17.5" r="3.2" fill="#20c997" stroke="#099268" strokeWidth="0.8" />
      <path d="M 18 13.5 V 14.5 M 18 20.5 V 21.5 M 14 17.5 H 15 M 21 17.5 H 22" stroke="#099268" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="18" cy="17.5" r="1.1" fill="#ffffff" />
    </svg>
  );
}

/** 12. Public Site: Emerald & Sapphire World Globe with Outbound Launch Arrow */
export function AdminPublicSiteIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Globe Sphere */}
      <circle cx="11" cy="13" r="7.5" fill="#1971c2" stroke="#4dabf7" strokeWidth="0.9" />
      {/* Meridian arcs */}
      <ellipse cx="11" cy="13" rx="3.5" ry="7.5" stroke="#a5d8ff" strokeWidth="0.8" fill="none" />
      <line x1="3.5" y1="13" x2="18.5" y2="13" stroke="#a5d8ff" strokeWidth="0.8" />
      <path d="M 5.5 8.5 Q 11 10.5 16.5 8.5" stroke="#a5d8ff" strokeWidth="0.7" fill="none" />
      <path d="M 5.5 17.5 Q 11 15.5 16.5 17.5" stroke="#a5d8ff" strokeWidth="0.7" fill="none" />
      {/* Outbound Golden Arrow & Launch Badge */}
      <circle cx="18" cy="6" r="4.2" fill="#ffd43b" stroke="#e67700" strokeWidth="0.8" />
      <path d="M 16 6 H 20 M 20 6 V 10 M 20 6 L 15.5 10.5" stroke="#741f29" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 13. Audit History & Activity Log: Security Shield with Ledger Lines & Golden Stamp */
export function AdminAuditIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Security Shield */}
      <path d="M 12 2.5 L 4 5.5 V 11.5 C 4 16.5 7.5 20.5 12 22 C 16.5 20.5 20 16.5 20 11.5 V 5.5 L 12 2.5 Z" fill="#1864ab" stroke="#4dabf7" strokeWidth="0.9" />
      {/* Inner Ledger Sheet */}
      <rect x="7" y="6.5" width="10" height="10" rx="1.5" fill="#ffffff" />
      {/* Ledger Lines */}
      <line x1="9" y1="9" x2="15" y2="9" stroke="#741f29" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="11.5" x2="15" y2="11.5" stroke="#495057" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="9" y1="14" x2="13" y2="14" stroke="#20c997" strokeWidth="1.1" strokeLinecap="round" />
      {/* Golden Inspection Stamp */}
      <circle cx="16.5" cy="16.5" r="3.2" fill="#ffd43b" stroke="#e67700" strokeWidth="0.8" />
      <path d="M 15.2 16.5 L 16.1 17.4 L 17.8 15.7" stroke="#741f29" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 14. Sign Out: Cardinal Liturgical Exit Portal Doorway with Golden Arrow */
export function AdminSignOutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Portal Doorway Frame */}
      <path d="M 10 3.5 H 4.5 C 3.7 3.5 3 4.2 3 5 V 19 C 3 19.8 3.7 20.5 4.5 20.5 H 10" stroke="#ff8787" strokeWidth="1.5" strokeLinecap="round" />
      {/* Cardinal Door Slab slightly ajar */}
      <path d="M 9 4.5 L 4 6.5 V 17.5 L 9 19.5 Z" fill="#e03131" stroke="#c92a2a" strokeWidth="0.8" />
      <circle cx="7.8" cy="12" r="0.8" fill="#ffd43b" />
      {/* Directional Exit Arrow in Gold & Emerald */}
      <path d="M 11 12 H 21 M 17 8 L 21 12 L 17 16" stroke="#ffd43b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
