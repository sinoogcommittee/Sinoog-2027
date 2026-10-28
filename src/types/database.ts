export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = 'public_user' | 'delegation_head' | 'news_in_charge' | 'admin';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type ReviewStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'needs_changes' | 'rejected' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'submitted' | 'verified' | 'rejected' | 'refunded';
export type ActivityType = 'mass' | 'run' | 'festival' | 'nightly' | 'other';
export type MediaKind = 'image' | 'video' | 'audio' | 'document';

export interface Database {
  public: {
    Tables: {
      editions: {
        Row: {
          id: string;
          year: number;
          sort_order: number;
          name: string;
          parish_name: string;
          location: string;
          timezone: string;
          run_date: string | null;
          novena_start_date: string | null;
          fiesta_date: string | null;
          registration_open: boolean;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          year: number;
          name: string;
          parish_name: string;
          location: string;
          timezone?: string;
          run_date?: string | null;
          novena_start_date?: string | null;
          fiesta_date?: string | null;
          registration_open?: boolean;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          year?: number;
          sort_order?: number;          
          name?: string;
          parish_name?: string;
          location?: string;
          timezone?: string;
          run_date?: string | null;
          novena_start_date?: string | null;
          fiesta_date?: string | null;
          registration_open?: boolean;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          mobile: string | null;
          locality: string | null;
          suspended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          mobile?: string | null;
          locality?: string | null;
          suspended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          mobile?: string | null;
          locality?: string | null;
          suspended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: AppRole;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          user_id: string;
          role: AppRole;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Update: {
          user_id?: string;
          role?: AppRole;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          edition_id: string;
          key: string;
          value: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          edition_id: string;
          key: string;
          value?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          edition_id?: string;
          key?: string;
          value?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          edition_id: string;
          type: ActivityType;
          title: string;
          description: string | null;
          starts_at: string | null;
          ends_at: string | null;
          venue: string | null;
          celebrant: string | null;
          status: ContentStatus;
          sort_order: number;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          edition_id: string;
          type: ActivityType;
          title: string;
          description?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          venue?: string | null;
          celebrant?: string | null;
          status?: ContentStatus;
          sort_order?: number;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          edition_id?: string;
          type?: ActivityType;
          title?: string;
          description?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          venue?: string | null;
          celebrant?: string | null;
          status?: ContentStatus;
          sort_order?: number;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          edition_id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          body_html: string;
          category: string;
          featured_image_path: string | null;
          status: ContentStatus;
          pinned: boolean;
          published_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          edition_id: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          body_html?: string;
          category?: string;
          featured_image_path?: string | null;
          status?: ContentStatus;
          pinned?: boolean;
          published_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          edition_id?: string;
          slug?: string;
          title?: string;
          excerpt?: string | null;
          body_html?: string;
          category?: string;
          featured_image_path?: string | null;
          status?: ContentStatus;
          pinned?: boolean;
          published_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          id: string;
          edition_id: string | null;
          bucket: string;
          object_path: string;
          kind: MediaKind;
          title: string | null;
          alt_text: string | null;
          caption: string | null;
          credit: string | null;
          width: number | null;
          height: number | null;
          bytes: number | null;
          mime_type: string | null;
          is_public: boolean;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          edition_id?: string | null;
          bucket: string;
          object_path: string;
          kind: MediaKind;
          title?: string | null;
          alt_text?: string | null;
          caption?: string | null;
          credit?: string | null;
          width?: number | null;
          height?: number | null;
          bytes?: number | null;
          mime_type?: string | null;
          is_public?: boolean;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          edition_id?: string | null;
          bucket?: string;
          object_path?: string;
          kind?: MediaKind;
          title?: string | null;
          alt_text?: string | null;
          caption?: string | null;
          credit?: string | null;
          width?: number | null;
          height?: number | null;
          bytes?: number | null;
          mime_type?: string | null;
          is_public?: boolean;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      post_media: {
        Row: {
          post_id: string;
          media_id: string;
          sort_order: number;
        };
        Insert: {
          post_id: string;
          media_id: string;
          sort_order?: number;
        };
        Update: {
          post_id?: string;
          media_id?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      albums: {
        Row: {
          id: string;
          edition_id: string;
          title: string;
          slug: string;
          description: string | null;
          year: number;
          sort_order: number;
          media_type: 'photo' | 'video';
          status: ContentStatus;
          cover_media_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          edition_id: string;
          title: string;
          slug: string;
          description?: string | null;
          year?: number;
          sort_order?: number;
          media_type?: 'photo' | 'video';
          status?: ContentStatus;
          cover_media_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          edition_id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          year?: number;
          sort_order?: number;
          media_type?: 'photo' | 'video';
          status?: ContentStatus;
          cover_media_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      album_items: {
        Row: {
          album_id: string;
          media_id: string;
          sort_order: number;
        };
        Insert: {
          album_id: string;
          media_id: string;
          sort_order?: number;
        };
        Update: {
          album_id?: string;
          media_id?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      sponsors: {
        Row: {
          id: string;
          name: string;
          website_url: string | null;
          facebook_url: string | null;
          logo_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website_url?: string | null;
          facebook_url?: string | null;
          logo_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website_url?: string | null;
          facebook_url?: string | null;
          logo_path?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      edition_sponsors: {
        Row: {
          edition_id: string;
          sponsor_id: string;
          tier: string;
          sort_order: number;
          published: boolean;
        };
        Insert: {
          edition_id: string;
          sponsor_id: string;
          tier?: string;
          sort_order?: number;
          published?: boolean;
        };
        Update: {
          edition_id?: string;
          sponsor_id?: string;
          tier?: string;
          sort_order?: number;
          published?: boolean;
        };
        Relationships: [];
      };
      delegations: {
        Row: {
          id: string;
          name: string;
          locality: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          locality?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          locality?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      delegation_memberships: {
        Row: {
          delegation_id: string;
          user_id: string;
          is_head: boolean;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          delegation_id: string;
          user_id: string;
          is_head?: boolean;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Update: {
          delegation_id?: string;
          user_id?: string;
          is_head?: boolean;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Relationships: [];
      };
      delegation_entries: {
        Row: {
          id: string;
          edition_id: string;
          delegation_id: string;
          status: ReviewStatus;
          current_version: number;
          submitted_at: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          reviewer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          edition_id: string;
          delegation_id: string;
          status?: ReviewStatus;
          current_version?: number;
          submitted_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          reviewer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          edition_id?: string;
          delegation_id?: string;
          status?: ReviewStatus;
          current_version?: number;
          submitted_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          reviewer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      delegation_participants: {
        Row: {
          id: string;
          entry_id: string;
          full_name: string;
          role_or_position: string | null;
          birth_date: string | null;
          version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          entry_id: string;
          full_name: string;
          role_or_position?: string | null;
          birth_date?: string | null;
          version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          entry_id?: string;
          full_name?: string;
          role_or_position?: string | null;
          birth_date?: string | null;
          version?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      delegation_files: {
        Row: {
          id: string;
          entry_id: string;
          kind: 'music' | 'roster' | 'photo' | 'document';
          object_path: string;
          original_name: string;
          mime_type: string | null;
          bytes: number | null;
          version: number;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entry_id: string;
          kind: 'music' | 'roster' | 'photo' | 'document';
          object_path: string;
          original_name: string;
          mime_type?: string | null;
          bytes?: number | null;
          version?: number;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entry_id?: string;
          kind?: 'music' | 'roster' | 'photo' | 'document';
          object_path?: string;
          original_name?: string;
          mime_type?: string | null;
          bytes?: number | null;
          version?: number;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      run_events: {
        Row: {
          id: string;
          edition_id: string;
          title: string;
          registration_opens_at: string | null;
          registration_closes_at: string | null;
          race_starts_at: string | null;
          official_started_at: string | null;
          official_started_by: string | null;
          gcash_number: string | null;
          gcash_account_name: string | null;
          terms_version: string | null;
          terms_body: string | null;
          privacy_version: string | null;
          privacy_body: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          edition_id: string;
          title?: string;
          registration_opens_at?: string | null;
          registration_closes_at?: string | null;
          race_starts_at?: string | null;
          official_started_at?: string | null;
          official_started_by?: string | null;
          gcash_number?: string | null;
          gcash_account_name?: string | null;
          terms_version?: string | null;
          terms_body?: string | null;
          privacy_version?: string | null;
          privacy_body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          edition_id?: string;
          title?: string;
          registration_opens_at?: string | null;
          registration_closes_at?: string | null;
          race_starts_at?: string | null;
          official_started_at?: string | null;
          official_started_by?: string | null;
          gcash_number?: string | null;
          gcash_account_name?: string | null;
          terms_version?: string | null;
          terms_body?: string | null;
          privacy_version?: string | null;
          privacy_body?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      run_categories: {
        Row: {
          id: string;
          run_event_id: string;
          name: string;
          distance_meters: number;
          fee_centavos: number;
          capacity: number | null;
          min_age: number | null;
          max_age: number | null;
          kit_description: string | null;
          published: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          run_event_id: string;
          name: string;
          distance_meters: number;
          fee_centavos: number;
          capacity?: number | null;
          min_age?: number | null;
          max_age?: number | null;
          kit_description?: string | null;
          published?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          run_event_id?: string;
          name?: string;
          distance_meters?: number;
          fee_centavos?: number;
          capacity?: number | null;
          min_age?: number | null;
          max_age?: number | null;
          kit_description?: string | null;
          published?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      run_routes: {
        Row: {
          id: string;
          category_id: string;
          map_image_path: string | null;
          map_url: string | null;
          route_notes: string | null;
          published: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          map_image_path?: string | null;
          map_url?: string | null;
          route_notes?: string | null;
          published?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          map_image_path?: string | null;
          map_url?: string | null;
          route_notes?: string | null;
          published?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      run_registrations: {
        Row: {
          id: string;
          reference: string;
          run_event_id: string;
          category_id: string;
          user_id: string;
          participant_name: string;
          division: string | null;
          birth_date: string | null;
          mobile: string;
          locality: string | null;
          shirt_size: string | null;
          club_name: string | null;
          emergency_name: string;
          emergency_relationship: string | null;
          emergency_mobile: string;
          accessibility_notes: string | null;
          fee_centavos: number;
          currency: string;
          status: ReviewStatus;
          registration_email: string | null;
          submitted_at: string | null;
          approved_at: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          bib_number: string | null;
          qr_token: string | null;
          registration_source: 'online' | 'admin_cash';
          registered_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference?: string;
          run_event_id: string;
          category_id: string;
          user_id: string;
          participant_name: string;
          division?: string | null;
          birth_date?: string | null;
          mobile: string;
          locality?: string | null;
          shirt_size?: string | null;
          club_name?: string | null;
          emergency_name: string;
          emergency_relationship?: string | null;
          emergency_mobile: string;
          accessibility_notes?: string | null;
          fee_centavos: number;
          currency?: string;
          status?: ReviewStatus;
          registration_email?: string | null;
          submitted_at?: string | null;
          approved_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          bib_number?: string | null;
          qr_token?: string | null;
          registration_source?: 'online' | 'admin_cash';
          registered_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference?: string;
          run_event_id?: string;
          category_id?: string;
          user_id?: string;
          participant_name?: string;
          division?: string | null;
          birth_date?: string | null;
          mobile?: string;
          locality?: string | null;
          shirt_size?: string | null;
          club_name?: string | null;
          emergency_name?: string;
          emergency_relationship?: string | null;
          emergency_mobile?: string;
          accessibility_notes?: string | null;
          fee_centavos?: number;
          currency?: string;
          status?: ReviewStatus;
          registration_email?: string | null;
          submitted_at?: string | null;
          approved_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          bib_number?: string | null;
          qr_token?: string | null;
          registration_source?: 'online' | 'admin_cash';
          registered_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      registration_consents: {
        Row: {
          id: string;
          registration_id: string;
          consent_type: 'terms' | 'privacy' | 'guardian' | 'marketing';
          version: string;
          accepted: boolean;
          accepted_at: string;
          ip_hash: string | null;
        };
        Insert: {
          id?: string;
          registration_id: string;
          consent_type: 'terms' | 'privacy' | 'guardian' | 'marketing';
          version: string;
          accepted: boolean;
          accepted_at?: string;
          ip_hash?: string | null;
        };
        Update: {
          id?: string;
          registration_id?: string;
          consent_type?: 'terms' | 'privacy' | 'guardian' | 'marketing';
          version?: string;
          accepted?: boolean;
          accepted_at?: string;
          ip_hash?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          registration_id: string;
          method: string;
          amount_centavos: number;
          currency: string;
          payer_reference: string | null;
          status: PaymentStatus;
          submitted_at: string | null;
          verified_by: string | null;
          verified_at: string | null;
          rejection_reason: string | null;
          received_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          registration_id: string;
          method: string;
          amount_centavos: number;
          currency?: string;
          payer_reference?: string | null;
          status?: PaymentStatus;
          submitted_at?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          rejection_reason?: string | null;
          received_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          registration_id?: string;
          method?: string;
          amount_centavos?: number;
          currency?: string;
          payer_reference?: string | null;
          status?: PaymentStatus;
          submitted_at?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          rejection_reason?: string | null;
          received_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      financial_transactions: {
        Row: {
          id: string;
          transaction_type: 'income' | 'expense';
          category: string;
          description: string;
          amount_centavos: number;
          currency: string;
          method: string | null;
          reference: string | null;
          counterparty_name: string | null;
          received_by_name: string | null;
          event_scope: 'general' | 'festival' | 'run';
          transaction_date: string;
          payment_id: string | null;
          created_by: string | null;
          voided_at: string | null;
          voided_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transaction_type: 'income' | 'expense';
          category: string;
          description: string;
          amount_centavos: number;
          currency?: string;
          method?: string | null;
          reference?: string | null;
          counterparty_name?: string | null;
          received_by_name?: string | null;
          event_scope?: 'general' | 'festival' | 'run';
          transaction_date?: string;
          payment_id?: string | null;
          created_by: string;
          voided_at?: string | null;
          voided_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          transaction_type?: 'income' | 'expense';
          category?: string;
          description?: string;
          amount_centavos?: number;
          currency?: string;
          method?: string | null;
          reference?: string | null;
          counterparty_name?: string | null;
          received_by_name?: string | null;
          event_scope?: 'general' | 'festival' | 'run';
          transaction_date?: string;
          payment_id?: string | null;
          created_by?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_evidence: {
        Row: {
          id: string;
          payment_id: string;
          object_path: string;
          original_name: string;
          mime_type: string | null;
          bytes: number | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          object_path: string;
          original_name: string;
          mime_type?: string | null;
          bytes?: number | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          payment_id?: string;
          object_path?: string;
          original_name?: string;
          mime_type?: string | null;
          bytes?: number | null;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      payment_events: {
        Row: {
          id: string;
          payment_id: string | null;
          provider: string;
          external_event_id: string;
          event_type: string;
          payload: Json;
          received_at: string;
        };
        Insert: {
          id?: string;
          payment_id?: string | null;
          provider: string;
          external_event_id: string;
          event_type: string;
          payload?: Json;
          received_at?: string;
        };
        Update: {
          id?: string;
          payment_id?: string | null;
          provider?: string;
          external_event_id?: string;
          event_type?: string;
          payload?: Json;
          received_at?: string;
        };
        Relationships: [];
      };
      run_finish_records: {
        Row: {
          registration_id: string;
          run_event_id: string;
          category_id: string;
          division: string;
          finished_at: string;
          elapsed_milliseconds: number;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          registration_id: string;
          run_event_id: string;
          category_id: string;
          division: string;
          finished_at: string;
          elapsed_milliseconds: number;
          recorded_by?: string | null;
          created_at?: string;
        };
        Update: {
          registration_id?: string;
          run_event_id?: string;
          category_id?: string;
          division?: string;
          finished_at?: string;
          elapsed_milliseconds?: number;
          recorded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      kit_claims: {
        Row: {
          registration_id: string;
          bib_number: string | null;
          claimed_at: string;
          claimed_by: string | null;
          notes: string | null;
        };
        Insert: {
          registration_id: string;
          bib_number?: string | null;
          claimed_at?: string;
          claimed_by?: string | null;
          notes?: string | null;
        };
        Update: {
          registration_id?: string;
          bib_number?: string | null;
          claimed_at?: string;
          claimed_by?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity_table: string;
          entity_id: string | null;
          detail: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          actor_id?: string | null;
          action: string;
          entity_table: string;
          entity_id?: string | null;
          detail?: Json;
          created_at?: string;
        };
        Update: {
          id?: number;
          actor_id?: string | null;
          action?: string;
          entity_table?: string;
          entity_id?: string | null;
          detail?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_outbox: {
        Row: {
          id: string;
          user_id: string | null;
          recipient: string;
          template: string;
          payload: Json;
          status: string;
          attempts: number;
          last_error: string | null;
          send_after: string;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          recipient: string;
          template: string;
          payload?: Json;
          status?: string;
          attempts?: number;
          last_error?: string | null;
          send_after?: string;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          recipient?: string;
          template?: string;
          payload?: Json;
          status?: string;
          attempts?: number;
          last_error?: string | null;
          send_after?: string;
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      reorder_gallery_album: {
        Args: {
          p_album_id: string;
          p_requested_position: number;
        };
        Returns: undefined;
      };
      reorder_activity_for_date: {
        Args: {
          p_activity_id: string;
          p_requested_position: number;
          p_previous_date?: string | null;
        };
        Returns: undefined;
      };
      submit_run_registration: {
        Args: {
          p_run_event_id: string;
          p_category_id: string;
          p_participant_name: string;
          p_division: string;
          p_birth_date: string;
          p_mobile: string;
          p_locality: string;
          p_shirt_size: string;
          p_club_name: string;
          p_emergency_name: string;
          p_emergency_relationship: string;
          p_emergency_mobile: string;
          p_accessibility_notes: string;
        };
        Returns: Database['public']['Tables']['run_registrations']['Row'];
      };
      mark_gcash_payment_submitted: {
        Args: { p_payment_id: string; p_payer_reference: string };
        Returns: undefined;
      };
      mark_manual_payment_submitted: {
        Args: {
          p_payment_id: string;
          p_method: string;
          p_payer_reference?: string | null;
          p_received_by?: string | null;
        };
        Returns: undefined;
      };
      list_cash_payment_receivers: {
        Args: Record<PropertyKey, never>;
        Returns: Array<{ user_id: string; full_name: string }>;
      };
      void_financial_transaction: {
        Args: { p_transaction_id: string };
        Returns: undefined;
      };
      review_run_registration: {
        Args: {
          p_registration_id: string;
          p_status: ReviewStatus;
          p_review_notes?: string;
        };
        Returns: Database['public']['Tables']['run_registrations']['Row'];
      };
      start_run_timing: {
        Args: { p_run_event_id: string };
        Returns: string;
      };
      record_run_finish: {
        Args: { p_qr_token: string };
        Returns: Database['public']['Tables']['run_finish_records']['Row'];
      };
      get_my_run_result: {
        Args: { p_registration_id: string };
        Returns: Array<{
          finished_at: string;
          elapsed_milliseconds: number;
          division_rank: number;
          category_rank: number;
          overall_rank: number;
        }>;
      };
      delete_rejected_run_registration: {
        Args: { p_registration_id: string };
        Returns: string[];
      };
      reset_run_timing: {
        Args: { p_run_event_id: string };
        Returns: number;
      };
      admin_register_cash_runner: {
        Args: {
          p_admin_id: string;
          p_user_id: string;
          p_run_event_id: string;
          p_category_id: string;
          p_participant_name: string;
          p_division: string;
          p_birth_date: string;
          p_mobile: string;
          p_full_address: string;
          p_shirt_size: string;
          p_club_name: string;
          p_emergency_name: string;
          p_emergency_relationship: string;
          p_emergency_mobile: string;
          p_accessibility_notes: string;
          p_offline_consent_confirmed: boolean;
        };
        Returns: Database['public']['Tables']['run_registrations']['Row'];
      };
    };
    Enums: {
      app_role: AppRole;
      content_status: ContentStatus;
      review_status: ReviewStatus;
      payment_status: PaymentStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Edition = Database['public']['Tables']['editions']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type DbActivity = Database['public']['Tables']['activities']['Row'];
export type DbPost = Database['public']['Tables']['posts']['Row'];
export type DbMediaAsset = Database['public']['Tables']['media_assets']['Row'];
export type DbAlbum = Database['public']['Tables']['albums']['Row'];
export type DbAlbumItem = Database['public']['Tables']['album_items']['Row'];
export type DbSiteSetting = Database['public']['Tables']['site_settings']['Row'];
export type DbSponsor = Database['public']['Tables']['sponsors']['Row'];
export type DbDelegation = Database['public']['Tables']['delegations']['Row'];
export type DbRunRegistration = Database['public']['Tables']['run_registrations']['Row'];

