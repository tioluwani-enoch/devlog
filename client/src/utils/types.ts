export interface User {
  id: number;
  username: string;
  display_name: string | null;
  avatar_url: string;
}

export interface Activity {
  type: 'commit' | 'pr' | 'review';
  github_event_id: string;
  repo_name: string;
  title: string;
  description?: string;
  branch?: string;
  url: string;
  occurred_at: string;
  raw_data: Record<string, unknown>;
}

export interface Summary {
  id: number;
  summary_date: string;
  content: string;
  is_edited: boolean;
  created_at: string;
}
