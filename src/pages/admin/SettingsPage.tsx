import { useEffect, useState, useCallback, useRef, useId, type FormEvent } from 'react';
import { Save, Calendar, Shield, Bell, Mail, CreditCard, Printer, Upload, PackageOpen, Trash2, Plus, Star } from 'lucide-react';
import {
  getCurrentEdition,
  getSiteSettings,
  updateEdition,
  saveSiteSetting,
} from '../../features/editions/editionQueries';
import { LoadingState } from '../../features/ui/FeedbackStates';
import { useToast } from '../../features/ui/useToast';
import type { Edition, DbRunRegistration, Json } from '../../types/database';
import { getRunEventAndCategories, updateRunEventSettings, getAllRegistrationsForAdmin, type RunCategory } from '../../features/run/runQueries';
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
import { TextField } from '../../components/m3/TextField';
import { SelectField } from '../../components/m3/SelectField';
import { Checkbox } from '../../components/m3/Checkbox';
import { RaceBibPrintSheet } from '../../components/run/RaceBibPrintSheet';
import { supabase } from '../../lib/supabase';

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

  // Site settings - Race Bibs & Logo
  const [bibLogoUrl, setBibLogoUrl] = useState<string>(() => {
    return localStorage.getItem('sinoog_bib_logo_url') || '/images/sinoog_run_logo.png';
  });
  const [uploadingBibLogo, setUploadingBibLogo] = useState(false);
  const [bibPrintModalOpen, setBibPrintModalOpen] = useState(false);
  const [registrations, setRegistrations] = useState<DbRunRegistration[]>([]);
  const [categories, setCategories] = useState<RunCategory[]>([]);
  const [settingsCategory, setSettingsCategory] = useState<'all' | 'parish' | 'run' | 'system'>('all');
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputId = useId();

  // Site settings - Official Race Kits per Category
  interface CategoryRaceKitState {
    image_url: string;
    images: string[];
    description: string;
  }
  const [raceKits, setRaceKits] = useState<Record<string, CategoryRaceKitState>>({});
  const [uploadingKitCategoryId, setUploadingKitCategoryId] = useState<string | null>(null);
  const kitFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

      const [{ event, categories: cats }, regs] = await Promise.all([
        getRunEventAndCategories(ed.id),
        getAllRegistrationsForAdmin().catch(() => []),
      ]);
      setCategories(cats);
      setRegistrations(regs);
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
      if (settings.race_bib?.logo_url) {
        setBibLogoUrl(settings.race_bib.logo_url);
        localStorage.setItem('sinoog_bib_logo_url', settings.race_bib.logo_url);
      }

      // Official Committee Kit Inclusions defaults
      const COMMITTEE_KIT_DESCRIPTIONS: Record<string, string> = {
        '3000': 'Official Sinoog 2027 Event Shirt, Race Bib, Finisher Medal, Post-race Refreshment',
        '5000': 'Official Sinoog 2027 Event Sublimation Shirt or Singlet, Race Bib, Finisher Medal, Post-race Refreshment',
        '10000': 'Official Sinoog 2027 Event Sublimation Shirt or Singlet, Race Bib, Finisher Medal, Finisher Shirt, Post-race Refreshment',
      };

      // Initialize race kits from settings or localStorage fallback
      const initialKits: Record<string, CategoryRaceKitState> = {};
      const sourceKits = settings.race_kits?.kits || (() => {
        try {
          const cached = localStorage.getItem('sinoog_race_kits');
          return cached ? JSON.parse(cached) : {};
        } catch {
          return {};
        }
      })();

      if (sourceKits && typeof sourceKits === 'object') {
        for (const [k, v] of Object.entries(sourceKits as Record<string, Record<string, unknown>>)) {
          const rawImages = Array.isArray(v.images)
            ? (v.images as string[]).filter(Boolean)
            : v.image_url
              ? [v.image_url as string]
              : [];
          initialKits[k] = {
            image_url: rawImages[0] || (v.image_url as string) || '',
            images: rawImages,
            description: (v.description as string) || '',
          };
        }
      }

      // Populate any category that does not yet have an entry in initialKits
      cats.forEach((c) => {
        const committeeDesc = COMMITTEE_KIT_DESCRIPTIONS[c.distance_meters.toString()] || c.kit_description || '';
        if (!initialKits[c.id]) {
          initialKits[c.id] = {
            image_url: '',
            images: [],
            description: committeeDesc,
          };
        } else {
          if (!Array.isArray(initialKits[c.id].images)) {
            initialKits[c.id].images = initialKits[c.id].image_url ? [initialKits[c.id].image_url] : [];
          }
          if (!initialKits[c.id].description) {
            initialKits[c.id].description = committeeDesc;
          }
        }
      });
      setRaceKits(initialKits);
    } catch (err: unknown) {
      console.error('Failed to load settings:', err);
      toast('Failed to load settings from Supabase.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

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

      // 5. Save race bib settings
      await saveSiteSetting(edition.id, 'race_bib', {
        logo_url: bibLogoUrl,
      });

      // 6. Save official race kits settings
      await saveSiteSetting(edition.id, 'race_kits', {
        kits: raceKits,
        updated_at: new Date().toISOString(),
      } as unknown as Json);
      try {
        localStorage.setItem('sinoog_race_kits', JSON.stringify(raceKits));
      } catch {
        // ignore
      }

      // 7. Synchronize updated kit descriptions to run_categories in database
      if (supabase && categories.length > 0) {
        for (const cat of categories) {
          const updatedDesc = raceKits[cat.id]?.description;
          if (updatedDesc !== undefined && updatedDesc !== cat.kit_description) {
            try {
              await supabase
                .from('run_categories')
                .update({ kit_description: updatedDesc.trim() || null })
                .eq('id', cat.id);
            } catch (catErr) {
              console.warn(`Could not update category description for ${cat.id}:`, catErr);
            }
          }
        }
      }

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

  const handleUploadBibLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !edition) return;

    try {
      setUploadingBibLogo(true);
      if (supabase) {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `branding/sinoog_run_bib_logo_${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('public-media')
          .upload(fileName, file, { upsert: true });

        if (!uploadErr) {
          const {
            data: { publicUrl },
          } = supabase.storage.from('public-media').getPublicUrl(fileName);
          setBibLogoUrl(publicUrl);
          localStorage.setItem('sinoog_bib_logo_url', publicUrl);
          await saveSiteSetting(edition.id, 'race_bib', { logo_url: publicUrl });
          toast('Sinoog Run bib logo updated successfully! All bibs will now use this logo.', 'success');
          return;
        }
      }

      // Local fallback
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        if (resultUrl) {
          setBibLogoUrl(resultUrl);
          localStorage.setItem('sinoog_bib_logo_url', resultUrl);
          toast('Sinoog Run bib logo updated locally!', 'success');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Bib logo upload failed:', err);
      toast('Failed to upload bib logo.', 'error');
    } finally {
      setUploadingBibLogo(false);
    }
  };

  const handleUploadKitPhotos = async (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !edition) return;

    try {
      setUploadingKitCategoryId(categoryId);
      const cat = categories.find((c) => c.id === categoryId);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `race-kits/kit_${categoryId}_${Date.now()}_${i}.${fileExt}`;

        let uploadedUrl: string | null = null;
        if (supabase) {
          const { error: uploadErr } = await supabase.storage
            .from('public-media')
            .upload(fileName, file, { upsert: true });

          if (!uploadErr) {
            const {
              data: { publicUrl },
            } = supabase.storage.from('public-media').getPublicUrl(fileName);
            uploadedUrl = publicUrl;
          } else {
            console.warn('Supabase storage upload failed, falling back to local FileReader:', uploadErr);
          }
        }

        if (!uploadedUrl) {
          uploadedUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve((event.target?.result as string) || '');
            reader.readAsDataURL(file);
          });
        }

        if (uploadedUrl) {
          uploadedUrls.push(uploadedUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        const currentData = raceKits[categoryId] || {
          images: [],
          image_url: '',
          description: cat?.kit_description || '',
        };
        const existingImages = Array.isArray(currentData.images)
          ? currentData.images
          : currentData.image_url
            ? [currentData.image_url]
            : [];
        const combinedImages = [...existingImages, ...uploadedUrls];

        const updatedKits: Record<string, CategoryRaceKitState> = {
          ...raceKits,
          [categoryId]: {
            ...currentData,
            images: combinedImages,
            image_url: combinedImages[0] || '',
          },
        };
        setRaceKits(updatedKits);
        try {
          localStorage.setItem('sinoog_race_kits', JSON.stringify(updatedKits));
        } catch {
          // ignore
        }
        await saveSiteSetting(edition.id, 'race_kits', {
          kits: updatedKits,
          updated_at: new Date().toISOString(),
        } as unknown as Json);
        toast(`Uploaded ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} for ${cat?.name || 'category'}!`, 'success');
      }
    } catch (err) {
      console.error('Race kit photo upload failed:', err);
      toast('Failed to upload race kit photo(s).', 'error');
    } finally {
      setUploadingKitCategoryId(null);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleRemoveKitPhotoIndex = async (categoryId: string, indexToRemove: number) => {
    const cat = categories.find((c) => c.id === categoryId);
    const currentData = raceKits[categoryId] || {
      images: [],
      image_url: '',
      description: cat?.kit_description || '',
    };
    const currentImages = Array.isArray(currentData.images)
      ? currentData.images
      : currentData.image_url
        ? [currentData.image_url]
        : [];
    const updatedImages = currentImages.filter((_, idx) => idx !== indexToRemove);

    const updatedKits: Record<string, CategoryRaceKitState> = {
      ...raceKits,
      [categoryId]: {
        ...currentData,
        images: updatedImages,
        image_url: updatedImages[0] || '',
      },
    };
    setRaceKits(updatedKits);
    try {
      localStorage.setItem('sinoog_race_kits', JSON.stringify(updatedKits));
    } catch {
      // ignore
    }
    if (edition) {
      await saveSiteSetting(edition.id, 'race_kits', {
        kits: updatedKits,
        updated_at: new Date().toISOString(),
      } as unknown as Json);
    }
    toast(`Photo removed from ${cat?.name || 'category'}.`, 'info');
  };

  const handleSetPrimaryKitPhoto = async (categoryId: string, indexToMakePrimary: number) => {
    const cat = categories.find((c) => c.id === categoryId);
    const currentData = raceKits[categoryId] || {
      images: [],
      image_url: '',
      description: cat?.kit_description || '',
    };
    const currentImages = Array.isArray(currentData.images)
      ? [...currentData.images]
      : currentData.image_url
        ? [currentData.image_url]
        : [];
    if (indexToMakePrimary <= 0 || indexToMakePrimary >= currentImages.length) return;
    const [selected] = currentImages.splice(indexToMakePrimary, 1);
    currentImages.unshift(selected);

    const updatedKits: Record<string, CategoryRaceKitState> = {
      ...raceKits,
      [categoryId]: {
        ...currentData,
        images: currentImages,
        image_url: currentImages[0] || '',
      },
    };
    setRaceKits(updatedKits);
    try {
      localStorage.setItem('sinoog_race_kits', JSON.stringify(updatedKits));
    } catch {
      // ignore
    }
    if (edition) {
      await saveSiteSetting(edition.id, 'race_kits', {
        kits: updatedKits,
        updated_at: new Date().toISOString(),
      } as unknown as Json);
    }
    toast(`Set primary photo for ${cat?.name || 'category'}.`, 'success');
  };

  const handleKitDescriptionChange = (categoryId: string, desc: string) => {
    setRaceKits((prev) => ({
      ...prev,
      [categoryId]: {
        image_url: prev[categoryId]?.image_url || '',
        images: prev[categoryId]?.images || (prev[categoryId]?.image_url ? [prev[categoryId].image_url] : []),
        description: desc,
      },
    }));
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

        {/* Category Navigation Tabs */}
        <div className="users-segmented-nav" style={{ maxWidth: '960px', marginBottom: '24px' }} role="tablist" aria-label="Settings categories">
          <button
            type="button"
            role="tab"
            aria-selected={settingsCategory === 'all'}
            className={`users-segmented-tab${settingsCategory === 'all' ? ' is-active' : ''}`}
            onClick={() => setSettingsCategory('all')}
          >
            All Settings
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={settingsCategory === 'parish'}
            className={`users-segmented-tab${settingsCategory === 'parish' ? ' is-active' : ''}`}
            onClick={() => setSettingsCategory('parish')}
          >
            Parish & Dates
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={settingsCategory === 'run'}
            className={`users-segmented-tab${settingsCategory === 'run' ? ' is-active' : ''}`}
            onClick={() => setSettingsCategory('run')}
          >
            Run & Registration
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={settingsCategory === 'system'}
            className={`users-segmented-tab${settingsCategory === 'system' ? ' is-active' : ''}`}
            onClick={() => setSettingsCategory('system')}
          >
            System & Banner
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--md-space-6)', maxWidth: '960px' }}>
          {/* CATEGORY 1: PARISH IDENTITY & DATES */}
          {(settingsCategory === 'all' || settingsCategory === 'parish') && (
            <>
              {settingsCategory === 'all' && (
                <div className="admin-shortcuts-group-header" style={{ marginTop: '4px' }}>
                  <h3 className="admin-shortcuts-group-title">Parish Identity, Dates & Contacts</h3>
                  <p className="admin-shortcuts-group-desc">Official titles, liturgical calendar dates, and contact channels.</p>
                </div>
              )}

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

              {/* Section 2: Key Event Dates */}
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

              {/* Section 3: Official Committee Contact & Socials */}
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
            </>
          )}

          {/* CATEGORY 2: RUN OPERATIONS & REGISTRATION */}
          {(settingsCategory === 'all' || settingsCategory === 'run') && (
            <>
              {settingsCategory === 'all' && (
                <div className="admin-shortcuts-group-header" style={{ marginTop: '8px' }}>
                  <h3 className="admin-shortcuts-group-title">Sinoog Run & Registration Operations</h3>
                  <p className="admin-shortcuts-group-desc">Payment destination, registration deadlines, and race bib printing.</p>
                </div>
              )}

              {/* Section 4: Sinoog Run operational settings */}
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

              {/* Section 5: Race Bibs, Official Logo & Race Kits */}
              <Card variant="outlined" style={{ padding: 'var(--md-space-6)' }}>
                <div style={{ marginBottom: 'var(--md-space-4)' }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-2)', margin: 0, fontSize: '1.25rem' }}>
                    <Printer size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
                    Race Bibs, Official Logo &amp; Official Race Kits
                  </h2>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
                    Upload the official Sinoog Run bib logo, manage race kit photos and descriptions per category, and print approved runner bibs.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--md-space-4)', flexWrap: 'wrap', background: 'var(--md-sys-color-surface-container-low)', padding: 'var(--md-space-4)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-4)' }}>
                    <div style={{ width: '90px', height: '65px', background: '#ffffff', border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                      <img src={bibLogoUrl} alt="Bib Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>Upper Left Bib Logo</strong>
                      <span style={{ fontSize: '0.80rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Upload finalized event logo here anytime — automatically converts on all race bibs.
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-2)', flexWrap: 'wrap' }}>
                    <input
                      id={logoInputId}
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      style={{ display: 'none' }}
                      onChange={handleUploadBibLogo}
                    />
                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
                      leadingIcon={<Upload size={16} />}
                      disabled={uploadingBibLogo}
                      onClick={() => logoFileInputRef.current?.click()}
                    >
                      {uploadingBibLogo ? 'Uploading logo…' : 'Upload final logo'}
                    </Button>
                    <Button
                      type="button"
                      variant="filled"
                      size="small"
                      leadingIcon={<Printer size={16} />}
                      onClick={() => setBibPrintModalOpen(true)}
                    >
                      Print approved bibs (8×13″)
                    </Button>
                  </div>
                </div>

                {/* Section 5b: Official Race Kits per Category */}
                <div style={{ marginTop: 'var(--md-space-6)', paddingTop: 'var(--md-space-6)', borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
                  <div style={{ marginBottom: 'var(--md-space-4)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-space-2)', margin: 0, fontSize: '1.1rem' }}>
                      <PackageOpen size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
                      Official Race Kits per Category
                    </h3>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.85rem' }}>
                      Upload pictures of the official race kits (singlets, shirts, medals, inclusions) and configure the kit descriptions for each category. These appear dynamically in the Official Race Kit viewer on the public Run page.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-space-4)' }}>
                    {categories.length === 0 ? (
                      <p style={{ fontStyle: 'italic', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem' }}>
                        No categories loaded yet.
                      </p>
                    ) : (
                      categories.map((c) => {
                        const kitData = raceKits[c.id];
                        const images = Array.isArray(kitData?.images) && kitData.images.length > 0
                          ? kitData.images
                          : kitData?.image_url
                            ? [kitData.image_url]
                            : [];
                        const description = kitData?.description ?? (c.kit_description || '');
                        const isUploading = uploadingKitCategoryId === c.id;

                        return (
                          <div
                            key={c.id}
                            style={{
                              background: 'var(--md-sys-color-surface-container-low)',
                              border: '1px solid var(--md-sys-color-outline-variant)',
                              borderRadius: '10px',
                              padding: 'var(--md-space-4)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 'var(--md-space-3)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  style={{
                                    background: 'var(--wine, #741f29)',
                                    color: '#ffffff',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                  }}
                                >
                                  {c.distance_meters / 1000}K
                                </span>
                                <strong style={{ fontSize: '1rem', color: 'var(--md-sys-color-on-surface)' }}>{c.name}</strong>
                              </div>
                              <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                Fee: <strong>{(c.fee_centavos / 100).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</strong>
                              </span>
                            </div>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: 'var(--md-space-4)',
                                alignItems: 'start',
                              }}
                            >
                              {/* Photo upload and preview (1 or more photos) */}
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
                                    Kit Photos {images.length > 0 ? `(${images.length})` : ''}
                                  </span>
                                  {images.length > 0 && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                      First photo is primary cover photo
                                    </span>
                                  )}
                                </div>

                                {images.length === 0 ? (
                                  <div
                                    style={{
                                      width: '100%',
                                      height: '160px',
                                      background: '#ffffff',
                                      border: '1px dashed var(--md-sys-color-outline-variant)',
                                      borderRadius: '8px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: '12px',
                                      textAlign: 'center',
                                      color: 'var(--md-sys-color-on-surface-variant)',
                                    }}
                                  >
                                    <PackageOpen size={32} style={{ opacity: 0.5, marginBottom: '6px' }} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>No race kit photos uploaded yet</span>
                                    <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>Upload 1 or more photos (JPG, PNG, or WebP)</span>
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
                                      gap: '8px',
                                      background: '#ffffff',
                                      padding: '8px',
                                      borderRadius: '8px',
                                      border: '1px solid var(--md-sys-color-outline-variant)',
                                      maxHeight: '260px',
                                      overflowY: 'auto',
                                    }}
                                  >
                                    {images.map((imgUrl, imgIdx) => (
                                      <div
                                        key={`${imgUrl}-${imgIdx}`}
                                        style={{
                                          position: 'relative',
                                          height: '95px',
                                          borderRadius: '6px',
                                          overflow: 'hidden',
                                          border: imgIdx === 0 ? '2px solid var(--wine, #741f29)' : '1px solid var(--md-sys-color-outline-variant)',
                                          background: '#f8fafc',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        <img
                                          src={imgUrl}
                                          alt={`Photo ${imgIdx + 1}`}
                                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        />
                                        <span
                                          style={{
                                            position: 'absolute',
                                            top: '4px',
                                            left: '4px',
                                            background: imgIdx === 0 ? 'var(--wine, #741f29)' : 'rgba(0,0,0,0.65)',
                                            color: '#ffffff',
                                            fontSize: '0.65rem',
                                            padding: '1px 5px',
                                            borderRadius: '10px',
                                            fontWeight: 700,
                                          }}
                                        >
                                          {imgIdx === 0 ? 'Cover' : `#${imgIdx + 1}`}
                                        </span>

                                        <div
                                          style={{
                                            position: 'absolute',
                                            bottom: '4px',
                                            right: '4px',
                                            display: 'flex',
                                            gap: '2px',
                                          }}
                                        >
                                          {imgIdx !== 0 && (
                                            <button
                                              type="button"
                                              title="Set as cover photo"
                                              onClick={() => void handleSetPrimaryKitPhoto(c.id, imgIdx)}
                                              style={{
                                                background: 'rgba(255,255,255,0.92)',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                                padding: '3px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                              }}
                                            >
                                              <Star size={12} style={{ color: '#d4a754' }} />
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            title="Remove photo"
                                            onClick={() => void handleRemoveKitPhotoIndex(c.id, imgIdx)}
                                            style={{
                                              background: 'rgba(255,255,255,0.92)',
                                              border: '1px solid #ba1a1a',
                                              borderRadius: '4px',
                                              padding: '3px',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                            }}
                                          >
                                            <Trash2 size={12} style={{ color: '#ba1a1a' }} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/png,image/jpeg,image/webp"
                                    style={{ display: 'none' }}
                                    ref={(el) => {
                                      kitFileInputRefs.current[c.id] = el;
                                    }}
                                    onChange={(e) => void handleUploadKitPhotos(c.id, e)}
                                  />
                                  <Button
                                    type="button"
                                    variant="outlined"
                                    size="small"
                                    leadingIcon={images.length > 0 ? <Plus size={14} /> : <Upload size={14} />}
                                    disabled={isUploading}
                                    onClick={() => kitFileInputRefs.current[c.id]?.click()}
                                  >
                                    {isUploading
                                      ? 'Uploading photo(s)…'
                                      : images.length > 0
                                        ? 'Add more photo(s)'
                                        : 'Upload kit photo(s)'}
                                  </Button>
                                </div>
                              </div>

                              {/* Kit description & inclusions */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label
                                  htmlFor={`kit-desc-${c.id}`}
                                  style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}
                                >
                                  Kit Inclusions &amp; Description
                                </label>
                                <textarea
                                  id={`kit-desc-${c.id}`}
                                  rows={5}
                                  value={description}
                                  onChange={(e) => handleKitDescriptionChange(c.id, e.target.value)}
                                  placeholder="e.g., Official Sinoog 2027 Singlet / Full Sub, Race Bib, Finisher Medal, Hydration Support"
                                  style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.5,
                                    borderRadius: '6px',
                                    border: '1px solid var(--md-sys-color-outline-variant)',
                                    background: 'var(--md-sys-color-surface)',
                                    color: 'var(--md-sys-color-on-surface)',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box',
                                  }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                  Describes what is inside the kit for {c.name}. Updated live on public Run page when saved.
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* CATEGORY 3: SYSTEM AVAILABILITY & ANNOUNCEMENTS */}
          {(settingsCategory === 'all' || settingsCategory === 'system') && (
            <>
              {settingsCategory === 'all' && (
                <div className="admin-shortcuts-group-header" style={{ marginTop: '8px' }}>
                  <h3 className="admin-shortcuts-group-title">System Switches & Public Advisories</h3>
                  <p className="admin-shortcuts-group-desc">Feature availability switches and urgent public announcement banner.</p>
                </div>
              )}

              {/* Section 6: Feature Switches */}
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

              {/* Section 7: Urgent Public Announcement Banner */}
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
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--md-space-2)', marginBottom: 'var(--md-space-6)' }}>
            <Button variant="filled" type="submit" loading={saving} leadingIcon={<Save size={18} />}>
              Save all settings
            </Button>
          </div>
        </div>
      </form>

      <RaceBibPrintSheet
        open={bibPrintModalOpen}
        onClose={() => setBibPrintModalOpen(false)}
        registrations={registrations}
        categories={categories}
        currentLogoUrl={bibLogoUrl}
        onLogoUpdated={(url) => setBibLogoUrl(url)}
      />
    </div>
  );
}
