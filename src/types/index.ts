export type Role = 'public_user' | 'delegation_head' | 'news_in_charge' | 'admin';
export type NewsPost = { id: string; slug: string; title: string; excerpt: string; category: string; publishedAt: string };
export type Activity = { id: string; title: string; type: 'mass' | 'run' | 'festival' | 'nightly'; date: string; time: string; venue: string; celebrant?: string };
