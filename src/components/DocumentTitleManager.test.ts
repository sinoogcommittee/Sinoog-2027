// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { getTitleForPath } from '../lib/documentTitle';

describe('DocumentTitleManager', () => {
  it('returns appropriate titles for public pages', () => {
    expect(getTitleForPath('/')).toBe('Sinoog 2027 | Sto. Niño Parish – Guinacot');
    expect(getTitleForPath('/festival')).toBe('Sinoog Festival 2027 | Sto. Niño Parish');
    expect(getTitleForPath('/festival/participants')).toBe('Festival Contingents | Sinoog 2027');
    expect(getTitleForPath('/festival/guidelines')).toBe('Festival Guidelines | Sinoog 2027');
    expect(getTitleForPath('/run')).toBe('Sinoog Run 2027 | Sto. Niño Parish');
    expect(getTitleForPath('/run/routes')).toBe('Routes & Checkpoints | Sinoog Run 2027');
    expect(getTitleForPath('/run/register')).toBe('Runner Registration | Sinoog Run 2027');
    expect(getTitleForPath('/activities')).toBe('Activities & Schedule | Sinoog 2027');
    expect(getTitleForPath('/activities/masses')).toBe('Novena & Fiesta Masses | Sinoog 2027');
    expect(getTitleForPath('/news')).toBe('News & Announcements | Sinoog 2027');
    expect(getTitleForPath('/gallery')).toBe('Photo & Video Gallery | Sinoog 2027');
    expect(getTitleForPath('/sponsors')).toBe('Partners & Sponsors | Sinoog 2027');
    expect(getTitleForPath('/about')).toBe('About Sto. Niño Parish | Sinoog 2027');
  });

  it('returns appropriate titles for committee admin pages', () => {
    expect(getTitleForPath('/admin')).toBe('Overview Dashboard | Committee Workspace');
    expect(getTitleForPath('/admin/registrations')).toBe('Runner Registrations | Committee Workspace');
    expect(getTitleForPath('/admin/kit-claims')).toBe('Race Kit Claiming Desk | Committee Workspace');
    expect(getTitleForPath('/admin/run-timing')).toBe('Race Gun & Timing | Committee Workspace');
    expect(getTitleForPath('/admin/delegations')).toBe('Festival Delegations | Committee Workspace');
    expect(getTitleForPath('/admin/audit')).toBe('Audit History & Security | Committee Workspace');
    expect(getTitleForPath('/admin/finance')).toBe('Financial Records | Committee Workspace');
  });

  it('falls back to default title for unknown or arbitrary routes', () => {
    expect(getTitleForPath('/non-existent-route')).toBe('Sinoog 2027 | Sto. Niño Parish – Guinacot');
  });
});
