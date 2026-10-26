import { ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHero } from '../../components/PageHero';
import { news } from '../../data/siteData';
export function NewsPage() { return <><PageHero eyebrow="Official updates" title="News & announcements" description="The latest information from the Sinoog Committee and Sto. Niño Parish."/><section className="section"><div className="container"><label className="search-field"><Search/><input aria-label="Search news" placeholder="Search announcements"/></label><div className="article-list">{news.map((post) => <Link to={`/news/${post.slug}`} key={post.id}><div className="article-list__date"><strong>{post.publishedAt.split(' ')[1]?.replace(',', '')}</strong><span>{post.publishedAt.split(' ')[0].slice(0, 3)}</span></div><div><span className="activity-type">{post.category}</span><h2>{post.title}</h2><p>{post.excerpt}</p></div><ArrowRight/></Link>)}</div></div></section></>; }
