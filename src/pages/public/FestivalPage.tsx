import { useState, useId, type ReactNode } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Download,
  FileText,
  MapPin,
  Music,
  Users,
} from 'lucide-react';
import { Button } from '../../components/Button';
import { PageHero } from '../../components/PageHero';
import { SectionHeading } from '../../components/SectionHeading';
import { Card } from '../../components/m3/Card';

type FestivalSection = 'participants' | 'guidelines' | undefined;

const GUIDELINE_DOCS = [
  {
    id: 'guidelines',
    title: 'Official Festival Guidelines (PDF)',
    note: 'Eligibility, deadlines, performance requirements, and judging overview.',
    href: undefined,
  },
  {
    id: 'registration',
    title: 'Registration Form (PDF)',
    note: 'Delegation entry form for barangay and school contingents.',
    href: undefined,
  },
  {
    id: 'criteria',
    title: 'Judging Criteria (PDF)',
    note: 'Scoring categories for street dancing and ritual showdown.',
    href: undefined,
  },
] as const;

const CONTINGENT_PANELS = [
  {
    id: 'roster',
    title: 'Contingents Roster',
    body: 'Registered barangay and school delegations will appear here with team leads and performance themes after committee approval.',
  },
  {
    id: 'official',
    title: 'Official Delegations',
    body: 'Approved groups representing communities of Guindulman and neighboring areas will be listed with presentation order when finalized.',
  },
] as const;

function AccordionPanel({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <div className={`festival-accordion ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="festival-accordion__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <ChevronDown size={18} aria-hidden />
      </button>
      {open && (
        <div id={panelId} className="festival-accordion__panel" role="region" aria-label={title}>
          {children}
        </div>
      )}
    </div>
  );
}

function ParadeMapGraphic() {
  return (
    <Card variant="outlined" className="parade-map" aria-label="Parade and showdown route schematic">
      <div className="parade-map__legend">
        <span>
          <i className="parade-map__dot parade-map__dot--assembly" /> Parade assembly
        </span>
        <span>
          <i className="parade-map__dot parade-map__dot--flow" /> Street flow
        </span>
        <span>
          <i className="parade-map__dot parade-map__dot--arena" /> Arena points
        </span>
      </div>
      <svg
        className="parade-map__svg"
        viewBox="0 0 640 280"
        role="img"
        aria-labelledby="parade-map-title"
      >
        <title id="parade-map-title">Schematic: assembly area, street dancing flow, and showdown arena</title>
        {/* soft background paths */}
        <path
          d="M40 200 C120 200 160 80 280 90 C380 98 420 160 520 150"
          fill="none"
          stroke="#c9a227"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.35"
        />
        <path
          d="M40 200 C120 200 160 80 280 90 C380 98 420 160 520 150"
          fill="none"
          stroke="#8b6914"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="2 10"
        />
        {/* Assembly */}
        <circle cx="48" cy="200" r="28" fill="#fff8e8" stroke="#c9a227" strokeWidth="3" />
        <text x="48" y="205" textAnchor="middle" fontSize="11" fontWeight="700" fill="#5c3d0a">
          Assembly
        </text>
        {/* Mid flow markers */}
        <circle cx="200" cy="120" r="8" fill="#9b2226" />
        <circle cx="320" cy="95" r="8" fill="#9b2226" />
        <circle cx="420" cy="140" r="8" fill="#9b2226" />
        {/* Arena */}
        <rect
          x="500"
          y="100"
          width="110"
          height="90"
          rx="12"
          fill="#fff8e8"
          stroke="#9b2226"
          strokeWidth="3"
        />
        <text x="555" y="150" textAnchor="middle" fontSize="13" fontWeight="700" fill="#5c0a12">
          Arena
        </text>
        <text x="555" y="168" textAnchor="middle" fontSize="10" fill="#7a4a1a">
          Showdown
        </text>
        {/* Labels */}
        <text x="120" y="240" fontSize="11" fill="#6b5a52">
          Street Flow
        </text>
        <text x="300" y="70" fontSize="11" fill="#6b5a52">
          Street Flow
        </text>
      </svg>
      <p className="parade-map__note">
        Route details and assembly points will be confirmed by the committee. This schematic is illustrative only.
      </p>
      <Button to="/activities" variant="outlined" className="parade-map__cta" leadingIcon={<ArrowRight size={18} />}>
        View parade schedule
      </Button>
    </Card>
  );
}

function MainFestivalView() {
  return (
    <>
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Festival information"
            title="Tradition brought to life"
            description="A vibrant expression of devotion, identity, and community in honor of the Sto. Niño — through movement, music, and shared celebration in Guinacot."
          />
          <p className="festival-intro">
            Sinoog gathers parish communities for street dancing, ritual presentation, and fellowship centered on the Holy
            Child. Confirmed program times, assembly points, and presentation order will be published as the committee
            finalizes each detail with the parish.
          </p>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container">
          <div className="feature-cards feature-cards--pillars">
            <Card as="article" variant="filled">
              <Music size={28} aria-hidden />
              <h3>Festival performances</h3>
              <p>Delegations share stories of faith and community through movement, music, and color.</p>
            </Card>
            <Card as="article" variant="filled">
              <Users size={28} aria-hidden />
              <h3>Participating communities</h3>
              <p>Meet the approved groups representing Guindulman and beyond.</p>
            </Card>
            <Card as="article" variant="filled">
              <FileText size={28} aria-hidden />
              <h3>Clear guidelines</h3>
              <p>Access the latest official rules, submission deadlines, and required documents when published.</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Parade & showdown map"
            title="How the celebration moves"
            description="Assembly, street flow, and the final arena — a simple guide for participants and visitors."
          />
          <ParadeMapGraphic />
        </div>
      </section>

      <section className="section section--cream">
        <div className="container">
          <SectionHeading
            eyebrow="Documents"
            title="Clear guidelines"
            description="Official PDFs will be available for download once the committee publishes the final versions."
          />
          <ul className="festival-docs">
            {GUIDELINE_DOCS.map((doc) => (
              <Card as="li" variant="outlined" key={doc.id} className="festival-docs__item">
                <div className="festival-docs__copy">
                  <FileText size={20} aria-hidden />
                  <div>
                    <strong>{doc.title}</strong>
                    <p>{doc.note}</p>
                  </div>
                </div>
                {doc.href ? (
                  <a className="festival-docs__download" href={doc.href} download>
                    <Download size={18} aria-hidden />
                    Download
                  </a>
                ) : (
                  <span className="festival-docs__pending">
                    <Download size={18} aria-hidden />
                    Coming soon
                  </span>
                )}
              </Card>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Participating contingents"
            title="Delegations & roster"
            description="Expand each panel for roster and official delegation information as it is published."
          />
          <div className="festival-accordion-list">
            {CONTINGENT_PANELS.map((panel) => (
              <AccordionPanel key={panel.id} title={panel.title}>
                <p>{panel.body}</p>
                <p className="festival-accordion__hint">Details to be announced after committee approval.</p>
              </AccordionPanel>
            ))}
          </div>
          <div className="festival-cta-stack">
            <Button to="/festival/participants">
              View participants <ArrowRight size={16} />
            </Button>
            <Button to="/festival/guidelines" variant="secondary">
              Read guidelines
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function ParticipantsView() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Festival participants"
          title="Delegations taking part"
          description="Approved groups will be listed here with community, team lead, and performance theme once published."
        />
        <Card variant="filled" className="empty-state festival-empty-state">
          <Users size={40} aria-hidden />
          <h3>Participants will be announced</h3>
          <p>
            Contingents and official delegations appear after committee review. Check back as Sinoog 2027 approaches, or
            follow parish announcements for the first published roster.
          </p>
          <div className="button-row festival-empty-state__actions">
            <Button to="/festival" variant="secondary">
              Back to festival overview
            </Button>
            <Button to="/festival/guidelines" variant="ghost">
              Read guidelines
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

function GuidelinesView() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Festival guidelines"
          title="Official participation guide"
          description="Eligibility rules, deadlines, performance requirements, and judging criteria will be published here."
        />
        <ul className="festival-docs">
          {GUIDELINE_DOCS.map((doc) => (
            <Card as="li" variant="outlined" key={doc.id} className="festival-docs__item">
              <div className="festival-docs__copy">
                <FileText size={20} aria-hidden />
                <div>
                  <strong>{doc.title}</strong>
                  <p>{doc.note}</p>
                </div>
              </div>
              <span className="festival-docs__pending">
                <Download size={18} aria-hidden />
                Coming soon
              </span>
            </Card>
          ))}
        </ul>
        <Card variant="filled" className="content-card festival-delegation-note">
          <MapPin size={22} aria-hidden />
          <h3>For delegation heads</h3>
          <p>
            Secure portal access for rosters and music uploads will be issued by the committee. Do not submit materials
            through unofficial channels.
          </p>
          <Button to="/festival" variant="secondary">
            Back to festival overview
          </Button>
        </Card>
      </div>
    </section>
  );
}

export function FestivalPage({ section }: { section?: FestivalSection }) {
  const title =
    section === 'participants'
      ? 'Festival participants'
      : section === 'guidelines'
        ? 'Festival guidelines'
        : 'Sinoog Festival 2027';

  const description =
    section === 'participants'
      ? 'Approved delegations, communities, and presentation details for the street dancing and ritual showdown.'
      : section === 'guidelines'
        ? 'Official rules, deadlines, judging criteria, and downloadable forms for contingents.'
        : 'A vibrant expression of devotion, identity, and community in honor of the Sto. Niño.';

  return (
    <main className="m3-festival-page">
      <PageHero eyebrow="January 15 · Guinacot" title={title} description={description} />
      {section === 'participants' ? (
        <ParticipantsView />
      ) : section === 'guidelines' ? (
        <GuidelinesView />
      ) : (
        <MainFestivalView />
      )}
    </main>
  );
}
