PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`tx_hash` text NOT NULL,
	`agent_id` text NOT NULL,
	`data_api_id` text NOT NULL,
	`amount_usd` text NOT NULL,
	`amount_mnee` text NOT NULL,
	`network` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`confirmed_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_payments`("id", "tx_hash", "agent_id", "data_api_id", "amount_usd", "amount_mnee", "network", "status", "metadata", "created_at", "confirmed_at") SELECT "id", "tx_hash", "agent_id", "data_api_id", "amount_usd", "amount_mnee", "network", "status", "metadata", "created_at", "confirmed_at" FROM `payments`;--> statement-breakpoint
DROP TABLE `payments`;--> statement-breakpoint
ALTER TABLE `__new_payments` RENAME TO `payments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `payments_tx_hash_unique` ON `payments` (`tx_hash`);--> statement-breakpoint
CREATE INDEX `payments_agent_idx` ON `payments` (`agent_id`);--> statement-breakpoint
CREATE INDEX `payments_api_idx` ON `payments` (`data_api_id`);--> statement-breakpoint
CREATE INDEX `payments_created_idx` ON `payments` (`created_at`);