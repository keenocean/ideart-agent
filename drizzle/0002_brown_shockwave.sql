DROP INDEX `post_slug_unique`;--> statement-breakpoint
DROP INDEX `idx_post_type_status`;--> statement-breakpoint
ALTER TABLE `post` ADD `locale` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_post_slug_locale` ON `post` (`slug`,`locale`);--> statement-breakpoint
CREATE INDEX `idx_post_type_status_locale` ON `post` (`type`,`status`,`locale`);