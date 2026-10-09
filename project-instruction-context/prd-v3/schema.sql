-- =====================================================================
-- Skema MySQL (KHUSUS PENGEMBANGAN LOKAL)
-- Butuh MySQL 8.0.16+ atau MariaDB 10.5+ (agar CHECK constraint berlaku)
-- Harus selalu ekuivalen dengan supabase/migrations/0001_init.sql
-- Tidak ada data dummy: semua tabel dibuat KOSONG.
-- Jalankan: mysql -u root -p < database/mysql/schema.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS seni_rupa
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE seni_rupa;

CREATE TABLE IF NOT EXISTS players (
  id                   CHAR(36)     NOT NULL,
  username_key         VARCHAR(16)  NOT NULL,   -- huruf kecil, kunci unik
  display_name         VARCHAR(16)  NOT NULL,   -- ejaan asli untuk tampilan
  timezone             VARCHAR(64)  NOT NULL DEFAULT 'Asia/Jakarta',
  username_changed_at  DATETIME(3)  NULL,
  created_at           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_players_username_key (username_key)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_stats (
  player_id         CHAR(36)      NOT NULL,
  lives_count       TINYINT       NOT NULL DEFAULT 5,
  lives_anchor_at   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  total_xp          INT           NOT NULL DEFAULT 0,
  current_streak    INT           NOT NULL DEFAULT 0,
  longest_streak    INT           NOT NULL DEFAULT 0,
  last_played_date  DATE          NULL,
  version           INT           NOT NULL DEFAULT 0,
  updated_at        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (player_id),
  CONSTRAINT fk_stats_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  CONSTRAINT chk_lives CHECK (lives_count BETWEEN 0 AND 5),
  CONSTRAINT chk_xp CHECK (total_xp >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chapter_progress (
  player_id           CHAR(36)    NOT NULL,
  chapter_id          VARCHAR(32) NOT NULL,
  stars               TINYINT     NOT NULL DEFAULT 0,
  best_minigame_score TINYINT     NOT NULL DEFAULT 0,
  best_quiz_correct   TINYINT     NOT NULL DEFAULT 0,
  completed_at        DATETIME(3) NULL,
  PRIMARY KEY (player_id, chapter_id),
  CONSTRAINT fk_progress_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  CONSTRAINT chk_stars CHECK (stars BETWEEN 0 AND 3)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chapter_attempts (
  id            CHAR(36)    NOT NULL,
  player_id     CHAR(36)    NOT NULL,
  chapter_id    VARCHAR(32) NOT NULL,
  status        VARCHAR(12) NOT NULL DEFAULT 'active',
  quiz_correct  TINYINT     NOT NULL DEFAULT 0,
  quiz_wrong    TINYINT     NOT NULL DEFAULT 0,
  started_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  finished_at   DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_attempts_player (player_id, chapter_id),
  CONSTRAINT fk_attempts_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  CONSTRAINT chk_attempt_status CHECK (status IN ('active','completed','failed'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attempt_answers (
  attempt_id   CHAR(36)    NOT NULL,
  question_id  VARCHAR(40) NOT NULL,
  is_correct   TINYINT(1)  NOT NULL,
  answered_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (attempt_id, question_id),
  CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id) REFERENCES chapter_attempts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS xp_events (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  player_id   CHAR(36)     NOT NULL,
  amount      INT          NOT NULL,
  source      VARCHAR(32)  NOT NULL,
  ref_key     VARCHAR(80)  NOT NULL,   -- mencegah XP ganda, mis. chapter:s1-c1:stars:3
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_xp_ref (player_id, ref_key),
  KEY idx_xp_created (created_at, player_id),
  CONSTRAINT fk_xp_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS submissions (
  id               CHAR(36)     NOT NULL,
  player_id        CHAR(36)     NOT NULL,
  chapter_id       VARCHAR(32)  NOT NULL,
  score            TINYINT      NOT NULL,
  criteria_results JSON         NULL,
  feedback         TEXT         NULL,
  created_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_sub_player (player_id, created_at),
  CONSTRAINT fk_sub_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket        VARCHAR(100) NOT NULL,
  window_start  DATETIME(3)  NOT NULL,
  hits          INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket)
) ENGINE=InnoDB;
