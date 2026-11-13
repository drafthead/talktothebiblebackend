CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  username_lower TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  email_lower TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
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

ALTER TABLE web_subscriptions ADD COLUMN account_id TEXT;
CREATE INDEX IF NOT EXISTS web_subscriptions_account_idx ON web_subscriptions(account_id);
