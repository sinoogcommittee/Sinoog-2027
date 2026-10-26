import { CalendarDays, Clock, MapPin, UserRound } from 'lucide-react';
import { PageHero } from '../../components/PageHero';
import { activities } from '../../data/siteData';
export function ActivitiesPage({ filter }: { filter?: 'mass' | 'nightly' }) {
  const shown = filter ? activities.filter((x) => x.type === filter) : activities;
  const title = filter === 'mass' ? 'Mass schedule' : filter === 'nightly' ? 'Nightly activities' : 'Fiesta activities';
  return <><PageHero eyebrow="January 2027" title={title} description="Your guide to the novena, festival, run, and community activities. Confirmed updates will be posted here."/><section className="section"><div className="container"><div className="filter-pills"><a href="/activities">All</a><a href="/activities/masses">Masses</a><a href="/activities/nightly">Nightly</a></div>{shown.length ? <div className="timeline">{shown.map((a) => <article key={a.id}><time><strong>{a.date.slice(-2)}</strong><span>JAN</span></time><div><span className={`activity-type activity-type--${a.type}`}>{a.type}</span><h2>{a.title}</h2><p><Clock/> {a.time}</p><p><MapPin/> {a.venue}</p>{a.celebrant && <p><UserRound/> Celebrant: {a.celebrant}</p>}</div></article>)}</div> : <div className="empty-state"><CalendarDays/><h3>Activities will be posted here</h3><p>The nightly program is still being prepared.</p></div>}</div></section></>;
}
