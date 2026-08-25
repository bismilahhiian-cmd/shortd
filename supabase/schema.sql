-- ============================================================
-- PioDramas Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  total_points INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0, -- lifetime points earned
  device_fingerprint TEXT, -- anti-clone
  ip_address TEXT,
  referral_code TEXT UNIQUE DEFAULT UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8)),
  referred_by UUID REFERENCES profiles(id),
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  daily_points_today INTEGER DEFAULT 0,
  last_daily_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_checkin TIMESTAMP WITH TIME ZONE,
  streak_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- WATCH HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- dramabox, pinedrama, etc
  drama_id TEXT NOT NULL,
  drama_title TEXT,
  drama_cover TEXT,
  episode_number INTEGER NOT NULL,
  duration_watched INTEGER DEFAULT 0, -- in seconds
  total_duration INTEGER DEFAULT 0,   -- in seconds
  watch_percentage DECIMAL(5,2) DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  reward_claimed BOOLEAN DEFAULT FALSE,
  device_fingerprint TEXT,
  ip_address TEXT,
  session_token TEXT UNIQUE, -- anti-cheat: unique per watch session
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- REWARD TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reward_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'withdraw', 'bonus', 'referral', 'checkin', 'penalty')),
  points INTEGER NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'rejected', 'cancelled')),
  -- Withdrawal specific fields
  ewallet_type TEXT CHECK (ewallet_type IN ('gopay', 'ovo', 'dana', 'shopeepay')),
  ewallet_number TEXT,
  ewallet_name TEXT,
  amount_idr INTEGER, -- 1000 points = Rp 10.000
  admin_note TEXT,
  processed_by TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- REFERRALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referrer_device TEXT,
  referred_device TEXT,
  referrer_ip TEXT,
  referred_ip TEXT,
  is_valid BOOLEAN DEFAULT TRUE,
  fraud_flag TEXT, -- 'same_device', 'same_ip', 'suspicious'
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id) -- each user can only be referred once
);

-- ============================================================
-- DRAMA CACHE TABLE (to bypass Sansekai rate limit)
-- ============================================================
CREATE TABLE IF NOT EXISTS drama_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL, -- e.g. "dramabox_foryou_page1"
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- WATCH SESSIONS TABLE (anti-cheat)
-- ============================================================
CREATE TABLE IF NOT EXISTS watch_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  drama_id TEXT NOT NULL,
  episode_number INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_duration INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  points_awarded BOOLEAN DEFAULT FALSE,
  device_fingerprint TEXT,
  ip_address TEXT
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles: user can only read/update their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profile creation" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Watch history: user can only see their own
CREATE POLICY "Users can view own watch history" ON watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watch history" ON watch_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reward transactions: user can only see their own
CREATE POLICY "Users can view own transactions" ON reward_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON reward_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Watch sessions
CREATE POLICY "Users can manage own sessions" ON watch_sessions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Reset daily points at midnight
CREATE OR REPLACE FUNCTION reset_daily_points()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET daily_points_today = 0, last_daily_reset = NOW()
  WHERE last_daily_reset < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_drama ON watch_history(provider, drama_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_id ON reward_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_status ON reward_transactions(status);
CREATE INDEX IF NOT EXISTS idx_drama_cache_key ON drama_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_drama_cache_expires ON drama_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_token ON watch_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
