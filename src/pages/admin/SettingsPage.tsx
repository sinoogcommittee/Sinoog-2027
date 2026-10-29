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
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
import { TextField } from '../../components/m3/TextField';
import { SelectField } from '../../components/m3/SelectField';
import { Checkbox } from '../../components/m3/Checkbox';

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
          <Button variant="filled" type="submit" loading={saving} leadingIcon={<Save size={18} />}>
            Save all settings
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--md-space-6)', maxWidth: '960px' }}>
          {/* Section 1: Edition & Parish Identity */}
          <Card variant="outlined" style={{ padding: 'var(--md-space-6)' }}>
            <div style={{ marginBottom: 'var(--md-space-4)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-2)', margin: 0, fontSize: '1.25rem' }}>
                <Calendar size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
                Edition & Parish Identity
              </h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
                Official event title, parish name, and geographical location.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--md-space-3)' }}>
              <TextField
                label="Edition Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextField
                label="Parish Name"
                required
                value={parishName}
                onChange={(e) => setParishName(e.target.value)}
              />
              <TextField
                label="Official Location"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <TextField
                label="Official Timezone"
                disabled
                value={timezone}
                helperText="All event schedules are authoritatively stored in Asia/Manila."
              />
            </div>
          </Card>

          {/* Section 2: Sinoog Run operational settings */}
          <Card variant="outlined" style={{ padding: 'var(--md-space-6)' }}>
            <div style={{ marginBottom: 'var(--md-space-4)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-2)', margin: 0, fontSize: '1.25rem' }}>
                <CreditCard size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
                Sinoog Run Registration & GCash
              </h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
                Editable payment destination, registration deadline, and race start time.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--md-space-3)' }}>
              <TextField
                label="GCash Number"
                type="tel"
                inputMode="numeric"
                value={gcashNumber}
                onChange={(e) => setGcashNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                placeholder="09260265423"
              />
              <TextField
                label="GCash Account Name"
                value={gcashAccountName}
                onChange={(e) => setGcashAccountName(e.target.value)}
                placeholder="Add when confirmed"
              />
              <TextField
                label="Registration Opens"
                type="datetime-local"
                value={registrationOpensAt}
                onChange={(e) => setRegistrationOpensAt(e.target.value)}
              />
              <TextField
                label="Registration Deadline"
                type="datetime-local"
                value={registrationClosesAt}
                onChange={(e) => setRegistrationClosesAt(e.target.value)}
                helperText="Leave blank while the deadline is still to be announced."
              />
              <TextField
                label="Race Start Date & Time"
                type="datetime-local"
                value={raceStartsAt}
                onChange={(e) => setRaceStartsAt(e.target.value)}
                helperText="Leave blank until official start time is confirmed."
              />
            </div>
          </Card>

          {/* Section 3: Key Event Dates */}
          <Card variant="outlined" style={{ padding: 'var(--md-space-6)' }}>
            <div style={{ marginBottom: 'var(--md-space-4)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-2)', margin: 0, fontSize: '1.25rem' }}>
                <Calendar size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
                Key Celebration Dates
              </h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
                Governs countdowns and key event labels across the website.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--md-space-3)' }}>
              <TextField
                label="Sinoog Run Date"
                type="date"
                value={runDate}
                onChange={(e) => setRunDate(e.target.value)}
              />
              <TextField
                label="Novena Start Date"
                type="date"
                value={novenaStartDate}
                onChange={(e) => setNovenaStartDate(e.target.value)}
              />
              <TextField
                label="Fiesta & Festival Day"
                type="date"
                value={fiestaDate}
                onChange={(e) => setFiestaDate(e.target.value)}
              />
            </div>
          </Card>

          {/* Section 4: Feature Switches */}
          <Card variant="outlined" style={{ padding: 'var(--md-space-6)' }}>
            <div style={{ marginBottom: 'var(--md-space-4)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-2)', margin: 0, fontSize: '1.25rem' }}>
                <Shield size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
                Feature Availability Switches
              </h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
                Enable or pause public portals and workflows.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-3)' }}>
              <div>
                <Checkbox
                  checked={registrationOpen}
                  onChange={(e) => setRegistrationOpen(e.target.checked)}
                  label="Sinoog Run Registration Open"
                />
                <small style={{ display: 'block', color: 'var(--md-sys-color-on-surface-variant)', marginLeft: '32px' }}>
                  When enabled, eligible participants can submit registration forms and upload payment evidence.
                </small>
              </div>

              <div>
                <Checkbox
                  checked={delegationsEnabled}
                  onChange={(e) => setDelegationsEnabled(e.target.checked)}
                  label="Delegation Submission Portal Open"
                />
                <small style={{ display: 'block', color: 'var(--md-sys-color-on-surface-variant)', marginLeft: '32px' }}>
                  Allows authorized delegation heads to submit participant rosters and musical pieces.
                </small>
              </div>

              <div>
                <Checkbox
                  checked={sponsorsEnabled}
                  onChange={(e) => setSponsorsEnabled(e.target.checked)}
                  label="Display Sponsors Page & Footers"
                />
                <small style={{ display: 'block', color: 'var(--md-sys-color-on-surface-variant)', marginLeft: '32px' }}>
                  Show verified corporate and community benefactors.
                </small>
              </div>

              <div>
                <Checkbox
                  checked={galleryEnabled}
                  onChange={(e) => setGalleryEnabled(e.target.checked)}
                  label="Display Public Media Gallery"
                />
                <small style={{ display: 'block', color: 'var(--md-sys-color-on-surface-variant)', marginLeft: '32px' }}>
                  Enable photo albums and video recordings of previous and current celebrations.
                </small>
              </div>
            </div>
          </Card>

          {/* Section 5: Urgent Public Announcement Banner */}
          <Card variant="outlined" style={{ padding: 'var(--md-space-6)' }}>
            <div style={{ marginBottom: 'var(--md-space-4)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-2)', margin: 0, fontSize: '1.25rem' }}>
                <Bell size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
                Public Announcement Banner
              </h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
                Broadcast high-visibility notifications or emergency advisories across all public pages.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-4)' }}>
              <Checkbox
                checked={bannerEnabled}
                onChange={(e) => setBannerEnabled(e.target.checked)}
                label="Enable announcement banner on website"
              />

              {bannerEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--md-space-3)' }}>
                  <TextField
                    label="Banner Text / Advisory"
                    placeholder="e.g. Weather Advisory: Holy Mass venue transferred to parish hall due to rain."
                    value={bannerText}
                    onChange={(e) => setBannerText(e.target.value)}
                  />
                  <SelectField
                    label="Severity Tone"
                    value={bannerSeverity}
                    onChange={(e) => setBannerSeverity(e.target.value as 'info' | 'warning' | 'alert')}
                  >
                    <option value="info">Information (Blue)</option>
                    <option value="warning">Notice / Caution (Gold)</option>
                    <option value="alert">Urgent / Advisory (Wine Red)</option>
                  </SelectField>
                </div>
              )}
            </div>
          </Card>

          {/* Section 6: Official Committee Contact & Socials */}
          <Card variant="outlined" style={{ padding: 'var(--md-space-6)' }}>
            <div style={{ marginBottom: 'var(--md-space-4)' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-2)', margin: 0, fontSize: '1.25rem' }}>
                <Mail size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
                Official Contacts & Channels
              </h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
                Publicized in the footer and About page for participant inquiries.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--md-space-3)' }}>
              <TextField
                label="Support Email"
                type="email"
                placeholder="e.g. sto.nino.guinacot@gmail.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
              <TextField
                label="Mobile / Telephone"
                type="tel"
                placeholder="e.g. +63 912 345 6789"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
              <TextField
                label="Office Hours"
                placeholder="e.g. Monday - Saturday, 8:00 AM - 5:00 PM"
                value={officeHours}
                onChange={(e) => setOfficeHours(e.target.value)}
              />
              <TextField
                label="Facebook Page URL"
                type="url"
                placeholder="e.g. https://facebook.com/stoninoguinacot"
                value={socialFb}
                onChange={(e) => setSocialFb(e.target.value)}
              />
            </div>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--md-space-2)', marginBottom: 'var(--md-space-6)' }}>
            <Button variant="filled" type="submit" loading={saving} leadingIcon={<Save size={18} />}>
              Save all settings
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
