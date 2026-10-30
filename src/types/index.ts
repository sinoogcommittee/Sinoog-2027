import type {
  Database,
  AppRole,
  ContentStatus,
  ReviewStatus,
  PaymentStatus,
  ActivityType,
  MediaKind,
  Edition,
  Profile,
  DbActivity,
  DbPost,
  DbSiteSetting,
  DbSponsor,
  DbDelegation,
  DbDelegationEntry,
  DbDelegationMembership,
  DbDelegationParticipant,
  DbDelegationFile,
  DbRunRegistration,
  DbKitClaim,
} from './database';

export type {
  Database,
  AppRole,
  ContentStatus,
  ReviewStatus,
  PaymentStatus,
  ActivityType,
  MediaKind,
  Edition,
  Profile,
  DbActivity,
  DbPost,
  DbSiteSetting,
  DbSponsor,
  DbDelegation,
  DbDelegationEntry,
  DbDelegationMembership,
  DbDelegationParticipant,
  DbDelegationFile,
  DbRunRegistration,
  DbKitClaim,
};

export type Role = AppRole;

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  bodyHtml?: string;
  featuredImagePath?: string | null;
  pinned?: boolean;
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  date: string;
  time: string;
  venue: string;
  celebrant?: string;
  description?: string;
  status?: ContentStatus;
  sortOrder?: number;
}
