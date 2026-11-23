-- An approved edit scheduled for the future waits here; the live published_snapshot keeps being served until the hourly job promotes it.
ALTER TABLE retreats ADD COLUMN pending_snapshot JSON NULL, ADD COLUMN pending_from DATETIME NULL;
ALTER TABLE retreat_sessions ADD COLUMN pending_snapshot JSON NULL, ADD COLUMN pending_from DATETIME NULL;
ALTER TABLE pilgrimages ADD COLUMN pending_snapshot JSON NULL, ADD COLUMN pending_from DATETIME NULL;
ALTER TABLE team_members ADD COLUMN pending_snapshot JSON NULL, ADD COLUMN pending_from DATETIME NULL;
ALTER TABLE verses ADD COLUMN pending_snapshot JSON NULL, ADD COLUMN pending_from DATETIME NULL;
