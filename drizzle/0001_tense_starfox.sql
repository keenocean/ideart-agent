CREATE TABLE `agent_turn_lease` (
	`chat_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`turn_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`cancel_requested_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_agent_turn_lease_user_expires` ON `agent_turn_lease` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_agent_turn_lease_turn_id` ON `agent_turn_lease` (`turn_id`);
