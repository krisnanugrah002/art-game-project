import { Generated, ColumnType } from 'kysely';

export interface PlayersTable {
  id: string;
  username_key: string;
  display_name: string;
  timezone: Generated<string>;
  username_changed_at: Date | string | null;
  created_at: Generated<Date | string>;
  last_seen_at: Generated<Date | string>;
}

export interface UserStatsTable {
  player_id: string;
  lives_count: Generated<number>;
  lives_anchor_at: Generated<Date | string>;
  total_xp: Generated<number>;
  current_streak: Generated<number>;
  longest_streak: Generated<number>;
  last_played_date: string | null;
  version: Generated<number>;
  updated_at: Generated<Date | string>;
}

export interface ChapterProgressTable {
  player_id: string;
  chapter_id: string;
  stars: Generated<number>;
  best_minigame_score: Generated<number>;
  best_quiz_correct: Generated<number>;
  completed_at: Date | string | null;
}

export interface ChapterAttemptsTable {
  id: string;
  player_id: string;
  chapter_id: string;
  status: Generated<string>;
  quiz_correct: Generated<number>;
  quiz_wrong: Generated<number>;
  started_at: Generated<Date | string>;
  finished_at: Date | string | null;
}

export interface AttemptAnswersTable {
  attempt_id: string;
  question_id: string;
  is_correct: boolean | number; // MySQL TINYINT(1) maps to number/boolean depending on driver
  answered_at: Generated<Date | string>;
}

export interface XpEventsTable {
  id: Generated<number>; // auto increment / identity
  player_id: string;
  amount: number;
  source: string;
  ref_key: string;
  created_at: Generated<Date | string>;
}

export interface SubmissionsTable {
  id: string;
  player_id: string;
  chapter_id: string;
  score: number;
  criteria_results: string | object | null; // JSON
  feedback: string | null;
  created_at: Generated<Date | string>;
}

export interface RateLimitsTable {
  bucket: string;
  window_start: Date | string;
  hits: Generated<number>;
}

export interface DB {
  players: PlayersTable;
  user_stats: UserStatsTable;
  chapter_progress: ChapterProgressTable;
  chapter_attempts: ChapterAttemptsTable;
  attempt_answers: AttemptAnswersTable;
  xp_events: XpEventsTable;
  submissions: SubmissionsTable;
  rate_limits: RateLimitsTable;
}
