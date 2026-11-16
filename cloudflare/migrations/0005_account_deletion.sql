CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'android',
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'received',
  requested_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS account_deletion_requests_email_idx ON account_deletion_requests(email);
CREATE INDEX IF NOT EXISTS account_deletion_requests_status_idx ON account_deletion_requests(status);
