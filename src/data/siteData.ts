import type { Activity, NewsPost } from '../types';

export const keyDates = [
  {
    date: 'January 6, 2027',
    label: 'Novena begins',
    note: 'Mass times and celebrants awaiting parish confirmation',
  },
  {
    date: 'January 9, 2027',
    label: 'Sinoog Run',
    note: 'Registration details to be announced',
  },
  {
    date: 'January 15, 2027',
    label: 'Fiesta & Sinoog Festival',
    note: 'Guinacot, Guindulman, Bohol',
  },
];

export const activities: Activity[] = [
  {
    id: '2',
    title: 'Opening Novena Mass',
    type: 'mass',
    date: '2027-01-06',
    time: 'To be announced',
    venue: 'Sto. Niño Parish',
    celebrant: 'To be announced',
  },
  {
    id: '1',
    title: 'Sinoog Run 2027',
    type: 'run',
    date: '2027-01-09',
    time: 'To be announced',
    venue: 'Guinacot, Guindulman',
  },
  {
    id: '3',
    title: 'Pontifical Mass',
    type: 'mass',
    date: '2027-01-15',
    time: 'To be announced',
    venue: 'Sto. Niño Parish',
    celebrant: 'To be announced',
  },
  {
    id: '4',
    title: 'Sinoog Festival 2027',
    type: 'festival',
    date: '2027-01-15',
    time: 'To be announced',
    venue: 'Guinacot, Guindulman',
  },
];

export const news: NewsPost[] = [
  {
    id: '1',
    slug: 'welcome-to-sinoog-2027',
    title: 'Welcome to Sinoog 2027',
    excerpt: 'Preparations have begun for our parish fiesta and festival celebration.',
    category: 'Announcement',
    publishedAt: 'October 26, 2026',
  },
  {
    id: '2',
    slug: 'run-details-coming-soon',
    title: 'Sinoog Run details coming soon',
    excerpt: 'Distances, routes, fees, and kit information will be published after committee confirmation.',
    category: 'Sinoog Run',
    publishedAt: 'October 26, 2026',
  },
  {
    id: '3',
    slug: 'delegation-guidelines',
    title: 'Delegation guidelines in preparation',
    excerpt: 'Delegation heads will receive access to the official submission portal.',
    category: 'Festival',
    publishedAt: 'October 26, 2026',
  },
];