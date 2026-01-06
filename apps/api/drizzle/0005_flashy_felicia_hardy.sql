ALTER TABLE `api_usage_logs` ADD `success` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `api_usage_logs` ADD `error_type` text;--> statement-breakpoint
ALTER TABLE `api_usage_logs` ADD `error_message` text;--> statement-breakpoint
CREATE INDEX `usage_success_idx` ON `api_usage_logs` (`success`);