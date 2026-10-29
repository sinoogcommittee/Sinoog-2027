import { useEffect, useState } from 'react';
import { Facebook, Globe, HeartHandshake, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { PageHero } from '../../components/PageHero';
import { Card } from '../../components/m3/Card';
import { toSafeHttpUrl } from '../../lib/safeUrl';
import { EmptyState, LoadingState } from '../../features/ui/FeedbackStates';
import {
  getSponsorLogoUrl,
  groupSponsorsByTier,
  listPublishedEditionSponsors,
  type EditionSponsorRow,
} from '../../features/sponsors/sponsorQueries';

function tierKey(
  tier: string
): 'presenter' | 'co-presenter' | 'diamond' | 'gold' | 'silver' | 'bronze' | 'media-partner' | 'other' {
  const t = tier.toLowerCase();
  if (t.includes('co-presenter') || t.includes('co presenter')) return 'co-presenter';
  if (t.includes('presenter')) return 'presenter';
  if (t.includes('media')) return 'media-partner';
  if (t.includes('diamond')) return 'diamond';
  if (t.includes('gold')) return 'gold';
  if (t.includes('silver')) return 'silver';
  if (t.includes('bronze')) return 'bronze';
  return 'other';
}

function tierBadge(tier: string): string {
  switch (tierKey(tier)) {
    case 'presenter':
      return '👑';
    case 'co-presenter':
      return '⭐';
    case 'diamond':
      return '💎';
    case 'gold':
      return '🥇';
    case 'silver':
      return '🥈';
    case 'bronze':
      return '🥉';
    case 'media-partner':
      return '🎙️';
    default:
      return '🤝';
  }
}

function SponsorCard({ row, size }: { row: EditionSponsorRow; size: 'large' | 'medium' | 'compact' }) {
  const logo = getSponsorLogoUrl(row.sponsor.logo_path);
  const facebookUrl = toSafeHttpUrl(row.sponsor.facebook_url);
  const websiteUrl = toSafeHttpUrl(row.sponsor.website_url);
  const key = tierKey(row.tier);

  return (
    <Card
      as="article"
      variant="outlined"
      className={`sponsors-public__card sponsors-public__card--${size} sponsors-public__card--${key}`}
    >
      <div className="sponsors-public__logo">
        {logo ? (
          <img src={logo} alt={`${row.sponsor.name} logo`} loading="lazy" />
        ) : (
          <HeartHandshake size={size === 'large' ? 36 : 28} aria-hidden />
        )}
      </div>
      <strong>{row.sponsor.name}</strong>
      {(websiteUrl || facebookUrl) && (
        <div className="sponsors-public__links">
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="sponsors-public__icon-link"
              aria-label={`${row.sponsor.name} website`}
              title="Website"
            >
              <Globe size={18} aria-hidden />
            </a>
          )}
          {facebookUrl && (
            <a
              href={facebookUrl}
              target="_blank"
              rel="noreferrer"
              className="sponsors-public__icon-link sponsors-public__icon-link--fb"
              aria-label={`${row.sponsor.name} on Facebook`}
              title="Facebook"
            >
              <Facebook size={18} aria-hidden />
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

function cardSizeForTier(tier: string): 'large' | 'medium' | 'compact' {
  const key = tierKey(tier);
  if (key === 'presenter' || key === 'diamond') return 'large';
  if (key === 'co-presenter' || key === 'gold' || key === 'silver') return 'medium';
  return 'compact';
}

export function SponsorsPage() {
  const [rows, setRows] = useState<EditionSponsorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const list = await listPublishedEditionSponsors();
        if (!mounted) return;
        setRows(list);
        setError(null);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load sponsors.');
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const groups = groupSponsorsByTier(rows);

  return (
    <main className="m3-sponsors-page">
      <PageHero
        eyebrow="With gratitude"
        title="Celebration sponsors"
        description="We recognize the partners who help make the parish fiesta and Sinoog Festival possible."
      />

      <section className="section">
        <div className="container">
          {loading ? (
            <LoadingState message="Loading sponsors…" />
          ) : error ? (
            <EmptyState title="Sponsors unavailable" message={error} />
          ) : groups.length === 0 ? (
            <EmptyState
              title="Sponsor list coming soon"
              message="Approved sponsor names, logos, and recognition tiers will appear here."
            />
          ) : (
            <div className="sponsors-public">
              {groups.map((group) => {
                const size = cardSizeForTier(group.tier);
                const key = tierKey(group.tier);
                return (
                  <section
                    key={group.tier}
                    className={`sponsors-public__tier sponsors-public__tier--${key}`}
                    aria-labelledby={`tier-${group.tier}`}
                  >
                    <h2 id={`tier-${group.tier}`} className="sponsors-public__tier-title">
                      <span className="sponsors-public__tier-badge" aria-hidden>
                        {tierBadge(group.tier)}
                      </span>
                      {group.tier}
                    </h2>
                    <div className={`sponsors-public__grid sponsors-public__grid--${size}`}>
                      {group.items.map((row) => (
                        <SponsorCard key={row.sponsor_id} row={row} size={size} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* Become a Partner CTA — always shown */}
          <aside className="sponsors-partner-cta" aria-labelledby="become-partner-title">
            <div className="sponsors-partner-cta__inner">
              <p className="sponsors-partner-cta__eyebrow">Support the celebration</p>
              <h2 id="become-partner-title">Become a Partner</h2>
              <p>
                Local businesses and organizations are invited to support Sinoog 2027. Partnership packages and recognition
                tiers are arranged through the Sinoog Committee.
              </p>
              <div className="sponsors-partner-cta__actions">
                <Button to="/about" variant="outlined" leadingIcon={<Mail size={16} aria-hidden />}>
                  Contact the committee
                </Button>
                <a
                  href="https://www.facebook.com/Sto.NinoParishGuinacot"
                  target="_blank"
                  rel="noreferrer"
                  className="button button--ghost"
                >
                  <Facebook size={16} aria-hidden /> Parish Facebook
                </a>
              </div>
              <p className="sponsors-partner-cta__note">
                Official sponsorship package materials will be linked here once the committee publishes them. Until then,
                reach the committee via the <Link to="/about">About & contact</Link> page.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
