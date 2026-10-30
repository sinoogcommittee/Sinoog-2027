const ROUTE_TITLES: Array<[RegExp, string]> = [
  // Public subpages & sections
  [/^\/festival\/participants\/?$/, 'Festival Contingents | Sinoog 2027'],
  [/^\/festival\/guidelines\/?$/, 'Festival Guidelines | Sinoog 2027'],
  [/^\/festival\/?$/, 'Sinoog Festival 2027 | Sto. Niño Parish'],
  [/^\/run\/routes\/?$/, 'Routes & Checkpoints | Sinoog Run 2027'],
  [/^\/run\/register\/?$/, 'Runner Registration | Sinoog Run 2027'],
  [/^\/run\/?$/, 'Sinoog Run 2027 | Sto. Niño Parish'],
  [/^\/activities\/masses\/?$/, 'Novena & Fiesta Masses | Sinoog 2027'],
  [/^\/activities\/nightly\/?$/, 'Nightly Activities | Sinoog 2027'],
  [/^\/activities\/?$/, 'Activities & Schedule | Sinoog 2027'],
  [/^\/news\/[^/]+\/?$/, 'News Article | Sinoog 2027'],
  [/^\/news\/?$/, 'News & Announcements | Sinoog 2027'],
  [/^\/gallery\/?$/, 'Photo & Video Gallery | Sinoog 2027'],
  [/^\/sponsors\/?$/, 'Partners & Sponsors | Sinoog 2027'],
  [/^\/about\/?$/, 'About Sto. Niño Parish | Sinoog 2027'],
  [/^\/privacy\/?$/, 'Privacy Notice | Sinoog 2027'],
  [/^\/terms\/?$/, 'Terms & Runner Waiver | Sinoog 2027'],
  [/^\/signin\/?$/, 'Runner Sign In | Sinoog 2027'],
  [/^\/account\/?$/, 'My Account & Digital Pass | Sinoog 2027'],
  [/^\/login\/?$/, 'Staff Login | Sinoog 2027'],
  [/^\/forgot-password\/?$/, 'Reset Password | Sinoog 2027'],

  // Committee Workspace routes
  [/^\/admin\/activities\/?$/, 'Activities & Schedule | Committee Workspace'],
  [/^\/admin\/posts\/?$/, 'News Posts | Committee Workspace'],
  [/^\/admin\/registrations\/?$/, 'Runner Registrations | Committee Workspace'],
  [/^\/admin\/kit-claims\/?$/, 'Race Kit Claiming Desk | Committee Workspace'],
  [/^\/admin\/run-timing\/?$/, 'Race Gun & Timing | Committee Workspace'],
  [/^\/admin\/delegations\/?$/, 'Festival Delegations | Committee Workspace'],
  [/^\/admin\/users\/?$/, 'Users & Staff | Committee Workspace'],
  [/^\/admin\/finance\/?$/, 'Financial Records | Committee Workspace'],
  [/^\/admin\/sponsors\/?$/, 'Sponsors Management | Committee Workspace'],
  [/^\/admin\/gallery\/?$/, 'Gallery Management | Committee Workspace'],
  [/^\/admin\/audit\/?$/, 'Audit History & Security | Committee Workspace'],
  [/^\/admin\/settings\/?$/, 'Website Settings | Committee Workspace'],
  [/^\/admin\/?$/, 'Overview Dashboard | Committee Workspace'],

  // Home route
  [/^\/?$/, 'Sinoog 2027 | Sto. Niño Parish – Guinacot'],
];

export function getTitleForPath(pathname: string): string {
  for (const [pattern, title] of ROUTE_TITLES) {
    if (pattern.test(pathname)) {
      return title;
    }
  }
  return 'Sinoog 2027 | Sto. Niño Parish – Guinacot';
}
