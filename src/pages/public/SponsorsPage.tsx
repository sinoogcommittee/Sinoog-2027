import { useEffect, useState } from 'react';
import { Facebook, Globe, HeartHandshake } from 'lucide-react';
import { PageHero } from '../../components/PageHero';
import { toSafeHttpUrl } from '../../lib/safeUrl';
import { LoadingState, EmptyState } from '../../features/ui/FeedbackStates';
import {
  getSponsorLogoUrl,
  groupSponsorsByTier,
  listPublishedEditionSponsors,
  type EditionSponsorRow,
} from '../../features/sponsors/sponsorQueries';

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
    <>
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
            <>
              <div className="empty-state">
                <HeartHandshake />
                <h3>Sponsor list coming soon</h3>
                <p>Approved sponsor names, logos, and recognition tiers will appear here.</p>
              </div>
              <div className="notice">
                <strong>Interested in supporting Sinoog 2027?</strong>
                <span> Reach the Sinoog Committee through the parish contacts on the About page.</span>
              </div>
            </>
          ) : (
            <div className="sponsors-public">
              {groups.map((group) => (
                <section key={group.tier} className="sponsors-public__tier" aria-labelledby={`tier-${group.tier}`}>
                  <h2 id={`tier-${group.tier}`}>{group.tier}</h2>
                  <div className="sponsors-public__grid">
                    {group.items.map((row) => {
                      const logo = getSponsorLogoUrl(row.sponsor.logo_path);
                      const facebookUrl = toSafeHttpUrl(row.sponsor.facebook_url);
                      const websiteUrl = toSafeHttpUrl(row.sponsor.website_url);

                      return (
                        <div key={row.sponsor_id} className="sponsors-public__card">
                          <div className="sponsors-public__logo">
                            {logo ? <img src={logo} alt={`${row.sponsor.name} logo`} /> : <HeartHandshake size={28} />}
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
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
