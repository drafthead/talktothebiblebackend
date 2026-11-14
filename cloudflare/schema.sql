CREATE TABLE IF NOT EXISTS users (
  device_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  translation TEXT NOT NULL DEFAULT 'kjv',
  plus INTEGER NOT NULL DEFAULT 0,
  memory_text TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  account_id TEXT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  translation TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_usage (
  device_id TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (device_id, day)
);

CREATE INDEX IF NOT EXISTS chats_device_created_idx ON chats(device_id, created_at);
CREATE INDEX IF NOT EXISTS chats_account_created_idx ON chats(account_id, created_at);

CREATE TABLE IF NOT EXISTS web_subscriptions (
  device_id TEXT PRIMARY KEY,
  account_id TEXT,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  square_customer_id TEXT,
  square_card_id TEXT,
  square_subscription_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_end TEXT,
  canceled_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS web_subscriptions_email_idx ON web_subscriptions(email);
CREATE INDEX IF NOT EXISTS web_subscriptions_status_idx ON web_subscriptions(status);

CREATE TABLE IF NOT EXISTS web_billing_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  subscription_id TEXT,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  username_lower TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  email_lower TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  test_premium INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS account_sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  test_premium INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS account_sessions_account_idx ON account_sessions(account_id);
CREATE INDEX IF NOT EXISTS account_sessions_expires_idx ON account_sessions(expires_at);

CREATE TABLE IF NOT EXISTS account_devices (
  account_id TEXT NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (account_id, device_id)
);

CREATE INDEX IF NOT EXISTS web_subscriptions_account_idx ON web_subscriptions(account_id);
