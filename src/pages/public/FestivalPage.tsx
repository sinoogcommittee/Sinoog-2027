import { ArrowRight, FileText, Music, Users } from 'lucide-react';
import { Button } from '../../components/Button';
import { PageHero } from '../../components/PageHero';
import { SectionHeading } from '../../components/SectionHeading';
export function FestivalPage({ section }: { section?: 'participants' | 'guidelines' }) {
  const title = section === 'participants' ? 'Festival participants' : section === 'guidelines' ? 'Festival guidelines' : 'Sinoog Festival 2027';
  return <><PageHero eyebrow="January 15 · Guinacot" title={title} description="A vibrant expression of devotion, identity, and community in honor of the Sto. Niño."/>
    <section className="section"><div className="container"><SectionHeading eyebrow="Festival information" title={section === 'participants' ? 'Delegations taking part' : section === 'guidelines' ? 'Official participation guide' : 'Tradition brought to life'}/>
      {section === 'participants' ? <div className="empty-state"><Users/><h3>Participants will be announced</h3><p>Approved delegations will appear here with their community and presentation details.</p></div> : section === 'guidelines' ? <div className="content-card"><FileText/><h3>Guidelines are being finalized</h3><p>The official eligibility rules, deadlines, performance requirements, judging criteria, and downloadable forms will be published here.</p><Button variant="secondary" disabled>Download unavailable</Button></div> : <><div className="feature-cards"><article><Music/><h3>Festival performances</h3><p>Delegations share stories of faith and community through movement, music, and color.</p></article><article><Users/><h3>Participating communities</h3><p>Meet the approved groups representing the communities of Guindulman and beyond.</p></article><article><FileText/><h3>Clear guidelines</h3><p>Access the latest official rules, submission deadlines, and required documents.</p></article></div><div className="button-row"><Button to="/festival/participants">View participants <ArrowRight size={16}/></Button><Button to="/festival/guidelines" variant="secondary">Read guidelines</Button></div></>}
    </div></section></>;
}
