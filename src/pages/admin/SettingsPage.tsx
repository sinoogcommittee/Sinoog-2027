import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { Save, Calendar, Shield, Bell, Mail, CreditCard } from 'lucide-react';
import {
  getCurrentEdition,
  getSiteSettings,
  updateEdition,
  saveSiteSetting,
} from '../../features/editions/editionQueries';
import { LoadingState } from '../../features/ui/FeedbackStates';
import { useToast } from '../../features/ui/useToast';
import type { Edition } from '../../types/database';
import { getRunEventAndCategories, updateRunEventSettings } from '../../features/run/runQueries';

const toManilaInput = (value: string | null) => value
  ? new Date(value).toLocaleString('sv-SE', { timeZone: 'Asia/Manila' }).replace(' ', 'T').slice(0, 16)
  : '';
const fromManilaInput = (value: string) => value ? `${value}:00+08:00` : null;

export function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edition, setEdition] = useState<Edition | null>(null);

  // Form states - Edition core
  const [name, setName] = useState('');
  const [parishName, setParishName] = useState('');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('Asia/Manila');
  const [runDate, setRunDate] = useState('');
  const [novenaStartDate, setNovenaStartDate] = useState('');
  const [fiestaDate, setFiestaDate] = useState('');
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [runEventId, setRunEventId] = useState<string | null>(null);
  const [registrationOpensAt, setRegistrationOpensAt] = useState('');
  const [registrationClosesAt, setRegistrationClosesAt] = useState('');
  const [raceStartsAt, setRaceStartsAt] = useState('');
  const [gcashNumber, setGcashNumber] = useState('09260265423');
  const [gcashAccountName, setGcashAccountName] = useState('');

  // Site settings - Feature switches
  const [delegationsEnabled, setDelegationsEnabled] = useState(false);
  const [sponsorsEnabled, setSponsorsEnabled] = useState(true);
  const [galleryEnabled, setGalleryEnabled] = useState(true);

  // Site settings - Announcement Banner
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerText, setBannerText] = useState('');
  const [bannerSeverity, setBannerSeverity] = useState<'info' | 'warning' | 'alert'>('info');

  // Site settings - Contact Info
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  const [socialFb, setSocialFb] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const ed = await getCurrentEdition();
      setEdition(ed);

      setName(ed.name);
      setParishName(ed.parish_name);
      setLocation(ed.location);
      setTimezone(ed.timezone || 'Asia/Manila');
      setRunDate(ed.run_date || '');
      setNovenaStartDate(ed.novena_start_date || '');
      setFiestaDate(ed.fiesta_date || '');
      setRegistrationOpen(ed.registration_open);

      const { event } = await getRunEventAndCategories(ed.id);
      setRunEventId(event.id);
      setRegistrationOpensAt(toManilaInput(event.registration_opens_at));
      setRegistrationClosesAt(toManilaInput(event.registration_closes_at));
      setRaceStartsAt(toManilaInput(event.race_starts_at));
      setGcashNumber(event.gcash_number || '09260265423');
      setGcashAccountName(event.gcash_account_name || '');

      const settings = await getSiteSettings(ed.id);
      if (settings.announcement_banner) {
        setBannerEnabled(Boolean(settings.announcement_banner.enabled));
        setBannerText(settings.announcement_banner.text || '');
        setBannerSeverity(settings.announcement_banner.severity || 'info');
      }
      if (settings.feature_switches) {
        setDelegationsEnabled(Boolean(settings.feature_switches.delegations_enabled));
        setSponsorsEnabled(settings.feature_switches.sponsors_enabled ?? true);
        setGalleryEnabled(settings.feature_switches.gallery_enabled ?? true);
      }
      if (settings.contact_info) {
        setContactEmail(settings.contact_info.email || '');
        setContactPhone(settings.contact_info.phone || '');
        setOfficeHours(settings.contact_info.office_hours || '');
        setSocialFb(settings.contact_info.social_fb || '');
      }
    } catch (err: unknown) {
      console.error('Failed to load settings:', err);
      toast('Failed to load settings from Supabase.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const ed = await getCurrentEdition();
        if (!mounted) return;
        setEdition(ed);

        setName(ed.name);
        setParishName(ed.parish_name);
        setLocation(ed.location);
        setTimezone(ed.timezone || 'Asia/Manila');
        setRunDate(ed.run_date || '');
        setNovenaStartDate(ed.novena_start_date || '');
        setFiestaDate(ed.fiesta_date || '');
        setRegistrationOpen(ed.registration_open);

        const { event } = await getRunEventAndCategories(ed.id);
        if (!mounted) return;
        setRunEventId(event.id);
        setRegistrationOpensAt(toManilaInput(event.registration_opens_at));
        setRegistrationClosesAt(toManilaInput(event.registration_closes_at));
        setRaceStartsAt(toManilaInput(event.race_starts_at));
        setGcashNumber(event.gcash_number || '09260265423');
        setGcashAccountName(event.gcash_account_name || '');

        const settings = await getSiteSettings(ed.id);
        if (!mounted) return;
        if (settings.announcement_banner) {
          setBannerEnabled(Boolean(settings.announcement_banner.enabled));
          setBannerText(settings.announcement_banner.text || '');
          setBannerSeverity(settings.announcement_banner.severity || 'info');
        }
        if (settings.feature_switches) {
          setDelegationsEnabled(Boolean(settings.feature_switches.delegations_enabled));
          setSponsorsEnabled(settings.feature_switches.sponsors_enabled ?? true);
          setGalleryEnabled(settings.feature_switches.gallery_enabled ?? true);
        }
        if (settings.contact_info) {
          setContactEmail(settings.contact_info.email || '');
          setContactPhone(settings.contact_info.phone || '');
          setOfficeHours(settings.contact_info.office_hours || '');
          setSocialFb(settings.contact_info.social_fb || '');
        }
      } catch (err: unknown) {
        if (!mounted) return;
        console.error('Failed to load settings:', err);
        toast('Failed to load settings from Supabase.', 'error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [toast]);

  const handleSaveAll = async (e: FormEvent) => {
    e.preventDefault();
    if (!edition) return;

    try {
      setSaving(true);

      // 1. Update Edition record
      const { error: edErr } = await updateEdition(edition.id, {
        name,
        parish_name: parishName,
        location,
        timezone,
        run_date: runDate || null,
        novena_start_date: novenaStartDate || null,
        fiesta_date: fiestaDate || null,
        registration_open: registrationOpen,
      });

      if (edErr) {
        throw edErr;
      }

      // 2. Save site settings: announcement banner
      await saveSiteSetting(edition.id, 'announcement_banner', {
        enabled: bannerEnabled,
        text: bannerText,
        severity: bannerSeverity,
      });

      // 3. Save feature switches
      await saveSiteSetting(edition.id, 'feature_switches', {
        registration_enabled: registrationOpen,
        delegations_enabled: delegationsEnabled,
        sponsors_enabled: sponsorsEnabled,
        gallery_enabled: galleryEnabled,
      });

      // 4. Save contact info
      await saveSiteSetting(edition.id, 'contact_info', {
        email: contactEmail,
        phone: contactPhone,
        office_hours: officeHours,
        social_fb: socialFb,
      });

      if (runEventId) {
        await updateRunEventSettings(runEventId, {
          registration_opens_at: fromManilaInput(registrationOpensAt),
          registration_closes_at: fromManilaInput(registrationClosesAt),
          race_starts_at: fromManilaInput(raceStartsAt),
          gcash_number: gcashNumber.trim() || null,
          gcash_account_name: gcashAccountName.trim() || null,
        });
      }

      toast('Website settings saved successfully!', 'success');
      await fetchSettings();
    } catch (err: unknown) {
      console.error('Error saving settings:', err);
      toast(err instanceof Error ? err.message : 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <LoadingState message="Loading website and edition settings…" />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <form onSubmit={(e) => void handleSaveAll(e)}>
        <div className="admin-heading">
          <div>
            <p className="eyebrow">Committee administration</p>
            <h1>Website Settings</h1>
            <p>Configure edition details, public schedules, feature switches, and emergency banners.</p>
          </div>
          <button type="submit" className="button button--primary" disabled={saving}>
            <Save size={18} /> {saving ? 'Saving changes…' : 'Save all settings'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', maxWidth: '960px' }}>
          {/* Section 1: Edition & Parish Identity */}
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <h2>
                  <Calendar size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: '-2px' }} />
                  Edition & Parish Identity
                </h2>
                <p>Official event title, parish name, and geographical location.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', padding: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Edition Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Parish Name
                </label>
                <input
                  type="text"
                  required
                  value={parishName}
                  onChange={(e) => setParishName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Official Location
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Official Timezone
                </label>
                <input
                  type="text"
                  disabled
                  value={timezone}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #e0d8d0', background: '#f5efe6' }}
                />
                <small style={{ color: '#6d6158' }}>All event schedules are authoritatively stored in Asia/Manila.</small>
              </div>
            </div>
          </section>

          {/* Sinoog Run operational settings */}
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <h2>
                  <CreditCard size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: '-2px' }} />
                  Sinoog Run Registration & GCash
                </h2>
                <p>Editable payment destination, registration deadline, and race start time.</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', padding: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>GCash Number</label>
                <input type="tel" inputMode="numeric" value={gcashNumber} onChange={(e) => setGcashNumber(e.target.value.replace(/[^0-9+]/g, ''))} placeholder="09260265423" style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>GCash Account Name</label>
                <input type="text" value={gcashAccountName} onChange={(e) => setGcashAccountName(e.target.value)} placeholder="Add when confirmed" style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>Registration Opens</label>
                <input type="datetime-local" value={registrationOpensAt} onChange={(e) => setRegistrationOpensAt(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>Registration Deadline</label>
                <input type="datetime-local" value={registrationClosesAt} onChange={(e) => setRegistrationClosesAt(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }} />
                <small style={{ color: '#6d6158' }}>Leave blank while the deadline is still to be announced.</small>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>Race Start Date & Time</label>
                <input type="datetime-local" value={raceStartsAt} onChange={(e) => setRaceStartsAt(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }} />
                <small style={{ color: '#6d6158' }}>Leave blank until the official start time is confirmed.</small>
              </div>
            </div>
          </section>

          {/* Section 2: Key Event Dates */}
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <h2>
                  <Calendar size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: '-2px' }} />
                  Key Celebration Dates
                </h2>
                <p>Governs countdowns and key event labels across the website.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', padding: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Sinoog Run Date
                </label>
                <input
                  type="date"
                  value={runDate}
                  onChange={(e) => setRunDate(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Novena Start Date
                </label>
                <input
                  type="date"
                  value={novenaStartDate}
                  onChange={(e) => setNovenaStartDate(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Fiesta & Festival Day
                </label>
                <input
                  type="date"
                  value={fiestaDate}
                  onChange={(e) => setFiestaDate(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Feature Switches */}
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <h2>
                  <Shield size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: '-2px' }} />
                  Feature Availability Switches
                </h2>
                <p>Enable or pause public portals and workflows.</p>
              </div>
            </div>

            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={registrationOpen}
                  onChange={(e) => setRegistrationOpen(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <strong>Sinoog Run Registration Open</strong>
                  <div style={{ fontSize: '0.85rem', color: '#6d6158' }}>
                    When enabled, eligible participants can submit registration forms and upload payment evidence.
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={delegationsEnabled}
                  onChange={(e) => setDelegationsEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <strong>Delegation Submission Portal Open</strong>
                  <div style={{ fontSize: '0.85rem', color: '#6d6158' }}>
                    Allows authorized delegation heads to submit participant rosters and musical pieces.
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={sponsorsEnabled}
                  onChange={(e) => setSponsorsEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <strong>Display Sponsors Page & Footers</strong>
                  <div style={{ fontSize: '0.85rem', color: '#6d6158' }}>
                    Show verified corporate and community benefactors.
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={galleryEnabled}
                  onChange={(e) => setGalleryEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <strong>Display Public Media Gallery</strong>
                  <div style={{ fontSize: '0.85rem', color: '#6d6158' }}>
                    Enable photo albums and video recordings of previous and current celebrations.
                  </div>
                </div>
              </label>
            </div>
          </section>

          {/* Section 4: Urgent Public Announcement Banner */}
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <h2>
                  <Bell size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: '-2px' }} />
                  Public Announcement Banner
                </h2>
                <p>Broadcast high-visibility notifications or emergency advisories across all public pages.</p>
              </div>
            </div>

            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={bannerEnabled}
                  onChange={(e) => setBannerEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <strong>Enable announcement banner on website</strong>
                </div>
              </label>

              {bannerEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                      Banner Text / Advisory
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Weather Advisory: Holy Mass venue transferred to parish hall due to rain."
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                      Severity Tone
                    </label>
                    <select
                      value={bannerSeverity}
                      onChange={(e) => setBannerSeverity(e.target.value as 'info' | 'warning' | 'alert')}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                    >
                      <option value="info">Information (Blue)</option>
                      <option value="warning">Notice / Caution (Gold)</option>
                      <option value="alert">Urgent / Advisory (Wine Red)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 5: Official Committee Contact & Socials */}
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <h2>
                  <Mail size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: '-2px' }} />
                  Official Contacts & Channels
                </h2>
                <p>Publicized in the footer and About page for participant inquiries.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', padding: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Support Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. sto.nino.guinacot@gmail.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Mobile / Telephone
                </label>
                <input
                  type="text"
                  placeholder="e.g. +63 912 345 6789"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Office Hours
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monday - Saturday, 8:00 AM - 5:00 PM"
                  value={officeHours}
                  onChange={(e) => setOfficeHours(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Facebook Page URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://facebook.com/stoninoguinacot"
                  value={socialFb}
                  onChange={(e) => setSocialFb(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                />
              </div>
            </div>
          </section>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', marginBottom: '2rem' }}>
            <button type="submit" className="button button--primary" disabled={saving}>
              <Save size={18} /> {saving ? 'Saving changes…' : 'Save all settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
