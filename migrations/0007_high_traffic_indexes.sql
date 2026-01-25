-- High Traffic Scaling Indexes
-- Migration for Phase 3 of High Traffic Scaling Architecture Plan
-- These indexes optimize the most frequently accessed queries for high-traffic scenarios

-- ==================== Race Participant Indexes ====================

-- Index for leaderboard queries: race participants by race, finish status, and position
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_race_participants_race_finished 
ON race_participants(race_id, is_finished, finish_position);

-- Index for user race history: find a user's races ordered by finish time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_race_participants_user_finished 
ON race_participants(user_id, finished_at DESC) WHERE user_id IS NOT NULL;

-- Index for participant lookup by race and user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_race_participants_race_user 
ON race_participants(race_id, user_id) WHERE user_id IS NOT NULL;

-- Index for participant WPM (for leaderboards and statistics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_race_participants_wpm 
ON race_participants(wpm DESC) WHERE is_finished = 1 AND wpm > 0;

-- ==================== Race Indexes ====================

-- Index for active race lookups (waiting, countdown, racing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_races_status_created 
ON races(status, created_at DESC) WHERE status IN ('waiting', 'countdown', 'racing');

-- Index for finished races (for history and analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_races_finished_at 
ON races(finished_at DESC) WHERE status = 'finished';

-- Index for race mode filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_races_mode_status 
ON races(race_mode, status);

-- ==================== User Indexes ====================

-- Index for user lookup by email (login)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower 
ON users(LOWER(email));

-- Index for user lookup by username (profile, mentions)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_lower 
ON users(LOWER(username));

-- ==================== Test Results Indexes ====================

-- Index for test results by user (history page)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_results_user_created 
ON test_results(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Index for test results by WPM (global leaderboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_results_wpm 
ON test_results(wpm DESC) WHERE wpm > 0;

-- Index for test results by mode (filtered leaderboards)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_results_mode_wpm 
ON test_results(mode, wpm DESC) WHERE wpm > 0;

-- ==================== Stress Test Indexes ====================

-- Index for stress test leaderboards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stress_tests_wpm 
ON stress_tests(wpm DESC) WHERE wpm > 0;

-- Index for stress tests by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stress_tests_user_created 
ON stress_tests(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- ==================== Code Typing Tests Indexes ====================

-- Index for code typing leaderboards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_code_typing_tests_wpm 
ON code_typing_tests(wpm DESC) WHERE wpm > 0;

-- Index for code typing by language
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_code_typing_tests_language_wpm 
ON code_typing_tests(language, wpm DESC) WHERE wpm > 0;

-- ==================== Dictation Tests Indexes ====================

-- Index for dictation test leaderboards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dictation_tests_wpm 
ON dictation_tests(wpm DESC) WHERE wpm > 0;

-- ==================== User Ratings Indexes ====================

-- Index for user rating lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_ratings_rating 
ON user_ratings(rating DESC);

-- Index for user ratings by mode
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_ratings_mode_rating 
ON user_ratings(rating_mode, rating DESC);

-- ==================== Session and Auth Indexes ====================

-- Index for session lookups by token
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_token 
ON user_sessions(session_token) WHERE expires_at > NOW();

-- Index for active sessions by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_active 
ON user_sessions(user_id, expires_at DESC) WHERE expires_at > NOW();

-- ==================== Certificate Indexes ====================

-- Index for certificate verification
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificates_verification_code 
ON certificates(verification_code);

-- Index for certificates by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certificates_user_created 
ON certificates(user_id, created_at DESC);

-- ==================== Analytics and Stats Indexes ====================

-- These indexes support the platform stats calculations

-- Composite index for race stats aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_race_participants_stats 
ON race_participants(is_finished, wpm, accuracy) WHERE is_finished = 1;

-- Index for daily active users calculation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_results_created_date 
ON test_results(DATE(created_at));
