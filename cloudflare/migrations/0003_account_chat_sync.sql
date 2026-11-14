ALTER TABLE chats ADD COLUMN account_id TEXT;
CREATE INDEX IF NOT EXISTS chats_account_created_idx ON chats(account_id, created_at);
