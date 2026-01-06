ALTER TABLE `data_apis` ADD `provider_id` text REFERENCES providers(id);--> statement-breakpoint
ALTER TABLE `data_apis` ADD `external_url` text;--> statement-breakpoint
ALTER TABLE `data_apis` ADD `revenue_share` integer DEFAULT 80 NOT NULL;--> statement-breakpoint
ALTER TABLE `data_apis` ADD `method` text DEFAULT 'GET' NOT NULL;--> statement-breakpoint
ALTER TABLE `data_apis` ADD `headers` text;--> statement-breakpoint
ALTER TABLE `data_apis` ADD `parameters` text;--> statement-breakpoint
ALTER TABLE `data_apis` ADD `example_response` text;--> statement-breakpoint
ALTER TABLE `data_apis` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
CREATE INDEX `apis_provider_idx` ON `data_apis` (`provider_id`);--> statement-breakpoint
CREATE INDEX `apis_category_idx` ON `data_apis` (`category`);--> statement-breakpoint
ALTER TABLE `data_apis` DROP COLUMN `network`;