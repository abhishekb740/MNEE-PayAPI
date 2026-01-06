CREATE TABLE `provider_payouts` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`amount` text NOT NULL,
	`tx_hash` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payouts_provider_idx` ON `provider_payouts` (`provider_id`);--> statement-breakpoint
CREATE TABLE `providers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`wallet_address` text NOT NULL,
	`api_key` text NOT NULL,
	`total_earned` text DEFAULT '0' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `providers_api_key_unique` ON `providers` (`api_key`);--> statement-breakpoint
CREATE INDEX `providers_user_idx` ON `providers` (`user_id`);