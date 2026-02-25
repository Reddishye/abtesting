export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer'
export type ScriptStatus = 'draft' | 'published' | 'archived'
export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived'
export type InviteStatus = 'pending' | 'accepted' | 'expired'
export type Variant = 'a' | 'b'

export interface OrgRow {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface UserRow {
  id: string
  email: string | null
  org_id: string
  role: UserRole
}

export interface ScriptRow {
  id: string
  org_id: string
  name: string | null
  code: string
  status: ScriptStatus
  version: number
  parent_id: string | null
  created_at: string
  published_at: string | null
  allowed_origins: string[]
}

export interface ExperimentWeights {
  a: number
  b: number
}

export interface ExperimentRow {
  id: string
  org_id: string
  name: string | null
  script_a: string | null
  script_b: string | null
  weights: ExperimentWeights
  status: ExperimentStatus
  allowed_origins: string[]
}

export interface EventRow {
  id: string
  experiment_id: string | null
  org_id: string | null
  variant: Variant | null
  event_type: string | null
  payload: Record<string, unknown> | null
  timestamp: string
}

export interface InviteRow {
  id: string
  org_id: string | null
  email: string | null
  role: UserRole | null
  token: string | null
  expires_at: string | null
  status: InviteStatus
}

// Joined types used in queries
export interface ScriptWithOrg extends ScriptRow {
  orgs: Pick<OrgRow, 'id' | 'name' | 'slug'>
}

export interface ExperimentWithScripts extends ExperimentRow {
  script_a_data: ScriptRow | null
  script_b_data: ScriptRow | null
}

export interface Database {
  public: {
    Tables: {
      orgs: {
        Row: OrgRow
        Insert: Omit<OrgRow, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<OrgRow, 'id'>>
        Relationships: []
      }
      users: {
        Row: UserRow
        Insert: UserRow
        Update: Partial<Omit<UserRow, 'id'>>
        Relationships: []
      }
      scripts: {
        Row: ScriptRow
        Insert: Omit<ScriptRow, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<ScriptRow, 'id' | 'created_at'>>
        Relationships: []
      }
      experiments: {
        Row: ExperimentRow
        Insert: Omit<ExperimentRow, 'id'> & { id?: string }
        Update: Partial<Omit<ExperimentRow, 'id'>>
        Relationships: []
      }
      events: {
        Row: EventRow
        Insert: Omit<EventRow, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
        Update: Partial<EventRow>
        Relationships: []
      }
      invites: {
        Row: InviteRow
        Insert: Omit<InviteRow, 'id'> & { id?: string }
        Update: Partial<Omit<InviteRow, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
