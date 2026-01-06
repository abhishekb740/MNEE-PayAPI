PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_api_usage_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`data_api_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`payment_id` text,
	`response_time` integer,
	`status_code` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_api_usage_logs`("id", "data_api_id", "agent_id", "payment_id", "response_time", "status_code", "created_at") SELECT "id", "data_api_id", "agent_id", "payment_id", "response_time", "status_code", "created_at" FROM `api_usage_logs`;--> statement-breakpoint
DROP TABLE `api_usage_logs`;--> statement-breakpoint
ALTER TABLE `__new_api_usage_logs` RENAME TO `api_usage_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `usage_api_idx` ON `api_usage_logs` (`data_api_id`);--> statement-breakpoint
CREATE INDEX `usage_agent_idx` ON `api_usage_logs` (`agent_id`);--> statement-breakpoint
CREATE INDEX `usage_created_idx` ON `api_usage_logs` (`created_at`);