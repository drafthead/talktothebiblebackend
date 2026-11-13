CREATE TABLE IF NOT EXISTS web_subscriptions (
  device_id TEXT PRIMARY KEY,
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
