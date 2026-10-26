import type { ReactNode } from 'react';
export function PageHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <section className="page-hero"><div className="container page-hero__inner"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p>{children}</div></section>;
}
